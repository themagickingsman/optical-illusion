import React, { useState } from 'react';
import AppleSpinner from '@/components/library/AppleSpinner';

interface VipInviteControlProps {
  onVipCreated?: (profileId: string) => void;
}

export default function VipInviteControl({ onVipCreated }: VipInviteControlProps) {
  const [isGeneratingVip, setIsGeneratingVip] = useState(false);
  const [vipCopied, setVipCopied] = useState(false);

  const handleNewVipChat = async () => {
    setIsGeneratingVip(true);
    try {
      const token = Math.random().toString(36).substring(2, 6).toUpperCase();
      const profileId = `VIP-${token}`;
      
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_vip_profile',
          profileId
        })
      });

      const inviteLink = `https://optical-illusion-eight.vercel.app/hire?t=${profileId}`;
      
      // Fallback clipboard copying
      try {
        await navigator.clipboard.writeText(inviteLink);
      } catch (err) {
        console.error("Failed to copy:", err);
        const input = document.createElement('input');
        input.value = inviteLink;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      
      if (onVipCreated) {
        onVipCreated(profileId);
      }
      
      setVipCopied(true);
      setTimeout(() => setVipCopied(false), 2000);
    } catch (err) {
      console.error("Failed to generate VIP chat", err);
    }
    setIsGeneratingVip(false);
  };

  return (
    <button 
      onClick={handleNewVipChat}
      disabled={isGeneratingVip}
      style={{ 
        width: '60px', 
        height: '32px', 
        borderRadius: '16px', 
        backgroundColor: vipCopied ? 'rgba(0,255,0,0.2)' : 'transparent', 
        color: vipCopied ? '#00FF00' : '#FFFFFF', 
        border: `1px solid ${vipCopied ? 'rgba(0,255,0,0.5)' : 'rgba(255, 255, 255, 0.3)'}`, 
        cursor: isGeneratingVip ? 'wait' : 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '12px', 
        fontWeight: 'bold', 
        flexShrink: 0, 
        transition: 'all 0.2s', 
        opacity: isGeneratingVip ? 0.7 : 1, 
        marginTop: '-5px' 
      }}
      title="Generate VIP Invite Link"
      onMouseEnter={e => { if (!isGeneratingVip && !vipCopied) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
      onMouseLeave={e => { if (!isGeneratingVip && !vipCopied) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; } }}
    >
      {isGeneratingVip ? <AppleSpinner size={14} /> : (vipCopied ? '✅' : 'Invite')}
    </button>
  );
}
