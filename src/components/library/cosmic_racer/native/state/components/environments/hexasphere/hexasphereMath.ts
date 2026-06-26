import * as THREE from 'three';

export interface HexTile {
  id: number;
  center: THREE.Vector3;
  polygon: THREE.Vector3[];
  isHexagon: boolean;
  color: THREE.Color;
  factionId?: number;
}

export function generateHexasphere(radius: number, detail: number): HexTile[] {
  // Detail 2 = 162 vertices -> 162 tiles
  // Detail 3 = 642 vertices -> 642 tiles
  // Detail 4 = 2562 vertices -> 2562 tiles
  const ico = new THREE.IcosahedronGeometry(radius, detail);
  const posArray = ico.attributes.position.array;
  
  // THREE.js IcosahedronGeometry might be non-indexed depending on the exact version/build
  let indices: ArrayLike<number>;
  if (ico.index) {
      indices = ico.index.array;
  } else {
      const numVertices = posArray.length / 3;
      const generatedIndices = new Uint32Array(numVertices);
      for (let i = 0; i < numVertices; i++) {
          generatedIndices[i] = i;
      }
      indices = generatedIndices;
  }

  // 1. Merge duplicate vertices to ensure flawless adjacency maps
  const uniqueVertices: THREE.Vector3[] = [];
  const oldToNew = new Map<number, number>();
  const vertexKeyMap = new Map<string, number>();

  for (let i = 0; i < posArray.length; i += 3) {
    const x = posArray[i];
    const y = posArray[i + 1];
    const z = posArray[i + 2];
    
    // Snapping to 4 decimals to merge float drift
    const key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;
    
    if (!vertexKeyMap.has(key)) {
      vertexKeyMap.set(key, uniqueVertices.length);
      uniqueVertices.push(new THREE.Vector3(x, y, z));
    }
    oldToNew.set(i / 3, vertexKeyMap.get(key)!);
  }

  // 2. Build Triangle Faces representing the dual centers
  const vertexFaces: number[][] = Array.from({ length: uniqueVertices.length }, () => []);
  const faceCenters: THREE.Vector3[] = [];

  for (let f = 0; f < indices.length / 3; f++) {
    const a = oldToNew.get(indices[f * 3])!;
    const b = oldToNew.get(indices[f * 3 + 1])!;
    const c = oldToNew.get(indices[f * 3 + 2])!;

    vertexFaces[a].push(f);
    vertexFaces[b].push(f);
    vertexFaces[c].push(f);

    const center = new THREE.Vector3()
      .copy(uniqueVertices[a])
      .add(uniqueVertices[b])
      .add(uniqueVertices[c])
      .divideScalar(3);
    
    // Project the center onto the sphere surface 
    // to make perfect spherical hexes hugging the crust!
    center.normalize().multiplyScalar(radius);
    faceCenters.push(center);
  }

  const tiles: HexTile[] = [];

  // Generate Aesthetic Geographic Faction Clusters
  const allianceCenters = [
    new THREE.Vector3(8, 4, 3).normalize().multiplyScalar(radius),   // Magenta Empire Capital
    new THREE.Vector3(-6, -7, -4).normalize().multiplyScalar(radius),// Purple Syndicate Capital
    new THREE.Vector3(-2, 7, -8).normalize().multiplyScalar(radius), // Electric Blue Vanguard Capital
  ];
  
  const allianceColors = [
    new THREE.Color("#ff00ff"), // Magenta
    new THREE.Color("#8a2be2"), // Deep Purple
    new THREE.Color("#00e5ff"), // Electric Blue
  ];
  
  const neutralColor = new THREE.Color("#0f172a"); // Dark Void Neutral

  // 3. Collect Face Centers around each vertex to form Hexagons/Pentagons
  for (let v = 0; v < uniqueVertices.length; v++) {
    const vFaces = vertexFaces[v];
    if (vFaces.length === 0) continue;
    
    const vNode = uniqueVertices[v];
    const polyVerts = vFaces.map(f => faceCenters[f]);

    // Sorting radially around the node's normal vector
    const vDir = vNode.clone().normalize();
    let up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(vDir.y) > 0.999) {
      up.set(1, 0, 0);
    }
    const right = new THREE.Vector3().crossVectors(up, vDir).normalize();
    up.crossVectors(vDir, right).normalize();

    polyVerts.sort((pA, pB) => {
      const vecA = pA.clone().sub(vNode);
      const vecB = pB.clone().sub(vNode);
      const angleA = Math.atan2(vecA.dot(up), vecA.dot(right));
      const angleB = Math.atan2(vecB.dot(up), vecB.dot(right));
      return angleA - angleB;
    });

    // Determine geographic faction alliance based on spherical proximity to capitals!
    let tileColor = neutralColor;
    let closestDist = Infinity;
    let closestAlliance = -1;
    
    for (let c = 0; c < 3; c++) {
        const dist = vNode.distanceTo(allianceCenters[c]);
        // Radius of influence = 7.0 geometric units (continent size)
        if (dist < 7.5 && dist < closestDist) {
            closestDist = dist;
            closestAlliance = c;
        }
    }
    
    if (closestAlliance !== -1) {
        tileColor = allianceColors[closestAlliance];
        
        // Sprinkle in 15% random neutral tiles inside territories to make the border/internal aesthetics feel organic and blocky
        if (Math.random() < 0.15) {
            tileColor = neutralColor;
        }
    } else {
        // Unclaimed deep-space/wild territories
        tileColor = neutralColor;
    }

    tiles.push({
      id: v,
      center: vNode,
      polygon: polyVerts,
      isHexagon: polyVerts.length === 6,
      color: tileColor,
      factionId: tileColor === neutralColor ? -1 : closestAlliance
    });
  }

  return tiles;
}

export function buildHexGridGeometry(tiles: HexTile[]) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const tileCenters: number[] = [];
  const tileIds: number[] = [];
  
  const wirePositions: number[] = [];
  const wireIndices: number[] = [];
  
  let vertexIndex = 0;
  let wireVertexIndex = 0;

  for (const tile of tiles) {
    const c = tile.center;
    const p = tile.polygon;
    const col = tile.color;

    // Central vertex
    const centerIdx = vertexIndex++;
    positions.push(c.x, c.y, c.z);
    colors.push(col.r, col.g, col.b);
    tileCenters.push(c.x, c.y, c.z);
    tileIds.push(tile.id);

    // Polygon ring vertices
    const startIdx = vertexIndex;
    for (let i = 0; i < p.length; i++) {
        positions.push(p[i].x, p[i].y, p[i].z);
        colors.push(col.r, col.g, col.b);
        tileCenters.push(c.x, c.y, c.z); // Every vertex in the tile knows its tile's center!
        tileIds.push(tile.id);
        vertexIndex++;
        
        // Triangle Face (fan from center)
        const nextRelativeIdx = (i + 1) % p.length;
        indices.push(centerIdx, startIdx + i, startIdx + nextRelativeIdx);
        
        // Wireframe vertices
        wirePositions.push(p[i].x, p[i].y, p[i].z);
        
        // Wireframe edges forming the polygon loop
        wireIndices.push(wireVertexIndex + i, wireVertexIndex + nextRelativeIdx);
    }
    wireVertexIndex += p.length;
  }

  const fillGeo = new THREE.BufferGeometry();
  fillGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  fillGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  fillGeo.setAttribute('tileCenter', new THREE.Float32BufferAttribute(tileCenters, 3));
  fillGeo.setAttribute('tileId', new THREE.Float32BufferAttribute(tileIds, 1));
  fillGeo.setIndex(indices);
  fillGeo.computeVertexNormals(); // Nice smooth shaded lighting

  const wireGeo = new THREE.BufferGeometry();
  wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(wirePositions, 3));
  wireGeo.setIndex(wireIndices);

  return { fillGeo, wireGeo };
}

export function generateLabelAtlasAndGeometry(tiles: HexTile[]) {
    const texSize = 4096;
    const cols = 64; 
    const cellSize = texSize / cols; // 64x64 pixels per tile is crisp!
    
    const canvas = document.createElement('canvas');
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext('2d')!;
    
    // Transparent background
    ctx.clearRect(0,0, texSize, texSize);
    
    // Aesthetic Styling
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const arrowColor = "rgba(0, 229, 255, 0.8)";
    const textColor = "rgba(255, 255, 255, 0.9)";
    
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    
    let vIdx = 0;
    
    tiles.forEach((tile, i) => {
        // Find Atlas quadrant
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * cellSize;
        const y = row * cellSize;
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        
        ctx.fillStyle = arrowColor;
        // Perfect Pointy-Topped Alignment Arrow pushing upwards to the North geometric pole of the Hexagon
        ctx.beginPath();
        ctx.moveTo(cx, cy - 20); // Top needle tip
        ctx.lineTo(cx - 10, cy - 8); // Wings
        ctx.lineTo(cx - 4, cy - 8);  // Inner Wings
        ctx.lineTo(cx - 4, cy - 2);  // Shaft Base
        ctx.lineTo(cx + 4, cy - 2);  // Shaft Base
        ctx.lineTo(cx + 4, cy - 8);  // Inner Wings
        ctx.lineTo(cx + 10, cy - 8); // Wings
        ctx.fill();
        
        // Write ID directly beneath it squarely in the middle of the hex
        ctx.fillStyle = textColor;
        ctx.font = "bold 20px monospace";
        ctx.fillText(tile.id.toString(), cx, cy + 12);
        
        // UV Coordinate Mapping
        const u0 = x / texSize;
        const v0 = 1.0 - (y + cellSize) / texSize; // WebGL flips Y natively
        const u1 = (x + cellSize) / texSize;
        const v1 = 1.0 - y / texSize;
        
        // Mathematical World Position (Floating very slightly higher than crust to prevent strictly-Z fighting)
        const normal = tile.center.clone().normalize();
        const center = tile.center.clone().add(normal.clone().multiplyScalar(0.02)); 
        
        // Match the "Up" vector to exactly match the Vertex we pointed the Camera roll towards!
        const topVertex = tile.polygon[0].clone();
        const upVec = topVertex.sub(tile.center).normalize();
        
        // Find the Right Vector using the spherical tangent plane (Up x Normal = Right)
        const rightVec = new THREE.Vector3().crossVectors(upVec, normal).normalize();
        
        // Calculate the 4 corners of a flat quad (scaled to fit nicely visually inside the mesh)
        const quadSize = 0.55; 
        
        const rHalf = rightVec.clone().multiplyScalar(quadSize/2);
        const uHalf = upVec.clone().multiplyScalar(quadSize/2);
        
        const tl = center.clone().add(uHalf).sub(rHalf);
        const tr = center.clone().add(uHalf).add(rHalf);
        const bl = center.clone().sub(uHalf).sub(rHalf);
        const br = center.clone().sub(uHalf).add(rHalf);
        
        // Append to Master Merged Buffer Geometry array
        positions.push(tl.x, tl.y, tl.z); uvs.push(u0, v1);
        positions.push(tr.x, tr.y, tr.z); uvs.push(u1, v1);
        positions.push(bl.x, bl.y, bl.z); uvs.push(u0, v0);
        positions.push(br.x, br.y, br.z); uvs.push(u1, v0);
        
        // Triangle Face Maps
        indices.push(vIdx, vIdx+2, vIdx+1);
        indices.push(vIdx+1, vIdx+2, vIdx+3);
        vIdx += 4;
    });
    
    // Construct ultra-lightweight GPU structure
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    
    return { labelGeo: geo, labelTexture: texture };
}
