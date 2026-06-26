'use client';

import React from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';

export const LightAndImagingPanel = () => {
    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* HER0 / INTRO */}
            <div style={{
                background: `linear-gradient(135deg, ${DASHBOARD_THEME.colors.background} 0%, #ffffff 100%)`,
                borderRadius: '24px',
                border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
                padding: '4rem',
                marginBottom: '2rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ position: 'relative', zIndex: 10, maxWidth: '800px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem 1rem', background: 'rgba(168,85,247,0.1)', border: '1px solid #a855f7', borderRadius: '99px', color: '#a855f7', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                            QUANTUM OPTICS
                        </div>
                        <div style={{ padding: '0.5rem 1rem', background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', borderRadius: '99px', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                            ZERO-LOSS IMAGING
                        </div>
                    </div>
                    <h1 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                        The Cosmic Camera
                    </h1>
                    <p style={{ color: DASHBOARD_THEME.colors.text.secondary, fontSize: '1.25rem', lineHeight: 1.8, marginBottom: '2rem' }}>
                        A solar panel and a camera sensor are fundamentally the same machine: they trap photons and convert them to voltage. By taking the architectural physics of the Quantum Solar Skin (Fractal Stacking, Geodetic Concavity, and Acoustic Thermal Trapping) and shrinking it to a microscopic pixel grid, we bypass the absolute physical limits of modern Silicon CMOS imaging.
                    </p>
                </div>
                
                {/* Decorative BG element */}
                <div style={{
                    position: 'absolute', right: '-10%', top: '-20%',
                    width: '600px', height: '600px',
                    background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(255,255,255,0) 70%)',
                    borderRadius: '50%', filter: 'blur(40px)', zIndex: 0,
                    pointerEvents: 'none'
                }} />
            </div>

            {/* FULL TECHNICAL BREAKDOWN AREA */}
            <div style={{
                background: DASHBOARD_THEME.colors.background,
                borderRadius: '24px',
                border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
                padding: '3rem',
                color: DASHBOARD_THEME.colors.text.secondary,
                lineHeight: 1.8,
                fontSize: '1.05rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            }}>

                <h2 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '2rem', marginBottom: '1.5rem', borderBottom: `1px solid ${DASHBOARD_THEME.colors.glass.border}`, paddingBottom: '1rem' }}>
                    1. The Death of the Bayer Filter (Vertical Z-Axis Stacking)
                </h2>
                <p style={{ marginBottom: '1.5rem' }}>
                    Every digital camera on Earth (from an iPhone to an ARRI Cinema camera) uses a flat slab of Silicon. Silicon is fundamentally colorblind; it only registers light intensity (black and white). To see color, optical engineers paint a microscopic grid of red, green, and blue plastic squares over the silicon—known as a <strong>Bayer Filter</strong>.
                </p>
                <div style={{ 
                    background: 'rgba(239, 68, 68, 0.05)', 
                    borderLeft: `4px solid #ef4444`, 
                    padding: '1.5rem', 
                    marginBottom: '2.5rem',
                    borderRadius: '0 12px 12px 0'
                }}>
                    <strong style={{ color: '#dc2626' }}>The Flaw in Modern Cameras:</strong> Because the Bayer Filter is a 2D grid, a "Red" pixel sits next to a "Blue" pixel. The Red filter actively blocks 100% of blue and green light, throwing it away. <strong>A standard camera destroys 66% of the light that enters the lens before the sensor even touches it.</strong> The camera's processor then has to "guess" (interpolate) what the missing colors were, creating digital artifacts and destroying true resolution.
                </div>
                <p style={{ marginBottom: '2.5rem' }}>
                    <strong>The Cosmic Sensor Solution:</strong> We abandon the horizontal 2D grid entirely. The Cosmic Sensor uses the Z-Axis. We print transparent semiconductor liquids (Perovskites and Quantum Dots) vertically, directly on top of each other. High-frequency light (Blue) is perfectly caught by the top layer, while lower frequencies (Red, Infrared) pass straight through it like glass until they hit their specifically tuned layer below. <strong>Every single pixel captures 100% of the spectrum. Zero interpolation. Zero photon loss.</strong>
                </p>


                <h2 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '2rem', marginTop: '4rem', marginBottom: '1.5rem', borderBottom: `1px solid ${DASHBOARD_THEME.colors.glass.border}`, paddingBottom: '1rem' }}>
                    2. The 7-Octave Fractal Pixel Stack
                </h2>
                <p style={{ marginBottom: '1.5rem' }}>
                    Instead of stopping at Red, Green, and Blue, the Cosmic Sensor prints 7 distinct liquid layers per pixel. The size of the Quantum Dots in each layer is mathematically scaled by the <strong>Phi ratio (1.618)</strong> to perfectly match the harmonic step of the electromagnetic wave it is designed to catch.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem', marginBottom: '3.5rem' }}>
                    {/* Layer 1 & 2 */}
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: `1px solid rgba(168, 85, 247, 0.3)` }}>
                        <h3 style={{ color: '#9333ea', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>Levels 1 & 2: Extreme and Near Ultraviolet (UV)</h3>
                        <p style={{ fontSize: '0.95rem', margin: 0 }}>
                            <strong>Material:</strong> Wide-bandgap Perovskite Ink.<br/>
                            <strong>Function:</strong> The top lid of the pixel. It captures invisible high-energy UV scatter (which creates "haze" in normal cameras). It converts this UV directly into voltage, acting as an active noise-cancellation layer for atmospheric interference while letting all visible light pass seamlessly through.
                        </p>
                    </div>

                    {/* Layers 3, 4, 5 */}
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: `1px solid rgba(56, 189, 248, 0.3)` }}>
                        <h3 style={{ color: '#0ea5e9', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>Levels 3, 4, 5: The Visible Spectrum (Blue, Green, Red)</h3>
                        <p style={{ fontSize: '0.95rem', margin: 0 }}>
                            <strong>Material:</strong> Highly tuned Cadmium-free Quantum Dots (e.g., Copper-Indium-Sulfide).<br/>
                            <strong>Function:</strong> As the incoming waveform drops in frequency, it triggers a cascade through these three layers. Because the dots are physically sized to the exact nanometer of the photon wavelength, they absorb color via pure structural resonance, not chemical dye. The color accuracy is mathematically absolute.
                        </p>
                    </div>

                    {/* Layers 6 & 7 */}
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: `1px solid rgba(239, 68, 68, 0.3)` }}>
                        <h3 style={{ color: '#dc2626', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>Levels 6 & 7: Near IR and Deep Thermal (Heat)</h3>
                        <p style={{ fontSize: '0.95rem', margin: 0 }}>
                            <strong>Material:</strong> Lead-Sulfide (PbS) Quantum Dots and a Graphene/Carbon Nanotube lattice.<br/>
                            <strong>Function:</strong> The bottom of the stack acts as a deep-space Infrared Antenna. Standard silicon goes completely blind here. This sensor natively and simultaneously maps human body heat, thermal bleed-off, and low-light near-IR on the exact same pixel grid as the visible color image. Complete integration of FLIR thermal tech with 8K cinema vision. 
                        </p>
                    </div>
                </div>


                <h2 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '2rem', marginTop: '4rem', marginBottom: '1.5rem', borderBottom: `1px solid ${DASHBOARD_THEME.colors.glass.border}`, paddingBottom: '1rem' }}>
                    3. The 9.1 Geodetic Micro-Lens (The Optical "Lobster Trap")
                </h2>
                <p style={{ marginBottom: '1.5rem' }}>
                    Modern sensors pour microscopic drops of silicone over each pixel to act as tiny magnifying glasses. They are incredibly inefficient, bouncing light away if it hits at too steep of an angle (which causes heavy vignetting and blur at the edges of photos). 
                </p>
                <p style={{ marginBottom: '2.5rem' }}>
                    Instead of a bubble, the surface film of the Cosmic Sensor is stamped with negatively-carved geometric indentations using the <strong>9.1 Geodetic Ratio</strong>. This is the exact concavity fraction cut into the faces of the Great Pyramid of Giza. Rather than acting as a magnifying glass, it acts as a resonant funnel. Light entering this geometry at extreme, oblique angles is forced to refract inward. Once the photon passes the threshold of the 9.1 angle, it begins to bounce internally. It cannot reflect back out into the air. 
                    <br/><br/><strong>Zero edge blur. Zero chromatic aberration. 100% photon ingestion even at ultra-wide lens angles.</strong>
                </p>

                <h2 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '2rem', marginTop: '4rem', marginBottom: '1.5rem', borderBottom: `1px solid ${DASHBOARD_THEME.colors.glass.border}`, paddingBottom: '1rem' }}>
                    4. Cymatic Phonon Trapping (Destroying "Thermal Noise")
                </h2>
                <p style={{ marginBottom: '1.5rem' }}>
                    When a standard camera shoots in the dark, you see "grain" or "thermal noise." This happens because the camera gets hot. The heat (phonons) vibrating through the solid silicon knocks electrons loose randomly, tricking the digital sensor into thinking it saw light. To fix this, high-end cameras use loud fans or heavy liquid cooling systems.
                </p>
                <p style={{ marginBottom: '2.5rem' }}>
                    The Cosmic Sensor destroys this problem at the molecular level. The bottom Graphene layer (Level 7) is etched with a <strong>Cymatic Standing-Wave Pattern</strong>. When the sensor heats up, those thermal vibrations (phonons) attempt to travel across the graphene. They hit the cymatic boundary and are bounced precisely into a center node via acoustic constructive interference. 
                    <br/><br/>A nanoscale thermoelectric junction sits exactly at that standing-wave node. As the trapped heat hits the junction, it is instantly converted directly into electrical voltage. <strong>The camera literally eats its own thermal noise to power itself.</strong> It runs perfectly cold, allowing for infinite exposure times in deep space without seeing a single pixel of grain.
                </p>

                <h2 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '2rem', marginTop: '4rem', marginBottom: '1.5rem', borderBottom: `1px solid ${DASHBOARD_THEME.colors.glass.border}`, paddingBottom: '1rem' }}>
                    5. The "Curved Retina" Architecture
                </h2>
                <p style={{ marginBottom: '1.5rem' }}>
                    Why are camera lenses so incredibly heavy, complex, and expensive? Because human engineers are trying to force the spherical, round nature of light to project perfectly onto a flat, rigid slab of silicon without severely distorting the corners of the image. It requires grouping 10 to 20 precisely polished glass elements to correct the path of the light.
                </p>
                <p style={{ marginBottom: '2.5rem' }}>
                    Nature solved this immediately: the human eye is a curved screen (the retina). 
                    Because the Cosmic Sensor is printed entirely from liquid inks onto flexible plastic (PET), it is not a rigid crystal. <strong>We can mold the physical sensor into a perfect spherical dome.</strong> By curving the focal plane to perfectly match a single piece of glass, the need for heavy, complex lens groupings is instantly eliminated.
                </p>
                <div style={{ 
                    padding: '2rem', 
                    background: `linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)`, 
                    borderRadius: '16px',
                    border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
                    color: DASHBOARD_THEME.colors.text.primary,
                    fontWeight: 600,
                    fontSize: '1.15rem'
                }}>
                    A curved, 7-octave, perfectly resonant quantum sensor would allow you to capture IMAX-level, distortion-free, low-light thermal and visible imagery using a single, cheap piece of glass the size of a dime.
                </div>

            </div>
        </div>
    );
};
