import { useState, useEffect, useCallback } from 'react';

export type ChatProfile = {
  id: string;
  name: string;
  email: string | null;
  lastActive: string;
};

export type ChatMessage = {
  id: string;
  profileId: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string;
};

export function useChatLogic(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<ChatProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      setProfiles(data.profiles || []);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    // Set up polling to check for new messages
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // First ensure the profile exists
    if (!profiles.find(p => p.id === sessionId)) {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'profile',
          payload: {
            id: sessionId,
            name: 'Visitor',
            email: null,
            lastActive: new Date().toISOString()
          }
        })
      });
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      profileId: sessionId,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);

    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'message', payload: newMessage })
    });
    
    // Trigger global event if needed for the dashboard counter
    window.dispatchEvent(new Event('chat_updated'));
    
    // Simulate auto-reply from admin
    setTimeout(async () => {
      const autoReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        profileId: sessionId,
        sender: 'admin',
        text: "Thank you for reaching out! I'll review your message and get back to you shortly.",
        timestamp: new Date().toISOString()
      };
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'message', payload: autoReply })
      });
      fetchChats();
      window.dispatchEvent(new Event('chat_updated'));
    }, 1500);
  };

  const sessionMessages = messages.filter(m => m.profileId === sessionId);

  return {
    messages: sessionMessages,
    isLoading,
    sendMessage
  };
}
