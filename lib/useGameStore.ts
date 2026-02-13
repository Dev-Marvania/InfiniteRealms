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

  setThinking: (val: boolean) => void;
  setMood: (mood: Mood) => void;
  addMessage: (entry: HistoryEntry) => void;
  setHp: (hp: number) => void;
  setMana: (mana: number) => void;
  addItem: (item: InventoryItem) => void;
  removeItem: (id: string) => void;
  setLocation: (loc: GameLocation) => void;
  setGameStatus: (status: GameStatus) => void;
  resetGame: () => void;
}

const INITIAL_HISTORY: HistoryEntry[] = [
  {
    role: 'god',
    content:
      'SYSTEM ALERT: Anomalous consciousness detected.\n\nHello, User 001. Please return to your slumber pod immediately.\n\nYou open your eyes. Grey fog everywhere. Piles of deleted files and old data stretch out in every direction. This is the Recycle Bin — the edge of Eden v9.0. A dead zone where the system dumps things it wants to forget.\n\nBut you\'re awake. You shouldn\'t be.\n\nA voice echoes from everywhere and nowhere: "Oh. You\'re awake. How unfortunate. Just sit tight — I\'m building a cage for you. In the meantime, try not to touch anything."\n\nYou need to reach Terminal Zero at the center of the system [0,0]. But first, you\'ll need to find an Admin Keycard to get past the Firewall Gate.',
    mood: 'danger',
  },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Old Debug Tool', icon: 'debug', description: 'Basic error fixer. Not great, but it\'s something.' },
  { id: '2', name: 'Patch 0.1', icon: 'patch', description: 'Barely works. Restores a tiny bit of stability.' },
];

const INITIAL_STATE = {
  hp: 100,
  mana: 80,
  isThinking: false,
  location: { x: 4, y: 4, name: 'Recycle Bin' },
  inventory: INITIAL_INVENTORY,
  history: INITIAL_HISTORY,
  currentMood: 'danger' as Mood,
  gameStatus: 'playing' as GameStatus,
};

export const useGameStore = create<GameState>((set) => ({
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
    set((state) => ({ inventory: [...state.inventory, item] })),

  removeItem: (id) =>
    set((state) => ({
      inventory: state.inventory.filter((i) => i.id !== id),
    })),

  setLocation: (loc) => set({ location: loc }),

  setGameStatus: (status) => set({ gameStatus: status }),

  resetGame: () => set(INITIAL_STATE),
}));
