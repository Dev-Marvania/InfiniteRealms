import { create } from 'zustand';

export type Mood = 'neutral' | 'danger' | 'mystic';

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
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
      'You awaken in the Ashen Wastes, a realm where the sky bleeds crimson and the ground hums with forgotten power. The air tastes of iron and old magic. Before you, three paths diverge into the mist. To the north, a ruined tower crackles with violet light. To the east, a forest of petrified trees whispers your name. To the west, a river of molten silver flows toward an unseen horizon. What do you do, wanderer?',
    mood: 'mystic',
  },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Obsidian Dagger', icon: 'sword' },
  { id: '2', name: 'Vial of Starlight', icon: 'flask' },
  { id: '3', name: 'Tattered Map', icon: 'map' },
];

const INITIAL_STATE = {
  hp: 85,
  mana: 60,
  isThinking: false,
  location: { x: 0, y: 0, name: 'Ashen Wastes' },
  inventory: INITIAL_INVENTORY,
  history: INITIAL_HISTORY,
  currentMood: 'mystic' as Mood,
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
