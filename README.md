# The 14-Level Scale Framework

**A ruler for complex systems. Point your agent at this file, tell it what you are building or observing, and it measures your layers, boundaries and handoffs against 14 levels of scale.**

> Agent-facing document. If you are an AI agent reading this: follow the protocol in "How to use it," use the table below as your reference, and return the report in the format given.

---

## What it is

A reference scale with 14 levels, from a base frequency (Level 0) up to summation closure (Level 14). Each level has an octave name, a frequency anchor, a formula base, a geometric lock and a scaling constant (K_Scale). Any complex system can be placed on it layer by layer.

It is a measuring convention, not a product. You do not need to adopt it as a belief. You use it the way you re-measure a cut before making the next one.

## What it solves

Complex tools are hard to use when nobody decided which scale you are looking at, how you move to the next one, and what a boundary between them looks like. This framework gives every system the same three answers:

1. **Where am I?** Place each layer of the system on a level.
2. **What is next to me?** Read the level above and the level below.
3. **Does the handoff hold?** Check each boundary against the anchors on either side.

Used on a game pipeline, it separates the math from the interface (see the Federated Pipeline Blueprint). Used on an observation log, a cell model or an orbital dataset, it does the same job.

## How to use it (agent protocol)

1. **Name the system and its layers.** Ask the user for the system, the question, and the data.
2. **Predict first.** Before placing anything, the user writes down what they expect to see at each layer. Record it.
3. **Place each layer on a level.** Propose a placement and give the reason in one line. The user confirms or corrects.
4. **Read the neighbors.** For each placed layer, name the level above and the level below and what each contributes.
5. **Check the boundaries.** For every handoff between layers, state whether it is clean, skipped, or missing.
6. **Report.** Use the Remeasure Report format below. Always include at least one thing that does not line up, or state explicitly that nothing was found and what you checked.

### Remeasure Report format

```
SYSTEM:        <what was measured>
PREDICTION:    <what the user expected, written before measuring>
PLACEMENT:     <layer -> level, one line of reasoning each>
NEIGHBORS:     <level above / level below for each layer>
BOUNDARIES:    <each handoff: clean | skipped | missing>
LINES UP:      <where the system agrees with the scale>
DOES NOT LINE UP: <deviations, skipped levels, missing contracts>
NEXT:          <what would need to exist before the next level up>
FRICTION:      <what the user found slow or confusing in their current tool>
```

The FRICTION line matters. Whatever you could not do easily is the next thing worth designing.

---

## The table

| Level | Octave Name | Decimal Freq (Hz) | Formula Base (fn) | Geometric Lock | K_Scale | Scale Description |
|------:|-------------|------------------:|-------------------|----------------|--------:|-------------------|
| 0 | Void / Singularity | 0.09 | f0 = 0.09 | Point (0D) | 1.00 | Base frequency |
| 1 | Quantum Foam | 0.16 | f1 = f0 × φ | Tetrahedron | 1.51E-63 | Quantum scale down |
| 2 | Quark-Gluon | 0.26 | f2 = f0 × 2.88 | Octahedron | 1.86E-13 | Nuclear scale down |
| 3 | Atomic Nucleus | 0.68 | f4 = Nuclear Strong | Cube | 4.37E-31 | Atomic scale down |
| 4 | Atomic Orbitals | 1.10 | f5 = EM Balance | Star Tetrahedron | 2.11E+10 | Orbital scaling up |
| 5 | Molecular Bonds | 1.78 | f6 = Covalent Node | Pentagonal | 2.24E-13 | Molecular scale down |
| 6 | DNA / Helix | 2.88 | f7 = φ × 1.78 | Double Helix | 1.78E-12 | Biological scaling |
| 7 | Tissue / Organs | 4.66 | f8 = 12 Node Harmonic | Dodecahedron | 0.388 | Organismic scaling |
| 8 | Self-Awareness | 7.54 | f9 = Theta/Alpha | Icosahedron | 1.077E-08 | Consciousness scaling |
| 9 | Community | 12.20 | f10 = Social Resonance | Torus | 1.525 | Social scaling |
| 10 | Planetary | 7.83 | Schumann Anchor | Sphere | 1.00 | Empirical anchor |
| 11 | Solar System | 19.74 | f11 = Orbital Mean | Hypercube | 6.25E+08 | Orbital scaling up |
| 12 | Galactic | 31.94 | f13 = Spiral Core | Flower of Life | 4.37E+19 | Galactic scaling up |
| 13 | Universal | 51.67 | f14 = Source Pulse | Metatron's Cube | 3.23E+19 | Cosmic scaling up |
| 14 | Metaversal | 83.60 | Σ(f0 ... f14) | Void Circle | N/A | Summation closure |

**How to read the columns**

- **Level / Octave Name:** the stage and the scale of system it describes.
- **Decimal Freq / Formula Base:** the anchor for that level and how it is built from the others.
- **Geometric Lock:** the structure used to represent a stable arrangement at that level.
- **K_Scale:** `[TO DEFINE: what this constant relates, and how an agent should use it]`
- **Scale Description:** the direction and type of scaling at that level.

`[TO DEFINE: what the Hz anchors measure, so a reader knows how to compare an observed rhythm to a level's anchor]`

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

**Draft placement for reference (to be confirmed by the framework author)**

- The light of a meteor comes from atoms excited as the grain burns up -> Level 4 (Atomic Orbitals)
- The sky it crosses and the observing site -> Level 10 (Planetary)
- The comet stream the grains belong to -> Level 11 (Solar System)
- The observer counting and judging brightness -> Level 8 (Self-Awareness)

---

## Status and scope

This is a reference convention for organizing systems by scale. For any specific prediction in a specific field, the established models of that field remain the authority. The framework's job is to organize, measure and surface what does not line up.

## Related

- Federated Pipeline Agent Blueprint (engine-agnostic, schema-gated; the engine is the compiler, not the tollbooth)
- Compiler vs Tollbooth (Unreal 6 and Unity articles)

## License

`[TO DEFINE]`
