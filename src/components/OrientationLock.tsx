"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function OrientationLock() {
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if the device is a mobile device in landscape
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      // We consider it a mobile device if it has touch and a small screen height
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                             (window.innerWidth <= 1024 && window.innerHeight <= 600);
      
      setIsLandscapeMobile(isLandscape && isMobileDevice);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  if (!isLandscapeMobile) return null;

  return (
    <div style={{
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
      padding: '20px'
    }}>
      <div style={{
        width: '120px',
        height: '120px',
        position: 'relative',
        marginBottom: '30px',
        filter: 'drop-shadow(0px 0px 20px rgba(255,255,255,0.3))'
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
        lineHeight: '1.5'
      }}>
        This experience is optimized for portrait mode. Please turn your phone vertically to continue.
      </p>
    </div>
  );
}
