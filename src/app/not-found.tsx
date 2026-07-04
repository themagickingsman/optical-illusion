import React from 'react';
import { Metadata } from 'next';
import CMSClientPage from './cms/CMSClientPage';

export const metadata: Metadata = {
  title: 'Not Found | Optical Illusions',
};

export default function NotFound() {
  return <CMSClientPage />;
}
