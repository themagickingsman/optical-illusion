"use client";

import React, { useState, useEffect } from 'react';
import ActionEngine from '../../action-engine/ActionEngine';

export default function SquareCMS() {
  const [activeTab, setActiveTab] = useState<'reddit' | 'chat'>('reddit');
  
  const [welcomeMessages, setWelcomeMessages] = useState<string[]>(["Welcome to the secure channel."]);
  const [autoReplyMessages, setAutoReplyMessages] = useState<string[]>(["Message Received\nCurrent response time: 1 hour"]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    fetch('/api/chat')
      .then(res => res.json())
      .then(data => {
        if (data.welcomeMessages && data.welcomeMessages.length > 0) {
          setWelcomeMessages(data.welcomeMessages);
        } else if (data.welcomeMessage) {
          setWelcomeMessages([data.welcomeMessage]);
        }
        
        if (data.autoReplyMessages && data.autoReplyMessages.length > 0) {
          setAutoReplyMessages(data.autoReplyMessages);
        } else if (data.autoReplyMessage) {
          setAutoReplyMessages([data.autoReplyMessage]);
        }
      })
      .catch(err => console.error("Failed to load auto messages", err));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("Saving...");
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_auto_messages',
          welcomeMessage: welcomeMessages[0] || "",
          autoReplyMessage: autoReplyMessages[0] || "",
          welcomeMessages,
          autoReplyMessages
        })
      });
      setSaveStatus("Saved successfully!");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateArray = (arr: string[], index: number, value: string, setter: any) => {
    const newArr = [...arr];
    newArr[index] = value;
    setter(newArr);
  };

  const removeFromArray = (arr: string[], index: number, setter: any) => {
    const newArr = arr.filter((_, i) => i !== index);
    setter(newArr);
  };

  const addToArray = (arr: string[], setter: any) => {
    setter([...arr, ""]);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] text-white overflow-hidden">
      {/* Sub-Navigation */}
      <div className="flex border-b border-[#333] p-4 gap-4 bg-[#111]">
        <button
          onClick={() => setActiveTab('reddit')}
          className={`px-6 py-2 rounded-full font-bold transition-all ${
            activeTab === 'reddit' 
              ? 'bg-[#0A84FF] text-white' 
              : 'bg-[#222] text-[#888] hover:bg-[#333]'
          }`}
        >
          Reddit Automation
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-6 py-2 rounded-full font-bold transition-all ${
            activeTab === 'chat' 
              ? 'bg-[#9333EA] text-white' 
              : 'bg-[#222] text-[#888] hover:bg-[#333]'
          }`}
        >
          Chat Responders
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'reddit' && (
          <div className="absolute inset-0 overflow-y-auto">
            <ActionEngine />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="absolute inset-0 overflow-y-auto p-8 flex flex-col items-center pb-32">
            <div className="w-full max-w-3xl bg-[#111] border border-[#333] rounded-3xl p-8 flex flex-col gap-10 shadow-2xl">
              
              <div>
                <h2 className="text-2xl font-bold mb-2 text-white">Chat Auto-Responders</h2>
                <p className="text-[#888]">Configure the automated messages that visitors see when they open the chat and when they send their first message.</p>
              </div>

              {/* Welcome Messages Section */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-[#aaa] uppercase tracking-wider text-sm">
                    Welcome Sequence
                  </label>
                  <button 
                    onClick={() => addToArray(welcomeMessages, setWelcomeMessages)}
                    className="text-xs bg-[#222] hover:bg-[#333] px-3 py-1 rounded-full text-white transition-colors"
                  >
                    + Add Message
                  </button>
                </div>
                
                {welcomeMessages.map((msg, index) => (
                  <div key={`welcome-${index}`} className="relative flex flex-col">
                    <textarea
                      value={msg}
                      onChange={(e) => updateArray(welcomeMessages, index, e.target.value, setWelcomeMessages)}
                      className="w-full bg-[#222] border border-[#444] rounded-xl p-4 text-white outline-none focus:border-[#0A84FF] transition-colors resize-none h-24"
                      placeholder="Welcome to the secure channel."
                    />
                    {welcomeMessages.length > 1 && (
                      <button 
                        onClick={() => removeFromArray(welcomeMessages, index, setWelcomeMessages)}
                        className="absolute top-3 right-3 text-red-500 hover:text-red-400 bg-[#111] rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-[#666]">This sequence is displayed locally to the user immediately when they open the chat interface.</p>
              </div>

              {/* Auto-Reply Messages Section */}
              <div className="flex flex-col gap-4 pt-6 border-t border-[#333]">
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-[#aaa] uppercase tracking-wider text-sm">
                    Auto-Reply Sequence
                  </label>
                  <button 
                    onClick={() => addToArray(autoReplyMessages, setAutoReplyMessages)}
                    className="text-xs bg-[#222] hover:bg-[#333] px-3 py-1 rounded-full text-white transition-colors"
                  >
                    + Add Message
                  </button>
                </div>

                {autoReplyMessages.map((msg, index) => (
                  <div key={`reply-${index}`} className="relative flex flex-col">
                    <textarea
                      value={msg}
                      onChange={(e) => updateArray(autoReplyMessages, index, e.target.value, setAutoReplyMessages)}
                      className="w-full bg-[#222] border border-[#444] rounded-xl p-4 text-white outline-none focus:border-[#9333EA] transition-colors resize-none h-24"
                      placeholder="Message Received\nCurrent response time: 1 hour"
                    />
                    {autoReplyMessages.length > 1 && (
                      <button 
                        onClick={() => removeFromArray(autoReplyMessages, index, setAutoReplyMessages)}
                        className="absolute top-3 right-3 text-red-500 hover:text-red-400 bg-[#111] rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-[#666]">This sequence is automatically sent out, staggered by a few seconds, after the user's first message.</p>
              </div>

              <div className="flex items-center gap-4 mt-4 pt-6 border-t border-[#333]">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-[#03FFC0] hover:bg-[#02E0A8] text-black font-bold py-3 px-8 rounded-full transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Configuration"}
                </button>
                {saveStatus && (
                  <span className={`font-bold ${saveStatus.includes('Failed') ? 'text-red-500' : 'text-[#03FFC0]'}`}>
                    {saveStatus}
                  </span>
                )}
              </div>
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
