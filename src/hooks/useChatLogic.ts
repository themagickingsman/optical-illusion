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

export function useChatLogic(sessionId: string, isGlobalChat: boolean = false) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<ChatProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [effectiveSessionId, setEffectiveSessionId] = useState(sessionId);
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

  // Sync if props change but only if we don't already have an effective ID
  useEffect(() => {
    if (!effectiveSessionId && sessionId) {
      setEffectiveSessionId(sessionId);
    }
  }, [sessionId, effectiveSessionId]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const currentId = effectiveSessionId || sessionId;

    // First ensure the profile exists
    if (!profiles.find(p => p.id === currentId)) {
      const pRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'profile',
          payload: {
            id: currentId,
            name: 'Visitor',
            email: null,
            lastActive: new Date().toISOString()
          }
        })
      });
      const pData = await pRes.json();
      if (pData.activeProfileId && pData.activeProfileId !== currentId) {
        setEffectiveSessionId(pData.activeProfileId);
      }
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      profileId: effectiveSessionId || sessionId,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'message', payload: newMessage })
    });
    
    const data = await res.json();
    if (data.activeProfileId && data.activeProfileId !== newMessage.profileId) {
      setEffectiveSessionId(data.activeProfileId);
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, profileId: data.activeProfileId } : m));
    }
    
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
        const activeId = effectiveSessionId || sessionId;
        const autoReply: ChatMessage = {
          id: (Date.now() + index).toString(),
          profileId: activeId,
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
    const currentId = effectiveSessionId || sessionId;
    if (!currentId) return;
    const now = Date.now();
    if (now - lastTypingTime > 3000) {
      lastTypingTime = now;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'typing', payload: { id: currentId } })
      });
      const data = await res.json();
      if (data.activeProfileId && data.activeProfileId !== currentId) {
        setEffectiveSessionId(data.activeProfileId);
      }
    }
  };

  const activeId = effectiveSessionId || sessionId;
  // If global chat, show all messages. Otherwise filter by the active session ID.
  const sessionMessages = isGlobalChat ? messages : messages.filter(m => m.profileId === activeId);
  // Cap messages to the last 25 for mobile performance (industry standard for live widgets)
  const cappedMessages = sessionMessages.slice(-25);

  return {
    messages: cappedMessages,
    isLoading,
    sendMessage,
    sendTypingStatus,
    isAdminTyping,
    welcomeMessage,
    autoReplyMessage,
    welcomeMessages,
    autoReplyMessages,
    effectiveSessionId: activeId,
    refreshChats: fetchChats
  };
}
