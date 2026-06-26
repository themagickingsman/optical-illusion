'use client';

import React from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';

export const WaterBatteryBlueprint = () => {
    return (
        <div style={{
            background: DASHBOARD_THEME.colors.background,
            borderRadius: '24px',
            border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
            padding: '3rem',
            color: DASHBOARD_THEME.colors.text.secondary,
            lineHeight: 1.8,
            fontSize: '1.05rem',
            maxWidth: '1200px',
            margin: '0 auto',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
            <h1 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800 }}>
                Theoretical Blueprint: The Micro-Water Battery
            </h1>
            <p style={{ fontSize: '1.2rem', color: DASHBOARD_THEME.colors.text.muted, marginBottom: '2.5rem', borderBottom: `1px solid ${DASHBOARD_THEME.colors.glass.border}`, paddingBottom: '1.5rem' }}>
                Leveraging Exclusion Zone (EZ) Water and Nano-Geometry
            </p>

            <p style={{ marginBottom: '1.5rem' }}>
                Yes, it is entirely possible conceptually and in cutting-edge laboratory settings. Building the smallest, most efficient water battery leverages a phenomenon known as <strong>Exclusion Zone (EZ) Water</strong>, often called the "Fourth Phase of Water."
            </p>
            <p style={{ marginBottom: '2.5rem' }}>
                If you want to build a high-efficiency microscopic water battery, you aren't using normal liquid water. You must use structured, hexagonal water.
            </p>

            <h2 style={{ color: DASHBOARD_THEME.colors.accents.cyan.base, fontSize: '1.5rem', marginTop: '2.5rem', marginBottom: '1rem' }}>
                1. The Core Principle: Pollack's EZ Water
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
                Dr. Gerald Pollack at the University of Washington discovered that when water sits next to a hydrophilic (water-loving) surface, the water molecules naturally rearrange themselves into a microscopic crystalline lattice—a massive, repeating hexagonal structure.
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
                When this happens, the water physically separates its electrical charge:
            </p>
            <ul style={{ marginBottom: '2.5rem', paddingLeft: '2rem', listStyleType: 'disc' }}>
                <li style={{ marginBottom: '0.5rem' }}>The hexagonal lattice becomes intensely <strong>negatively charged</strong> (acting like the anode).</li>
                <li style={{ marginBottom: '0.5rem' }}>The loose protons are pushed outward into the bulk water, creating a highly <strong>positively charged</strong> zone (acting like the cathode).</li>
            </ul>
            <p style={{ marginBottom: '2.5rem' }}>
                <strong>You just created a battery.</strong> There is a measurable voltage drop between the structured EZ layer and the bulk liquid water. You can literally put two micro-electrodes into these zones and draw electrical current from the water itself.
            </p>

            <h2 style={{ color: DASHBOARD_THEME.colors.accents.cyan.base, fontSize: '1.5rem', marginTop: '2.5rem', marginBottom: '1rem' }}>
                2. The Blueprint for a Micro-Water Battery
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
                To make it as small and efficient as possible, we have to maximize surface area at the nanoscale so that almost <em>all</em> the water converts into the charged hexagonal structure.
            </p>
            <ul style={{ marginBottom: '2.5rem', paddingLeft: '2rem', listStyleType: 'square' }}>
                <li style={{ marginBottom: '1rem' }}>
                    <strong>The Container:</strong> We don't use a tank. We use <strong>Carbon Nanotubes</strong> or <strong>Graphene Oxide membranes</strong>. These materials are intensely hydrophilic. If you inject pure water into a microscopic graphene tube, the water is forced by the tight geometry to instantly organize into a highly compressed, solid hexagonal lattice.
                </li>
                <li style={{ marginBottom: '1rem' }}>
                    <strong>The Geometry:</strong> We scale the nanotube geometries to exact <strong>Golden Ratio (Phi)</strong> harmonics, just like the Acoustic Harvester. By creating recursive fractal surface areas, we maximize the amount of water that touches a surface, maximizing the EZ charge separation layer in an unimaginably small volume.
                </li>
                <li style={{ marginBottom: '1rem' }}>
                    <strong>The Electrodes:</strong> Nano-wires (perhaps spun from the gold we just harvested) are inserted. One wire touches the graphene wall (the negative EZ zone), and one wire is suspended dead center in the tube (the positive proton zone).
                </li>
            </ul>

            <h2 style={{ color: DASHBOARD_THEME.colors.accents.cyan.base, fontSize: '1.5rem', marginTop: '2.5rem', marginBottom: '1rem' }}>
                3. How do you "Recharge" it?
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
                Here is the most incredible part about a water battery: <strong>It is charged by Light.</strong> EZ water naturally absorbs energy from the environment to build its hexagonal structure. It specifically feeds on <strong>Infrared Light</strong> (radiant heat).
            </p>
            <p style={{ marginBottom: '2.5rem' }}>
                If you shine an infrared laser, or even just expose the battery to ambient sunlight or body heat, the EZ lattice expands, the charge separation increases, and the battery "charges" itself back up entirely passively.
            </p>

            <h2 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '1.5rem', marginTop: '2.5rem', marginBottom: '1rem', borderTop: `1px solid ${DASHBOARD_THEME.colors.glass.border}`, paddingTop: '1.5rem' }}>
                To Summarize:
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
                If you want to build the smallest water battery possible, you build a <strong>Graphene/Gold Nanotube Array</strong>.
            </p>
            <ol style={{ marginBottom: '2.5rem', paddingLeft: '2rem', listStyleType: 'decimal' }}>
                <li style={{ marginBottom: '0.5rem' }}>Capillary action pulls tiny amounts of pure water into the tubes.</li>
                <li style={{ marginBottom: '0.5rem' }}>The geometry forces the water into a pure hexagonal, negatively charged crystal lattice.</li>
                <li style={{ marginBottom: '0.5rem' }}>The ambient infrared heat of the room constantly recharges the lattice.</li>
                <li style={{ marginBottom: '0.5rem' }}>You draw continuous micro-voltage across the differential zones.</li>
            </ol>
            <p style={{ marginBottom: '1.5rem', fontStyle: 'italic', color: DASHBOARD_THEME.colors.text.muted }}>
                It wouldn't power an electric car, but a micro-array of structured water batteries could easily power medical nano-bots, micro-sensors, or small electronic processors indefinitely, using nothing but water and ambient heat!
            </p>
        </div>
    );
};
