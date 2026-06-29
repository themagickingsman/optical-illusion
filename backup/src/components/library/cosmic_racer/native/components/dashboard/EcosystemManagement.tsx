'use client';

import React, { useState } from 'react';

// --- DATA: THE PHASE 1 PROJECTS & SPECS ---
const PROJECTS = [
    {
        id: 'viability-assessment',
        title: 'Phase 1 Viability Assessment',
        status: 'Active',
        priority: 'P1',
        lastUpdated: '2026-02-25',
        markdownContent: `## Objective
Assess the physical viability of building the Phase 1 ARN ecosystem in a garage environment. Strip away all "Star Trek" sci-fi assumptions and evaluate what is achievable *today* using off-the-shelf industrial and laboratory equipment. Identify critical missing links required to close the loop on a first-generation working prototype.

## The Active Phase 1 Ecosystem

### 1. The Power Source: Modular Solid-State Micro-Grid
*   **Hex-Cell Architecture & Mainframe Suitcase:** A 45 kWh, 60L transit case utilizing solid-state lithium-metal batteries.
*   **Manufacturing (Acoustic Lab):** A $50k micro-gigafactory using a modified SLA 3D printer, Argon glovebox, and planetary vacuum mixer to acoustically align solid-state battery inks.
*   **Solar Integration:** A 15 sqm printable fractal solar skin for rapid recharging.
*   **Viability Assessment:** **HIGH.** The bottleneck in solid-state batteries is the billions required for mechanical calendering factories. By pivoting to acoustic wave alignment (essentially cymatics in a UV resin vat), we drop the CAPEX to $50k. The chemistry exists; the required equipment is standard in aerospace/biotech labs. This is entirely buildable in a garage.

### 2. Materials Processing: Acoustic Water & Element Harvesting
*   **Acoustic Water Structuring:** Continuous flow phase alignment to create structured water (H3O2).
*   **Acoustic Element Harvesting (Gold Harvester):** Extracting trace minerals from seawater using precise resonant frequencies and cymatic trapping.
*   **Viability Assessment:** **MEDIUM-HIGH.** Structuring water with acoustics is a proven physical phenomenon (cavitation, boundary layer effects). Extracting trace elements via acoustic resonance is theoretically sound but practically challenging. It requires highly precise, tunable transducers and specialized piping to create the necessary standing waves without destroying the equipment via cavitation erosion. The *theory* doesn't require Star Trek tech, but the *tuning* requires extreme precision.

### 3. Fabrication: Acoustic Elemental Printing
*   **Volumetric Holographic Assembly:** Using intersecting acoustic waves to trap and bind matter in a vat, similar to holographic light printing but with sound.
*   **Viability Assessment:** **MOVED TO PHASE 2.** "Volumetric acoustic printing" is currently a bleeding-edge research topic (e.g., at Max Planck Institute). While feasible, doing it in a garage *today* in 3D is too complex for Phase 1. Our implemented "Acoustic Lab" for battery printing (which only requires aligning a 2D plane as it cures) remains the focus for Phase 1.

### 4. Applied Science: Light & Imaging
*   **Quantum Optics & Holography:** 
*   **Viability Assessment:** **MOVED TO PHASE 2.** Advanced optical holography and deep quantum imaging will be revisited in the second generation. Phase 1 focuses purely on the acoustic logic and foundational hardware.

---

## Critical Analysis: What is Missing? (The "Star Trek" Filter)

To build a fully functional, closed-loop Phase 1 prototype in a garage today, we are missing several grounding pieces of technology and process:

### 1. The Initial "Seed" Materials (The Chicken/Egg Problem)
*   **The Problem:** We propose processing our own materials (element harvesting) to build our own batteries. But what powers the harvester initially? What are the *first* acoustic transducers made of before we can print our own?
*   **The Missing Link:** A formalized **"Bootstrap Protocol."** We are defining the exact raw materials ordered from chemical suppliers (e.g., lithium powder, polymer resins) to make the first batch of ink, alongside a list of suppliers capable of shipping to Africa/South Africa.

### 2. Advanced Metrology and Feedback Loops
*   **The Problem:** Generating a standing acoustic wave is easy. Keeping it perfectly tuned as the fluid density changes (because particles are aggregating) is incredibly difficult.
*   **The Missing Link:** **Real-time Acoustic Impedance Profiling.** We need a closed-loop software system and sensor array that constantly measures the speed of sound through the vat and adjusts the transducer frequencies in real-time. Without this, the acoustic structures will collapse. This is standard industrial control theory, but we haven't documented the software/sensor stack handling it.

### 3. Thermal Management (Energy Reclamation)
*   **The Problem:** Pumping high-frequency sound into a fluid generates massive amounts of heat via acoustic cavitation. A planetary vacuum mixer also generates heat. An Argon glovebox is a sealed, insulated environment.
*   **The Missing Link:** **Thermoelectric Chilling Loops.** We are not just cooling the glovebox; we are capturing that waste heat. By utilizing Thermoelectric Generators (TEGs) or closed-loop thermal mass heat exchangers, we can convert the cavitation/mixing heat directly back into energy to charge the batteries operating the lab.

### 4. The Inverter / Power Conditioning Bottleneck
*   **The Problem:** We have a brilliant 45 kWh DC solid-state suitcase and solar panels. How does it power standard AC equipment?
*   **The Missing Link:** **The Ruggedized Micro-Inverter OR Facility Bridge.** Ideally, we integrate a solid-state GaN (Gallium Nitride) inverter into a 3rd transit case. **Plan B (Immediate Phase 1):** The heavy inverter/converter box is permanently installed directly onto the house or facility. The DC suitcases are then simply swapped in and out of the facility dock, removing the need to miniaturize the inverter for the first generation.`,
        tasks: [
            { id: 't1', text: 'Document GaN Micro-Inverter specs', completed: true },
            { id: 't2', text: 'Design Thermoelectric Chilling Loop for Acoustic Lab', completed: true },
            { id: 't3', text: 'Formalize Phase 2 shifts in overall project roadmap', completed: false }
        ],
        changelog: [
            { date: '2026-02-25', note: 'Moved Volumetric Printing and Quantum Optics to Phase 2. Added Thermoelectric Chilling Loop and Facility Bridge inverter protocols.' },
            { date: '2026-02-24', note: 'Initial draft identifying garage build constraints.' }
        ]
    },
    {
        id: 'element-harvester',
        title: 'Deep-Water Element Harvester Transducers',
        status: 'Active',
        priority: 'P0 - BLOCKER',
        lastUpdated: '2026-02-25',
        markdownContent: `# Element Harvester Transducer Specs

To extract trace minerals (like gold or lithium) from seawater using resonant frequencies and cymatic trapping, we cannot rely on abstract theory. We need off-the-shelf, industrial-grade marine hardware capable of generating and sustaining hyper-precise standing waves in a high-pressure saltwater environment.

## 1. Physical Deployment & Anchoring

*   **Deployment Depth:** The primary harvester array will be physically anchored at a maximum depth of **40 meters**.
*   **Why 40m?:** This avoids the extreme pressure requirements of deep-sea equipment while significantly mitigating surface turbulence, wave action, and bio-fouling (relative to the photic zone). It is also well within the range of standard commercial diving operations for maintenance and retrieval.
*   **Anchoring System:** Concrete deadweight anchors with synthetic Dyneema mooring lines, utilizing subsea acoustic release mechanisms (e.g., *Edgetech* or *Teledyne Benthos* releases) for easy retrieval without sending divers down.

## 2. Transducer Hardware (Off-The-Shelf)

We require broadband or highly tunable narrow-band transducers capable of handling continuous wave (CW) or pulsed duty cycles without burning out.

**Recommended Commercial Providers:**
1.  **Massa Products Corporation:** (USA) Standard industrial/marine ultrasonic transducers. Their M-150 or similar bulk transducers operate in the 10kHz - 200kHz range, suitable for generating the necessary standing waves.
2.  **Benthowave Instrument Inc.:** (Canada) Specialists in precision broadband hydrophones and subsea acoustic projectors. They offer customized arrays that can be tuned to highly specific resonant frequencies.
3.  **Neptune Sonar:** (UK) Offers a wide range of free-flooded rings and tonpilz transducers specifically designed for high-power subsea continuous transmission.

**Technical Specifications Required:**
*   **Type:** Tonpilz or Free-Flooded Ring (FFR) piezoceramic composites.
*   **Frequency Range:** Tunable between 20kHz – 150kHz (to hit specific molecular resonant nodes).
*   **Power Handling:** Minimum 500W to 2000W continuous per array.
*   **Housing:** Titanium or specialized marine-grade polyurethane potting to prevent saltwater ingress at 40m depth (approx 4 ATM / 58 PSI).

## 3. The "Chicken/Egg" Power Source

Before the harvester can extract the lithium/materials to build the Phase 1 solid-state batteries, we must power the initial subsea operation.

**The Initial Anchor Power Source:**
*   For the first iteration, the 40m deep harvester will NOT be powered by our proprietary tech.
*   **Primary:** A surface buoy equipped with a standard *commercial marine solar array (e.g., SunPower flexible panels)* feeding into highly reliable, deep-cycle **Lithium Iron Phosphate (LiFePO4)** marine batteries (e.g., *Battle Born* or *Victron Energy*).
*   **Transmission:** Power is sent down the mooring line via an armored umbilical cable to the transducer driver electronics housed in a 1 ATM subsea pressure vessel.

Once the harvester successfully traps and extracts the first yields of trace elements, those specific yields are processed in the $50k Acoustic Lab to manufacture the *first* true ARN Hex-Cell, completing the bootstrap cycle.`,
        tasks: [
            { id: 't4', text: 'Request quotes from Massa and Benthowave for 500W broadband transducers', completed: false },
            { id: 't5', text: 'Design surface buoy solar/LiFePO4 power schematic', completed: false },
            { id: 't6', text: 'Source Teledyne Benthos acoustic release catalog', completed: false }
        ],
        changelog: [
            { date: '2026-02-25', note: 'Created initial transducer spec. Locked deployment depth at 40m. Identified commercial piezo suppliers.' }
        ]
    },
    {
        id: 'impedance-profiling',
        title: 'Acoustic Impedance Profiling & Control',
        status: 'Active',
        priority: 'P1',
        lastUpdated: '2026-02-25',
        markdownContent: `# Real-Time Feedback Loop & Metrology

The core differentiator of ARN's Phase 1 solid-state manufacturing isn't just generating an acoustic wave; it's the ability to *control* that wave perfectly as the liquid resin cures into a solid structure. As particles align and polymerize, the fluid's density changes. If the acoustic frequency doesn't shift dynamically to match the changing speed of sound, the harmonic nodes collapse, and the battery cell fails.

We require a closed-loop **Acoustic Impedance Profiling** system.

## 1. The Equipment (Off-The-Shelf)

We do not need to invent new sensors. We utilize standard Non-Destructive Testing (NDT) pulse-echo equipment.

*   **Primary Sensor Array:** Ultrasonic Pulser-Receivers (e.g., *Olympus/Evident* Epoch series, or high-speed DAQ boards from *National Instruments* paired with Panametrics immersion transducers).
*   **How it works:** These sensors ping a secondary, high-frequency sound wave through the resin vat thousands of times per second. By measuring exactly how long the echo takes to bounce back, the system calculates the exact density and acoustic impedance of the slurry *in real-time*.
*   **The Controller:** An industrial FPGA (Field Programmable Gate Array) or a high-end PLC (Programmable Logic Controller) like a *Beckhoff* TwinCAT system.

## 2. The Feedback Pipeline

1.  **Sense:** The Olympus ultrasonic pulser-receivers constantly read the speed of sound through the curing resin.
2.  **Analyze:** The data is fed into the National Instruments DAQ or Beckhoff PLC. Custom control software calculates the shifting resonant frequency required to maintain perfect Phi-ratio standing waves.
3.  **Adjust:** The PLC instantly adjusts the power and frequency output of the primary Piezoelectric transducer drivers (the ones actually doing the levitation/alignment).

## 3. Personnel Requirements: The Technician

This operation does not require a quantum physicist. It requires a specialized, highly skilled industrial technician.

**Target Role:** NDT (Non-Destructive Testing) Level III Technician or Mechatronics/Process Control Engineer.

**Required Skill Sets:**
*   **Ultrasonic Metrology:** Must deeply understand Time-of-Flight (ToF), pulse-echo mechanics, and A-scan/B-scan interpretation.
*   **Industrial Control Systems:** Must be able to program and tune PID loops within PLC/FPGA environments (e.g., LabVIEW, TwinCAT).
*   **Materials Intuition:** The technician must understand that they are essentially "tuning a piano" dynamically while the piano is changing shape. They operate the software that keeps the wave locked onto the resonance.

**Availability:** Africa (specifically South Africa) has a massive mining, aerospace, and maritime repair industry. NDT Level III technicians specialized in advanced ultrasonics (Phased Array, TOFD) are readily available. We are repurposing their existing skills from *finding cracks in steel* to *measuring density in battery resin*.`,
        tasks: [
            { id: 't7', text: 'Review National Instruments DAQ boards for high-speed pulse-echo compatability', completed: false },
            { id: 't8', text: 'Draft job description for NDT Level III Technician in Johannesburg', completed: false },
            { id: 't9', text: 'Design the LabVIEW PID loop architecture diagram', completed: false }
        ],
        changelog: [
            { date: '2026-02-25', note: 'Created spec defining Olympus pulse-receivers and NDT personnel requirements.' }
        ]
    },
    {
        id: 'bootstrap-protocol',
        title: 'The Bootstrap Protocol: Procurement',
        status: 'Active',
        priority: 'P0 - BLOCKER',
        lastUpdated: '2026-02-25',
        markdownContent: `# Creating the First Hex-Cell

To build the first solid-state batteries, we must bridge the gap between abstract theory and physical reality. We cannot use our "Element Harvester" until we have built our first power sources. Therefore, Phase 1 begins with a highly specific procurement list of commercially available, off-the-shelf raw materials.

Crucially, because initial operations may be based in or servicing the African continent (e.g., South Africa), we have verified that these suppliers either operate locally or have established, reliable shipping corridors to Africa.

## 1. Raw Chemical Materials (The "Ink")

To formulate the photo-curable, solid-state battery slurry (the ink that is acoustically aligned), we need three primary components:

### A. The Solid Electrolyte (Active Material)
*   **Material:** LLZO (Lithium Lanthanum Zirconium Oxide) garnet nanopowder, or LATP (Lithium Aluminum Titanium Phosphate). These are the standard, proven ceramic solid-state conductors.
*   **Supplier:** *NEI Corporation* (USA) or *MSE Supplies* (USA/Global). Both supply high-purity, battery-grade LLZO nanopowders.
*   **African Availability:** Direct import required via industrial chemical distributors (e.g., DHL Global Forwarding or specialized Hazmat chemical importers in Cape Town/Johannesburg). **No backorders on standard R&D quantities (1kg - 5kg).**

### B. The Photo-Polymer Resin (The Binder)
*   **Material:** UV-curable PEGDA (Polyethylene glycol diacrylate) or highly specialized thiol-ene resins that remain stable in the presence of lithium.
*   **Supplier:** *Sigma-Aldrich (Merck)*.
*   **African Availability:** **Excellent.** Merck has massive, direct distribution hubs in South Africa (Modderfontein/Johannesburg). These resins are standard biotech/chemical materials and are easily sourced locally.

### C. The Lithium Metal (The Anode)
*   **Material:** Ultra-thin Lithium Metal foil or passivated Lithium powder.
*   **Supplier:** *Livent* or *Albemarle* for bulk, *Sigma-Aldrich* or *MTI Corp* for R&D scale.
*   **African Availability:** Requires specialized Class 4.3 (Dangerous when wet) Hazmat shipping. Importers like *Protea Chemicals* (South Africa) handle these classes regularly. It is achievable but requires a 4-8 week lead time for sea freight, as it cannot fly standard air cargo.

## 2. The $50k Acoustic Lab Hardware

The hardware is comprised of off-the-shelf aerospace and lab tech. None of it is bespoke "Star Trek" technology.

### A. The Argon Glovebox
*   **Supplier:** *Vigor Tech* or *Mbraun*.
*   **Availability:** Direct import. However, local South African laboratory suppliers (like *Lasec* or *Microsep*) operate as authorized distributors for Mbraun and can handle installation and servicing locally. Standard 8-12 week lead time.

### B. The Planetary Centrifugal Mixer
*   **Supplier:** *Thinky Corporation* (Japan). The absolute industry standard for battery slurry defoaming and mixing.
*   **Availability:** *Thinky* has global distributors. Local analytical equipment suppliers in RSA can procure this. Lead time 4-6 weeks. Not hard to get.

### C. The 3D Printer Chassis (The Core)
*   **Supplier:** Standard high-end SLA/DLP chassis (e.g., *Formlabs* Form 3+ or a larger industrial equivalent like *Asiga*).
*   **Availability:** **Excellent.** Formlabs and Asiga have authorized resellers based in Johannesburg and Cape Town. Procurement is immediate (days). The ultrasonic modification (adding Piezo transducers to the vat) is done in-house.

## Conclusion

The "Bootstrap" is entirely viable. The most difficult logistical hurdle is the hazmat shipping of Lithium metal foil to the African continent, which simply requires a 2-month lead time and proper customs clearing via a registered chemical importer like Protea. The resins, mixers, and printer chassis are widely available through existing local laboratory supply chains.`,
        tasks: [
            { id: 't10', text: 'Contact Protea Chemicals (RSA) regarding Class 4.3 Hazmat import logistics for Lithium foil', completed: false },
            { id: 't11', text: 'Request quote for 1kg LLZO nanopowder from NEI Corp', completed: false },
            { id: 't12', text: 'Confirm Mbraun glovebox installation availability with Lasec or Microsep', completed: false }
        ],
        changelog: [
            { date: '2026-02-25', note: 'Created procurement spec. Verified RSA availability for Formlabs, Merck, and Thinky.' }
        ]
    }
];

// --- STYLING ---
const THEME = {
    bg: '#0f172a',
    bgPanel: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    accent: '#3b82f6',
    accentHover: '#2563eb',
    border: '#334155',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
};

const getPriorityColor = (priority: string) => {
    if (priority.includes('P0')) return THEME.danger;
    if (priority.includes('P1')) return THEME.warning;
    return THEME.success;
};

// --- HELPER COMPONENT: SIMPLE MARKDOWN RENDERER ---
const SimpleMarkdown = ({ content }: { content: string }) => {
    // Very basic parsing for headers, lists, and bold text to avoid external dependencies.
    const blocks = content.split('\n\n');
    return (
        <div style={{ color: THEME.text, lineHeight: 1.6, fontSize: '0.95rem' }}>
            {blocks.map((block, i) => {
                if (block.startsWith('## ')) {
                    return <h3 key={i} style={{ color: THEME.accent, marginTop: '2rem', marginBottom: '1rem', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '0.5rem' }}>{block.replace('## ', '')}</h3>;
                }
                if (block.startsWith('# ')) {
                    return <h2 key={i} style={{ color: '#fff', fontSize: '1.8rem', marginTop: '1rem', marginBottom: '1.5rem' }}>{block.replace('# ', '')}</h2>;
                }
                if (block.startsWith('*   ')) {
                    const items = block.split('\n');
                    return (
                        <ul key={i} style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                            {items.map((item, j) => {
                                // Handle basic bolding: **text**
                                const textParts = item.replace('*   ', '').split(/\*\*(.*?)\*\*/g);
                                return (
                                    <li key={j} style={{ marginBottom: '0.5rem' }}>
                                        {textParts.map((part, k) => (k % 2 === 1 ? <strong key={k} style={{ color: '#fff' }}>{part}</strong> : <span key={k}>{part}</span>))}
                                    </li>
                                );
                            })}
                        </ul>
                    );
                }
                if (block.match(/^[0-9]\.\s/)) {
                    const items = block.split('\n');
                    return (
                        <ol key={i} style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                            {items.map((item, j) => {
                                const textParts = item.replace(/^[0-9]\.\s/, '').split(/\*\*(.*?)\*\*/g);
                                return (
                                    <li key={j} style={{ marginBottom: '0.5rem' }}>
                                        {textParts.map((part, k) => (k % 2 === 1 ? <strong key={k} style={{ color: '#fff' }}>{part}</strong> : <span key={k}>{part}</span>))}
                                    </li>
                                );
                            })}
                        </ol>
                    );
                }
                
                // Normal paragraph
                const textParts = block.split(/\*\*(.*?)\*\*/g);
                return (
                    <p key={i} style={{ marginBottom: '1rem' }}>
                        {textParts.map((part, k) => (k % 2 === 1 ? <strong key={k} style={{ color: '#fff' }}>{part}</strong> : <span key={k}>{part}</span>))}
                    </p>
                );
            })}
        </div>
    );
};

export default function EcosystemManagement() {
    const [activeProjectId, setActiveProjectId] = useState(PROJECTS[0].id);
    const activeProject = PROJECTS.find(p => p.id === activeProjectId) || PROJECTS[0];

    // Simple toggle state for tasks (visual only for this prototype)
    const [taskStates, setTaskStates] = useState<Record<string, boolean>>(
        PROJECTS.reduce((acc, proj) => {
            proj.tasks.forEach(t => acc[t.id] = t.completed);
            return acc;
        }, {} as Record<string, boolean>)
    );

    const toggleTask = (taskId: string) => {
        setTaskStates(prev => ({ ...prev, [taskId]: !prev[taskId] }));
    };

    return (
        <div style={{
            display: 'flex',
            height: '100%',
            backgroundColor: THEME.bg,
            color: THEME.text,
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            
            {/* L E F T   S I D E B A R :   P R O J E C T   N A V I G A T O R */}
            <div style={{
                width: '300px',
                borderRight: `1px solid ${THEME.border}`,
                backgroundColor: THEME.bgPanel,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: `1px solid ${THEME.border}` }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.05em', color: THEME.textMuted }}>ECOSYSTEM MANAGEMENT</h2>
                    <div style={{ fontSize: '0.8rem', color: THEME.accent, marginTop: '0.3rem' }}>Phase 1 Command Center</div>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.textMuted, marginBottom: '0.8rem', paddingLeft: '0.5rem' }}>ACTIVE INITIATIVES</div>
                    
                    {PROJECTS.map(proj => (
                        <div 
                            key={proj.id}
                            onClick={() => setActiveProjectId(proj.id)}
                            style={{
                                padding: '0.8rem 1rem',
                                marginBottom: '0.5rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                backgroundColor: activeProjectId === proj.id ? THEME.bg : 'transparent',
                                border: `1px solid ${activeProjectId === proj.id ? THEME.accent : 'transparent'}`,
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.4rem'
                            }}
                        >
                            <div style={{ 
                                fontWeight: activeProjectId === proj.id ? 700 : 500,
                                color: activeProjectId === proj.id ? '#fff' : THEME.textMuted
                            }}>
                                {proj.title}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                                <span style={{ 
                                    padding: '0.1rem 0.4rem', 
                                    borderRadius: '4px',
                                    backgroundColor: getPriorityColor(proj.priority) + '33', /* 33 is 20% opacity hex */
                                    color: getPriorityColor(proj.priority),
                                    fontWeight: 700
                                }}>
                                    {proj.priority}
                                </span>
                                <span style={{ color: THEME.textMuted }}>{proj.lastUpdated}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* C E N T E R   P A N E L :   T H E   S P E C   E N G I N E */}
            <div style={{
                flex: 1,
                padding: '3rem',
                overflowY: 'auto',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <div style={{ maxWidth: '800px', width: '100%' }}>
                    <div style={{ 
                        borderBottom: `2px solid ${THEME.border}`, 
                        paddingBottom: '1.5rem', 
                        marginBottom: '2rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                    }}>
                        <div>
                            <div style={{ color: THEME.accent, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>SPECIFICATION DOCUMENT</div>
                            <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 800 }}>{activeProject.title}</h1>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.85rem', color: THEME.textMuted }}>Status: <span style={{ color: THEME.success, fontWeight: 600 }}>{activeProject.status}</span></div>
                            <div style={{ fontSize: '0.85rem', color: THEME.textMuted }}>Updated: {activeProject.lastUpdated}</div>
                        </div>
                    </div>
                    
                    {/* Markdown Content Injection */}
                    <div style={{ 
                        backgroundColor: THEME.bgPanel, 
                        padding: '2.5rem', 
                        borderRadius: '12px',
                        border: `1px solid ${THEME.border}`,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                    }}>
                        <SimpleMarkdown content={activeProject.markdownContent} />
                    </div>
                </div>
            </div>

            {/* R I G H T   P A N E L :   T H E   A C T I O N   C E N T E R */}
            <div style={{
                width: '350px',
                borderLeft: `1px solid ${THEME.border}`,
                backgroundColor: THEME.bgPanel,
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Priority Banner */}
                <div style={{ 
                    padding: '1.5rem', 
                    borderBottom: `1px solid ${THEME.border}`,
                    backgroundColor: getPriorityColor(activeProject.priority) + '1A', // 10% opacity
                    borderTop: `4px solid ${getPriorityColor(activeProject.priority)}`
                }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.textMuted, marginBottom: '0.3rem' }}>CURRENT PRIORITY</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: getPriorityColor(activeProject.priority) }}>
                        {activeProject.priority}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {/* Tasks Checklist */}
                    <div style={{ padding: '1.5rem', borderBottom: `1px solid ${THEME.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Active Tasks</h3>
                            <span style={{ fontSize: '0.8rem', color: THEME.accent, cursor: 'pointer' }}>+ Add Task</span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {activeProject.tasks.map(task => (
                                <div 
                                    key={task.id} 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'flex-start', 
                                        gap: '0.8rem',
                                        cursor: 'pointer',
                                        opacity: taskStates[task.id] ? 0.6 : 1
                                    }}
                                    onClick={() => toggleTask(task.id)}
                                >
                                    <div style={{ 
                                        width: '18px', 
                                        height: '18px', 
                                        borderRadius: '4px', 
                                        border: `2px solid ${taskStates[task.id] ? THEME.success : THEME.border}`,
                                        backgroundColor: taskStates[task.id] ? THEME.success : 'transparent',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        flexShrink: 0,
                                        marginTop: '0.1rem'
                                    }}>
                                        {taskStates[task.id] && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                    </div>
                                    <span style={{ 
                                        fontSize: '0.9rem', 
                                        color: taskStates[task.id] ? THEME.textMuted : THEME.text,
                                        textDecoration: taskStates[task.id] ? 'line-through' : 'none',
                                        lineHeight: 1.4
                                    }}>
                                        {task.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Changelog */}
                    <div style={{ padding: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', marginBottom: '1rem' }}>Update History</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                            {/* Vertical Line */}
                            <div style={{ position: 'absolute', left: '5px', top: '10px', bottom: '10px', width: '2px', backgroundColor: THEME.border }}></div>
                            
                            {activeProject.changelog.map((log, i) => (
                                <div key={i} style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
                                    <div style={{ 
                                        width: '12px', 
                                        height: '12px', 
                                        borderRadius: '50%', 
                                        backgroundColor: i === 0 ? THEME.accent : THEME.border,
                                        flexShrink: 0,
                                        marginTop: '0.3rem'
                                    }}></div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.textMuted, marginBottom: '0.3rem' }}>{log.date}</div>
                                        <div style={{ fontSize: '0.85rem', color: THEME.textMuted, lineHeight: 1.5 }}>
                                            {log.note}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
