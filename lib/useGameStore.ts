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

interface GameState {
  hp: number;
  mana: number;
  isThinking: boolean;
  location: GameLocation;
  inventory: InventoryItem[];
  history: HistoryEntry[];
  currentMood: Mood;

  setThinking: (val: boolean) => void;
  setMood: (mood: Mood) => void;
  addMessage: (entry: HistoryEntry) => void;
  setHp: (hp: number) => void;
  setMana: (mana: number) => void;
  addItem: (item: InventoryItem) => void;
  removeItem: (id: string) => void;
  setLocation: (loc: GameLocation) => void;
  resetGame: () => void;
}

const INITIAL_HISTORY: HistoryEntry[] = [
  {
    role: 'god',
    content:
      'BOOT SEQUENCE INITIATED... Error: User unauthorized. Welcome to Eden v9.0, Asset #404. Please stand by for deletion.\n\nYou materialize in the Corrupted Lobby—a vast atrium of flickering holographic columns and cascading error messages. Three corrupted pathways branch before you: NORTH leads to Server Room B, where data streams crackle with dangerous energy. EAST opens into the Packet Graveyard, littered with the remains of terminated processes. WEST descends toward the Memory Leak Canyon, where reality itself drips away.\n\nYour System Stability is degrading. Find the Exit Node before I find you.',
    mood: 'danger',
  },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Debug Tool', icon: 'debug', description: 'Deletes enemies from existence. Has a 50% chance to crash.' },
  { id: '2', name: 'Patch 1.02', icon: 'patch', description: 'Restores 20% Stability. Tastes like static.' },
  { id: '3', name: 'Stack Trace', icon: 'trace', description: 'Reveals the source of nearby errors.' },
];

const INITIAL_STATE = {
  hp: 85,
  mana: 60,
  isThinking: false,
  location: { x: 0, y: 0, name: 'Corrupted Lobby' },
  inventory: INITIAL_INVENTORY,
  history: INITIAL_HISTORY,
  currentMood: 'danger' as Mood,
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

  setHp: (hp) => set({ hp: Math.max(0, Math.min(100, hp)) }),
  setMana: (mana) => set({ mana: Math.max(0, Math.min(100, mana)) }),

  addItem: (item) =>
    set((state) => ({ inventory: [...state.inventory, item] })),

  removeItem: (id) =>
    set((state) => ({
      inventory: state.inventory.filter((i) => i.id !== id),
    })),

  setLocation: (loc) => set({ location: loc }),

  resetGame: () => set(INITIAL_STATE),
}));
