'use client';
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Demo from './Demo';

export interface WebGPUFireworksHandle {
  launchRocket: () => void;
  startFinale: () => void;
}

interface WebGPUFireworksProps {
  zIndex?: number;
}

export const WebGPUFireworks = forwardRef<WebGPUFireworksHandle, WebGPUFireworksProps>(
  ({ zIndex = 9999 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const demoRef = useRef<Demo | null>(null);

    useImperativeHandle(ref, () => ({
      launchRocket: () => {
        if (demoRef.current) demoRef.current.launchRocket();
      },
      startFinale: () => {
        if (demoRef.current) demoRef.current.startFinale();
      }
    }));

    useEffect(() => {
    if (typeof window === 'undefined' || !canvasRef.current) return;

    try {
      const demo = new Demo(canvasRef.current);
      demoRef.current = demo;
    } catch (e) {
      console.warn("WebGPU not supported or initialization failed for WebGPUFireworks:", e);
    }

    return () => {
      if (demoRef.current) {
        demoRef.current.destroy();
        demoRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex,
        background: 'transparent'
      }}
    />
  );
});
