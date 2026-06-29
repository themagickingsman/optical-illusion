import React, { useState, useEffect } from 'react';

export default function FactsAndQuotesTab() {
  const [activeTab, setActiveTab] = useState<'facts' | 'quotes'>('facts');
  const [facts, setFacts] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    fetch('/api/cms?key=section_facts_quotes')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setFacts(res.data.facts || []);
          setQuotes(res.data.quotes || []);
        }
      })
      .catch(err => console.error("Failed to load Facts & Quotes", err));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const payload = { facts, quotes };
    try {
      await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'section_facts_quotes', data: payload })
      });
    } catch(e) {
      console.error("Save failed", e);
    }
    setTimeout(() => setIsSaving(false), 800);
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    if (activeTab === 'facts') {
      setFacts([newItemText, ...facts]);
    } else {
      setQuotes([newItemText, ...quotes]);
    }
    setNewItemText("");
  };

  const deleteItem = (index: number) => {
    if (activeTab === 'facts') {
      const newFacts = [...facts];
      newFacts.splice(index, 1);
      setFacts(newFacts);
    } else {
      const newQuotes = [...quotes];
      newQuotes.splice(index, 1);
      setQuotes(newQuotes);
    }
  };

  const updateItem = (index: number, newText: string) => {
    if (activeTab === 'facts') {
      const newFacts = [...facts];
      newFacts[index] = newText;
      setFacts(newFacts);
    } else {
      const newQuotes = [...quotes];
      newQuotes[index] = newText;
      setQuotes(newQuotes);
    }
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    if (activeTab === 'facts') {
      const newArr = [...facts];
      if (index + direction < 0 || index + direction >= newArr.length) return;
      const temp = newArr[index];
      newArr[index] = newArr[index + direction];
      newArr[index + direction] = temp;
      setFacts(newArr);
    } else {
      const newArr = [...quotes];
      if (index + direction < 0 || index + direction >= newArr.length) return;
      const temp = newArr[index];
      newArr[index] = newArr[index + direction];
      newArr[index + direction] = temp;
      setQuotes(newArr);
    }
  };

  const currentList = activeTab === 'facts' ? facts : quotes;

  return (
    <div style={{ width: "100%", height: "100%", background: "#050511", color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      
      {/* Header */}
      <div style={{ padding: "20px 30px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", gap: "20px" }}>
            <button 
              onClick={() => setActiveTab('facts')}
              style={{ 
                background: "none", border: "none", 
                color: activeTab === 'facts' ? "#38bdf8" : "#888", 
                fontSize: "16px", fontWeight: activeTab === 'facts' ? "bold" : "normal", 
                cursor: "pointer", borderBottom: activeTab === 'facts' ? "2px solid #38bdf8" : "2px solid transparent",
                paddingBottom: "8px", textTransform: 'uppercase', letterSpacing: 1
              }}
            >
              📚 Facts ({facts.length})
            </button>
            <button 
              onClick={() => setActiveTab('quotes')}
              style={{ 
                background: "none", border: "none", 
                color: activeTab === 'quotes' ? "#a855f7" : "#888", 
                fontSize: "16px", fontWeight: activeTab === 'quotes' ? "bold" : "normal", 
                cursor: "pointer", borderBottom: activeTab === 'quotes' ? "2px solid #a855f7" : "2px solid transparent",
                paddingBottom: "8px", textTransform: 'uppercase', letterSpacing: 1
              }}
            >
              💬 Quotes ({quotes.length})
            </button>
        </div>
        <button 
            onClick={handleSave}
            style={{ background: isSaving ? '#22c55e' : '#38bdf8', color: '#000', border: 'none', padding: '8px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
        >
            {isSaving ? 'SAVED ✓' : 'SAVE CHANGES'}
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Add New Item */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "20px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <textarea 
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder={`Add a new ${activeTab === 'facts' ? 'Fact' : 'Quote'}...`}
                    style={{ flex: 1, height: "60px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", padding: "12px", fontSize: "14px", resize: "none", fontFamily: "inherit" }}
                />
                <button 
                    onClick={addItem}
                    disabled={!newItemText.trim()}
                    style={{ background: activeTab === 'facts' ? '#38bdf8' : '#a855f7', color: '#000', border: 'none', height: "60px", padding: '0 24px', borderRadius: '8px', fontWeight: 'bold', cursor: newItemText.trim() ? 'pointer' : 'not-allowed', opacity: newItemText.trim() ? 1 : 0.5 }}
                >
                    ADD
                </button>
            </div>

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {currentList.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: activeTab === 'facts' ? '#38bdf8' : '#a855f7', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, marginTop: '4px' }}>
                            {idx + 1}
                        </div>
                        
                        <textarea 
                            value={item}
                            onChange={(e) => updateItem(idx, e.target.value)}
                            style={{ flex: 1, minHeight: "40px", background: "transparent", border: "none", color: "#e2e8f0", fontSize: "15px", lineHeight: "1.5", resize: "vertical", outline: "none", fontFamily: "inherit" }}
                        />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                            <button 
                                onClick={() => moveItem(idx, -1)} 
                                disabled={idx === 0}
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: "24px", height: "24px", borderRadius: '4px', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >▲</button>
                            <button 
                                onClick={() => moveItem(idx, 1)} 
                                disabled={idx === currentList.length - 1}
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: "24px", height: "24px", borderRadius: '4px', cursor: idx === currentList.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === currentList.length - 1 ? 0.3 : 1, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >▼</button>
                        </div>
                        
                        <button 
                            onClick={() => deleteItem(idx)}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', width: "32px", height: "32px", borderRadius: '6px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '10px', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

        </div>
      </div>
    </div>
  );
}
