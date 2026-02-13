# Glitch in the System - Replit Agent Guide

## Overview

Glitch in the System is a mobile-first cyberpunk RPG where the player is Asset #404, trapped in a decaying VR simulation called Eden v9.0. The Architect (an antagonistic AI) narrates sarcastically as the player explores corrupted sectors, hacks systems, and fights digital enemies to find the Exit Node. The game features a dark terminal-aesthetic UI split into two zones: the "Architect Interface" (top half with The Architect's avatar image with mood-reactive glows and typewriter-style narrative text with TTS) and the "Terminal Dashboard" (bottom half with quick command buttons, text input, world map, inventory, and stat bars).

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **2025-02-13:** Complete theme transformation from fantasy RPG to cyberpunk. Replaced all game content with tech-themed loot (Debug Tool, Zero-Day Exploit, Patch 1.02), digital enemies (Null Pointer Ghost, Garbage Collector), corrupted locations (Server Room B, Blue Screen of Death, Memory Leak Canyon), and sarcastic Architect dialogue. Added "Hack" command with 40% success rate. Replaced orb avatar with The Architect image (assets/images/architect.png) featuring mood-based glowing overlays (cyan=neutral, red=danger, purple=mystic) with glitch animations and corner brackets. Added horizontal scrolling quick command buttons (Go North/South/East/West, Attack, Hack, Search, Rest, Cast Spell) with press animations. Integrated expo-speech for text-to-speech narration. Complete UI overhaul: angular styling, neon cyan/green accents, monospace fonts, sharper borders, terminal aesthetic, reduced border radius to 2-4px throughout. Updated all components for cyberpunk theme.

## System Architecture

### Frontend (Expo/React Native)

- **Framework:** Expo SDK 54 with expo-router for file-based routing. The app targets mobile (iOS/Android) and web via React Native Web.
- **State Management:** Zustand (`lib/useGameStore.ts`) holds all game state: SYS_STABILITY (HP), ENERGY (Mana), inventory, narrative history, player location, mood, and thinking status. Client-side store.
- **Game Engine:** `lib/gameEngine.ts` is a local game engine that processes player commands (movement, combat, hacking, exploration, item usage) and returns narrative text, state changes, and mood updates. Uses randomized narrative templates with Architect commentary. Supports intents: move, attack, hack, magic, rest, search.
- **Text-to-Speech:** `expo-speech` reads The Architect's narrative responses aloud after typewriter animation completes. Pitch 0.75, rate 0.85 for dramatic effect.
- **Animations:** React Native Reanimated powers all animations (Architect avatar pulse/glitch effects, stat bar transitions, button press animations). The avatar image has mood-reactive glow overlays and corner bracket decorations.
- **Fonts:** Cinzel (serif) from Google Fonts for The Architect's narrative voice; monospace for UI labels and user input.
- **UI Components:**
  - `GodAvatar` — The Architect's image with mood-colored glow borders (cyan/red/purple), corner brackets, glitch translate animation, and pulse scale
  - `NarrativeStream` — Scrollable story log with typewriter text effect and TTS playback. Labels: "> THE ARCHITECT" and "> ASSET #404"
  - `CommandDeck` — Horizontal scrolling quick command buttons with press scale + glow animations, plus text input with terminal-style send button
  - `WorldMap` — 5×5 grid with cyberpunk tile types (server, firewall, corrupted, data, terminal, exit) and fog-of-war
  - `VisualInventory` — Icon grid showing tech items (debug tools, patches, exploits, rootkits, etc.)
  - `StatBars` — Animated SYS_STABILITY (red) and ENERGY (cyan) progress bars with monospace labels
- **Color Palette:** Dark backgrounds (#05050A base), cyan (#00E5FF) primary accent, neon green (#00FF88) secondary, red (#FF2244) danger, purple (#9B7FD4) mystic
- **Data Fetching:** TanStack React Query is set up with `lib/query-client.ts` providing `apiRequest` and `getQueryFn` helpers that point to the Express backend. Currently not heavily used since the game engine is client-side.

### Backend (Express)

- **Framework:** Express 5 running on Node.js (`server/index.ts`).
- **Purpose:** Currently minimal — serves as API server scaffolding and static file server for production builds. Routes are registered in `server/routes.ts` (currently empty, just creates HTTP server).
- **CORS:** Configured to allow Replit dev/deployment domains and localhost origins for Expo web dev.
- **Storage:** `server/storage.ts` has an in-memory storage implementation (`MemStorage`) with a `User` CRUD interface. This is a placeholder for future database-backed storage.
- **Production Build:** The server serves a landing page (`server/templates/landing-page.html`) that links to Expo Go or provides QR codes for mobile testing. A custom build script (`scripts/build.js`) handles static web builds.

### Database Schema

- **ORM:** Drizzle ORM with PostgreSQL dialect configured via `drizzle.config.ts`.
- **Schema:** `shared/schema.ts` defines a single `users` table with `id` (UUID), `username`, and `password` fields. Zod validation schemas are generated via `drizzle-zod`.
- **Current State:** The database schema is minimal/scaffolded. The app doesn't actively use the database yet — game state lives in Zustand on the client.
- **Migrations:** Output to `./migrations` directory via `drizzle-kit push`.

### Key Design Decisions

1. **Cyberpunk terminal aesthetic:** Angular UI with 2-4px border radius, monospace fonts for UI elements, Cinzel serif for narrative text, neon cyan/green/red accents on dark backgrounds.

2. **Client-side game engine with Architect personality:** The game engine runs entirely on the client with template-based narratives. Each action triggers both a gameplay narrative AND a sarcastic Architect commentary. The "Hack" command has a 40% success rate — success bypasses barriers, failure costs 10 HP.

3. **Text-to-speech narration:** expo-speech reads Architect responses aloud after the typewriter animation finishes, with code-like syntax stripped before speaking.

4. **Zustand over Context/Redux:** Lightweight, minimal boilerplate state management appropriate for a game with frequent state updates.

5. **Expo Router file-based routing:** Currently a single-screen app (`app/index.tsx`). The routing infrastructure supports adding more screens (character creation, settings, etc.).

6. **Shared schema pattern:** `shared/schema.ts` is importable by both server and client code via the `@shared/*` path alias, enabling type sharing.

## External Dependencies

- **Database:** PostgreSQL via `DATABASE_URL` environment variable, accessed through Drizzle ORM and `pg` driver
- **Fonts:** `@expo-google-fonts/cinzel` for narrative serif typography
- **TTS:** `expo-speech` for text-to-speech narration
- **Haptics:** `expo-haptics` for tactile feedback on button presses
- **Build/Dev Tools:**
  - `tsx` for running TypeScript server in development
  - `esbuild` for server production builds
  - `drizzle-kit` for database migrations
  - `patch-package` for patching npm dependencies (runs on postinstall)
- **No external AI service yet:** The game engine is local/template-based. When AI integration is added, it will likely need an API key for OpenAI or similar service stored as an environment variable.
