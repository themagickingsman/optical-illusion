import React, { useState, useEffect, useRef } from 'react';

interface IdleCopyButtonProps {
  assetKey: string;
}

export function IdleCopyButton({ assetKey }: IdleCopyButtonProps) {
  const [isIdle, setIsIdle] = useState(false);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetIdleTimer = () => {
      setIsIdle(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsIdle(true);
      }, 5000);
    };

    // Initial trigger
    resetIdleTimer();

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);

    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(assetKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0, 229, 255, 1)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(0, 229, 255, 0.8)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
      style={{
        position: 'fixed',
        top: '40px',
        right: '220px', // Positioned to the left of the Exit Preview button
        zIndex: 9999,
        opacity: isIdle ? 0 : 1,
        pointerEvents: isIdle ? 'none' : 'auto',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        background: 'rgba(0, 229, 255, 0.8)',
        border: '1px solid rgba(0, 229, 255, 1)',
        color: '#000',
        padding: '16px 32px',
        borderRadius: '9999px',
        cursor: 'pointer',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '16px',
        fontWeight: 'bold',
        letterSpacing: '0.5px',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 24px rgba(0, 229, 255, 0.4)'
      }}
    >
      {copied ? 'Copied to Clipboard!' : 'Copy Asset Key'}
    </button>
  );
}
