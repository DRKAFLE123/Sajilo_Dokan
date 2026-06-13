import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from accounts.models import CustomUser  
from .models import Conversation, Message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.conversation_group_name = f'chat_{self.conversation_id}'
        
        # Token Authentication from query string
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        query_params = dict(qp.split('=') for qp in query_string.split('&') if '=' in qp)
        token_key = query_params.get('token')
        
        user = await self.get_user_from_token(token_key)
        self.scope['user'] = user
        
        if user == AnonymousUser() or not user.is_authenticated:
            await self.close()
            return
        
        # Join conversation group
        await self.channel_layer.group_add(
            self.conversation_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave conversation group
        await self.channel_layer.group_discard(
            self.conversation_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_content = text_data_json.get('message', '')
        
        user = self.scope['user']
        if not user or user.is_anonymous:
            return
        
        # Save message to database
        conversation = await self.get_conversation()
        if conversation:
            msg = await self.create_message(conversation, user, message_content)
            
            # Send message to conversation group
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    'type': 'chat_message',
                    'message_data': {
                        'id': msg.id,
                        'conversation': conversation.id,
                        'sender': {
                            'id': user.id,
                            'username': user.username,
                            'email': user.email,
                            'user_type': user.user_type,
                            'profile_picture': user.profile_picture.url if user.profile_picture else None,
                        },
                        'content': msg.content,
                        'image': None,
                        'audio': None,
                        'timestamp': msg.timestamp.isoformat(),
                        'is_read': msg.is_read
                    }
                }
            )
    
    async def chat_message(self, event):
        # Send message to WebSocket client
        await self.send(text_data=json.dumps(event['message_data']))
    
    @database_sync_to_async
    def get_user_from_token(self, token_key):
        from rest_framework.authtoken.models import Token
        from django.contrib.auth.models import AnonymousUser
        if not token_key:
            return AnonymousUser()
        try:
            token = Token.objects.select_related('user').get(key=token_key)
            return token.user
        except Token.DoesNotExist:
            return AnonymousUser()
            
    @database_sync_to_async
    def get_conversation(self):
        try:
            return Conversation.objects.get(id=self.conversation_id)
        except Conversation.DoesNotExist:
            return None
    
    @database_sync_to_async
    def create_message(self, conversation, sender, content):
        return Message.objects.create(
            conversation=conversation,
            sender=sender,
            content=content
        )