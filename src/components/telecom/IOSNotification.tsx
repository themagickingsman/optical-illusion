import React, { useEffect } from 'react';

interface IOSNotificationProps {
  title: string;
  message: string;
  isVisible: boolean;
  onClick: () => void;
  onClose: () => void;
  duration?: number;
}

export default function IOSNotification({ title, message, isVisible, onClick, onClose, duration = 4000 }: IOSNotificationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  // To display video call special UI
  const isVideoCall = message.includes('[VIDEO_CALL');
  const displayMessage = isVideoCall ? '📹 Incoming Video Call' : message;

  return (
    <div 
      onClick={() => {
        onClick();
        onClose();
      }}
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: `translateX(-50%) translateY(${isVisible ? '0px' : '-150px'})`,
        opacity: isVisible ? 1 : 0,
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease',
        width: '90%',
        maxWidth: '400px',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 99999,
        cursor: 'pointer',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #03FFC0 0%, #00A37A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        boxShadow: '0 4px 10px rgba(3, 255, 192, 0.3)',
        flexShrink: 0
      }}>
        👤
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ fontWeight: '600', fontSize: '15px', color: '#fff', marginBottom: '2px' }}>
          {title}
        </div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayMessage}
        </div>
      </div>
    </div>
  );
}
