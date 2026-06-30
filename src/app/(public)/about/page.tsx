import React, { Suspense } from 'react';
import HomeCMS from '@/components/cms/views/HomeCMS';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Optical Illusions',
  description: 'The R&D Forge for AAA Game Studios',
};

export default function AboutPage() {
  return (
    <Suspense fallback={null}>
      <HomeCMS />
    </Suspense>
  );
}
