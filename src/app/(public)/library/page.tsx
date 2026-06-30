import React, { Suspense } from 'react';
import LibraryCMS from '@/components/cms/views/LibraryCMS';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Library | Optical Illusions',
  description: 'Agentic Game Assets and tools.',
};

export default function LibraryPage() {
  return (
    <Suspense fallback={null}>
      <LibraryCMS />
    </Suspense>
  );
}
