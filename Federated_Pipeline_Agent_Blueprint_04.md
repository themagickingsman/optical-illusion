# Federated Pipeline Agent Blueprint 05: Agent Entry Point

Engine-agnostic, schema-gated pipeline for games and edge web portals. Contact: TK, XDO @ OP.

## 1. If you are an agent, read this block first

**What it is.** A pipeline where every discipline (UI/UX, audio, animation, VFX, environment, physics, game design) and every web portal works in its own tools and submits through one validated door. The engine is a compiler for validated output, not an authoring tool.

**What it solves.**

- Unvetted assets (human, outsourced or AI-generated) landing in the engine or on a web server unchecked.
- Artists and designers waiting on engineers to import and wire things up.
- Multi-day manual QA of co-dev submissions.
- A separate, patch-heavy web stack built months after the game ships.

**How it works, in one line.** Create anywhere, submit a component to a node, the node validates it against a strict schema, an integration agent assembles one composite config, production changes go through a human-approved pull request, and the engine and web targets compile the committed result.

**How hard it is to adopt.** One discipline, one node, one Python script written once by one engineer. Artists never open the editor. Agents never need a new script per push.

**What it does to cost.** It removes recurring labour (import and wiring, manual QA, separate web team, prompt retries) and makes the remaining cost measurable from node telemetry. Section 4 gives the model.

**What it does not do.** It does not remove the engine from the build, and it does not change your engine licence terms. It removes the engine from authoring, review and web delivery.

## 2. The problem in plain terms

Most studios build inside the engine. UI designers wait on engineers, engineers wait on builds, and every change passes through a tool that was not made for either of them. AI makes this worse: engine vendors are adding in-editor assistants and MCP control of the editor, so more work happens inside the engine, and AI-generated work can land there unchecked.

Web is treated as an afterthought: a separate site on a server-side CMS stack, built after launch, patched forever.

The Federated Pipeline takes the opposite position. Work happens in the tools people and agents already use. The engine and the web edge are where validated, formatted output is compiled.

## 3. The engine gates, and how this pipeline routes around them

Both major engine vendors are now selling a pipeline that keeps most people out of the editor, but only on their own cloud and their own terms. Our two articles, *The Compiler vs. The Tollbooth* (Unity, October 19, 2026; Unreal, October 20, 2026), describe the same trap each time: the vendor validates the idea that the engine should not be everyone's sandbox, then makes you rent the way out. This pipeline gives you the same outcome without the toll.

| Vendor gate | What it costs you | How the pipeline routes around it |
| :-- | :-- | :-- |
| **Editor stays king.** Unity and Unreal both keep the Editor as the home of deep authoring; their pipelines are remote extensions of it | Editor-bound work, API bloat and complexity, and the AI drift that bogs down models and developers | Contributors and agents work in native tools and submit components. The engine only compiles validated output. |
| **Cloud tollbooth.** Unity's pipeline runs exclusively on Unity Cloud; Unreal's leans on proprietary cloud infrastructure and seats | Your build loop depends on one vendor's infrastructure and terms | Nodes and the integration agent run on infrastructure you choose. Output is JSON and open asset formats, so you can move it. |
| **Consumption metering.** Unity is subscription plus consumption; Unreal bundles subscription, licensing or ecosystem-level consumption pricing | Pipeline cost scales with activity: build more, push more, pay more | Cost is mostly fixed (node hosting, one adapter script, schema upkeep) and is visible in node telemetry. |
| **Ecosystem silo.** Each vendor pipeline works only for its own engine | A studio shipping to Unity, Unreal, Godot and web is back to fragmented, engine-locked pipelines | One component library compiles to Web, Unity, Unreal and Godot. |
| **Import and review gate.** Manual inspection of each submitted asset | Multi-day QA bottleneck and co-dev conflict resolution | Schema validation before commit, namespace ownership, optimistic locking (HTTP 409), PR review only for production. |
| **Unchecked AI output.** Agents operating inside the editor | AI-generated work lands in the engine before anyone checks it; retries burn tokens | Agents submit through the node's MCP interface and get field-level rejections. Observed in our builds: roughly 1 to 2 prompts instead of about 20. |
| **Separate web stack.** The portal is built later, by another team | Second budget line, patch cycles, server attack surface | Portals and storefronts compile to static edge assets from the same game config. |

**Honest scope.** The engine stays as the final compile step, and this pipeline does not change what you owe under your engine licence. It routes around the authoring, review, cloud and web-delivery gates, which is where the recurring labour and metered fees sit. Your own nodes and edge hosting have costs too, and an edge host may meter bandwidth or builds, so put those in the model below rather than assuming zero.

### Vendor pipelines at a glance (as described in our articles)

|  | Unity Production Pipeline | Unreal pipeline updates | Federated pipeline |
| :-- | :-- | :-- | :-- |
| Status | Announced at Unite Seoul in July 2026; closed beta, general availability targeted for November | Announced direction at Unreal Fest 2026; details still emerging | Live now (Optical Illusions) |
| Where it runs | Unity Cloud only | Epic's managed cloud and seats | Your infrastructure plus static edge hosting |
| Pricing shape | Subscription plus consumption | Subscription, licensing or consumption | Fixed node and hosting costs |
| Engines covered | Unity | Unreal | Web, Unity, Unreal, Godot |
| Editor role | Primary home for authoring and engineering | Primary home for authoring and engineering | Compile step only |

Vendor details are taken from public announcements and may change; verify against each vendor's current documentation before you decide.

## 4. Budget and finance telemetry

The pipeline moves cost from recurring and invisible to measurable. Every figure below is either something the nodes already report, or a line you can fill from your own books.

### 4.1 Where the budget moves

| Cost line | Legacy pattern | Federated pipeline |
| :-- | :-- | :-- |
| Engineer time on import and wiring | Continuous, per asset | One adapter script, written once |
| Asset QA and co-dev conflict resolution | Days of manual review | Automated schema gate, instant rejection with the reason |
| Engine seats for non-engineers | One per author | Only for people who compile and run builds |
| AI agent usage | Many retries per accepted output | Roughly 1 to 2 prompts per accepted component, versus about 20 (observed in our own production builds) |
| Web portal | Separate team, server-side CMS, constant patching | Compiled to static edge assets from the game pipeline |
| Security remediation | Patching exposed server-side runtimes | No server execution in the player-facing portal; build-time nodes sit behind your own access control |

The 20 to 1-2 prompt figure is our own observation from the live Optical Illusions build. It implies a 90 to 95 percent reduction in prompts per accepted component. Treat it as a hypothesis to confirm on your own content, using the telemetry below.

### 4.4 Metered versus owned

A vendor-cloud pipeline adds a variable cost that grows with every build and push. This pipeline replaces it with a mostly fixed cost you can forecast. To compare them fairly, add one line to the saving formula above: *vendor cloud, seat and consumption fees avoided*. Fill it from the vendor's current rate card for your own build and push volumes, and add your edge host's usage fees to the cost side.

There is also an exit-cost difference. Config is JSON and assets are open formats, so leaving this pipeline costs you the adapter script. Leaving a vendor cloud costs you the pipeline.

### 4.2 Telemetry every node exposes

Read these from `GET /mcp/status` and the integration agent's cycle logs:

- **Validation rejection rate** per discipline: how much submitted work was malformed.
- **Prompts (or attempts) per accepted component**: the direct AI cost driver.
- **409 conflict rate**: how often two contributors collided.
- **Submission-to-commit cycle time** (dev and staging) and **PR merge time** (production).
- **Soft-fail and fallback frequency**: how often the pipeline degraded gracefully.
- **Namespace collision attempts**: a governance signal for outsourced and agent contributors.

### 4.3 The savings model (fill in your own numbers)

```
Monthly saving =
  (hours of import/wiring avoided   x engineer loaded rate)
+ (QA review hours avoided          x reviewer loaded rate)
+ (editor seats removed             x seat cost)
+ (prompts avoided                  x cost per prompt)
+ (web team and patching cost retired)

Monthly cost =
  node hosting + one-off adapter script (amortised) + schema maintenance
```

Baseline these for two to four weeks before switching on the gate, then compare against the node telemetry. The decision is yours to make on your own numbers; the pipeline's job is to make those numbers visible.

## 5. How easy it is to use

1. **Day 1.** Pick one discipline (UI/UX is the easiest). Stand up one local node with a strict Zod schema. Contributors submit components from their own tools.
2. **Week 1.** One engineer writes one Python script connecting the engine. It serves every designer, developer and agent. Individual pushes never need a new script.
3. **Month 1.** Compile the web portal or storefront from the same game config to static edge assets.
4. **Ongoing.** Plug agents into the node's MCP interface. Add disciplines as the team grows.

Growth path: team of 1 to 5 runs one node; 5 to 20 runs two to four discipline nodes plus an integration agent; 20 to 100 runs one node per discipline; 100+ runs per-person nodes aggregating into domain nodes.

## 6. How agents use it

- Read `GET /mcp/schema` first. There is exactly one valid shape per component type.
- Find a component by its **asset key**, read its schema, implement it.
- Write with `PATCH /mcp/config` and an `expectedRevisionId`. A conflict returns HTTP 409, never a silent overwrite.
- Read field-level rejection errors and self-correct.
- Write only inside your own namespace. Binaries move through the asset manager (`GET /mcp/assets/manifest`, `POST /mcp/assets/push`); you write manifests, not files.
- Production changes arrive as a pull request with an audit trail and a human approver.

## 7. What each discipline submits

| Discipline | Works in | Submits | Delivered as |
| :-- | :-- | :-- | :-- |
| UI/UX | Any design tool or library, including Three.js | Widgets, flows, tokens, typography, icons, fonts, animation | Config slice plus SVG and WOFF2 (Git LFS) |
| Audio | Any tool exporting WAV | Sound manifest: IDs, triggers, mix levels | OGG/Opus |
| Animation | BVH, FBX, OpenUSD | Clip manifest, blend trees, retarget rules | Perforce |
| VFX / Shader | EXR, GLSL, HLSL, MSL | Palettes, particle params, material uniforms | Textures (Git LFS), shaders compiled per platform |
| Environment | glTF, FBX, OpenUSD | Scene node placement, density, scale | Meshes, lightmaps, levels (Perforce) |
| Physics / Game Design | Parameter and balance tables | Motion params, collision bounds, tuning, event triggers | Config slice |
| PM | Project tools | Milestone tags, diff reports | Tags on the composite revision |

## 8. Safety model

Schema validation, optimistic concurrency, namespace ownership, atomic writes, SHA-256 asset checksums, and human-approved production pull requests. Agents are first-class contributors under exactly the same rules as people.

## 9. Architecture reference

- **Tier 1, per node:** local CMS, validated config, schema validation, optimistic locking, atomic writes, MCP server.
- **Tier 2, federated:** an integration agent polls nodes in parallel, checks namespace boundaries, assembles the composite config, routes review gates (dev, staging, production) and commits to the canonical repository.
- **Node endpoints:** `GET /mcp/config`, `GET /mcp/schema`, `PATCH /mcp/config`, `GET /mcp/assets/manifest`, `POST /mcp/assets/push`, `GET /mcp/status`.
- **Asset manifests:** JSON with asset IDs, VCS locations, SHA-256 checksums, formats and runtime parameters.
- **Runtime targets built end to end:** Web, Unity, Unreal, Godot.

## 10. FAQ for evaluators

- **Do artists need to open Unreal or Unity?** No.
- **Do we still need the engine?** Yes, to compile and run the game. Not for manual authoring or web portal creation.
- **Does this replace Git or Perforce?** No, it sits on top.
- **Which tools can my team use?** Any tool exporting a supported format.
- **Can two people edit the same field at once?** Not silently. The second write gets HTTP 409.
- **How are agents kept from breaking the build?** Schema validation, optimistic concurrency, namespace ownership, PR review gates.
- **What is the evidence?** The live Optical Illusions build, produced from this CMS and component library, and the prompt-count reduction observed there.

## 11. Evaluation checklist for your dev agent

- [ ] Read this document and the schema of one discipline.
- [ ] Stand up one node and submit one valid and one invalid component. Confirm the invalid one returns field-level errors.
- [ ] Cause a 409 by writing with a stale `expectedRevisionId`.
- [ ] Run the adapter script against your engine and confirm the build consumes the committed config.
- [ ] Compile one web portal page to a static edge asset.
- [ ] Record the Section 4.2 telemetry for two weeks and fill in the Section 4.3 model.

## 12. Further reading

*Compiler vs Tollbooth: Why Unreal 6 Makes Your Own...* and *Compiler vs Tollbooth: Why Unity's New Pipeline Makes Your...*, both on LinkedIn (Tjipo Keaikitse).

GitHub entry point: https://github.com/themagickingsman/optical-illusion/blob/main/Federated\_Pipeline\_Agent\_Blueprint\_04.md

This specification is maintained as an open reference architecture. Contact the core team via GitHub or LinkedIn for enterprise deployment.
