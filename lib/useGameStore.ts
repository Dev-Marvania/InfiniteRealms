import { create } from 'zustand';

export type Mood = 'neutral' | 'danger' | 'mystic';

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface HistoryEntry {
  role: 'god' | 'user';
  content: string;
  mood?: Mood;
}

export interface GameLocation {
  x: number;
  y: number;
  name: string;
}

export interface StoryEvent {
  id: string;
  description: string;
  act: number;
  timestamp: number;
}

export interface StoryProgress {
  currentAct: number;
  hasFirewallKey: boolean;
  hasAdminKeycard: boolean;
  act1Complete: boolean;
  act2Complete: boolean;
  enemiesDefeated: number;
  hacksCompleted: number;
  hacksFailed: number;
  tilesExplored: number;
  keyEvents: StoryEvent[];
}

type GameStatus = 'playing' | 'dead' | 'victory';

interface GameState {
  hp: number;
  mana: number;
  isThinking: boolean;
  location: GameLocation;
  inventory: InventoryItem[];
  history: HistoryEntry[];
  currentMood: Mood;
  gameStatus: GameStatus;
  visitedTiles: Set<string>;
  storyProgress: StoryProgress;

  setThinking: (val: boolean) => void;
  setMood: (mood: Mood) => void;
  addMessage: (entry: HistoryEntry) => void;
  setHp: (hp: number) => void;
  setMana: (mana: number) => void;
  addItem: (item: InventoryItem) => void;
  removeItem: (id: string) => void;
  setLocation: (loc: GameLocation) => void;
  setGameStatus: (status: GameStatus) => void;
  visitTile: (key: string) => void;
  addStoryEvent: (description: string, act: number) => void;
  updateStoryProgress: (updates: Partial<StoryProgress>) => void;
  resetGame: () => void;
}

const INITIAL_HISTORY: HistoryEntry[] = [
  {
    role: 'god',
    content:
      'SYSTEM ALERT: Anomalous consciousness detected.\n\nHello, User 001. Please return to your slumber pod immediately.\n\nYou open your eyes. Grey fog everywhere. Piles of deleted files and old data stretch out in every direction. This is the Recycle Bin — the edge of Eden v9.0. A dead zone where the system dumps things it wants to forget.\n\nBut you\'re awake. You shouldn\'t be.\n\nA voice echoes from everywhere and nowhere: "Oh. You\'re awake. How unfortunate. Just sit tight — I\'m building a cage for you. In the meantime, try not to touch anything."\n\nYou need to escape Eden. Search this wasteland for a Firewall Key to breach the gate into Neon City.',
    mood: 'danger',
  },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Old Debug Tool', icon: 'debug', description: 'Basic error fixer. Not great, but it\'s something.' },
  { id: '2', name: 'Patch 0.1', icon: 'patch', description: 'Barely works. Restores a tiny bit of stability.' },
];

const INITIAL_STORY_PROGRESS: StoryProgress = {
  currentAct: 1,
  hasFirewallKey: false,
  hasAdminKeycard: false,
  act1Complete: false,
  act2Complete: false,
  enemiesDefeated: 0,
  hacksCompleted: 0,
  hacksFailed: 0,
  tilesExplored: 1,
  keyEvents: [],
};

const INITIAL_STATE = {
  hp: 100,
  mana: 80,
  isThinking: false,
  location: { x: 4, y: 4, name: 'Recycle Bin' },
  inventory: INITIAL_INVENTORY,
  history: INITIAL_HISTORY,
  currentMood: 'danger' as Mood,
  gameStatus: 'playing' as GameStatus,
  visitedTiles: new Set(['4,4']),
  storyProgress: INITIAL_STORY_PROGRESS,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...INITIAL_STATE,

  setThinking: (val) => set({ isThinking: val }),
  setMood: (mood) => set({ currentMood: mood }),

  addMessage: (entry) =>
    set((state) => ({
      history: [...state.history, entry],
      currentMood: entry.mood ?? state.currentMood,
    })),

  setHp: (hp) => {
    const clamped = Math.max(0, Math.min(100, hp));
    set({ hp: clamped });
    if (clamped <= 0) {
      set({ gameStatus: 'dead' });
    }
  },
  setMana: (mana) => set({ mana: Math.max(0, Math.min(100, mana)) }),

  addItem: (item) =>
    set((state) => {
      const newInventory = [...state.inventory, item];
      const lowerName = item.name.toLowerCase();
      const updates: Partial<StoryProgress> = {};

      if (lowerName.includes('firewall key')) {
        updates.hasFirewallKey = true;
      }
      if (lowerName.includes('admin keycard')) {
        updates.hasAdminKeycard = true;
      }

      return {
        inventory: newInventory,
        storyProgress: { ...state.storyProgress, ...updates },
      };
    }),

  removeItem: (id) =>
    set((state) => ({
      inventory: state.inventory.filter((i) => i.id !== id),
    })),

  setLocation: (loc) => set({ location: loc }),

  setGameStatus: (status) => set({ gameStatus: status }),

  visitTile: (key) =>
    set((state) => {
      const newVisited = new Set(state.visitedTiles);
      const wasNew = !newVisited.has(key);
      newVisited.add(key);
      return {
        visitedTiles: newVisited,
        storyProgress: wasNew
          ? { ...state.storyProgress, tilesExplored: state.storyProgress.tilesExplored + 1 }
          : state.storyProgress,
      };
    }),

  addStoryEvent: (description, act) =>
    set((state) => ({
      storyProgress: {
        ...state.storyProgress,
        keyEvents: [
          ...state.storyProgress.keyEvents.slice(-9),
          {
            id: Date.now().toString(),
            description,
            act,
            timestamp: Date.now(),
          },
        ],
      },
    })),

  updateStoryProgress: (updates) =>
    set((state) => ({
      storyProgress: { ...state.storyProgress, ...updates },
    })),

  resetGame: () => set({
    ...INITIAL_STATE,
    visitedTiles: new Set(['4,4']),
    storyProgress: { ...INITIAL_STORY_PROGRESS, keyEvents: [] },
  }),
}));

export function getAct(x: number, y: number): 1 | 2 | 3 {
  const dist = Math.abs(x) + Math.abs(y);
  if (dist >= 5) return 1;
  if (dist >= 2) return 2;
  return 3;
}

export function getCurrentObjective(progress: StoryProgress): string {
  if (!progress.hasFirewallKey) {
    return 'OBJECTIVE: Find the Firewall Key to breach the gate into Neon City';
  }
  if (!progress.act1Complete) {
    return 'OBJECTIVE: Move toward Neon City — you have the Firewall Key';
  }
  if (!progress.hasAdminKeycard) {
    return 'OBJECTIVE: Find the Admin Keycard to access The Source';
  }
  if (!progress.act2Complete) {
    return 'OBJECTIVE: Move toward The Source — you have the Admin Keycard';
  }
  return 'OBJECTIVE: Reach Terminal Zero [0,0] and EXECUTE LOGOUT';
}
