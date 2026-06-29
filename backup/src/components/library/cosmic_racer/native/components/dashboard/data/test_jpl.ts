import { getEclipticLongitude, calculate3DPosition, SOLAR_SYSTEM_PLANETS, deg2rad } from "./solar_system_jpl";

// Validation 1: Feb 28, 2026
console.log("================ METRIC 1: PLANETARY PARADE (Feb 28, 2026) ================");
const date1 = new Date("2026-02-28T12:00:00Z");
SOLAR_SYSTEM_PLANETS.forEach(p => {
    const pos = calculate3DPosition(p, date1);
    const lon = getEclipticLongitude(pos.x, pos.y);
    console.log(`${p.name.padEnd(10)}: ${lon.toFixed(2)} deg`);
});

// Validation 2: Mar 20, 2026
console.log("\n================ METRIC 2: SPRING EQUINOX (March 20, 2026) ================");
const date2 = new Date("2026-03-20T12:00:00Z");
SOLAR_SYSTEM_PLANETS.forEach(p => {
    const pos = calculate3DPosition(p, date2);
    const lon = getEclipticLongitude(pos.x, pos.y);
    console.log(`${p.name.padEnd(10)}: ${lon.toFixed(2)} deg`);
});
