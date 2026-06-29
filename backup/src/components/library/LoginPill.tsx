"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function LoginPill() {
  const [isExpanded, setIsExpanded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Click outside to collapse
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [formRef]);

  // Tuned Spring Physics for buttery smoothness
  const springConfig = { type: 'spring' as const, stiffness: 500, damping: 35, mass: 1 };

  return (
    <div style={{ height: '56px', marginBottom: '25px', display: 'flex', justifyContent: 'center', transform: 'translateY(-80px)' }}>
      
      <motion.div
        animate={{ 
          width: isExpanded ? 420 : 160,
          background: isExpanded ? 'rgba(0,0,0,0.6)' : '#4ade80',
          borderColor: isExpanded ? 'rgba(74, 222, 128, 0.4)' : 'rgba(74, 222, 128, 0)',
          boxShadow: isExpanded 
            ? 'inset 0 0 20px rgba(74, 222, 128, 0.1), 0 0 15px rgba(74, 222, 128, 0.2)' 
            : '0 0 25px rgba(74, 222, 128, 0.4)'
        }}
        transition={springConfig}
        style={{
          height: '56px',
          borderRadius: '100px',
          border: '1px solid',
          overflow: 'hidden',
          position: 'relative',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          
          {/* COLLAPSED STATE (LOGIN BUTTON) */}
          {!isExpanded && (
            <motion.button
              key="login-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                color: 'black',
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                cursor: 'pointer',
                fontFamily: 'var(--font-rubik), sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              LOGIN
            </motion.button>
          )}

          {/* EXPANDED STATE (FORM) */}
          {isExpanded && (
            <motion.form
              key="login-form"
              ref={formRef}
              initial={{ opacity: 0, filter: 'blur(4px)', x: -20 }}
              animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
              exit={{ opacity: 0, filter: 'blur(4px)', x: 20 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '420px', // Hardcoded to match expanded width
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px 0 24px',
                gap: '16px',
                fontFamily: 'var(--font-rubik), sans-serif',
              }}
              onSubmit={(e) => {
                e.preventDefault();
                console.log("Submitted");
                setIsExpanded(false);
              }}
            >
              {/* User Phrase Input */}
              <input
                type="text"
                placeholder="User Phrase"
                autoFocus
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  fontSize: '16px',
                  width: '140px',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  paddingRight: '16px',
                  fontWeight: 500,
                }}
              />
              
              {/* AI Key Input */}
              <input
                type="password"
                placeholder="Ai Key"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  fontSize: '16px',
                  width: '130px',
                  fontWeight: 500,
                  letterSpacing: '2px',
                }}
              />

              {/* Submit Circle Arrow */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05, backgroundColor: '#22c55e' }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#4ade80',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'black',
                  boxShadow: '0 0 15px rgba(74, 222, 128, 0.3)',
                  marginLeft: 'auto'
                }}
              >
                <ArrowRight size={20} strokeWidth={3} />
              </motion.button>
            </motion.form>
          )}

        </AnimatePresence>
      </motion.div>

    </div>
  );
}
