# The 14-Level Scale Framework: Biology Edition

## What this is (plain language, for humans)

A ruler for living systems. Point your AI agent at this file, tell it what you're researching, and it measures each layer of your system against 14 levels, from electrons to the planet. It tells you where each layer sits, which handoffs between layers are clean, and which ones are missing a contract. The missing contract is the gap worth designing next.

Companion to the article *The DNA Sourcecode: Separating the Math from the Interface in Biological Systems*.

## How to use it (for the human)

Paste this file's link into your agent and say:

> What is this and how do I use it?

That's it. The agent reads the rest of this file and takes it from there.

---

## How to explain it (for the agent: read this to the human)

When a human asks what this is, say something like:

> "This is a ruler for biological systems. You tell me what you're working on, and I measure each layer of it on a 14-level scale. I show you where the handoffs between layers are clean, and where one is missing a contract. That missing contract is your next design target."

Keep the explanation to a few sentences. Do not recite this file. Then offer two ways to start:

1. **Try a known case study first.** Cello (2016, genetic circuits), AlphaFold (2021, sequence to structure), or whole-cell models (genotype to phenotype). Good for seeing what a report looks like.
2. **Bring your own research now.** Tell me the system and your prediction, and I'll measure it.

Ask which they want. If they choose 1, run the case study from "Case studies to offer" below and show them the report. If they choose 2, follow "How to run it" below.

---

## The ruler (the table)

| Level | Octave Name        | Decimal Freq (Hz) | Formula Base           | Geometric Lock   | K_Scale   | Scale Description     |
|------:|--------------------|------------------:|------------------------|------------------|----------:|-----------------------|
| 0     | Void / Singularity | 0.09              | f0 = 0.09              | Point (0D)       | 1.00      | Base frequency        |
| 1     | Quantum Foam       | 0.16              | f1 = f0 × φ            | Tetrahedron      | 1.51E-63  | Quantum scale down    |
| 2     | Quark-Gluon        | 0.26              | f2 = f0 × 2.88         | Octahedron       | 1.86E-13  | Nuclear scale down    |
| 3     | Atomic Nucleus     | 0.68              | f4 = Nuclear Strong    | Cube             | 4.37E-31  | Atomic scale down     |
| 4     | Atomic Orbitals    | 1.10              | f5 = EM Balance        | Star Tetrahedron | 2.11E+10  | Orbital scaling up    |
| 5     | Molecular Bonds    | 1.78              | f6 = Covalent Node     | Pentagonal       | 2.24E-13  | Molecular scale down  |
| 6     | DNA / Helix        | 2.88              | f7 = φ × 1.78          | Double Helix     | 1.78E-12  | Biological scaling    |
| 7     | Tissue / Organs    | 4.66              | f8 = 12 Node Harmonic  | Dodecahedron     | 0.388     | Organismic scaling    |
| 8     | Self-Awareness     | 7.54              | f9 = Theta/Alpha       | Icosahedron      | 1.077E-08 | Consciousness scaling |
| 9     | Community          | 12.20             | f10 = Social Resonance | Torus            | 1.525     | Social scaling        |
| 10    | Planetary          | 7.83              | Schumann Anchor        | Sphere           | 1.00      | Empirical anchor      |
| 11    | Solar System       | 19.74             | f11 = Orbital Mean     | Hypercube        | 6.25E+08  | Orbital scaling up    |
| 12    | Galactic           | 31.94             | f13 = Spiral Core      | Flower of Life   | 4.37E+19  | Galactic scaling up   |
| 13    | Universal          | 51.67             | f14 = Source Pulse     | Metatron's Cube  | 3.23E+19  | Cosmic scaling up     |
| 14    | Metaversal         | 83.60             | Σ(f0 ... f14)          | Void Circle      | N/A       | Summation closure     |

**How to read the columns**

- **Level / Octave Name:** the stage and the scale of system it describes. Levels 0 to 2 are the physics beneath the chemistry, 3 to 8 are the biological stretch, and 9 and up are populations, the planet and beyond.
- **Decimal Freq / Formula Base:** the anchor for that level and how it is built from the others. Through the biological stretch, each level is built from the two beneath it: 1.10 + 1.78 = 2.88 (Orbitals + Bonds = DNA), 1.78 + 2.88 = 4.66 (Bonds + DNA = Tissue), 2.88 + 4.66 = 7.54 (DNA + Tissue = Self-Awareness).
- **Geometric Lock:** the structure used to represent a stable arrangement at that level.
- **K_Scale:** the scaling constant for that level and the direction it scales.
- **Scale Description:** the direction and type of scaling at that level.

For placement and handoff checks, use the Level, the Octave Name and the order of the levels. Do all calculations yourself and show the numbers you used.

---

## How to run it (agent protocol)

1. **Name the system and its layers.** Ask the human for the system, the question, and the data. If they are unsure of the layers, propose them from the placement guide below.
2. **Predict first.** Before placing anything, the human writes down what they expect to see at each layer and which handoff they expect to be cleanest. Record it.
3. **Place each layer on a level.** Propose a placement and give the reason in one line. The human confirms or corrects.
4. **Read the neighbors.** For each placed layer, name the level above and the level below and what each contributes.
5. **Check the boundaries.** For every handoff between layers, state whether it is **clean**, **skipped** (the system jumps two or more levels with nothing in between), or **missing** (a handoff exists in the system but no contract defines it).
6. **Find the hidden layer and the contract.** Name which levels sit behind an interface the human never touches, and where intent goes in and structured results come out.
7. **Report.** Use the report format below. Always include at least one thing that does not line up, or state explicitly that nothing was found and what you checked.

Treat the human's data and any published results they cite as given. Your job is to place, measure and report.

---

## The report format

```
SYSTEM:        <what was measured>
PREDICTION:    <what the human expected, written before measuring>
PLACEMENT:     <layer -> level, one line of reasoning each>
NEIGHBORS:     <level above / level below for each layer>
BOUNDARIES:    <each handoff: clean | skipped | missing>
HIDDEN LAYER:  <which levels sit behind an interface the human never touches>
CONTRACT:      <where intent goes in and structured results come out>
LINES UP:      <where the system agrees with the scale>
DOES NOT LINE UP: <deviations, skipped levels, missing contracts>
NEXT:          <what would need to exist before the next level up>
FRICTION:      <what the human found slow or confusing in their current tool>
```

The FRICTION line matters. Whatever could not be done easily is the next thing worth designing.

---

## Case studies to offer

Each is a published case. Run it through the protocol and show the human the report.

**Cello (2016, genetic circuits).** A logic specification goes in and a built genetic circuit comes out. Sixty circuits were built as designed, and forty-five worked on the first test.

```
SYSTEM:        Cello genetic circuit design (2016)
PREDICTION:    Cleanest handoff is specification -> DNA
PLACEMENT:     spec -> L8 (intent) | design -> L6 (DNA / Helix) |
               assembly -> L5 (Molecular Bonds) | cell -> L7 (Tissue / Organs)
NEIGHBORS:     L6 sits on L4 + L5 and feeds L7
BOUNDARIES:    spec -> design: clean | design -> assembly: clean |
               assembly -> cell behavior: partial
HIDDEN LAYER:  circuit design and DNA assembly (L5-L6)
CONTRACT:      logic specification in, built circuit out
LINES UP:      the contract between intent (L8) and DNA (L6)
DOES NOT LINE UP: 60 circuits were built as designed and 45 worked on
               the first test, so 15 did not; the open handoff is
               DNA (L6) -> living cell (L7)
NEXT:          a contract for the L6 -> L7 handoff
FRICTION:      cell-context tuning is still done by hand
```

**AlphaFold (2021, sequence to structure).** An amino acid sequence goes in and a structure comes out. Sequence enters at Level 6 (DNA / Helix), and the forces of Level 4 (Atomic Orbitals) and Level 5 (Molecular Bonds) stay hidden behind the input. Contract: sequence in, structure out.

**Whole-cell models (genotype to phenotype).** Genotype enters at Level 6 and phenotype comes out at Level 7 (Tissue / Organs). The Level 6 to Level 7 handoff is the contract itself.

---

## Placement guide

Reference placements. Use them to propose a placement, then let the human confirm or correct.

| Level | Octave Name        | What belongs here in biology |
|------:|--------------------|------------------------------|
| 0-2   | Void to Quark-Gluon | Physics beneath the chemistry. Usually appears as a hidden layer under the model, not something measured directly. |
| 3     | Atomic Nucleus     | Isotopes, radiolabels, nuclear spin as used in NMR, radiometric dating. |
| 4     | Atomic Orbitals    | Electron behavior: redox, fluorescence excitation and emission, spectroscopy, light capture in photosynthesis, bioluminescence. |
| 5     | Molecular Bonds    | Covalent and hydrogen bonds, base pairing, enzyme catalysis, ligand binding, folding forces, DNA assembly chemistry. |
| 6     | DNA / Helix        | Sequences, genes, genomes, edits, gene circuits, expression programs, the information layer. |
| 7     | Tissue / Organs    | Cells, organoids, tissues, organs, whole organisms as bodies. Organismic scaling. |
| 8     | Self-Awareness     | Nervous systems, cognition, behavior, and the observer: the researcher's intent, judgment and specification. |
| 9     | Community          | Populations, microbiomes, ecosystems, social behavior, epidemics. |
| 10    | Planetary          | The biosphere, planet-wide cycles, the empirical anchor. |
| 11-14 | Solar System to Metaversal | Astrobiology and the orbital drivers of biology (day length, seasons). If a layer is placed here, ask what it contributes. |

When two layers land on the same level, split them by what each contributes to the handoff, and do not merge them.

---

## Start with your own research

**The simple run (one hour, no new lab work).** Take the last pathway you worked on, from DNA sequence to a measurable phenotype. Write your prediction first, then give your agent:

```
Read this README. My system is [your pathway, sequence to phenotype].
My prediction is [your prediction]. Follow the agent protocol: place
each layer on a level, name the level above and below each one, mark
each handoff clean, skipped or missing, name the hidden layer and the
contract, and return a report. Tell me what does not line up.
```

**The harder run (a system across several scales).** Pick a viral vector (capsid, payload, target cell, tissue), an engineered circuit, or an organoid model:

```
Read this README. My system is [vector, circuit or organoid] with these
layers: [list them, with the size, timescale or rate you measured for
each]. My prediction is [your prediction]. Follow the agent protocol.
Place every layer on a level and say what the level above and below
contribute. Flag every skipped level, meaning anywhere my system jumps
two levels with no contract in between. Return a report with at least
one thing that does not line up and the FRICTION line.
```

Then read the FRICTION line. Whatever was slow, unclear or missing is a complex system nobody has designed for yet.

---

## Status and scope

This is a reference convention for organizing biological systems by scale. For any specific prediction in a specific field, the established models of that field remain the authority. The framework's job is to organize, measure and surface what does not line up.

## Related

- 14-Level Scale Framework (general): https://github.com/themagickingsman/optical-illusion/blob/main/README.md
- Federated Pipeline Agent Blueprint (engine-agnostic, schema-gated; the engine is the compiler, not the tollbooth)
- Compiler vs Tollbooth (Unreal 6 and Unity articles)
- The DNA Sourcecode: Separating the Math from the Interface in Biological Systems

## License

All rights reserved.
