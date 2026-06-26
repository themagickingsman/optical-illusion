const fs = require('fs');

const path = '/Users/uxmagicman/Desktop/ARN/web_portal/src/app/science/dashboard/components/AsteroidsGame.tsx';
let txt = fs.readFileSync(path, 'utf8');

const badChunk = `      if (warpSettled && activeWarpA        // ── WARP ZONE AUTOPILOT LOGIC ──────────────────
        if (warpZoneActiveRef.current) {
          autoPilotRef.current = true;
          waypointRef.current = {
            id: "origin",
            name: "Warp Hub",
            isEarth: false,
            r: 0,
            worldR: 0,
            baseAngle: 0,
            orbSpeed: 0,
            color: "#ffffff",
            isSource: true,
            au: 0,
          } as (typeof SOLAR_BODIES)[0];

          if (Math.hypot(ship.pos.x, ship.pos.y) < WARP_ZONE_RADIUS) {
            warpZoneActiveRef.current = false;
          }
        }

        // ── RTB (Return To Base) SEQUENTIAL LOGIC ──────────────────
        if (rtbActiveRef.current) {
          autoPilotRef.current = true;
          if (displayOct !== 11) {
            waypointRef.current = {
              id: "origin",
              name: "Warp Hub",
              isEarth: false,
              r: 0,
              worldR: 0,
              baseAngle: 0,
              orbSpeed: 0,
              color: "#ffffff",
              isSource: true,
              au: 0,
            } as (typeof SOLAR_BODIES)[0];

            // Trigger warp if we breach the warp zone
            if (Math.hypot(ship.pos.x, ship.pos.y) < WARP_ZONE_RADIUS) {
              const settlescale = Math.abs(
                targetLogZoomRef.current - logZoomRef.current,
              );
              const isZooming = settlescale > 0.01;
              const targetZoom11 = 11 * RINGS_PER_OCTAVE + RINGS_PER_OCTAVE / 2;
              if (
                pendingOctaveRef.current === null &&
                !isZooming &&
                targetLogZoomRef.current !== targetZoom11
              ) {
                // Just command the camera. The main loop will automatically trigger audio, caching, and octave switching.
                targetLogZoomRef.current = targetZoom11;
              }
            }
          } else if (true) {
            // isZooming is stripped here since we trigger off state check
            const earth = SOLAR_BODIES.find((b) => b.isEarth);
            if (earth) {
              waypointRef.current = earth;
              const eAngle =
                earth.baseAngle + frameRef.current * earth.orbSpeed;
              const eDist = dist2(ship.pos, {
                x: Math.cos(eAngle) * earth.worldR,
                y: Math.sin(eAngle) * earth.worldR,
              });
              // Safely disable RTB logic once Earth orbit capture happens
              if (eDist < earth.r * 2.5 || s.autoOrbitTarget?.isEarth) {
                rtbActiveRef.current = false;
              }
            }
          }
        }

        // ── AUTOPILOT LOGIC ───────────────────────────────────────
        // Auto-Orbit check: If coasting and close to a planet, get snatched into auto-orbit
        const coasting = !(
          keys["ArrowUp"] ||
          keys["ArrowDown"] ||
          keys["ArrowLeft"] ||
          keys["ArrowRight"] ||
          keys["KeyW"] ||
          keys["KeyA"] ||
          keys["KeyS"] ||
          keys["KeyD"]
        );

        if (!autoPilotRef.current && !zoomedPlanetRef.current) {
          let bestOrbitBody = null;
          let bestDistSq = Infinity;
          let dockBody = null;
          
          // Prevents the ship from instantly being snared by Mercury on game load due to overlapping 3.8x gravity wells at the (0,0) center
          if (dist2(s.ship.pos, { x: 0, y: 0 }) > Math.pow(200, 2)) {
            for (const body of SOLAR_BODIES) {
              if (body.name.toLowerCase().includes("sun")) continue; // Don't randomly snare into the Sun
              const bAngle = body.baseAngle + frameRef.current * body.orbSpeed;
              const bwx = Math.cos(bAngle) * body.worldR;
              const bwy = Math.sin(bAngle) * body.worldR;
              const distToBodySq = dist2(s.ship.pos, { x: bwx, y: bwy });

              // If the user manually thrusts over the planet core, prioritize instant auto-dock capture!
              if (!coasting && distToBodySq < Math.pow(body.r * 1.5, 2)) {
                dockBody = body;
                break;
              }
              
              // Orbit capture happens at 3.8x the body radius (matches autopilot threshold) when coasting
              if (coasting && distToBodySq < Math.pow(body.r * 3.8, 2) && distToBodySq < bestDistSq) {
                bestDistSq = distToBodySq;
                bestOrbitBody = body;
              }
            }
          }

          if (dockBody) {
             // Initiate Auto-Dock sequence seamlessly
             s.autoOrbitTarget = null;
             s.ship.vel.x *= 0.1; // Bleed velocity rapidly
             s.ship.vel.y *= 0.1;
             zoomedPlanetRef.current = dockBody as any;
             setZoomedPlanet(dockBody as any);
             planetZoomAnimRef.current = {
               active: true, progress: 0, planet: dockBody as any,
               startCam: { x: s.camera.x || 0, y: s.camera.y || 0 },
               endCam: { x: 0, y: 0 },
               startScale: 1.0, 
               endScale: Math.min(100, Math.max(1, Math.min(canvasRef.current?.width || 1200, canvasRef.current?.height || 800) * 0.15 / ((dockBody as any).r || 1))),
               direction: 'in'
             };
             surfaceCameraRef.current = { x: 0, y: 0, scale: 1 };
             setSurfaceCamera(surfaceCameraRef.current);
          } else if (coasting && bestOrbitBody && !s.autoOrbitTarget) {
             s.autoOrbitTarget = bestOrbitBody as any;
          } else if (!coasting) {
             s.autoOrbitTarget = null; // Break auto-orbit if user steers away
          }
        }  keys["ArrowLeft"] ||
          keys["ArrowRight"] ||
          keys["KeyW"] ||
          keys["KeyA"] ||
          keys["KeyS"] ||
          keys["KeyD"]
        );

        if (!coasting) {
          s.autoOrbitTarget = null; // Break auto-orbit if user steers
        } else if (!autoPilotRef.current && !s.autoOrbitTarget && !zoomedPlanetRef.current) {
          // Look for a planet to snare us or dock us
          let bestBody = null;
          let bestDistSq = Infinity;
          let dockBody = null;
          
          // Prevents the ship from instantly being snared by Mercury on game load due to overlapping 3.8x gravity wells at the (0,0) center
          if (dist2(s.ship.pos, { x: 0, y: 0 }) > Math.pow(200, 2)) {
            for (const body of SOLAR_BODIES) {
              if (body.name.toLowerCase().includes("sun")) continue; // Don't randomly snare into the Sun
              const bAngle = body.baseAngle + frameRef.current * body.orbSpeed;
              const bwx = Math.cos(bAngle) * body.worldR;
              const bwy = Math.sin(bAngle) * body.worldR;
              const distToBodySq = dist2(s.ship.pos, { x: bwx, y: bwy });

              // If we coast directly over the planet core, prioritize instant auto-dock capture!
              if (distToBodySq < Math.pow(body.r * 1.5, 2)) {
                dockBody = body;
                break;
              }
              
              // Orbit capture happens at 3.8x the body radius (matches autopilot threshold)
              if (distToBodySq < Math.pow(body.r * 3.8, 2) && distToBodySq < bestDistSq) {
                bestDistSq = distToBodySq;
                bestBody = body;
              }
            }
          }

          if (dockBody) {
             // Initiate Auto-Dock sequence seamlessly
             s.ship.vel.x *= 0.1; // Bleed velocity rapidly
             s.ship.vel.y *= 0.1;
             zoomedPlanetRef.current = dockBody as any;
             setZoomedPlanet(dockBody as any);
             planetZoomAnimRef.current = {
               active: true, progress: 0, planet: dockBody as any,
               startCam: { x: s.camera.x || 0, y: s.camera.y || 0 },
               endCam: { x: 0, y: 0 },
               startScale: 1.0, 
               endScale: Math.min(100, Math.max(1, Math.min(canvasRef.current?.width || 1200, canvasRef.current?.height || 800) * 0.15 / ((dockBody as any).r || 1))),
               direction: 'in'
             };
             surfaceCameraRef.current = { x: 0, y: 0, scale: 1 };
             setSurfaceCamera(surfaceCameraRef.current);
          } else if (bestBody) {
             s.autoOrbitTarget = bestBody as any;
          }
        }\`;

const correctChunk = \`      if (warpSettled && activeWarpAudioRef.current) {
        activeWarpAudioRef.current.fadeOut(1.0); // 1-second fade
        activeWarpAudioRef.current = null;
      }

      // Now spawn the new field if needed
      if (warpSettled && pendingOctaveRef.current !== null) {
        const oct = pendingOctaveRef.current;
        pendingOctaveRef.current = null;
        asteroidsKilledRef.current = 0; // new octave — reset kill counter

        if (s.phase === "PLAYING" && gameMode !== 'fleet_garage') {
          s.asteroids = spawnField(s.level, s.ship.pos, W, H, oct);
          s.dustOrbs = [];
          s.debris = [];
        }
      }

      // ── Game Update ───────────────────────────────────────────────────
      // ── Muzzled Orbital UI Tether Fallback ────────────────────────────
      // When the UI is rendering, steering/thrust physics are completely disabled.
      // We manually tether the disabled ship's spatial vector to its orbit target so it doesn't drift apart.
      if (s.phase === "PLAYING" && zoomedPlanetRef.current && s.autoOrbitTarget) {
         const wp = s.autoOrbitTarget;
         const bAngle = wp.baseAngle + frameRef.current * wp.orbSpeed;
         const wpwx = Math.cos(bAngle) * wp.worldR;
         const wpwy = Math.sin(bAngle) * wp.worldR;
         const orbitRadius = wp.r * 3.0; // Hard synchronize to the native 3.0x orbit
         
         const angleFromPlanet = Math.atan2(
            s.ship.pos.y - wpwy,
            s.ship.pos.x - wpwx,
         );
         // Stagnant steering implies perfect circle trajectory calculation
         s.ship.pos.x = wpwx + Math.cos(angleFromPlanet) * orbitRadius;
         s.ship.pos.y = wpwy + Math.sin(angleFromPlanet) * orbitRadius;
      }

      if (s.phase === "PLAYING" && !planetZoomAnimRef.current.active && !zoomedPlanetRef.current) {
        const { ship, keys } = s;
        const shipCfg = SHIP_CONFIGS[shipTypeRef.current] ?? SHIP_CONFIGS[1];

        const turnAccel = shipCfg.turnSpeed ?? ANGULAR_ACCEL;
        const turnFriction = shipCfg.turnDrag ?? ANGULAR_DRAG;

        // User input disables autopilot
        if (
          keys["ArrowUp"] ||
          keys["ArrowDown"] ||
          keys["ArrowLeft"] ||
          keys["ArrowRight"] ||
          keys["KeyW"] ||
          keys["KeyA"] ||
          keys["KeyS"] ||
          keys["KeyD"]
        ) {
          autoPilotRef.current = false;
          rtbActiveRef.current = false;
          warpZoneActiveRef.current = false;
        }

        // ── WARP ZONE AUTOPILOT LOGIC ──────────────────
        if (warpZoneActiveRef.current) {
          autoPilotRef.current = true;
          waypointRef.current = {
            id: "origin",
            name: "Warp Hub",
            isEarth: false,
            r: 0,
            worldR: 0,
            baseAngle: 0,
            orbSpeed: 0,
            color: "#ffffff",
            isSource: true,
            au: 0,
          } as (typeof SOLAR_BODIES)[0];

          if (Math.hypot(ship.pos.x, ship.pos.y) < WARP_ZONE_RADIUS) {
            warpZoneActiveRef.current = false;
          }
        }

        // ── RTB (Return To Base) SEQUENTIAL LOGIC ──────────────────
        if (rtbActiveRef.current) {
          autoPilotRef.current = true;
          if (displayOct !== 11) {
            waypointRef.current = {
              id: "origin",
              name: "Warp Hub",
              isEarth: false,
              r: 0,
              worldR: 0,
              baseAngle: 0,
              orbSpeed: 0,
              color: "#ffffff",
              isSource: true,
              au: 0,
            } as (typeof SOLAR_BODIES)[0];

            // Trigger warp if we breach the warp zone
            if (Math.hypot(ship.pos.x, ship.pos.y) < WARP_ZONE_RADIUS) {
              const settlescale = Math.abs(
                targetLogZoomRef.current - logZoomRef.current,
              );
              const isZooming = settlescale > 0.01;
              const targetZoom11 = 11 * RINGS_PER_OCTAVE + RINGS_PER_OCTAVE / 2;
              if (
                pendingOctaveRef.current === null &&
                !isZooming &&
                targetLogZoomRef.current !== targetZoom11
              ) {
                // Just command the camera. The main loop will automatically trigger audio, caching, and octave switching.
                targetLogZoomRef.current = targetZoom11;
              }
            }
          } else if (true) {
            // isZooming is stripped here since we trigger off state check
            const earth = SOLAR_BODIES.find((b) => b.isEarth);
            if (earth) {
              waypointRef.current = earth;
              const eAngle =
                earth.baseAngle + frameRef.current * earth.orbSpeed;
              const eDist = dist2(ship.pos, {
                x: Math.cos(eAngle) * earth.worldR,
                y: Math.sin(eAngle) * earth.worldR,
              });
              // Safely disable RTB logic once Earth orbit capture happens
              if (eDist < earth.r * 2.5 || s.autoOrbitTarget?.isEarth) {
                rtbActiveRef.current = false;
              }
            }
          }
        }

        // ── AUTOPILOT LOGIC ───────────────────────────────────────
        // Auto-Orbit check: If coasting and close to a planet, get snatched into auto-orbit
        const coasting = !(
          keys["ArrowUp"] ||
          keys["ArrowDown"] ||
          keys["ArrowLeft"] ||
          keys["ArrowRight"] ||
          keys["KeyW"] ||
          keys["KeyA"] ||
          keys["KeyS"] ||
          keys["KeyD"]
        );

        if (!autoPilotRef.current && !zoomedPlanetRef.current) {
          let bestOrbitBody = null;
          let bestDistSq = Infinity;
          let dockBody = null;
          
          // Prevents the ship from instantly being snared by Mercury on game load due to overlapping 3.8x gravity wells at the (0,0) center
          if (dist2(s.ship.pos, { x: 0, y: 0 }) > Math.pow(200, 2)) {
            for (const body of SOLAR_BODIES) {
              if (body.name.toLowerCase().includes("sun")) continue; // Don't randomly snare into the Sun
              const bAngle = body.baseAngle + frameRef.current * body.orbSpeed;
              const bwx = Math.cos(bAngle) * body.worldR;
              const bwy = Math.sin(bAngle) * body.worldR;
              const distToBodySq = dist2(s.ship.pos, { x: bwx, y: bwy });

              // If the user manually thrusts over the planet core, prioritize instant auto-dock capture!
              if (!coasting && distToBodySq < Math.pow(body.r * 1.5, 2)) {
                dockBody = body;
                break;
              }
              
              // Orbit capture happens at 3.8x the body radius (matches autopilot threshold) when coasting
              if (coasting && distToBodySq < Math.pow(body.r * 3.8, 2) && distToBodySq < bestDistSq) {
                bestDistSq = distToBodySq;
                bestOrbitBody = body;
              }
            }
          }

          if (dockBody) {
             // Initiate Auto-Dock sequence seamlessly
             s.autoOrbitTarget = null;
             s.ship.vel.x *= 0.1; // Bleed velocity rapidly
             s.ship.vel.y *= 0.1;
             zoomedPlanetRef.current = dockBody as any;
             setZoomedPlanet(dockBody as any);
             planetZoomAnimRef.current = {
               active: true, progress: 0, planet: dockBody as any,
               startCam: { x: s.camera.x || 0, y: s.camera.y || 0 },
               endCam: { x: 0, y: 0 },
               startScale: 1.0, 
               endScale: Math.min(100, Math.max(1, Math.min(canvasRef.current?.width || 1200, canvasRef.current?.height || 800) * 0.15 / ((dockBody as any).r || 1))),
               direction: 'in'
             };
             surfaceCameraRef.current = { x: 0, y: 0, scale: 1 };
             setSurfaceCamera(surfaceCameraRef.current);
          } else if (coasting && bestOrbitBody && !s.autoOrbitTarget) {
             s.autoOrbitTarget = bestOrbitBody as any;
          } else if (!coasting) {
             s.autoOrbitTarget = null; // Break auto-orbit if user steers away
          }
        }\`;

if (txt.includes(badChunk)) {
  txt = txt.replace(badChunk, correctChunk);
  fs.writeFileSync(path, txt, 'utf8');
  console.log("Replaced exactly via script.");
} else {
  console.log("Chunk not found. Dumping substring instead");
  fs.writeFileSync('/tmp/dump.txt', txt.substring(txt.indexOf('activeWarpA') - 50, txt.indexOf('activeWarpA') + 5000));
}
