'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DASHBOARD_THEME } from '../components/DashboardTheme';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);
const Circle = dynamic(
    () => import('react-leaflet').then((mod) => mod.Circle),
    { ssr: false }
);
const CircleMarker = dynamic(
    () => import('react-leaflet').then((mod) => mod.CircleMarker),
    { ssr: false }
);
const Polyline = dynamic(
    () => import('react-leaflet').then((mod) => mod.Polyline),
    { ssr: false }
);
const Tooltip = dynamic(
    () => import('react-leaflet').then((mod) => mod.Tooltip),
    { ssr: false }
);

// Dynamic Import of MapController (must be client-side only due to useMap hook)
const LeafletMapController = dynamic(
    () => import('./LeafletMapController'),
    { ssr: false }
);

// LEAFLET SETUP (Fix for icons)
const fixLeafletIcons = async () => {
    // Only run on client
    if (typeof window !== 'undefined') {
        const L = (await import('leaflet')).default;
        if ((L.Icon.Default.prototype as any)._getIconUrl) {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: '/images/marker-icon-2x.png',
                iconUrl: '/images/marker-icon.png',
                shadowUrl: '/images/marker-shadow.png',
            });
        }
    }
};

// --- DATA CONSTANTS ---
const UNIT_HARMONIC_IDEAL_KM = 1728; // The Framework's "Perfect" Unit

// GLOBAL DATA (Tab: LEY_LINES)
const ANCHOR_SITE = {
    name: 'Great Zimbabwe',
    lat: -20.273,
    lng: 30.934,
    desc: 'The Anchor (0). Center of the Southern Geodetic System.',
    color: '#fbbf24' // Amber
};

const TARGET_SITES = [
    { name: 'Meroë (Kush)', lat: 16.938, lng: 33.729, desc: 'Geometric Resonant Point', harmonic: '2.40x (Pharaonic)', ratioParams: '12 / 5', tooltipDirection: 'left' },
    { name: 'Giza (Pyramids)', lat: 29.9792, lng: 31.1342, desc: 'The Prime Meridian of the North', harmonic: '3.236x (2Φ)', ratioParams: 'Phi Harmonic', tooltipDirection: 'top' },
    { name: 'Stonehenge', lat: 51.1789, lng: -1.8262, desc: 'Western Megalithic Anchor', harmonic: '4.96x (~5.0)', ratioParams: 'Grid Alignment', tooltipDirection: 'top' },
    { name: 'Angkor Wat', lat: 13.4125, lng: 103.8670, desc: 'Eastern Equatorial Temple', harmonic: '5.10x (~5.0)', ratioParams: 'Grid Alignment', tooltipDirection: 'bottom' },
    { name: 'Tiwanaku (Bolivia)', lat: -16.5565, lng: -68.6740, desc: 'The Antipodal Resonator', harmonic: '5.98x (~6.0)', ratioParams: 'Perfect Hex', tooltipDirection: 'top' },
    { name: 'Uluru (Australia)', lat: -25.3444, lng: 131.0369, desc: 'The Red Center', harmonic: '5.79x (~6.0)', ratioParams: 'Grid Alignment', tooltipDirection: 'top' }
];

const HARMONIC_RINGS = Array.from({ length: 12 }, (_, i) => i + 1); // 1 to 12

// LONDON DATA (Tab: LONDON)
const LONDON_SITES = [
    // PRIMARY INFRASTRUCTURE (THE MACHINE)
    { id: "eye", name: "London Eye (CPU)", lat: 51.5033, lon: -0.1195, type: "cpu", desc: "System Clock / Processor" },
    { id: "greenwich", name: "Greenwich (Input)", lat: 51.4769, lon: -0.0005, type: "input", desc: "Data Input (t=0)" },
    { id: "canary", name: "Canary Wharf (Output)", lat: 51.5048, lon: -0.0202, type: "output", desc: "Signal Transmitter" },
    { id: "o2", name: "The O2 (Receiver)", lat: 51.5030, lon: 0.0031, type: "receiver", desc: "Signal Dish" },
    
    // THE 33 NETWORK (AMBER)
    { id: "centrepoint", name: "Centre Point (33)", lat: 51.5164, lon: -0.1302, type: "node-33", desc: "33 Harmonic Node" },
    { id: "33grosvenor", name: "33 Grosvenor Place", lat: 51.4994, lon: -0.1465, type: "node-33", desc: "Esoteric Iconography" },
    { id: "33stjames", name: "33 St James's Sq", lat: 51.5071, lon: -0.1343, type: "node-33", desc: "Masonic Hub" },
    { id: "33horseferry", name: "33 Horseferry Rd", lat: 51.4952, lon: -0.1287, type: "node-33", desc: "Govt / Home Office" },

    // THE 66 NETWORK (VIOLET)
    { id: "gherkin", name: "The Gherkin (66)", lat: 51.5145, lon: -0.0803, type: "node-66", desc: "30 St Mary Axe" },
    { id: "66portland", name: "66 Portland Place", lat: 51.5213, lon: -0.1456, type: "node-66", desc: "RIBA HQ" },
    { id: "66lincoln", name: "66 Lincoln's Inn", lat: 51.5168, lon: -0.1175, type: "node-66", desc: "Legal / Esoteric" },
    { id: "66stjames", name: "66 St James's St", lat: 51.5064, lon: -0.1407, type: "node-66", desc: "Clubland" },
    { id: "stone", name: "London Stone", lat: 51.5113, lon: -0.0898, type: "node-66", desc: "The Geometric Heart" },

    // ADDITIONAL GEOMANTIC POINTS
    { id: "freemasons", name: "Freemasons Hall", lat: 51.5150, lon: -0.1213, type: "special", desc: "Grand Lodge Activity" },
    { id: "needle", name: "Cleopatra's Needle", lat: 51.5086, lon: -0.1206, type: "special", desc: "Egyptian Obelisk" },
    { id: "temple", name: "Temple Bar", lat: 51.5134, lon: -0.1111, type: "special", desc: "City Gateway" },
];

// WASHINGTON DC DATA (Tab: WASHINGTON)
const DC_SITES = [
    // THE POWER TRIANGLE
    { id: "capitol", name: "US Capitol (The Head)", lat: 38.8899, lon: -77.0090, type: "capitol", desc: "Legislative / Masonic Apex" },
    { id: "whitehouse", name: "White House (The Apex)", lat: 38.8977, lon: -77.0365, type: "executive", desc: "Executive / Pentagram Point" },
    { id: "obelisk", name: "Washington Monument (The Phallus)", lat: 38.8895, lon: -77.0353, type: "obelisk", desc: "Osirian Phallus / Center" },
    
    // THE INVERTED PENTAGRAM (The Goat of Mendes?)
    { id: "dupont", name: "Dupont Circle", lat: 38.9096, lon: -77.0434, type: "pentagram", desc: "West Point" },
    { id: "logan", name: "Logan Circle", lat: 38.9097, lon: -77.0296, type: "pentagram", desc: "East Point" },
    { id: "washcircle", name: "Washington Circle", lat: 38.9024, lon: -77.0501, type: "pentagram", desc: "West Base" },
    { id: "mtvernon", name: "Mt Vernon Square", lat: 38.9025, lon: -77.0218, type: "pentagram", desc: "East Base" },

    // THE MERIDIAN (16th Street)
    { id: "scott", name: "Scott Circle", lat: 38.9056, lon: -77.0365, type: "meridian", desc: "Meridian Node" },
    { id: "temple_house", name: "House of the Temple", lat: 38.9133, lon: -77.0365, type: "masonic", desc: "Supreme Council 33° HQ" },
    
    { id: "union", name: "Union Station", lat: 38.8974, lon: -77.0062, type: "owl", desc: "Left Ear" },
    { id: "garfield", name: "Garfield Circle", lat: 38.8860, lon: -77.0120, type: "owl", desc: "Right Wing Base" },
    { id: "peace", name: "Peace Monument", lat: 38.8906, lon: -77.0123, type: "owl", desc: "Beak / Neck" },

    // EXTENDED GEOMETRY (Tree of Life / Pentagon)
    { id: "pentagon", name: "The Pentagon", lat: 38.8719, lon: -77.0563, type: "military", desc: "The War Machine" },
    { id: "jefferson", name: "Jefferson Memorial", lat: 38.8814, lon: -77.0365, type: "sephiroth", desc: "Malkuth (Kingdom)" },
    { id: "lincoln", name: "Lincoln Memorial", lat: 38.8893, lon: -77.0502, type: "sephiroth", desc: "Hod (Splendor)?" },
];

// DC NETWORKS
const DC_TRIANGLE = [
    [38.8899, -77.0090], // Capitol
    [38.8977, -77.0365], // White House
    [38.8895, -77.0353], // Obelisk
    [38.8899, -77.0090]  // Capitol (Close)
];

const DC_PENTAGRAM = [
    [38.8977, -77.0365], // White House (South Point)
    [38.9024, -77.0501], // Washington Circle
    [38.9096, -77.0434], // Dupont Circle
    [38.9097, -77.0296], // Logan Circle
    [38.9025, -77.0218], // Mt Vernon Sq
    [38.8977, -77.0365]  // White House
];

const DC_MERIDIAN = [
    [38.8814, -77.0365], // Jefferson (Malkuth)
    [38.8895, -77.0353], // Obelisk (Yesod)
    [38.8977, -77.0365], // White House (Tiphereth)
    [38.9056, -77.0365], // Scott Circle
    [38.9133, -77.0365]  // House of the Temple (Kether?)
];

const DC_PENTAGON_ALIGNMENT = [
    [38.8719, -77.0563], // Pentagon
    [38.8977, -77.0365]  // White House
];

// NEW: DC TREE MESH (The Cross)
const DC_TREE = [
    [[38.8893, -77.0502], [38.8895, -77.0353]], // Lincoln -> Obelisk
    [[38.8893, -77.0502], [38.8977, -77.0365]], // Lincoln -> White House
    [[38.8893, -77.0502], [38.8814, -77.0365]], // Lincoln -> Jefferson
    [[38.8814, -77.0365], [38.8899, -77.0090]], // Jefferson -> Capitol
    [[38.8977, -77.0365], [38.8899, -77.0090]]  // White House -> Capitol (Triangle Base)
];

// ROME DATA (Tab: ROME)
const ROME_SITES = [
    // THE VATICAN (THE KEY)
    { id: "vatican", name: "St. Peter's Basilica", lat: 41.9022, lon: 12.4539, type: "vatican", desc: "The Keyhole / Petra" },
    { id: "vatican_obelisk", name: "Vatican Obelisk", lat: 41.9022, lon: 12.4572, type: "obelisk", desc: "Caligula's Pillar" },

    // THE SEVEN PILGRIMAGE CHURCHES (THE NETWORK)
    { id: "maggiore", name: "Santa Maria Maggiore", lat: 41.8972, lon: 12.4987, type: "hub", desc: "The Geometric Hub (Sixtus V)" },
    { id: "lateran", name: "St. John Lateran", lat: 41.8859, lon: 12.5057, type: "church", desc: "Cathedral of Rome" },
    { id: "paolo", name: "St. Paul Outside Walls", lat: 41.8587, lon: 12.4768, type: "church", desc: "Southern Anchor" },
    { id: "croce", name: "Santa Croce in Gersualemme", lat: 41.8892, lon: 12.5163, type: "church", desc: "Relic Repository" },
    { id: "lorenzo", name: "San Lorenzo fuori le Mura", lat: 41.9026, lon: 12.5205, type: "church", desc: "Eastern Node" },
    { id: "sebastiano", name: "San Sebastiano", lat: 41.8550, lon: 12.5186, type: "church", desc: "Appian Way Node" },
    // (St Peter's is the 7th)

    // KEY ANCHORS
    { id: "popolo", name: "Piazza del Popolo", lat: 41.9107, lon: 12.4763, type: "obelisk", desc: "Northern Gateway (Flaminio)" },
    { id: "pantheon", name: "The Pantheon", lat: 41.8986, lon: 12.4769, type: "pantheon", desc: "The Solar Eye" },
    { id: "angelo", name: "Castel Sant'Angelo", lat: 41.9031, lon: 12.4663, type: "castle", desc: "Hadrian's Tomb / Fortress" },
    { id: "trinita", name: "Trinità dei Monti", lat: 41.9064, lon: 12.4831, type: "obelisk", desc: "Spanish Steps / Sallustiano" }
];

// ROME NETWORKS (SIXTUS V STAR)
const ROME_STAR = [
    // Radiating from Santa Maria Maggiore
    [[41.8972, 12.4987], [41.9107, 12.4763]], // To Popolo (Via Sistina)
    [[41.8972, 12.4987], [41.8859, 12.5057]], // To Lateran (Via Merulana)
    [[41.8972, 12.4987], [41.8892, 12.5163]], // To Croce
    [[41.8972, 12.4987], [41.9026, 12.5205]], // To Lorenzo (?)
    [[41.8972, 12.4987], [41.9064, 12.4831]], // To Trinita dei Monti
];

const ROME_KEY_LINE = [
    [41.9022, 12.4539], // St Peter's
    [41.9031, 12.4663], // Castel Sant'Angelo
    [41.8986, 12.4769]  // Pantheon
];

// MASONIC LONDON GEOMETRY
const MASONIC_SQUARE = [
    // The Square (90 degrees at Eye)
    [[51.5033, -0.1195], [51.5164, -0.1302]], // Eye -> Centre Point (333 deg)
    [[51.5033, -0.1195], [51.5145, -0.0803]]  // Eye -> Gherkin (66 deg)
];

const MASONIC_COMPASS = [
    // The Compass (Shard Pivot?)
    [[51.5045, -0.0865], [51.5145, -0.0803]], // Shard -> Gherkin
    [[51.5045, -0.0865], [51.5033, -0.1195]]  // Shard -> Eye
];

// NEW: ROME PILGRIMAGE CIRCUIT (The 7 Churches Loop)
// Order: Peter -> Paul -> Sebastiano -> Lateran -> Croce -> Lorenzo -> Maggiore -> Peter
const ROME_CIRCUIT = [
    [41.9022, 12.4539], // St Peter
    [41.8587, 12.4768], // St Paul
    [41.8550, 12.5186], // Sebastiano
    [41.8859, 12.5057], // Lateran
    [41.8892, 12.5163], // Croce
    [41.9026, 12.5205], // Lorenzo
    [41.8972, 12.4987], // Maggiore
    [41.9022, 12.4539]  // St Peter
];



// --- HELPER METRICS ---
const toRad = (val: number) => val * Math.PI / 180;
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth Radius
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};


export default function GeodeticSystemPanel() {
    const [isMounted, setIsMounted] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [activeTab, setActiveTab] = useState<'LEY_LINES' | 'LONDON' | 'WASHINGTON' | 'ROME'>('LEY_LINES');
    const [showLabels, setShowLabels] = useState(true);

    useEffect(() => {
        fixLeafletIcons();
        setIsMounted(true);
    }, []);

    if (!isMounted) return <div style={{ padding: '2rem', color: '#fff' }}>Initializing Geodetic System...</div>;

    // Toggle Styles
    const containerStyle: React.CSSProperties = isFullScreen ? {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: '#0f172a'
    } : {
        position: 'relative', width: '100%', height: '100%', background: '#0f172a', overflow: 'hidden'
    };

    // View State Logic
    const viewState = (() => {
        if (activeTab === 'LONDON') return { center: [51.5033, -0.06] as [number, number], zoom: 13 };
        if (activeTab === 'WASHINGTON') return { center: [38.9000, -77.0250] as [number, number], zoom: 14 };
        if (activeTab === 'ROME') return { center: [41.8950, 12.4850] as [number, number], zoom: 13 };
        return { center: [0, 20] as [number, number], zoom: 2 }; // Global
    })();

    return (
        <div style={containerStyle}>
             
             {/* HEADER & TABS OVERLAY */}
             <div style={{
                 position: 'absolute',
                 top: '20px',
                 left: '20px',
                 zIndex: 1000,
                 display: 'flex',
                 gap: '12px'
             }}>
                 {/* TAB BUTTONS */}
                 <div style={{
                     background: 'rgba(15, 23, 42, 0.8)',
                     border: '1px solid #334155',
                     borderRadius: '8px',
                     padding: '4px',
                     display: 'flex',
                     backdropFilter: 'blur(8px)',
                     boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                 }}>
                     <button
                        onClick={() => setActiveTab('LEY_LINES')}
                        style={{
                            padding: '8px 16px',
                            background: activeTab === 'LEY_LINES' ? DASHBOARD_THEME.colors.accents.cyan.base : 'transparent',
                            color: activeTab === 'LEY_LINES' ? '#000' : '#94a3b8',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                     >
                        LEY LINES
                     </button>
                     <button
                        onClick={() => setActiveTab('LONDON')}
                        style={{
                            padding: '8px 16px',
                            background: activeTab === 'LONDON' ? DASHBOARD_THEME.colors.accents.violet.base : 'transparent',
                            color: activeTab === 'LONDON' ? '#000' : '#94a3b8',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                     >
                        LONDON
                     </button>
                     <button
                        onClick={() => setActiveTab('WASHINGTON')}
                        style={{
                            padding: '8px 16px',
                            background: activeTab === 'WASHINGTON' ? '#ef4444' : 'transparent',
                            color: activeTab === 'WASHINGTON' ? '#fff' : '#94a3b8',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                     >
                        WASHINGTON DC
                     </button>
                     <button
                        onClick={() => setActiveTab('ROME')}
                        style={{
                            padding: '8px 16px',
                            background: activeTab === 'ROME' ? '#f59e0b' : 'transparent',
                            color: activeTab === 'ROME' ? '#000' : '#94a3b8',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                     >
                        ROME
                     </button>
                 </div>

                 {/* LABELS TOGGLE */}
                 <button
                    onClick={() => setShowLabels(!showLabels)}
                    style={{
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: showLabels ? '#fff' : '#94a3b8',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                 >
                    {showLabels ? '👁️ Labels On' : 'Latels Off'} 
                 </button>
             </div>

             {/* TOGGLE FULLSCREEN BUTTON */}
             <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                style={{
                    position: 'absolute', top: '20px', right: '20px', zIndex: 1000,
                    background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #334155', color: '#fff',
                    padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                    backdropFilter: 'blur(4px)', fontSize: '0.9rem', fontWeight: 600,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}
            >
                {isFullScreen ? '↙ Exit Fullscreen' : '↗ Fullscreen'}
            </button>

            {/* MAP CONTAINER */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                 <MapContainer
                    center={viewState.center} 
                    zoom={viewState.zoom} 
                    minZoom={2}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                    zoomControl={false} 
                >
                    {/* DYNAMIC ZOOM CONTROLLER */}
                    <LeafletMapController center={viewState.center} zoom={viewState.zoom} />

                    <TileLayer
                        attribution='&copy; CARTO'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        noWrap={false}
                    />

                    {/* --- TAB: LEY LINES (GLOBAL) --- */}
                    {activeTab === 'LEY_LINES' && (
                        <>
                            {/* ANCHOR: GREAT ZIMBABWE */}
                            <Marker position={[ANCHOR_SITE.lat, ANCHOR_SITE.lng]}>
                                <Popup>
                                    <div style={{ color: '#000' }}>
                                        <strong>{ANCHOR_SITE.name}</strong><br/>
                                        {ANCHOR_SITE.desc}
                                    </div>
                                </Popup>
                            </Marker>
                            
                            {/* HARMONIC RINGS */}
                            {HARMONIC_RINGS.map(ringIndex => (
                                <Circle
                                    key={ringIndex}
                                    center={[ANCHOR_SITE.lat, ANCHOR_SITE.lng]}
                                    radius={UNIT_HARMONIC_IDEAL_KM * ringIndex * 1000}
                                    pathOptions={{ 
                                        color: ringIndex % 3 === 0 ? '#fbbf24' : '#06b6d4', 
                                        fillColor: 'transparent', weight: ringIndex % 3 === 0 ? 1.5 : 0.5, 
                                        opacity: ringIndex % 3 === 0 ? 0.6 : 0.3, 
                                        dashArray: ringIndex % 3 === 0 ? undefined : '5, 10' 
                                    }}
                                >
                                    {ringIndex <= 3 && (
                                        <Tooltip direction="top" offset={[0, -10]} opacity={0.7}>
                                            {ringIndex}x ({ringIndex * UNIT_HARMONIC_IDEAL_KM} km)
                                        </Tooltip>
                                    )}
                                </Circle>
                            ))}

                            {/* TARGET SITES */}
                            {TARGET_SITES.map((site, idx) => {
                                const dist = getDistanceKm(ANCHOR_SITE.lat, ANCHOR_SITE.lng, site.lat, site.lng);
                                const harmonicVal = parseFloat(site.harmonic.split('x')[0]); 
                                const targetDist = harmonicVal * UNIT_HARMONIC_IDEAL_KM;
                                const delta = dist - targetDist;
                                const percentError = ((dist - targetDist) / targetDist) * 100;
                                const accuracyColor = Math.abs(percentError) < 1.0 ? '#10b981' : Math.abs(percentError) < 5.0 ? '#fbbf24' : '#ef4444';

                                return (
                                    <React.Fragment key={`${idx}-${showLabels}`}>
                                        {(site.name.includes('Meroe') || site.name.includes('Giza')) && (
                                             <Circle
                                                center={[ANCHOR_SITE.lat, ANCHOR_SITE.lng]}
                                                radius={targetDist * 1000}
                                                pathOptions={{ 
                                                    color: site.name.includes('Giza') ? '#f59e0b' : '#8b5cf6', 
                                                    fillColor: 'transparent', weight: 1, opacity: 0.8, dashArray: '4, 4' 
                                                }}
                                            />
                                        )}
                                        <Marker position={[site.lat, site.lng]}>
                                            <Popup>
                                                <div style={{ color: '#0f172a', minWidth: '200px' }}>
                                                    <strong>{site.name}</strong><br/>
                                                    {site.desc}<br/>
                                                    <span style={{color: accuracyColor}}>Dev: {delta.toFixed(0)}km</span>
                                                </div>
                                            </Popup>
                                            <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={showLabels}>
                                                {site.name}
                                            </Tooltip>
                                        </Marker>
                                        <Polyline
                                            positions={[[ANCHOR_SITE.lat, ANCHOR_SITE.lng], [site.lat, site.lng]]}
                                            pathOptions={{ color: '#fff', weight: 1, opacity: 0.15, dashArray: '4, 8' }}
                                        />
                                    </React.Fragment>
                                );
                            })}
                        </>
                    )}

                    {/* --- TAB: LONDON (GEOMANCY) --- */}
                    {activeTab === 'LONDON' && (
                        <>
                            {/* NETWORK TRACES: Connect Eye to Everything */}
                            {/* NETWORK TRACES: Connect Eye to Everything */}
                            {LONDON_SITES.map((site) => {
                                if (site.id === 'eye') return null;
                                // Color logic
                                let traceColor = '#ffffff';
                                if (site.type === 'node-33') traceColor = '#fbbf24'; // Amber
                                if (site.type === 'node-66') traceColor = '#a855f7'; // Violet
                                if (site.type === 'special') traceColor = '#94a3b8'; // Slate
                                if (site.type === 'input' || site.type === 'output' || site.type === 'receiver') traceColor = '#06b6d4'; // Cyan

                                return (
                                    <Polyline
                                        key={`line-${site.id}`}
                                        positions={[[51.5033, -0.1195], [site.lat, site.lon]]}
                                        pathOptions={{ 
                                            color: traceColor, 
                                            weight: 1, // Thinner (was 2)
                                            opacity: 0.6, 
                                            dashArray: '3, 6' // More delicate dash
                                        }}
                                    />
                                );
                            })}

                            {/* LONDON SITES MARKERS */}
                            {LONDON_SITES.map((site) => {
                                // Dynamic Circle Marker instead of standard pin for better "Tech" feel?
                                // Stick to Markers for now but use Circle for cleaner look if possible.
                                // Using standard Marker for consistency, but customized style colors via Circle below marker?
                                
                                let circleColor = '#fff';
                                if (site.type === 'node-33') circleColor = '#fbbf24';
                                if (site.type === 'node-66') circleColor = '#a855f7';
                                if (site.type === 'cpu') circleColor = '#f43f5e'; // Rose

                                return (
                                    <React.Fragment key={`${site.id}-${showLabels}`}>
                                         <CircleMarker 
                                            center={[site.lat, site.lon]}
                                            radius={site.type === 'cpu' ? 6 : 4} // Pixels
                                            pathOptions={{ 
                                                color: circleColor, 
                                                fillColor: circleColor, 
                                                fillOpacity: 0.8, 
                                                weight: 0 
                                            }}
                                         />
                                         <Marker position={[site.lat, site.lon]} opacity={0}> {/* Invisible clickable target */}
                                            <Popup>
                                                <div style={{ color: '#0f172a' }}>
                                                    <strong>{site.name}</strong><br/>
                                                    {site.desc}<br/>
                                                    <span style={{ fontSize: '0.8em', color: '#64748b' }}>Lat: {site.lat.toFixed(4)}, Lon: {site.lon.toFixed(4)}</span>
                                                </div>
                                            </Popup>
                                            <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={showLabels}>
                                                {site.name}
                                            </Tooltip>
                                        </Marker>
                                    </React.Fragment>
                                );
                            })}
                            
                            {/* SPECIAL LEYLINES (Stronger Traces) */}
                            {/* Eye -> Stone -> Gherkin (66 deg) */}
                            <Polyline 
                                positions={[
                                    [51.5033, -0.1195], // Eye
                                    [51.5113, -0.0898], // Stone
                                    [51.5145, -0.0803]  // Gherkin
                                ]}
                                pathOptions={{ color: '#a855f7', weight: 1.5, dashArray: '5, 5', opacity: 0.8 }}
                            />
                            
                            {/* Eye -> Centre Point (333 deg) - REPLACED BY MASONIC SQUARE */}


                            {/* MASONIC SQUARE (CYAN) */}
                            {MASONIC_SQUARE.map((line, i) => (
                                <Polyline 
                                    key={`square-${i}`}
                                    positions={line as any}
                                    pathOptions={{ color: '#06b6d4', weight: 2, opacity: 0.8 }} // Thinner Masonic Square
                                >
                                    <Tooltip sticky>Masonic Square {i===0 ? '(33°)' : '(66°)'}</Tooltip>
                                </Polyline>
                            ))}


                        </>
                    )}


                    {/* --- TAB: WASHINGTON DC (MASONIC) --- */}
                    {activeTab === 'WASHINGTON' && (
                        <>
                            {/* THE FEDERAL TRIANGLE (RED) */}
                            <Polyline 
                                positions={DC_TRIANGLE as any} 
                                pathOptions={{ color: '#ef4444', weight: 2, dashArray: '5, 5', opacity: 0.8 }}
                            />
                            
                            {/* THE PENTAGRAM (VIOLET) */}
                            <Polyline 
                                positions={DC_PENTAGRAM as any} 
                                pathOptions={{ color: '#a855f7', weight: 2, opacity: 0.8 }}
                            />
                            
                            {/* THE MERIDIAN (CYAN) - EXTENDED */}
                            <Polyline 
                                positions={DC_MERIDIAN as any} 
                                pathOptions={{ color: '#06b6d4', weight: 3, opacity: 0.6 }}
                            />

                            {/* PENTAGON ALIGNMENT (Gold) */}
                            <Polyline 
                                positions={DC_PENTAGON_ALIGNMENT as any} 
                                pathOptions={{ color: '#fbbf24', weight: 2, opacity: 0.6, dashArray: '5, 5' }}
                            />

                            {/* DC TREE MESH (The Cross - Gold) */}
                            {DC_TREE.map((line, i) => (
                                <Polyline 
                                    key={`tree-${i}`}
                                    positions={line as any} 
                                    pathOptions={{ color: '#fbbf24', weight: 1, opacity: 0.5 }}
                                />
                            ))}
                            
                            {/* OWL WINGS (Approximate) */}
                             <Polyline 
                                positions={[
                                    [38.8974, -77.0062], // Union Station
                                    [38.8899, -77.0090], // Capitol
                                    [38.8860, -77.0120]  // Garfield
                                ]}
                                pathOptions={{ color: '#fbbf24', weight: 1, opacity: 0.5, dashArray: '2, 4' }}
                            />

                            {/* SITES */}
                            {DC_SITES.map((site) => {
                                let color = '#fff';
                                if (site.type === 'capitol') color = '#fbbf24'; // Amber
                                if (site.type === 'executive') color = '#f43f5e'; // Rose
                                if (site.type === 'pentagram') color = '#a855f7'; // Violet
                                if (site.type === 'masonic') color = '#06b6d4'; // Cyan
                                
                                return (
                                    <React.Fragment key={`${site.id}-${showLabels}`}>
                                        <Circle 
                                            center={[site.lat, site.lon]}
                                            radius={(site.type === 'obelisk' || site.type === 'pentagon') ? 100 : 50}
                                            pathOptions={{ 
                                                color: color, 
                                                fillColor: color, 
                                                fillOpacity: 0.8, 
                                                weight: 0 
                                            }}
                                         />
                                        <Marker position={[site.lat, site.lon]} opacity={0}>
                                            <Popup>
                                                <div style={{ color: '#0f172a' }}>
                                                    <strong>{site.name}</strong><br/>
                                                    {site.desc}
                                                </div>
                                            </Popup>
                                            <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={showLabels}>
                                                {site.name}
                                            </Tooltip>
                                        </Marker>
                                    </React.Fragment>
                                );
                            })}
                        </>
                    )}

                    {/* --- TAB: ROME (THE HOLY SEE) --- */}
                    {activeTab === 'ROME' && (
                        <>
                            {/* SIXTUS V STAR (Gold) */}
                            {ROME_STAR.map((line, i) => (
                                <Polyline 
                                    key={i}
                                    positions={line as any} 
                                    pathOptions={{ color: '#f59e0b', weight: 2, dashArray: '5, 5', opacity: 0.8 }}
                                />
                            ))}
                            
                            {/* VATICAN KEY LINE (Cyan) */}
                            <Polyline 
                                positions={ROME_KEY_LINE as any} 
                                pathOptions={{ color: '#06b6d4', weight: 2, opacity: 0.8 }}
                            />

                            {/* PILGRIMAGE CIRCUIT (Violet Loop) */}
                            <Polyline 
                                positions={ROME_CIRCUIT as any} 
                                pathOptions={{ color: '#a855f7', weight: 2, opacity: 0.6, dashArray: '4, 4' }}
                            />

                            {/* SITES */}
                            {ROME_SITES.map((site) => {
                                let color = '#fff';
                                if (site.type === 'vatican') color = '#fbbf24'; // Amber
                                if (site.type === 'hub') color = '#f59e0b'; // Gold
                                if (site.type === 'obelisk') color = '#f43f5e'; // Rose
                                if (site.type === 'pantheon') color = '#a855f7'; // Violet
                                if (site.type === 'church') color = '#06b6d4'; // Cyan
                                
                                return (
                                    <React.Fragment key={`${site.id}-${showLabels}`}>
                                        <Circle 
                                            center={[site.lat, site.lon]}
                                            radius={site.type === 'hub' ? 80 : 50}
                                            pathOptions={{ 
                                                color: color, 
                                                fillColor: color, 
                                                fillOpacity: 0.8, 
                                                weight: 0 
                                            }}
                                         />
                                        <Marker position={[site.lat, site.lon]} opacity={0}>
                                            <Popup>
                                                <div style={{ color: '#0f172a' }}>
                                                    <strong>{site.name}</strong><br/>
                                                    {site.desc}
                                                </div>
                                            </Popup>
                                            <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={showLabels}>
                                                {site.name}
                                            </Tooltip>
                                        </Marker>
                                    </React.Fragment>
                                );
                            })}
                        </>
                    )}

                 </MapContainer>
            </div>
        </div>
    );
}
