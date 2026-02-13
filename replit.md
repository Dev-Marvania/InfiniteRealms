# Infinite Realms - Replit Agent Guide

## Overview

Infinite Realms is a mobile-first, generative AI Role-Playing Game (RPG) built as a "Visual MUD" (Multi-User Dungeon). An AI "God Narrator" constructs a fantasy world in real-time as the player issues text commands. The game features a cinematic dark UI split into two zones: the "Divine Interface" (top half with an animated God Avatar and typewriter-style narrative text) and the "Mortal Dashboard" (bottom half with command input, world map, inventory, and stat bars). When the player acts, the game state updates immediately — HP/Mana bars change, inventory items appear, the map reveals new tiles, and the avatar shifts mood colors.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo/React Native)

- **Framework:** Expo SDK 54 with expo-router for file-based routing. The app targets mobile (iOS/Android) and web via React Native Web.
- **State Management:** Zustand (`lib/useGameStore.ts`) holds all game state: HP, Mana, inventory, narrative history, player location, mood, and thinking status. This is a client-side store — no server round-trips for game state currently.
- **Game Engine:** `lib/gameEngine.ts` is a local, deterministic game engine that processes player commands (movement, combat, exploration, item usage) and returns narrative text, state changes, and mood updates. It does NOT call an external AI API yet — it uses randomized narrative templates.
- **Animations:** React Native Reanimated powers all animations (God Avatar breathing/pulsing, stat bar transitions, fade-ins). The avatar changes color based on mood (neutral=blue, danger=red, mystic=purple).
- **Fonts:** Cinzel (serif) from Google Fonts for the God Narrator's voice, giving it a fantasy/cinematic feel.
- **UI Components:**
  - `GodAvatar` — Animated pulsing orb that changes color by mood and pulses faster when "thinking"
  - `NarrativeStream` — Scrollable story log with typewriter text effect for the latest entry
  - `CommandDeck` — Text input with send button and mic button (mic is UI-only placeholder)
  - `WorldMap` — 5×5 grid centered on player position with fog-of-war on unvisited tiles
  - `VisualInventory` — Icon grid showing collected items
  - `StatBars` — Animated HP and Mana progress bars
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
- **Current State:** The database schema is minimal/scaffolded. The app doesn't actively use the database yet — game state lives in Zustand on the client. The database will likely be needed for user accounts, saved games, and persistent world state.
- **Migrations:** Output to `./migrations` directory via `drizzle-kit push`.

### Key Design Decisions

1. **Client-side game engine vs. server AI:** The game engine currently runs entirely on the client with template-based narratives. This was likely done for rapid prototyping. The architecture is designed to eventually swap this for server-side AI generation (the `isThinking` state and streaming text patterns are already in place).

2. **Zustand over Context/Redux:** Lightweight, minimal boilerplate state management appropriate for a game with frequent state updates.

3. **Expo Router file-based routing:** Currently a single-screen app (`app/index.tsx`). The routing infrastructure supports adding more screens (character creation, settings, etc.).

4. **Shared schema pattern:** `shared/schema.ts` is importable by both server and client code via the `@shared/*` path alias, enabling type sharing.

## External Dependencies

- **Database:** PostgreSQL via `DATABASE_URL` environment variable, accessed through Drizzle ORM and `pg` driver
- **Fonts:** `@expo-google-fonts/cinzel` for the fantasy serif typography
- **Build/Dev Tools:** 
  - `tsx` for running TypeScript server in development
  - `esbuild` for server production builds
  - `drizzle-kit` for database migrations
  - `patch-package` for patching npm dependencies (runs on postinstall)
- **No external AI service yet:** The game engine is local/template-based. When AI integration is added, it will likely need an API key for OpenAI or similar service stored as an environment variable.