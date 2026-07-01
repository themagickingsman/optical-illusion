import MasterDashboard from '@/app/cms/page';
import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const preview = resolvedParams?.preview;
  const engineId = resolvedParams?.engine;
  const categoryId = resolvedParams?.category;

  if (process.env.NEXT_PUBLIC_BUILD !== 'true') {
    return { title: 'CMS Dashboard', robots: { index: false, follow: false } };
  }

  // Handle Games (Engines) Metadata
  if (preview === 'games' && typeof engineId === 'string') {
    try {
      const dbPath = path.join(process.cwd(), 'src/data/library.json');
      const dbData = fs.readFileSync(dbPath, 'utf8');
      const engines = JSON.parse(dbData);
      const engine = engines.find((e: any) => e.id === engineId);
      if (engine) {
        return {
          title: `${engine.title} | Cosmic Architecture`,
          description: engine.description || `Play ${engine.title} by the Cosmic Architecture team.`,
        };
      }
    } catch (e) {
      console.error('Failed to generate metadata for engine:', e);
    }
  }

  // Handle Library (Categories) Metadata
  if (preview === 'library' && typeof categoryId === 'string') {
    return {
      title: `${categoryId === 'all' ? 'All' : categoryId} Assets | Cosmic Architecture`,
      description: `Browse our library of ${categoryId} game assets.`,
    };
  }

  // Generic metadata for other tabs
  let title = 'Optical Illusions';
  if (preview === 'games') title = 'Games | Optical Illusions';
  if (preview === 'library') title = 'Asset Library | Optical Illusions';
  if (preview === 'about' || preview === 'home') title = 'About Us | Optical Illusions';
  if (preview === 'process') title = 'Our Process | Optical Illusions';
  if (preview === 'hire') title = 'Hire Us | Optical Illusions';

  return {
    title,
    description: 'Explore the universe of web-based optical illusions and interactive WebGL experiences.',
  };
}

export default function RootPage() {
  return <MasterDashboard />;
}
