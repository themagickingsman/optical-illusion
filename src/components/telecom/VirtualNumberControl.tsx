import React, { useState, useEffect } from 'react';

interface VirtualNumberControlProps {
  onNumberActivated?: (profileId: string) => void;
}

export default function VirtualNumberControl({ onNumberActivated }: VirtualNumberControlProps = {}) {
  const [activeNumber, setActiveNumber] = useState<string | null>(null);
  const [availableNumbers, setAvailableNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNumbers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telecom/virtual-number', { cache: 'no-store' });
      const data = await res.json();
      setActiveNumber(data.activeNumber || null);
      setAvailableNumbers(data.availableNumbers || []);
      
      if (data.activeNumber && onNumberActivated) {
        const profileId = `virtual-sms-${data.activeNumber.replace(/\D/g, '')}`;
        onNumberActivated(profileId);
      }
      
      if (!data.activeNumber && (data.availableNumbers?.length > 0)) {
        setShowDropdown(true);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const activateNumber = async (num: string) => {
    try {
      await fetch('/api/telecom/virtual-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: num })
      });
      setActiveNumber(num);
      setShowDropdown(false);
      const profileId = `virtual-sms-${num.replace(/\D/g, '')}`;
      if (onNumberActivated) {
        onNumberActivated(profileId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNumbers();
  }, []);

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
    <div style={{ padding: '20px', background: '#1a1a1a', borderBottom: '1px solid #333' }}>
      <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#4ade80' }}>Public Virtual SMS Scraper</h2>
      <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#888' }}>
        Select a public phone number to monitor. All incoming confirmation codes for this number will be injected directly into the Chat feed. 
        <br/><strong style={{color: '#ef4444'}}>Warning:</strong> These are public numbers. You will see texts from other users.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ flex: 1, padding: '15px', background: '#000', borderRadius: '8px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Active Number</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: activeNumber ? '#fff' : '#444' }}>
              {activeNumber || 'No number selected'}
            </div>
          </div>
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (availableNumbers.length === 0 && !loading) {
                fetchNumbers().then(() => setShowDropdown(true));
              } else {
                setShowDropdown(!showDropdown);
              }
            }}
            disabled={loading}
            style={{ padding: '10px 20px', background: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'Fetching...' : 'Get New Number'}
          </button>
        </div>
      </div>

      {showDropdown && availableNumbers.length > 0 && (
        <div style={{ marginTop: '15px', background: '#000', border: '1px solid #333', borderRadius: '8px', padding: '10px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#888' }}>Select a Public Number to Monitor:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {availableNumbers.map(num => (
              <button
                key={num}
                onClick={() => activateNumber(num)}
                style={{ padding: '15px', background: '#111', border: '1px solid #222', borderRadius: '6px', color: '#fff', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#222'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#111'}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
