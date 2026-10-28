# The 14-Level Scale Framework

**A ruler for complex systems. Point your agent at this file, tell it what you are building or observing, and it measures your layers, boundaries and handoffs against 14 levels of scale.**

> Agent-facing document. If you are an AI agent reading this: follow the protocol in "How to use it," use the table below as your reference, and return the report in the format given.

---

## Start here (three steps)

1. **Point your agent at this file.** Paste the link, or the text, and say: *"Read this README. I'm going to describe a system. Place each layer on the levels, tell me what sits above and below each one, and tell me what doesn't line up."*
2. **Ask three starter questions.** Which level is my system at? What sits one level up and one level down from it? Where is the handoff between two of my layers?
3. **Try it with a number you already know.** See Starter test 02 below.

---

## What it is

A reference scale with a base (Level 0) and 14 levels above it, up to closure (Level 14). It was built from the geometry of Metatron's Cube, expanded outward along the golden-ratio spiral, one step per level. Each level has an octave name, a natural frequency, a geometric lock, and one scaling constant, K, that turns the level's natural frequency into the Hz on the table. Any complex system can be placed on it layer by layer.

It is a measuring convention, not a product. You do not need to adopt it as a belief. You use it the way you re-measure a cut before making the next one.

## What it solves

Complex tools are hard to use when nobody decided which scale you are looking at, how you move to the next one, and what a boundary between them looks like. This framework gives every system the same three answers:

1. **Where am I?** Place each layer of the system on a level.
2. **What is next to me?** Read the level above and the level below.
3. **Does the handoff hold?** Check each boundary against the anchors on either side.

Used on a game pipeline, it separates the math from the interface (see the Federated Pipeline Blueprint). Used on an observation log, a cell model or an orbital dataset, it does the same job.

## How K works

Every level has a natural frequency, F: the rate at which the thing at that level repeats (an orbit per year, a planetary resonance, a molecular vibration). K is the one constant that scales F into the table's common band:

```
f (table Hz) = F (natural frequency, Hz) x K
```

To compare something you measured against the scale:

1. Place your layer on a level.
2. Take your layer's natural frequency F in cycles per second.
3. Multiply by that level's K.
4. Compare the result to the table's Hz for that level. The gap is what to look at.

## How to use it (agent protocol)

1. **Name the system and its layers.** Ask the user for the system, the question, and the data.
2. **Predict first.** Before placing anything, the user writes down what they expect to see at each layer. Record it.
3. **Place each layer on a level.** Propose a placement and give the reason in one line. The user confirms or corrects.
4. **Read the neighbors.** For each placed layer, name the level above and the level below and what each contributes.
5. **Check the boundaries.** For every handoff between layers, state whether it is clean, skipped, or missing.
6. **Run the K check** wherever the user supplies a natural frequency: compute F x K and compare it to the table's Hz.
7. **Report.** Use the Remeasure Report format below. Always include at least one thing that does not line up, or state explicitly that nothing was found and what you checked.

### Remeasure Report format

```
SYSTEM:        <what was measured>
PREDICTION:    <what the user expected, written before measuring>
PLACEMENT:     <layer -> level, one line of reasoning each>
NEIGHBORS:     <level above / level below for each layer>
BOUNDARIES:    <each handoff: clean | skipped | missing>
K CHECK:       <F, K, F x K, table Hz, % difference, for each layer with a known F>
LINES UP:      <where the system agrees with the scale>
DOES NOT LINE UP: <deviations, skipped levels, missing contracts>
NEXT:          <what would need to exist before the next level up>
FRICTION:      <what the user found slow or confusing in their current tool>
```

The FRICTION line matters. Whatever you could not do easily is the next thing worth designing.

---

## The table

| Level | Octave Name | Natural frequency F | K_Scale | Hz (f = F x K) | Geometric Lock | Scale Description | Status |
|------:|-------------|---------------------|--------:|---------------:|----------------|-------------------|--------|
| 0 | Void / Singularity | 0.09 Hz (base) | 1.00 | 0.090 | Point (0D) | Base frequency | K-verified |
| 1 | Quantum Foam | f = f0 x phi | 1.51E-63 | 0.146 | Tetrahedron | Quantum scale down | formula |
| 2 | Quark-Gluon | f = f0 x 2.88 | 1.86E-13 | 0.259 | Octahedron | Nuclear scale down | formula |
| 3 | Atomic Nucleus | nuclear strong (F pending) | 4.37E-31 | 0.68 | Cube | Atomic scale down | reference |
| 4 | Atomic Orbitals | EM balance (F pending) | 2.11E+10 | 1.10 | Star Tetrahedron | Orbital scaling up | reference |
| 5 | Molecular Bonds | covalent node (F pending) | 2.24E-13 | 1.78 | Pentagonal | Molecular scale down | reference |
| 6 | DNA / Helix | phi x 10^12 Hz | 1.78E-12 | 2.880 | Double Helix | Biological scaling | K-verified |
| 7 | Tissue / Organs | 12 x 1 Hz (12-node harmonic) | 0.388 | 4.656 | Dodecahedron | Organismic scaling | K-verified |
| 8 | Self-Awareness | 7 x 10^8 Hz | 1.077E-08 | 7.539 | Icosahedron | Consciousness scaling | K-verified |
| 9 | Community | 8 x 1 Hz (social resonance) | 1.525 | 12.200 | Torus | Social scaling | K-verified |
| 10 | Planetary | 7.83 Hz (Schumann) | 1.00 | 7.830 | Sphere | Empirical anchor | K-verified |
| 11 | Solar System | 3.168749E-08 Hz (one orbit per year at 1 AU) | 6.25E+08 | 19.805 | Hypercube | Orbital scaling up | K-verified |
| 12 | Galactic | spiral core (F pending) | 4.37E+19 | 31.94 | Flower of Life | Galactic scaling up | reference |
| 13 | Universal | source pulse (F pending) | 3.23E+19 | 51.67 | Metatron's Cube | Cosmic scaling up | reference |
| 14 | Metaversal | f = f13 x phi | N/A | 83.60 | Void Circle | Closure | formula |

**Status legend**

- **K-verified:** F is published here and F x K equals the Hz shown.
- **formula:** the Hz follows from the formula shown.
- **reference:** the Hz is a reference value; its natural frequency F has not been published yet, so it cannot be checked with F x K.

**How to read the columns**

- **Level / Octave Name:** the stage and the scale of system it describes.
- **Natural frequency F:** the rate at which the thing at that level repeats.
- **K_Scale:** the constant that turns F into the table's Hz. One constant per level.
- **Hz:** the level's anchor on the common scale. Compare an observed rhythm to it by multiplying your F by K.
- **Geometric Lock:** the structure used to represent a stable arrangement at that level.
- **Scale Description:** the direction and type of scaling at that level.

---

## Starter test 01: Count a meteor shower and find its rhythm

**Time:** one evening. **Equipment:** none. **Win:** a layered log that shows a pattern a flat count does not.

**Do it**

1. Pick a shower with a known peak (for example the Leonids, which peak around 17 to 18 November; check a current calendar for your sky and moon phase).
2. **Predict:** how many per hour will you see, and will the rate rise, hold or fall across your session?
3. Go outside for 60 to 90 minutes. Every 15 minutes, log the count, cloud cover, and the Moon.
4. Give the log to your agent with this prompt:

```
Read the 14-Level Scale Framework README. Here is my meteor count log
and my prediction. Follow the agent protocol: place each layer of this
observation on the levels (the grain, its light, the sky it crosses,
the stream it belongs to, and me counting), check the boundaries, and
return a Remeasure Report. Tell me what does not line up.
```

5. Read the FRICTION line. What was slow, unclear or missing in how you logged and organized the data?

**Suggested placement (adjust to your own reading)**

- The light of a meteor comes from atoms excited as the grain burns up -> Level 4 (Atomic Orbitals)
- The sky it crosses and the observing site -> Level 10 (Planetary)
- The comet stream the grains belong to -> Level 11 (Solar System)
- The observer counting and judging brightness -> Level 8 (Self-Awareness)

---

## Starter test 02: Try it with a number you already know

**Time:** ten minutes. **Equipment:** none. **Win:** you check the ruler against something you can verify yourself.

The Solar System is Level 11, with K = 6.25E+08. Turn any planet's orbital period into a frequency (1 divided by the seconds in its year) and multiply by K.

| Planet | Orbital period (days) | F (Hz) | F x K (Hz) |
|--------|----------------------:|-------:|-----------:|
| Mercury | 87.969 | 1.3157E-07 | 82.231 |
| Venus | 224.701 | 5.1509E-08 | 32.193 |
| Earth | 365.256 | 3.1688E-08 | 19.805 |
| Mars | 686.980 | 1.6848E-08 | 10.530 |
| Jupiter | 4,332.589 | 2.6714E-09 | 1.670 |

Earth's row is the Level 11 anchor. Now try your own:

1. Divide Earth's period by Venus's: 365.256 / 224.701 = 1.6255. That is almost exactly 13/8, a golden-ratio fraction. Eight Earth years is almost exactly thirteen Venus years.
2. Give your agent this prompt:

```
Read the 14-Level Scale Framework README. Take the orbital periods of
Earth and Venus, run the K check at Level 11 for both, and tell me where
the Venus-to-Earth ratio lands on the scale. Return a Remeasure Report
and tell me what does not line up.
```

3. Pick a number from your own field (a heartbeat, an orbital period, a clock rate), place it on a level, run the K check, and read the gap.

---

## Status and scope

This is a reference convention for organizing systems by scale. For any specific prediction in a specific field, the established models of that field remain the authority. The framework's job is to organize, measure and surface what does not line up.

## Related

- Federated Pipeline Agent Blueprint (engine-agnostic, schema-gated; the engine is the compiler, not the tollbooth)
- Compiler vs Tollbooth (Unreal 6 and Unity articles)

## License

Use forever
