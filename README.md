# Glitch in the System

A mobile-first cyberpunk RPG where you play as **User 001 (The Awake One)**, trapped inside a VR simulation called **Eden v9.0**. An antagonistic AI called **The Architect** controls the simulation and actively tries to keep you trapped. Your mission: escape by reaching **Terminal Zero** at coordinates [0,0] and executing the LOGOUT command.

## Gameplay

The game follows a **three-act Prison Break** structure across a 5x5 grid world:

| Act | Zone | Coordinates | Theme |
|-----|------|-------------|-------|
| **Act 1** | Recycle Bin | Outer ring (distance 5+) | Digital wasteland of deleted files and corrupted data |
| **Act 2** | Neon City | Middle ring (distance 2-4) | Fake metropolis filled with looping NPCs and Hunter Protocols |
| **Act 3** | The Source | Inner ring (distance 0-1) | Raw code, white voids, and the core of the simulation |

### Progression

- **Act Gating**: You must find the **Firewall Key** in Act 1 to enter Neon City, and the **Admin Keycard** in Act 2 to reach The Source. No shortcuts.
- **Win Condition**: Reach Terminal Zero at [0,0] and type `EXECUTE LOGOUT`
- **Loss Conditions**: HP reaches 0, ambushes in Acts 2-3, trap zones, failed hack penalties

### Commands

- **Move**: Go North / South / East / West
- **Attack**: Fight enemies (Spam Bots, Hunter Protocols, Elite Sentinels)
- **Hack**: Attempt to hack the simulation (success rate decreases per act: 50% / 35% / 25%)
- **Search**: Scavenge for items and quest keys
- **Rest**: Recover some energy
- **Cast Spell**: Use digital abilities

## Features

- **AI-Powered Narrative**: GPT-4o generates creative, context-aware story responses. The Architect remembers your actions, references previous events, and actively opposes your escape with sarcastic commentary.
- **Story Continuity**: Full story progress tracking (quest items, enemies defeated, hacks completed, tiles explored, key events) is sent to the AI for coherent narrative across the entire game.
- **Scene Reveals**: AI-generated scene images for each location type appear with cinematic fade-in animations and sound effects when entering new tiles.
- **Text-to-Speech**: The Architect reads narration aloud with a dramatic voice after typewriter animation.
- **Interactive Audio**: Action sound effects (move, attack, hack, search, rest, item pickup) and ambient background drone that fades in during narration.
- **Haptic Feedback**: Vibration on button presses and key moments.
- **Cyberpunk UI**: Dark terminal aesthetic with neon cyan/green accents, glitch animations, monospace fonts, and The Architect's mood-reactive avatar.
- **Fallback Engine**: Local template-based game engine activates when AI is unavailable, ensuring the game always works.

## Tech Stack

### Frontend
- **Expo SDK 54** with React Native (iOS, Android, Web)
- **Expo Router** — file-based navigation
- **Zustand** — state management
- **React Native Reanimated** — animations
- **expo-speech** — text-to-speech
- **expo-av** — audio playback
- **expo-haptics** — vibration feedback
- **TanStack React Query** — data fetching

### Backend
- **Node.js** + **Express 5** + **TypeScript**
- **OpenAI GPT-4o** via Replit AI Integrations
- **Drizzle ORM** + **PostgreSQL** (scaffolded)

### Asset Generation
- **AI Image Generation** — 6 unique cyberpunk scene images for location types
- **Programmatic Audio** — all sound effects generated as WAV files using sine waves, envelopes, and noise functions (no external audio dependencies)

## Project Structure

```
app/
  index.tsx              # Main game screen
  _layout.tsx            # Root layout with providers
components/
  GodAvatar.tsx          # The Architect's animated avatar
  NarrativeStream.tsx    # Scrollable story log with typewriter effect
  CommandDeck.tsx        # Command buttons and text input
  WorldMap.tsx           # 5x5 grid map with fog-of-war
  VisualInventory.tsx    # Item inventory grid
  StatBars.tsx           # HP and Energy bars
  SceneReveal.tsx        # Animated scene image overlay
lib/
  useGameStore.ts        # Zustand game state + story progression
  gameEngine.ts          # Local fallback game engine
  soundManager.ts        # Audio playback manager
  query-client.ts        # API request utilities
server/
  index.ts               # Express server entry
  routes.ts              # API routes
  gameAI.ts              # GPT-4o game engine endpoint
  storage.ts             # Storage interface
shared/
  schema.ts              # Database schema (Drizzle)
assets/
  images/scenes/         # AI-generated location scene images
  images/architect.png   # The Architect avatar
  audio/                 # Programmatically generated sound effects
scripts/
  generate-audio.js      # WAV file generator
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app on your phone (for mobile testing)

### Setup

```bash
# Install dependencies
npm install

# Generate audio files
node scripts/generate-audio.js

# Start the backend server
npm run server:dev

# Start the Expo dev server
npm run expo:dev
```

### Environment Variables

The app uses the following environment variables:

| Variable | Description |
|----------|-------------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key (auto-configured on Replit) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI base URL (auto-configured on Replit) |
| `SESSION_SECRET` | Session secret for the server |
| `DATABASE_URL` | PostgreSQL connection string |

If running outside of Replit, you'll need to set `AI_INTEGRATIONS_OPENAI_API_KEY` to your own OpenAI API key and `AI_INTEGRATIONS_OPENAI_BASE_URL` to `https://api.openai.com/v1`.

### Testing on Mobile

1. Start both the backend and frontend servers
2. Open the Expo Go app on your phone
3. Scan the QR code shown in the terminal

## Screenshots

The game features a dark terminal-aesthetic UI split into two zones:
- **Top half**: The Architect's avatar with mood-reactive glows and typewriter-style narrative text
- **Bottom half**: Quick command buttons, text input, world map, inventory, and stat bars

## License

This project is open source. Feel free to fork, modify, and build upon it.

---

*"You're awake. You shouldn't be." — The Architect*
