import { useState, useEffect, useRef, useCallback } from 'react';

interface UseChatProps {
  conversationId: number | null;
  token: string | null;
  initialMessages?: any[];
  onMessageReceived?: (message: any) => void;
}

export function useChat({ conversationId, token, initialMessages = [], onMessageReceived }: UseChatProps) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Sync initial messages when they change (e.g., when active conversation changes)
  useEffect(() => {
    setMessages(initialMessages);
  }, [conversationId, initialMessages]);

  useEffect(() => {
    if (!conversationId || !token) {
      setIsConnected(false);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use localhost:8000 for development backend
    const host = '127.0.0.1:8000'; 
    const wsUrl = `${protocol}//${host}/ws/chat/${conversationId}/?token=${token}`;
    
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connection established.');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data);
        
        // Append message to state if not a duplicate
        setMessages((prev) => {
          if (prev.some((m) => m.id === messageData.id)) {
            return prev;
          }
          return [...prev, messageData];
        });

        // Trigger callback if defined (useful for updating conversations list)
        if (onMessageReceived) {
          onMessageReceived(messageData);
        }
      } catch (err) {
        console.error('Failed to parse incoming WebSocket message', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed.');
      setIsConnected(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setIsConnected(false);
    };
  }, [conversationId, token, onMessageReceived]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: content }));
    } else {
      console.warn('WebSocket is not open. Cannot send message.');
    }
  }, []);

  return {
    messages,
    setMessages,
    sendMessage,
    isConnected
  };
}
