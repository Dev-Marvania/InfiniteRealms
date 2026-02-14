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

export interface EnemyState {
  name: string;
  hp: number;
  maxHp: number;
  damage: number;
  act: number;
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
  discoveredLore: string[];
  traceLevel: number;
  itemsUsed: number;
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
  activeEnemy: EnemyState | null;
  lastRestTile: string | null;
  hasExploitReady: boolean;

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
  discoverLore: (loreId: string) => void;
  addTrace: (amount: number) => void;
  reduceTrace: (amount: number) => void;
  setActiveEnemy: (enemy: EnemyState | null) => void;
  damageEnemy: (amount: number) => void;
  setLastRestTile: (tile: string | null) => void;
  setExploitReady: (val: boolean) => void;
  useItem: (id: string) => { effect: string; narrative: string } | null;
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
  discoveredLore: [],
  traceLevel: 0,
  itemsUsed: 0,
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
  activeEnemy: null as EnemyState | null,
  lastRestTile: null as string | null,
  hasExploitReady: false,
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

  discoverLore: (loreId) =>
    set((state) => {
      if (state.storyProgress.discoveredLore.includes(loreId)) return state;
      return {
        storyProgress: {
          ...state.storyProgress,
          discoveredLore: [...state.storyProgress.discoveredLore, loreId],
        },
      };
    }),

  addTrace: (amount) =>
    set((state) => ({
      storyProgress: {
        ...state.storyProgress,
        traceLevel: Math.min(100, state.storyProgress.traceLevel + amount),
      },
    })),

  reduceTrace: (amount) =>
    set((state) => ({
      storyProgress: {
        ...state.storyProgress,
        traceLevel: Math.max(0, state.storyProgress.traceLevel - amount),
      },
    })),

  setActiveEnemy: (enemy) => set({ activeEnemy: enemy }),

  damageEnemy: (amount) =>
    set((state) => {
      if (!state.activeEnemy) return state;
      const newHp = state.activeEnemy.hp - amount;
      if (newHp <= 0) {
        return { activeEnemy: null };
      }
      return { activeEnemy: { ...state.activeEnemy, hp: newHp } };
    }),

  setLastRestTile: (tile) => set({ lastRestTile: tile }),

  setExploitReady: (val) => set({ hasExploitReady: val }),

  useItem: (id) => {
    const state = get();
    const item = state.inventory.find((i) => i.id === id);
    if (!item) return null;

    const icon = item.icon.toLowerCase();

    if (icon === 'token') return null;

    let effect = '';
    let narrative = '';

    switch (icon) {
      case 'patch':
        set((s) => ({
          hp: Math.min(100, s.hp + 15),
          inventory: s.inventory.filter((i) => i.id !== id),
          storyProgress: { ...s.storyProgress, itemsUsed: s.storyProgress.itemsUsed + 1 },
        }));
        effect = 'heal';
        narrative = `Applied ${item.name}. Systems patched — stability restored by 15%.`;
        break;
      case 'memory':
        set((s) => ({
          mana: Math.min(100, s.mana + 20),
          inventory: s.inventory.filter((i) => i.id !== id),
          storyProgress: { ...s.storyProgress, itemsUsed: s.storyProgress.itemsUsed + 1 },
        }));
        effect = 'energy';
        narrative = `Used ${item.name}. Energy cells recharged — +20% energy restored.`;
        break;
      case 'debug':
        set((s) => ({
          inventory: s.inventory.filter((i) => i.id !== id),
          storyProgress: {
            ...s.storyProgress,
            traceLevel: Math.max(0, s.storyProgress.traceLevel - 20),
            itemsUsed: s.storyProgress.itemsUsed + 1,
          },
        }));
        effect = 'trace';
        narrative = `Ran ${item.name}. Trace signatures scrubbed — trace reduced by 20.`;
        break;
      case 'exploit':
        set((s) => ({
          hasExploitReady: true,
          inventory: s.inventory.filter((i) => i.id !== id),
          storyProgress: { ...s.storyProgress, itemsUsed: s.storyProgress.itemsUsed + 1 },
        }));
        effect = 'exploit';
        narrative = `Loaded ${item.name}. Next hack will auto-succeed.`;
        break;
      case 'proxy':
        set((s) => ({
          inventory: s.inventory.filter((i) => i.id !== id),
          storyProgress: {
            ...s.storyProgress,
            traceLevel: Math.max(0, s.storyProgress.traceLevel - 35),
            itemsUsed: s.storyProgress.itemsUsed + 1,
          },
        }));
        effect = 'stealth';
        narrative = `Activated ${item.name}. Proxy mask engaged — trace reduced by 35.`;
        break;
      case 'firewall':
        set((s) => ({
          hp: Math.min(100, s.hp + 10),
          inventory: s.inventory.filter((i) => i.id !== id),
          storyProgress: { ...s.storyProgress, itemsUsed: s.storyProgress.itemsUsed + 1 },
        }));
        effect = 'shield';
        narrative = `Deployed ${item.name}. Shield active — stability restored by 10%.`;
        break;
      default:
        return null;
    }

    return { effect, narrative };
  },

  resetGame: () => set({
    ...INITIAL_STATE,
    visitedTiles: new Set(['4,4']),
    storyProgress: { ...INITIAL_STORY_PROGRESS, keyEvents: [] },
    activeEnemy: null,
    lastRestTile: null,
    hasExploitReady: false,
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
