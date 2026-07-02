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
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome to the secure channel.");
  const [autoReplyMessage, setAutoReplyMessage] = useState("Message Received\nCurrent response time: 1 hour");
  const [welcomeMessages, setWelcomeMessages] = useState<string[]>([]);
  const [autoReplyMessages, setAutoReplyMessages] = useState<string[]>([]);

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch('/api/chat', { cache: 'no-store' });
      const data = await res.json();
      setProfiles(data.profiles || []);
      setMessages(data.messages || []);
      if (data.welcomeMessage) setWelcomeMessage(data.welcomeMessage);
      if (data.autoReplyMessage) setAutoReplyMessage(data.autoReplyMessage);
      if (data.welcomeMessages) setWelcomeMessages(data.welcomeMessages);
      if (data.autoReplyMessages) setAutoReplyMessages(data.autoReplyMessages);
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
    
    // Simulate auto-reply from admin with typing indicator
    setIsAdminTyping(true);
    
    const sendSequence = async (messagesArray: string[], index: number = 0) => {
      if (index >= messagesArray.length) {
        setIsAdminTyping(false);
        return;
      }
      
      setTimeout(async () => {
        const autoReply: ChatMessage = {
          id: (Date.now() + index).toString(),
          profileId: sessionId,
          sender: 'admin',
          text: messagesArray[index],
          timestamp: new Date().toISOString()
        };
        
        // Optimistic update for the admin reply
        setMessages(prev => [...prev, autoReply]);
        
        // Turn off typing indicator instantly *after* message is in state
        setIsAdminTyping(false);

        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'message', payload: autoReply })
        });
        fetchChats();
        window.dispatchEvent(new Event('chat_updated'));
        
        if (index + 1 < messagesArray.length) {
          setIsAdminTyping(true);
          sendSequence(messagesArray, index + 1);
        }
      }, 2000);
    };

    const messagesToSend = autoReplyMessages.length > 0 ? autoReplyMessages : [autoReplyMessage];
    sendSequence(messagesToSend);
  };

  // Throttle typing events
  let lastTypingTime = 0;
  const sendTypingStatus = async () => {
    if (!sessionId) return;
    const now = Date.now();
    if (now - lastTypingTime > 3000) {
      lastTypingTime = now;
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'typing', payload: { id: sessionId } })
      });
    }
  };

  const sessionMessages = messages.filter(m => m.profileId === sessionId);

  return {
    messages: sessionMessages,
    isLoading,
    sendMessage,
    sendTypingStatus,
    isAdminTyping,
    welcomeMessage,
    autoReplyMessage,
    welcomeMessages,
    autoReplyMessages
  };
}
