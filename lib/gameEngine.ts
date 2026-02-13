import { Mood, InventoryItem, GameLocation, HistoryEntry } from './useGameStore';

interface GameResponse {
  narrative: string;
  mood: Mood;
  hpChange: number;
  manaChange: number;
  newItem?: InventoryItem;
  removeItemId?: string;
  newLocation?: GameLocation;
}

const DIRECTIONS: Record<string, { dx: number; dy: number }> = {
  north: { dx: 0, dy: -1 },
  south: { dx: 0, dy: 1 },
  east: { dx: 1, dy: 0 },
  west: { dx: -1, dy: 0 },
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

const LOCATION_NAMES = [
  'Whispering Hollow',
  'Crimson Spire',
  'Ashfall Basin',
  'The Bone Reaches',
  'Moonveil Glade',
  'Ironmaw Caverns',
  'The Shattered Gate',
  'Veilstorm Peak',
  'Obsidian Marsh',
  'Duskfang Crossing',
  'The Hollow Throne',
  'Starfall Ruins',
  'Bloodtide Shore',
  'The Wandering Dark',
  'Ember Root Grove',
  'Frostfang Ridge',
  'The Silent Crypt',
  'Wraithwood',
  'Thunderstone Mesa',
  'The Veiled Sanctum',
];

const EXPLORE_NARRATIVES = [
  'You press forward through the shifting mist. The ground beneath you trembles, and ancient stones rise from the earth, forming a path that did not exist moments ago. The air grows colder as you reach {location}.',
  'A distant howl echoes across the wasteland. You follow the sound through corridors of twisted stone until you emerge at {location}. Strange runes flicker along the walls, pulsing with a heartbeat not your own.',
  'The path narrows and descends into shadow. When you emerge, the sky above has changed—twin moons hang where one once stood. You have arrived at {location}.',
  'Your steps leave glowing footprints in the dark soil. Something watches from the periphery—you sense it rather than see it. {location} unfolds before you, ancient and hungry.',
  'Threads of luminous energy guide you through a labyrinth of crystal and bone. At its heart lies {location}, a place spoken of only in the oldest of forbidden texts.',
];

const ATTACK_NARRATIVES = [
  'You draw your weapon and strike at the darkness ahead. A creature of shadow and sinew lunges back—its claws rake across your arm before you dispatch it with a final blow. The shadows retreat, whimpering.',
  'With a battle cry that echoes through the realm, you charge. Steel meets chitinous hide. The creature shrieks—a sound like tearing metal—before collapsing into motes of dark energy.',
  'You slash through the air, catching the lurking beast mid-pounce. Its ichor spatters the ancient stones as it writhes and dissolves. The cost of victory: a few drops of your own blood.',
  'The creature attacks first, its form shifting between states of matter. You barely dodge, then counter with a devastating strike. It explodes into fragments of frozen light.',
];

const MAGIC_NARRATIVES = [
  'You extend your hand and speak words that taste of starlight. A bolt of radiant energy erupts from your palm, illuminating the darkness. The walls themselves recoil from the light. Your mana reservoir drains visibly.',
  'Drawing from the ley lines beneath your feet, you weave a spell of binding. Arcane chains erupt from the ground, shackling the shadow-things in place. The effort leaves you breathless.',
  'You trace the ancient sigils in the air. They blaze with violet fire, and reality itself bends around you. For a moment, you see all possible futures converging on this point.',
  'The spell erupts with more force than you anticipated. Power cascades outward in spiraling waves. You feel the mana drain sharply, but the effect is magnificent.',
];

const REST_NARRATIVES = [
  'You find a sheltered alcove among the ruins and allow yourself a moment of respite. The ambient energy of this place seeps into your wounds, knitting flesh and restoring vigor. When you rise, the world feels slightly less hostile.',
  'You lean against an ancient pillar and close your eyes. Dreams come quickly here—visions of forgotten cities and sleeping gods. When you wake, your wounds have partially mended, as if the realm itself tends to those who pause.',
  'You sit in stillness, breathing deeply. The mystic energy of the land flows through you like a river of warm light. Strength returns to your limbs. The darkness watches, but it does not approach a soul at peace.',
];

const SEARCH_NARRATIVES = [
  'You sift through the debris of ages and find something glinting beneath a layer of cosmic dust. {item}—it practically hums with potential.',
  'Your fingers brush against something hidden in the crevice of an ancient altar. {item}. It was waiting for someone worthy to claim it.',
  'Behind a loose stone in the wall, you discover a hidden cache. Among the dust and forgotten offerings, {item} catches your eye. It feels important.',
];

const ITEM_POOL: InventoryItem[] = [
  { id: '', name: 'Crimson Gem', icon: 'gem' },
  { id: '', name: 'Ancient Scroll', icon: 'scroll' },
  { id: '', name: 'Health Potion', icon: 'potion' },
  { id: '', name: 'Runic Shield', icon: 'shield' },
  { id: '', name: 'Shadow Ring', icon: 'ring' },
  { id: '', name: 'Iron Key', icon: 'key' },
  { id: '', name: 'Blazing Torch', icon: 'torch' },
  { id: '', name: 'Bone Armor', icon: 'armor' },
  { id: '', name: 'Starbow', icon: 'bow' },
  { id: '', name: 'Tome of Whispers', icon: 'book' },
  { id: '', name: 'Moon Crystal', icon: 'crystal' },
  { id: '', name: 'Soul Coin', icon: 'coin' },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getLocationName(x: number, y: number): string {
  const idx = Math.abs(x * 7 + y * 13 + x * y * 3) % LOCATION_NAMES.length;
  return LOCATION_NAMES[idx];
}

type Intent = 'move' | 'attack' | 'magic' | 'rest' | 'search' | 'look' | 'unknown';

function parseIntent(input: string): { intent: Intent; direction?: string } {
  const lower = input.toLowerCase();

  for (const dir of Object.keys(DIRECTIONS)) {
    if (lower.includes(dir) && (lower.includes('go') || lower.includes('walk') || lower.includes('move') || lower.includes('travel') || lower.includes('head') || lower.includes('run'))) {
      return { intent: 'move', direction: dir };
    }
    if (lower === dir) {
      return { intent: 'move', direction: dir };
    }
  }

  if (/\b(attack|fight|strike|slash|hit|kill|slay|stab|swing)\b/.test(lower)) {
    return { intent: 'attack' };
  }
  if (/\b(cast|spell|magic|fireball|heal|enchant|invoke|conjure|channel)\b/.test(lower)) {
    return { intent: 'magic' };
  }
  if (/\b(rest|sleep|camp|meditate|sit|relax|recover)\b/.test(lower)) {
    return { intent: 'rest' };
  }
  if (/\b(search|look|examine|inspect|investigate|explore|find|loot|open|grab|take|pick)\b/.test(lower)) {
    return { intent: 'search' };
  }
  if (/\b(look around|observe|survey)\b/.test(lower)) {
    return { intent: 'look' };
  }

  const dirMatch = Object.keys(DIRECTIONS).find((d) => lower.includes(d));
  if (dirMatch) {
    return { intent: 'move', direction: dirMatch };
  }

  return { intent: 'unknown' };
}

export function processCommand(
  input: string,
  currentLocation: GameLocation,
): GameResponse {
  const { intent, direction } = parseIntent(input);

  switch (intent) {
    case 'move': {
      const dir = direction && DIRECTIONS[direction]
        ? DIRECTIONS[direction]
        : { dx: pick([-1, 0, 1]), dy: pick([-1, 0, 1]) };
      const newX = currentLocation.x + dir.dx;
      const newY = currentLocation.y + dir.dy;
      const name = getLocationName(newX, newY);
      const narrative = pick(EXPLORE_NARRATIVES).replace('{location}', name);

      return {
        narrative,
        mood: 'mystic',
        hpChange: 0,
        manaChange: -5,
        newLocation: { x: newX, y: newY, name },
      };
    }

    case 'attack': {
      const damage = Math.floor(Math.random() * 15) + 5;
      return {
        narrative: pick(ATTACK_NARRATIVES),
        mood: 'danger',
        hpChange: -damage,
        manaChange: 0,
      };
    }

    case 'magic': {
      const manaCost = Math.floor(Math.random() * 20) + 10;
      return {
        narrative: pick(MAGIC_NARRATIVES),
        mood: 'mystic',
        hpChange: 0,
        manaChange: -manaCost,
      };
    }

    case 'rest': {
      const hpGain = Math.floor(Math.random() * 20) + 10;
      const manaGain = Math.floor(Math.random() * 15) + 5;
      return {
        narrative: pick(REST_NARRATIVES),
        mood: 'neutral',
        hpChange: hpGain,
        manaChange: manaGain,
      };
    }

    case 'search': {
      const found = Math.random() > 0.3;
      if (found) {
        const template = pick(ITEM_POOL);
        const item: InventoryItem = {
          ...template,
          id: genId(),
        };
        const narrative = pick(SEARCH_NARRATIVES).replace('{item}', item.name);
        return {
          narrative,
          mood: 'mystic',
          hpChange: 0,
          manaChange: 0,
          newItem: item,
        };
      }
      return {
        narrative:
          'You search the area thoroughly, turning over every stone and peering into every shadow. Nothing of value reveals itself this time—but the act of looking has left you more attuned to the subtle currents of this place.',
        mood: 'neutral',
        hpChange: 0,
        manaChange: 0,
      };
    }

    default: {
      const responses = [
        'The realm responds to your words, but their meaning is lost in the wind. The God Narrator watches, waiting for a clearer command. Perhaps you should explore, attack, search, rest, or cast a spell.',
        'Your words ripple through the aether, but the fabric of reality does not shift. The Narrator requires a more decisive action—move, fight, search, or invoke the arcane.',
        'The ancient power that governs this place hears you, but cannot parse your intent. Speak of movement, combat, magic, or discovery, and the world will answer.',
      ];
      return {
        narrative: pick(responses),
        mood: 'neutral',
        hpChange: 0,
        manaChange: 0,
      };
    }
  }
}
