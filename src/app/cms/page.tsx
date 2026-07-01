import React from 'react';
import { Metadata } from 'next';
import CMSClientPage from './CMSClientPage';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const tab = resolvedParams?.tab;
  
  let tabName = 'Dashboard';
  if (tab === 'build') tabName = 'Build Environment';
  if (tab === 'home') tabName = 'About Me';
  if (tab === 'games') tabName = 'Games';
  if (tab === 'process') tabName = 'Process';
  if (tab === 'library') tabName = 'Library';
  if (tab === 'hire') tabName = 'Hire Me';
  if (tab === 'chat') tabName = 'Chat';
  if (tab === 'variables') tabName = 'Variables';
  if (tab === 'master-control') tabName = 'Master Control';
  
  const titleStr = `CMS | ${tabName}`;

  return {
    title: titleStr,
    description: 'Optical Illusions CMS Dashboard.',
    robots: {
      index: false,
      follow: false,
    }
  };
}

export default function CMSPage() {
  return <CMSClientPage />;
}
