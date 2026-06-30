import React, { Suspense } from 'react';
import ProcessCMS from '@/components/cms/views/ProcessCMS';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Process | Optical Illusions',
  description: 'How we build next-generation interfaces.',
};

export default function ProcessPage() {
  return (
    <Suspense fallback={null}>
      <ProcessCMS />
    </Suspense>
  );
}
