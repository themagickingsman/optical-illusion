import React from 'react';
import NexusMetaballs from '@/components/NexusMetaballs';

export default function MetaballsCMS() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <NexusMetaballs showUI={true} />
    </div>
  );
}
