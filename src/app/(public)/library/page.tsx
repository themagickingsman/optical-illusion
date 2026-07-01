import React, { Suspense } from 'react';
import LibraryCMS from '@/components/cms/views/LibraryCMS';
import { Metadata } from 'next';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const category = resolvedParams?.category;
  const titleStr = category ? `Library | ${String(category)}` : 'Library | Optical Illusions';

  return {
    title: titleStr,
    description: 'Agentic Game Assets, tools, and technical resources.',
  };
}

export default function LibraryPage() {
  return (
    <Suspense fallback={null}>
      <LibraryCMS />
    </Suspense>
  );
}
