"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollResetter() {
  const pathname = usePathname();

  useEffect(() => {
    const container = document.getElementById('build-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [pathname]);

  return null;
}
