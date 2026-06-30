import React from 'react';
import HireMeView from '@/components/views/HireMeView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hire Me | Optical Illusions',
  description: 'Work with the best in the business.',
};

export default function HireMePage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 170px)' }}>
      <HireMeView />
    </div>
  );
}
