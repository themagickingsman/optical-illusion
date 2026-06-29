import React from 'react';
import fs from 'fs';
import path from 'path';
import EngineClientView from './EngineClientView';

// Read from the unified library.json schema instead of engines.ts
const getLibraryData = () => {
  try {
    const filePath = path.join(process.cwd(), 'src/data/library.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (err) {
    return [];
  }
};

export default async function EngineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const libraryData = getLibraryData();
  const engine = libraryData.find((e: any) => e.id === id);

  if (!engine) {
    // Instead of 404, show debug info so the user and I can see what went wrong
    return (
      <div style={{ color: 'white', padding: '50px' }}>
        <h1>404 Debug</h1>
        <p>Requested ID: {id}</p>
        <p>Available IDs: {libraryData.map((e: any) => e.id).join(', ')}</p>
      </div>
    );
  }

  // We mount the new 50/50 Editorial Redesign as the official sub page
  return <EngineClientView app={engine} />;
}
