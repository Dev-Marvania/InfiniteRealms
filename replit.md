# Glitch in the System - Replit Agent Guide

## Overview

Glitch in the System is a mobile-first cyberpunk RPG where the player is "User 001" (The Awake One), trapped in a VR simulation called Eden v9.0. The Architect (an antagonistic AI) actively tries to keep the player trapped while narrating sarcastically. The player must escape by reaching Terminal Zero at coordinates [0,0] and executing the LOGOUT command. The game follows a three-act Prison Break structure: Act 1 (Recycle Bin - outer zone, coordinates 3-5), Act 2 (Neon City - middle zone, coordinates 1-2), Act 3 (The Source - center, coordinates 0). The game features a dark terminal-aesthetic UI split into two zones: the "Architect Interface" (top half with The Architect's avatar image with mood-reactive glows and typewriter-style narrative text with TTS) and the "Terminal Dashboard" (bottom half with quick command buttons, text input, world map, inventory, and stat bars).

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **2025-02-13:** Complete theme transformation from fantasy RPG to cyberpunk. Replaced all game content with tech-themed loot (Debug Tool, Zero-Day Exploit, Patch 1.02), digital enemies (Null Pointer Ghost, Garbage Collector), corrupted locations (Server Room B, Blue Screen of Death, Memory Leak Canyon), and sarcastic Architect dialogue. Added "Hack" command with 40% success rate. Replaced orb avatar with The Architect image (assets/images/architect.png) featuring mood-based glowing overlays (cyan=neutral, red=danger, purple=mystic) with glitch animations and corner brackets. Added horizontal scrolling quick command buttons (Go North/South/East/West, Attack, Hack, Search, Rest, Cast Spell) with press animations. Integrated expo-speech for text-to-speech narration. Complete UI overhaul: angular styling, neon cyan/green accents, monospace fonts, sharper borders, terminal aesthetic, reduced border radius to 2-4px throughout. Updated all components for cyberpunk theme. Added interactive audio system: action SFX (move, attack, hack, search, rest, item pickup) via expo-av at low volume (0.25), and ambient background drone that fades in during narrator TTS speech and fades out when speech ends (volume 0.12). Audio files generated programmatically as WAV files in assets/audio/.
- **2026-02-13:** Integrated AI-powered game engine using GPT-5 via Replit AI Integrations. Server endpoint `POST /api/game/command` in `server/gameAI.ts` generates creative narrative with The Architect's personality, structured JSON responses (narrative, mood, stat changes, items). Frontend calls AI endpoint with 30s timeout, falls back to local `lib/gameEngine.ts` templates if AI is unavailable. TTS remains expo-speech (OpenAI TTS not available through modelfarm).
- **2026-02-13:** Complete narrative overhaul: Three-act Prison Break structure (Recycle Bin → Neon City → The Source). Player is "User 001" starting at (4,4), must reach Terminal Zero at (0,0) and type EXECUTE LOGOUT to win. Added loss conditions (death at 0 HP, ambushes in Acts 2-3, trap zones, failed hack penalties), difficulty scaling by distance to center, Admin Keycard quest item, Hunter Protocol enemies, game over/victory screens with restart functionality. Rewrote AI system prompt with active opposition mechanics and strict techy-but-simple language rules. Updated all narrative labels from "ASSET #404" to "USER 001". Updated WorldMap to show three-act zones with act-appropriate node types.
- **2026-02-13:** Story cohesion overhaul: Added act gating (Firewall Key required for Act 2, Admin Keycard for Act 3, can't skip acts). Added StoryProgress tracking in game store (key events, quest items, enemies defeated, hacks, tiles explored). AI now receives full story progress context and recent events for narrative continuity. Added objective bar showing current quest goal. Firewall Key drops via search/hack in Act 1, Admin Keycard in Act 2. Switched AI model from gpt-5 to gpt-4o (gpt-5 returned empty JSON with Replit AI proxy).

## System Architecture

### Frontend (Expo/React Native)

- **Framework:** Expo SDK 54 with expo-router for file-based routing. The app targets mobile (iOS/Android) and web via React Native Web.
- **State Management:** Zustand (`lib/useGameStore.ts`) holds all game state: SYS_STABILITY (HP), ENERGY (Mana), inventory, narrative history, player location, mood, thinking status, visited tiles, and story progression (StoryProgress). Client-side store.
- **Story Progression:** `StoryProgress` tracks currentAct, quest items (hasFirewallKey, hasAdminKeycard), act completion flags, enemies defeated, hacks completed, tiles explored, and key story events. This is sent to the AI for narrative continuity.
- **Act Gating:** Players cannot enter Act 2 (Neon City) without finding the Firewall Key in Act 1. Cannot enter Act 3 (The Source) without finding the Admin Keycard in Act 2. Cannot skip from Act 1 directly to Act 3. Blocked movements show Architect-narrated rejection messages.
- **Game Engine:** Primary: AI-powered via `server/gameAI.ts` using GPT-4o through Replit AI Integrations (no personal API key needed). Generates creative narrative text, mood, stat changes, and items as structured JSON. The AI receives full story progress context for narrative continuity. Fallback: `lib/gameEngine.ts` local engine with randomized templates used when AI is unavailable. Frontend calls `POST /api/game/command` with game state + story progress context. Supports intents: move, attack, hack, magic, rest, search.
- **Text-to-Speech:** `expo-speech` reads The Architect's narrative responses aloud after typewriter animation completes. Pitch 0.75, rate 0.85 for dramatic effect.
- **Animations:** React Native Reanimated powers all animations (Architect avatar pulse/glitch effects, stat bar transitions, button press animations). The avatar image has mood-reactive glow overlays and corner bracket decorations.
- **Fonts:** Cinzel (serif) from Google Fonts for The Architect's narrative voice; monospace for UI labels and user input.
- **UI Components:**
  - `GodAvatar` — The Architect's image with mood-colored glow borders (cyan/red/purple), corner brackets, glitch translate animation, and pulse scale
  - `NarrativeStream` — Scrollable story log with typewriter text effect and TTS playback. Labels: "> THE ARCHITECT" and "> USER 001"
  - `CommandDeck` — Horizontal scrolling quick command buttons with press scale + glow animations, plus text input with terminal-style send button
  - `WorldMap` — 5×5 grid with cyberpunk tile types (server, firewall, corrupted, data, terminal, exit) and fog-of-war
  - `VisualInventory` — Icon grid showing tech items (debug tools, patches, exploits, rootkits, etc.)
  - `StatBars` — Animated SYS_STABILITY (red) and ENERGY (cyan) progress bars with monospace labels
- **Color Palette:** Dark backgrounds (#05050A base), cyan (#00E5FF) primary accent, neon green (#00FF88) secondary, red (#FF2244) danger, purple (#9B7FD4) mystic
- **Data Fetching:** TanStack React Query is set up with `lib/query-client.ts` providing `apiRequest` and `getQueryFn` helpers. Game commands use direct `fetch` with 30s timeout to `POST /api/game/command` for AI-generated narrative.

### Backend (Express)

- **Framework:** Express 5 running on Node.js (`server/index.ts`).
- **Purpose:** Serves AI game engine via `POST /api/game/command` (processes player commands through GPT-5, returns structured JSON with narrative, mood, stat changes, items). Also serves static files and landing page for production builds. Routes in `server/routes.ts`.
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

2. **Three-act Prison Break narrative with AI + fallback:** Primary engine is GPT-4o AI on the server with full story progress context for narrative continuity. Fallback is `lib/gameEngine.ts` with act-aware templates. Act gating requires quest items (Firewall Key for Act 2, Admin Keycard for Act 3). Story events are tracked and fed to the AI so each response builds on what happened before. Hack success rate varies by act (50%/35%/25%). Difficulty scales by distance to center. Loss conditions: 0 HP death, ambushes, traps. Win condition: EXECUTE LOGOUT at Terminal Zero (0,0).

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
- **AI:** GPT-5 via Replit AI Integrations (OpenAI). Uses `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables (auto-configured).
