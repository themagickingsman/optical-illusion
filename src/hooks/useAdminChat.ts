import { useState, useEffect, useCallback } from 'react';
import { ChatProfile, ChatMessage } from './useChatLogic';

export function useAdminChat() {
  const [profiles, setProfiles] = useState<ChatProfile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllChats = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      setProfiles(data.profiles || []);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch admin chats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllChats();
    const interval = setInterval(fetchAllChats, 3000);
    return () => clearInterval(interval);
  }, [fetchAllChats]);

  const sendAdminReply = async (profileId: string, text: string) => {
    if (!text.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      profileId,
      sender: 'admin',
      text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);

    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'message', payload: newMessage })
    });
    
    // Dispatch event to sync immediately
    window.dispatchEvent(new Event('chat_updated'));
  };

  const deleteMessage = async (messageId: string) => {
    // Optimistic UI update
    setMessages(prev => prev.filter(m => m.id !== messageId));

    // To properly support delete on the backend, we would need a DELETE route.
    // For now, since the user asked for "basic manage", we will just post a delete type
    // We must implement the delete handler in route.ts next.
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'delete_message', payload: { id: messageId } })
    });
    window.dispatchEvent(new Event('chat_updated'));
  };

  return {
    profiles,
    messages,
    isLoading,
    sendAdminReply,
    deleteMessage
  };
}
