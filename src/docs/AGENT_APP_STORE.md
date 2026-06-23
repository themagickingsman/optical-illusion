# Universal Game Component System: Product Strategy & Architecture

## 1. Product Vision
We are building the **first universal sharing platform for game development**. It is a system where "regular people"—gamers, creators, visionaries, and "Directors"—can find highly complex game components, click a button, and instantly plug them into any game engine or platform they are using.

The complexity of the code, the API, and the autonomous AI integration is entirely hidden. To the user, it works like magic: **Find a feature you want, copy the "Plug," and drop it into your game or hand it to your AI agent.** 

This completely shifts the paradigm away from a developer-focused API documentation site, and turns it into a consumer-grade App Store for Game Blocks.

## 2. Nomenclature & Language Strategy
To reflect this vision, the platform strictly avoids engineering jargon. The following nomenclature is used across the UI:

| Old Developer Jargon | Official Platform Language | Definition / Why |
| :--- | :--- | :--- |
| **API Endpoint** | **Asset Key** | The actual "key" you grab to inject a component. |
| **Global API Endpoint** | **Master Asset Key** | Communicates that this single key contains all the pieces. |
| **The Architecture / Fetching Concept** | **Universal Plug** | The underlying technology that makes everything plug-and-play. |
| **Modular Component** | **Game Block** (or *Smart Feature*) | "Blocks" are universally understood as pieces you build with. |
| **Copy API** | **Get Asset Key** | Explains exactly what the user is getting: a key that just works. |
| **Headless Logic** | **Core Rules** (or *Game Rules*) | Explains what the logic actually dictates in the game. |
| **Asset** | **3D Model / Visuals** | Everyday terminology. |

## 3. Componentization (The Store is a Component)
The platform itself is built as a completely separate, standalone feature that can be instantiated anywhere. It is packaged as a modular React component (`<AgentAppStore />`). 

This means users or AI agents can "Get" the store itself and embed it into entirely different projects to create their own custom marketplaces.

## 3. Main Navigation
To perfectly mimic the Mac App Store, the library features a dedicated left sidebar navigation system. The sidebar has a very light grey background, distinct from the pure white main content area.

**Sidebar Navigation Items:**
- **Top:** A prominent rounded Search bar.
- **Main Links:** Discover, Arcade, Create, Work, Play, Develop, Categories, Updates.
  - *Active state:* A subtle, light blue-grey rounded rectangle.
- **Bottom:** The User's Profile icon and name.

## 4. Design Aesthetic & UI Layout
The entire product adheres to a strictly **Light Mode** aesthetic, matching the exact spacing, typography (SF Pro), and structure of the macOS App Store.

### Homepage Layout (Discover):
1. **Featured Article Cards (Top Row):**
   - A horizontally scrolling row of large, beautiful featured cards.
   - **Card Structure:** 
     - Top: Large rounded-rectangle hero image.
     - Below Image: Tiny all-caps kicker (e.g., "LET'S PLAY" or "COMPONENT SPOTLIGHT").
     - Bold Title and a grey, regular-weight subtitle.
2. **Category Lists (2-Column Grid):**
   - Headings like "Best New Modules and Updates" with a right-aligned "See All" link.
   - Content is arranged in a 2-column grid.
   - **List Item Design:** 
     - Left: Small rounded-square icon (`media.thumbnail`).
     - Middle: Title (bold) and Subtitle (grey) stacked vertically.
     - Right: A distinct, pill-shaped light-blue "Get" button (or price) with a tiny "In-App Purchases" disclaimer below it.

### Interior Page (Editorial Layout):
When clicking on a featured item or component, it uses the Mac App Store "Editorial/Story" split layout:
- **Left Column (Visuals & Action):**
  - A massive, full-bleed hero image that fills the entire left half of the window.
  - Top Left: Tiny all-caps kicker and Massive Bold Title overlaid on the image.
  - Bottom: A dark, translucent glassmorphism floating card containing the App Icon, Title, Subtitle, and the "Get" button (or cloud download icon).
- **Right Column (Documentation & Details):**
  - A pure white, vertically scrolling area.
  - Contains rich text: Bold introductory paragraphs, section headers, standard text, and embedded screenshots/videos.
  - Top Right: A standard Apple "Share" icon.

## 5. The "Get Asset Key" Interaction
The core transaction of the Universal Game Component System is getting the Asset Key.

When a user or AI agent clicks "Get Asset Key", the UI briefly transitions the button state to "Copied!" and places a pre-formatted Asset Key string into the system clipboard. 

**Example output copied to clipboard:**
```javascript
// This Asset Key injects the Combat Module Game Block into your environment
const gameBlock = await fetch('http://localhost:3009/api/engine/c1').then(res => res.json());
```
This frictionless interaction allows creators to "download" capabilities simply by dropping this key into their AI tools or game engines.

## 6. Category Architecture
The store utilizes a strict, static list of classic App Store categories to maintain familiarity. 

### The Master Category List:
`Business`, `Developer Tools`, `Education`, `Entertainment`, `Finance`, `Games`, `Graphics & Design`, `Health & Fitness`, `Lifestyle`, `Medical`, `Music`, `Navigation`, `News`, `Photo & Video`, `Productivity`, `Reference`, `Shopping`, `Social Networking`, `Sports`, `Travel`, `Utilities`, `Weather`.

### Dynamic UI Rendering:
While the backend architecture defines the full master list of categories above, the UI is smart enough to **only render rows for categories that currently contain content**. As you create and tag new content, new category rows will automatically appear in the UI. Empty categories remain entirely hidden to prevent dead space.

## 7. Component Typology
Within those categories, items are structurally defined by their `type` in the database:
- **Engines:** Complete frameworks (e.g., a full racing game wrapper).
- **Modules:** Plug-and-play features (e.g., a hit-reaction combat module).
- **Logic:** Headless algorithms or state machines (e.g., A* pathfinding solvers).
- **Assets:** Pure media or UI components (e.g., 3D hovercar models, glass box primitives).

## 8. Global Engineering Constraints (The Architecture Rules)
When AI agents or human developers build new views or components for the system, they MUST adhere to the following strict architectural constraints to maintain the integrity of the PS5-style OS:

1. **Gamepad-First UI Wiring:** Every single interactive list, grid, horizontal carousel, or button array MUST be manually wired to the `useGamepadNavigation` hook. Do not assume default React accessibility covers this; the custom polling system must be utilized for native controller support.
2. **SPA Routing over Next.js Pages:** The main application (`WebsiteBuildCMS`) is a persistent Single Page Application mimicking a console dashboard. Do NOT push users to new Next.js routes (e.g., `/engine/[id]`) for interior pages. Instead, use URL Query State (`?engine=xxx`) to instantly swap internal views while preserving the persistent top-level navigation and PS5 header.
3. **GPU Resource Management:** Heavy WebGL components (such as `NexusMetaballs`) must be wrapped in conditional renderers that listen to the URL Query State. If a heavy, opaque UI layer covers the screen, the WebGL components MUST be fully unmounted from the DOM to free up GPU resources. Hiding them via CSS `opacity` or `z-index` is unacceptable.
4. **No LocalStorage:** The architecture strictly forbids the use of `localStorage`. All data persistence must rely on static JSON databases or dedicated backend databases.
