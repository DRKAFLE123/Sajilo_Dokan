"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/lib/useChat';
import { Send, Store, User, MessageSquare, Image as ImageIcon, X, Mic, Square, Trash2 } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';

interface Customer {
  id: number;
  username: string;
}

interface Message {
  id: number;
  content: string;
  sender: {
    id: number;
    username: string;
    user_type: string;
  };
  timestamp: string;
  image: string | null;
  audio: string | null;
}

interface Conversation {
  id: number;
  customer: Customer;
  messages: Message[];
  unread_count: number;
}

export default function ShopOwnerChatPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
    type: 'danger'
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleWebSocketMessage = useCallback((message: any) => {
    setConversations(prev => {
      return prev.map(convo => {
        if (convo.id === message.conversation) {
          const messageExists = convo.messages.some(m => m.id === message.id);
          const updatedMessages = messageExists 
            ? convo.messages 
            : [...convo.messages, message];
          
          if (activeConversation?.id === convo.id) {
            if (!messageExists && message.sender.id !== user?.id) {
              api.post(`/conversations/${convo.id}/mark_read/`).catch(console.error);
            }
            return { ...convo, messages: updatedMessages, unread_count: 0 };
          } else {
            const isMe = message.sender.id === user?.id;
            return { 
              ...convo, 
              messages: updatedMessages, 
              unread_count: isMe ? convo.unread_count : convo.unread_count + 1 
            };
          }
        }
        return convo;
      });
    });
  }, [activeConversation?.id, user?.id]);

  const { token } = useAuth();
  const { messages, isConnected } = useChat({
    conversationId: activeConversation?.id ?? null,
    token,
    initialMessages: activeConversation?.messages ?? [],
    onMessageReceived: handleWebSocketMessage
  });

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations/?role=shop_owner');
      const fetchedConvos = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setConversations(fetchedConvos);

      if (isInitializing) {
        if (fetchedConvos.length > 0) {
          setActiveConversation(fetchedConvos[0]);
        }
        setIsInitializing(false);
      } else if (activeConversation) {
        // Update active conversation data silently
        const updatedActive = fetchedConvos.find((c: Conversation) => c.id === activeConversation.id);
        if (updatedActive) {
          setActiveConversation(updatedActive);
        } else {
          setActiveConversation(null);
        }
      } else {
        setIsInitializing(false);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchConversations();
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeConversation) {
      api.post(`/conversations/${activeConversation.id}/mark_read/`).catch(console.error);
      setConversations(prev => 
        prev.map(c => c.id === activeConversation.id ? { ...c, unread_count: 0 } : c)
      );
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording", err);
      alert("Microphone access denied or not supported");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage && !audioBlob) || !activeConversation) return;

    const tempMessage = newMessage;
    const tempImage = selectedImage;
    const tempAudio = audioBlob;

    setNewMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    setAudioBlob(null);

    try {
      const formData = new FormData();
      if (tempMessage) formData.append('content', tempMessage);
      if (tempImage) formData.append('image', tempImage);
      if (tempAudio) formData.append('audio', tempAudio, 'voice_message.webm');

      await api.post(`conversations/${activeConversation.id}/send_message/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err) {
      console.error("Failed to send message", err);
      alert("Failed to send message");
      setNewMessage(tempMessage);
      setSelectedImage(tempImage);
      setAudioBlob(tempAudio);
    }
  };

  const handleUnsendMessage = (messageId: number) => {
    setModalConfig({
      isOpen: true,
      title: "Unsend Message",
      message: "Are you sure you want to unsend this message? This action cannot be undone.",
      confirmText: "Unsend",
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`messages/${messageId}/`);
          fetchConversations();
        } catch (err) {
          console.error("Failed to unsend message", err);
        }
      }
    });
  };

  const handleClearChat = () => {
    if (!activeConversation) return;
    setModalConfig({
      isOpen: true,
      title: "Delete Conversation",
      message: "Are you sure you want to delete this entire conversation? All messages will be permanently removed.",
      confirmText: "Delete",
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`conversations/${activeConversation.id}/`);
          setActiveConversation(null);
          fetchConversations();
        } catch (err) {
          console.error("Failed to delete conversation", err);
        }
      }
    });
  };

  if (isLoading || isInitializing) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading chat...</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-4rem)] overflow-hidden">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Support Chat</h1>
          <p className="text-sm text-gray-500 mt-1">Reply to customer inquiries in real-time.</p>
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-700">Customers</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No active conversations.</div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition flex items-center gap-3 ${activeConversation?.id === conv.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                >
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <User size={20} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-semibold text-gray-900 truncate">{conv.customer.username}</p>
                      {conv.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                      {conv.messages.length > 0 
                        ? conv.messages[conv.messages.length - 1].content 
                        : 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-2/3 flex flex-col bg-gray-50">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{activeConversation.customer.username}</h3>
                    <p className="text-xs text-green-500 font-medium">Online</p>
                  </div>
                </div>
                <button 
                  onClick={handleClearChat}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition group"
                  title="Delete Conversation"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {/* Messages List */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 overscroll-contain bg-[#f0f2f5]"
              >
                {messages.map((msg) => {
                  const isMe = msg.sender.id === user?.id;
                  return (
                    <div key={msg.id} className={`flex max-w-[80%] ${isMe ? 'self-end' : 'self-start'} group relative`}>
                      <div className={`p-3 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'}`}>
                        {msg.image && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                            <img 
                              src={msg.image.startsWith('http') ? msg.image : `http://127.0.0.1:8000${msg.image}`} 
                              alt="Attached" 
                              className="max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition"
                              onClick={() => window.open(msg.image?.startsWith('http') ? msg.image : `http://127.0.0.1:8000${msg.image}`, '_blank')}
                            />
                          </div>
                        )}
                        {msg.audio && (
                          <div className="mb-2 min-w-[200px]">
                            <audio 
                              controls 
                              className={`w-full h-8 ${isMe ? 'filter invert brightness-200' : ''}`}
                              src={msg.audio.startsWith('http') ? msg.audio : `http://127.0.0.1:8000${msg.audio}`}
                            />
                          </div>
                        )}
                        {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <p className={`text-[10px] ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {isMe && (
                            <button 
                              onClick={() => handleUnsendMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 transition text-indigo-300 hover:text-white"
                              title="Unsend"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                {imagePreview && (
                  <div className="mb-3 relative inline-block">
                    <img src={imagePreview} className="h-20 w-20 object-cover rounded-xl border-2 border-indigo-100" alt="Preview" />
                    <button 
                      onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                {audioBlob && !isRecording && (
                  <div className="mb-3 flex items-center gap-3 bg-indigo-50 p-2 rounded-xl border border-indigo-100 w-fit">
                    <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                      <Mic size={14} />
                    </div>
                    <span className="text-sm font-medium text-indigo-700">Voice Message Ready</span>
                    <button 
                      onClick={() => setAudioBlob(null)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  
                  {!isRecording ? (
                    <>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-10 w-10 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                      >
                        <ImageIcon size={22} />
                      </button>
                      <button 
                        type="button"
                        onClick={startRecording}
                        className="h-10 w-10 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                      >
                        <Mic size={22} />
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a reply..."
                        className="flex-1 rounded-full bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-4 py-2 outline-none transition"
                      />
                    </>
                  ) : (
                    <div className="flex-1 flex items-center gap-3 bg-red-50 px-4 py-2 rounded-full border border-red-100 animate-pulse">
                      <div className="h-2 w-2 bg-red-500 rounded-full" />
                      <span className="text-red-600 font-medium text-sm flex-1">Recording... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
                      <button 
                        type="button"
                        onClick={stopRecording}
                        className="text-red-600 hover:text-red-800 font-bold text-sm flex items-center gap-1"
                      >
                        <Square size={16} fill="currentColor" /> Stop
                      </button>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={!newMessage.trim() && !selectedImage && !audioBlob || isRecording}
                    className="h-10 w-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition shadow-md"
                  >
                    <Send size={18} className="ml-1" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>Select a customer conversation to reply</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
      />
    </div>
  );
}
