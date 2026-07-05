import React, { useState, useEffect } from 'react';
import AppleSpinner from '@/components/library/AppleSpinner';

interface SmsScraperControlProps {
  onSmsCreated?: (profileId: string) => void;
}

export default function SmsScraperControl({ onSmsCreated }: SmsScraperControlProps) {
  const [isGeneratingSms, setIsGeneratingSms] = useState(false);
  const [activeNumber, setActiveNumber] = useState<string | null>(null);

  // Restore active number on mount if there's one already active
  useEffect(() => {
    const fetchCurrentNumber = async () => {
      try {
        const res = await fetch('/api/telecom/virtual-number', { cache: 'no-store' });
        const data = await res.json();
        if (data.activeNumber) {
          setActiveNumber(data.activeNumber);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCurrentNumber();
  }, []);

  const handleNewSmsChat = async () => {
    setIsGeneratingSms(true);
    try {
      const getRes = await fetch('/api/telecom/virtual-number');
      const getData = await getRes.json();
      
      let numberToActivate = null;
      if (getData.availableNumbers && getData.availableNumbers.length > 0) {
        numberToActivate = getData.availableNumbers[Math.floor(Math.random() * getData.availableNumbers.length)];
      }

      if (numberToActivate) {
        const postRes = await fetch('/api/telecom/virtual-number', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: numberToActivate })
        });
        const postData = await postRes.json();
        
        if (postData.activeNumber) {
          const profileId = `virtual-sms-${postData.activeNumber.replace(/\D/g, '')}`;
          
          // Create the profile in the database
          await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create_sms_profile',
              profileId,
              number: postData.activeNumber
            })
          });

          setActiveNumber(postData.activeNumber);
          if (onSmsCreated) onSmsCreated(profileId);
        }
      }
    } catch (err) {
      console.error("Failed to generate new SMS chat", err);
    }
    setIsGeneratingSms(false);
  };

  // Background polling to stream SMS messages directly to the chat database
  useEffect(() => {
    if (!activeNumber) return;
    const syncSms = async () => {
      try {
        await fetch('/api/telecom/sync-sms');
      } catch (err) {}
    };
    syncSms(); // run once immediately
    const interval = setInterval(syncSms, 10000);
    return () => clearInterval(interval);
  }, [activeNumber]);

  return (
    <button 
      onClick={handleNewSmsChat}
      disabled={isGeneratingSms}
      style={{ 
        width: '40px', 
        height: '32px', 
        borderRadius: '16px', 
        backgroundColor: activeNumber ? 'rgba(3, 255, 192, 0.2)' : 'transparent', 
        color: '#03FFC0', 
        border: '1px solid rgba(3, 255, 192, 0.3)', 
        cursor: isGeneratingSms ? 'wait' : 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '12px', 
        fontWeight: 'bold', 
        flexShrink: 0, 
        transition: 'all 0.2s', 
        opacity: isGeneratingSms ? 0.7 : 1 
      }}
      title="Generate New SMS Chat"
    >
      {isGeneratingSms ? <AppleSpinner size={14} /> : 'SMS'}
    </button>
  );
}
