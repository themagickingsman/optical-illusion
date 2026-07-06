"use client";

import React from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  
  return (
    <div 
      onClick={() => router.push('/')}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#7c3aed', // Purple color matching brand
        zIndex: 9999999, // Ensure it covers absolutely everything
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'var(--font-rubik), sans-serif',
        textAlign: 'center',
        padding: '20px',
        cursor: 'pointer' // Let user know it's clickable
      }}
    >
      <div style={{
        width: '120px',
        height: '120px',
        position: 'relative',
        marginBottom: '30px'
      }}>
        <Image 
          src="/assets/logo/op_logo.png" 
          alt="OP Logo" 
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>
      <h2 style={{ 
        fontSize: '28px', 
        fontWeight: 'bold', 
        marginBottom: '15px',
        letterSpacing: '1px'
      }}>
        Please Rotate Device
      </h2>
      <p style={{ 
        fontSize: '16px', 
        opacity: 0.8,
        maxWidth: '300px',
        lineHeight: '1.5',
        marginBottom: '30px'
      }}>
        This experience is optimized for portrait mode. Please turn your phone vertically to continue.
      </p>
      
      <div style={{
        padding: '12px 24px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '30px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        fontSize: '14px',
        transition: 'background-color 0.2s ease',
      }}>
        TAP TO RELOAD
      </div>
    </div>
  );
}
