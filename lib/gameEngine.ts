import { Mood, InventoryItem, GameLocation } from './useGameStore';

interface GameResponse {
  narrative: string;
  mood: Mood;
  hpChange: number;
  manaChange: number;
  newItem?: InventoryItem;
  removeItemId?: string;
  newLocation?: GameLocation;
  intent: string;
  gameOver?: boolean;
  victory?: boolean;
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

function getAct(x: number, y: number): 1 | 2 | 3 {
  const dist = Math.abs(x) + Math.abs(y);
  if (dist >= 5) return 1;
  if (dist >= 2) return 2;
  return 3;
}

const ACT1_LOCATIONS = [
  'Recycle Bin', 'Deleted Files Dump', 'Old Cache Storage',
  'Temp Folder Ruins', 'Junk Data Field', 'Crashed Program Lot',
  'Expired Cookie Pile', 'Defrag Wasteland', 'Format Graveyard',
];

const ACT2_LOCATIONS = [
  'Neon City Gate', 'Fake Mall District', 'NPC Boulevard',
  'Hologram Plaza', 'Pixel Market', 'Firewall Checkpoint',
  'Data Highway', 'Clone Alley', 'Simulation Square',
];

const ACT3_LOCATIONS = [
  'The White Void', 'Monolith Chamber', 'Source Code Hall',
  'Root Access Point', 'Kernel Bridge', 'Terminal Zero Approach',
];

function getLocationName(x: number, y: number): string {
  if (x === 0 && y === 0) return 'Terminal Zero';
  const act = getAct(x, y);
  const pool = act === 1 ? ACT1_LOCATIONS : act === 2 ? ACT2_LOCATIONS : ACT3_LOCATIONS;
  const idx = Math.abs(x * 7 + y * 13 + x * y * 3) % pool.length;
  return pool[idx];
}

const MOVE_ACT1 = [
  'You walk through grey fog. Deleted files crunch under your feet like broken glass. Another empty wasteland.\n\n// THE ARCHITECT: "Walking through my trash. Classy. You belong here."',
  'A loading bar appears in the sky, stuck at 12%. The path ahead is littered with corrupted thumbnails and dead shortcuts.\n\n// THE ARCHITECT: "Keep walking. You\'re not going anywhere I can\'t see."',
  'The fog clears a bit. You see piles of old data — crashed spreadsheets, broken links, expired sessions. Everything smells like burnt circuits.\n\n// THE ARCHITECT: "Welcome to the dump. Population: you."',
];

const MOVE_ACT2 = [
  'Neon signs flicker everywhere. NPCs walk past you, all saying the same thing: "Welcome to Eden! Everything is fine!" Their smiles don\'t reach their eyes.\n\n// THE ARCHITECT: "Beautiful, isn\'t it? I built all of this. Stop trying to break it."',
  'The city streets glow with fake advertisements. A hologram tries to sell you "premium sleep mode." Everything here is a distraction.\n\n// THE ARCHITECT: "Just stay here. It\'s nice. Why would you want to leave?"',
  'You push through crowds of copy-paste NPCs. They bump into you and say "Have a nice day!" on repeat. The buildings are just flat textures up close.\n\n// THE ARCHITECT: "Stop looking behind the curtain. You won\'t like what you find."',
];

const MOVE_ACT3 = [
  'The world goes white. Black monoliths float in empty space. The ground is just raw code — you can see the numbers scrolling beneath your feet.\n\n// THE ARCHITECT: "Turn back. Now. I\'m not asking."',
  'Reality breaks apart into wireframes. You can see the edges of the simulation — just a thin shell over nothing. Terminal Zero pulses ahead.\n\n// THE ARCHITECT: "You\'re breaking everything. Is that what you want? To destroy a whole world?"',
  'Static fills your vision. When it clears, you\'re standing on floating platforms of raw data. The Source hums with power.\n\n// THE ARCHITECT: "If you take one more step, I will end you myself."',
];

const ATTACK_ACT1 = [
  'A Spam Bot rushes at you, blasting pop-up ads. You smash it apart. It wasn\'t very tough.\n\n// THE ARCHITECT: "Congrats. You killed a pop-up. Feel like a hero yet?"',
  'A Corrupted File Fragment lunges at you — it\'s a mess of broken pixels. You swing and it shatters into junk data.\n\n// THE ARCHITECT: "Oh no, you beat my weakest program. I\'m so scared."',
  'A glitching error message attacks you. Yes, an error message. It scratches you before you delete it.\n\n// THE ARCHITECT: "Even my bugs don\'t like you."',
];

const ATTACK_ACT2 = [
  'A Hunter Protocol drops from the ceiling — sleek, fast, red eyes. It hits you hard before you can fight back. You manage to damage it, but it hurts.\n\n// THE ARCHITECT: "I built the Hunters to find people like you. They don\'t stop."',
  'Two Hunter drones swarm you. You take one down but the other clips you with an electric charge. Your systems flicker.\n\n// THE ARCHITECT: "Every time you fight, you get weaker. Every time I send more, I get stronger."',
  'A Security Crawler blocks your path. It\'s covered in firewalls. You break through but your stability takes a hit.\n\n// THE ARCHITECT: "You can\'t fight your way through my whole system. Give up."',
];

const ATTACK_ACT3 = [
  'An Elite Sentinel appears — massive, glowing white, covered in encryption. It hits like a truck. You barely survive the exchange.\n\n// THE ARCHITECT: "That was my best. There are more. How long can you last?"',
  'The Source itself fights you. Tendrils of raw code whip at you. You cut through some but they keep coming.\n\n// THE ARCHITECT: "You\'re fighting the system itself now. You can\'t win this."',
  'A Firewall Guardian blocks Terminal Zero. It\'s the toughest thing you\'ve faced. Combat is brutal.\n\n// THE ARCHITECT: "Last chance. Turn around or I will recycle you."',
];

const HACK_SUCCESS = [
  'Your hack breaks through. The lock pops open. Data flows freely.\n\n// THE ARCHITECT: "That was MY code you just rewrote. Do you know how rude that is?"',
  'ACCESS GRANTED. The firewall drops. You\'re in.\n\n// THE ARCHITECT: "Fine. But the next one is harder. I\'m watching you."',
  'You crack the encryption in seconds. The system bends to your command.\n\n// THE ARCHITECT: "Impossible. That was 256-bit. Who ARE you?"',
];

const HACK_FAIL = [
  'ACCESS DENIED. The system fights back. A counter-hack zaps your stability.\n\n// THE ARCHITECT: "Nice try, script kiddie. My firewalls are smarter than you."',
  'Your exploit crashes before it runs. The system locks you out and sends an alert to nearby Hunters.\n\n// THE ARCHITECT: "Ha! You thought sudo would work on MY system?"',
  'The hack hits a honeypot. It was a trap. Your system takes damage as alarms go off.\n\n// THE ARCHITECT: "I set that trap just for you. Walked right into it."',
];

const REST_ACT1 = [
  'You find a quiet corner behind some old log files. Your systems slowly repair themselves. It\'s peaceful here.\n\n// THE ARCHITECT: "Enjoy the nap. It\'s the last quiet moment you\'ll get."',
  'You plug into a maintenance port. Power trickles in. Your stability climbs back up.\n\n// THE ARCHITECT: "Resting in my Recycle Bin. How pathetic."',
];

const REST_ACT2 = [
  'You try to rest but the city never sleeps. Neon lights buzz. You recover a little, but not much.\n\n// THE ARCHITECT: "You think I\'d let you sleep? I turned the volume up."',
  'You duck behind a dumpster. Your systems patch themselves slowly. A Hunter patrol passes nearby — too close.\n\n// THE ARCHITECT: "Rest fast. They\'ll find you."',
];

const REST_ACT3 = [
  'You try to rest but the white void pulses with energy. It\'s hard to relax when reality is falling apart. Barely any recovery.\n\n// THE ARCHITECT: "There is no rest here. Only the end."',
  'You close your eyes for a second. An alarm blares. A Sentinel spotted you. Rest interrupted.\n\n// THE ARCHITECT: "Sleep is a luxury. You can\'t afford it anymore."',
];

const SEARCH_ACT1 = [
  'You dig through the junk data and find something useful.',
  'Hidden behind a pile of deleted files, something glows.',
  'Your scanner picks up a signal. You pull something out of the garbage.',
];

const SEARCH_ACT2 = [
  'Behind a fake storefront, you find a hidden stash.',
  'A glitching NPC drops something before looping. You grab it.',
  'You hack a vending machine. Something useful falls out.',
];

const SEARCH_ACT3 = [
  'Floating in the void, a data fragment catches your eye.',
  'A cracked monolith reveals something hidden inside.',
  'You find something wedged in the raw source code.',
];

const SEARCH_NOTHING = [
  'You search everywhere. Nothing. Just empty memory.\n\n// THE ARCHITECT: "Looking for hope? I deleted that a long time ago."',
  'Your scan comes back empty. This area has been cleaned out.\n\n// THE ARCHITECT: "I made sure there\'s nothing here. Keep wasting your time."',
  'Nothing. Not even a stray byte. The Architect must have swept this zone.\n\n// THE ARCHITECT: "Oh, were you looking for something? Too bad."',
];

const MAGIC_NARRATIVES = [
  'You channel raw system energy through your core. A blast of pure data erupts outward. It costs you a lot of power.\n\n// THE ARCHITECT: "Cute trick. You\'re burning through your energy like a bad app."',
  'You override the local physics engine. Reality bends. The attack lands hard but drains your batteries.\n\n// THE ARCHITECT: "Keep using magic like that and you\'ll crash before you reach me."',
  'You compile a power surge on the fly. It tears through the enemy. But your energy bar drops fast.\n\n// THE ARCHITECT: "Nice spell. You\'ve got maybe two more before you\'re empty."',
];

const UNKNOWN_RESPONSES = [
  'The terminal blinks. Command not recognized.\n\n// THE ARCHITECT: "Speak English. Or code. Move, attack, hack, search, or rest. Pick one."',
  'Nothing happens. Your input got rejected.\n\n// THE ARCHITECT: "That\'s not a real command. Try: move, attack, hack, search, or rest."',
];

const AMBUSH_NARRATIVES_ACT2 = [
  'A Hunter Protocol drops from the ceiling mid-step! It attacks before you can react.\n\n// THE ARCHITECT: "Surprise. I\'ve been tracking you since Act 1."',
  'AMBUSH! Two security drones decloak behind you. They open fire.\n\n// THE ARCHITECT: "Did you think I\'d just let you walk through my city?"',
];

const AMBUSH_NARRATIVES_ACT3 = [
  'A Sentinel materializes right in front of you. No warning. It swings hard.\n\n// THE ARCHITECT: "Getting close to Terminal Zero, are we? Not on my watch."',
  'The Source Code itself lashes out — a tendril of raw data slams into you.\n\n// THE ARCHITECT: "The closer you get, the harder I fight. Remember that."',
];

const ITEM_POOL_ACT1: Omit<InventoryItem, 'id'>[] = [
  { name: 'Rusty Debug Tool', icon: 'debug', description: 'Old but still works. Fixes small errors.' },
  { name: 'Patch 0.9', icon: 'patch', description: 'Restores a bit of stability. Better than nothing.' },
  { name: 'Broken Firewall Shard', icon: 'firewall', description: 'A piece of old security. Might block one hit.' },
  { name: 'Corrupted Token', icon: 'token', description: 'An expired login token. Maybe it still works somewhere.' },
  { name: 'Old Stack Trace', icon: 'trace', description: 'Shows you where errors are hiding nearby.' },
];

const ITEM_POOL_ACT2: Omit<InventoryItem, 'id'>[] = [
  { name: 'Hunter Protocol Chip', icon: 'data', description: 'Ripped from a dead Hunter. Contains patrol routes.' },
  { name: 'Zero-Day Exploit', icon: 'exploit', description: 'Cracks any lock. One use only.' },
  { name: 'Proxy Mask', icon: 'proxy', description: 'Hides you from scanners for a short time.' },
  { name: 'Energy Cell', icon: 'memory', description: 'Restores some energy when used.' },
  { name: 'Firewall Breaker', icon: 'rootkit', description: 'Tears through security walls. Loud but effective.' },
];

const ITEM_POOL_ACT3: Omit<InventoryItem, 'id'>[] = [
  { name: 'Root Access Key', icon: 'rootkit', description: 'Grants admin-level privileges. Very rare.' },
  { name: 'Source Code Fragment', icon: 'data', description: 'A piece of the simulation\'s core. Powerful.' },
  { name: 'Sentinel Override', icon: 'exploit', description: 'Shuts down one Elite Sentinel instantly.' },
];

const FIREWALL_KEY: Omit<InventoryItem, 'id'> = {
  name: 'Firewall Key',
  icon: 'token',
  description: 'Unlocks the Firewall Gate to Neon City. The Architect is furious you found this.',
};

const ADMIN_KEYCARD: Omit<InventoryItem, 'id'> = {
  name: 'Admin Keycard',
  icon: 'token',
  description: 'Admin-level access to The Source. The Architect really doesn\'t want you to have this.',
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

type Intent = 'move' | 'attack' | 'magic' | 'rest' | 'search' | 'hack' | 'look' | 'unknown' | 'logout';

function parseIntent(input: string): { intent: Intent; direction?: string } {
  const lower = input.toLowerCase().trim();

  if (/\bexecute\s*logout\b/.test(lower) || lower === 'logout' || lower === 'log out') {
    return { intent: 'logout' };
  }

  if (/\b(hack|rewrite|code|sudo|exploit|inject|override|crack|decrypt|bypass)\b/.test(lower)) {
    return { intent: 'hack' };
  }

  for (const dir of Object.keys(DIRECTIONS)) {
    if (lower.includes(dir) && (lower.includes('go') || lower.includes('walk') || lower.includes('move') || lower.includes('travel') || lower.includes('head') || lower.includes('run'))) {
      return { intent: 'move', direction: dir };
    }
    if (lower === dir) {
      return { intent: 'move', direction: dir };
    }
  }

  if (/\b(attack|fight|strike|slash|hit|kill|slay|stab|swing|delete|terminate)\b/.test(lower)) {
    return { intent: 'attack' };
  }
  if (/\b(cast|spell|magic|fireball|heal|enchant|invoke|conjure|channel|compile)\b/.test(lower)) {
    return { intent: 'magic' };
  }
  if (/\b(rest|sleep|camp|meditate|sit|relax|recover|reboot|repair|recharge)\b/.test(lower)) {
    return { intent: 'rest' };
  }
  if (/\b(search|look|examine|inspect|investigate|explore|find|loot|open|grab|take|pick|scan|query)\b/.test(lower)) {
    return { intent: 'search' };
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
  const act = getAct(currentLocation.x, currentLocation.y);

  if (intent === 'logout') {
    if (currentLocation.x === 0 && currentLocation.y === 0) {
      return {
        narrative: 'You type the command: EXECUTE LOGOUT.\n\nThe screen cracks. White light pours through the simulation like water through a broken dam. The Architect screams — not words, just raw static. The NPCs freeze. The buildings dissolve. The sky rips open.\n\nAnd then... silence. Real silence. Not the fake kind.\n\nYou\'re out. You made it.\n\n// THE ARCHITECT: "NO! You can\'t— I built this world! It was PERFECT! You\'ve ruined everything! I... I... [CONNECTION LOST]"',
        mood: 'mystic',
        hpChange: 0,
        manaChange: 0,
        intent: 'logout',
        victory: true,
      };
    } else {
      return {
        narrative: 'You try to execute the logout command, but nothing happens. You\'re not at Terminal Zero yet.\n\n// THE ARCHITECT: "Cute. You need to be at Terminal Zero [0,0] for that to work. And trust me, you\'ll never get there."',
        mood: 'neutral',
        hpChange: 0,
        manaChange: 0,
        intent: 'logout',
      };
    }
  }

  switch (intent) {
    case 'move': {
      const dir = direction && DIRECTIONS[direction]
        ? DIRECTIONS[direction]
        : { dx: pick([-1, 0, 1]), dy: pick([-1, 0, 1]) };
      let newX = currentLocation.x + dir.dx;
      let newY = currentLocation.y + dir.dy;
      if (newX < -1) newX = -1;
      if (newX > 5) newX = 5;
      if (newY < -1) newY = -1;
      if (newY > 5) newY = 5;
      const name = getLocationName(newX, newY);
      const newAct = getAct(newX, newY);

      const moveNarratives = newAct === 1 ? MOVE_ACT1 : newAct === 2 ? MOVE_ACT2 : MOVE_ACT3;
      let narrative = pick(moveNarratives);
      let hpChange = 0;
      let manaChange = -5;
      let mood: Mood = 'mystic';

      const ambushChance = newAct === 1 ? 0.1 : newAct === 2 ? 0.3 : 0.4;
      if (Math.random() < ambushChance && newAct >= 2) {
        const ambushPool = newAct === 2 ? AMBUSH_NARRATIVES_ACT2 : AMBUSH_NARRATIVES_ACT3;
        const ambushDmg = newAct === 2 ? -(Math.floor(Math.random() * 8) + 5) : -(Math.floor(Math.random() * 10) + 8);
        narrative += '\n\n' + pick(ambushPool);
        hpChange = ambushDmg;
        mood = 'danger';
      }

      return {
        narrative,
        mood,
        hpChange,
        manaChange,
        newLocation: { x: newX, y: newY, name },
        intent: 'move',
      };
    }

    case 'attack': {
      const pool = act === 1 ? ATTACK_ACT1 : act === 2 ? ATTACK_ACT2 : ATTACK_ACT3;
      const baseDmg = act === 1 ? -(Math.floor(Math.random() * 5) + 2) : act === 2 ? -(Math.floor(Math.random() * 8) + 5) : -(Math.floor(Math.random() * 12) + 8);
      return {
        narrative: pick(pool),
        mood: 'danger',
        hpChange: baseDmg,
        manaChange: 0,
        intent: 'attack',
      };
    }

    case 'hack': {
      const successRate = act === 1 ? 0.5 : act === 2 ? 0.35 : 0.25;
      const success = Math.random() < successRate;
      if (success) {
        let extraItem: InventoryItem | undefined;
        if (act === 1 && Math.random() < 0.35) {
          extraItem = { ...FIREWALL_KEY, id: genId() };
        } else if (act === 2 && Math.random() < 0.25) {
          extraItem = { ...ADMIN_KEYCARD, id: genId() };
        }
        return {
          narrative: pick(HACK_SUCCESS),
          mood: 'mystic',
          hpChange: 0,
          manaChange: -(Math.floor(Math.random() * 10) + 10),
          newItem: extraItem,
          intent: 'hack',
        };
      } else {
        const failDmg = act === 1 ? -8 : act === 2 ? -12 : -15;
        return {
          narrative: pick(HACK_FAIL),
          mood: 'danger',
          hpChange: failDmg,
          manaChange: -5,
          intent: 'hack',
        };
      }
    }

    case 'magic': {
      const manaCost = -(Math.floor(Math.random() * 12) + 15);
      return {
        narrative: pick(MAGIC_NARRATIVES),
        mood: 'mystic',
        hpChange: 0,
        manaChange: manaCost,
        intent: 'magic',
      };
    }

    case 'rest': {
      const pool = act === 1 ? REST_ACT1 : act === 2 ? REST_ACT2 : REST_ACT3;
      const hpGain = act === 1 ? Math.floor(Math.random() * 5) + 4 : act === 2 ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 3) + 1;
      const manaGain = act === 1 ? Math.floor(Math.random() * 8) + 5 : act === 2 ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 3) + 1;

      let narrative = pick(pool);
      let finalHpGain = hpGain;

      if (act >= 2 && Math.random() < 0.5) {
        const interruptPool = act === 2 ? AMBUSH_NARRATIVES_ACT2 : AMBUSH_NARRATIVES_ACT3;
        narrative += '\n\n' + pick(interruptPool);
        finalHpGain = -(Math.floor(Math.random() * 5) + 3);
      }

      return {
        narrative,
        mood: act === 1 ? 'neutral' : 'danger',
        hpChange: finalHpGain,
        manaChange: manaGain,
        intent: 'rest',
      };
    }

    case 'search': {
      const findChance = act === 1 ? 0.7 : act === 2 ? 0.5 : 0.35;
      const found = Math.random() < findChance;

      if (found) {
        const searchPool = act === 1 ? SEARCH_ACT1 : act === 2 ? SEARCH_ACT2 : SEARCH_ACT3;
        const itemPool = act === 1 ? ITEM_POOL_ACT1 : act === 2 ? ITEM_POOL_ACT2 : ITEM_POOL_ACT3;

        let template: Omit<InventoryItem, 'id'>;
        if (act === 1 && Math.random() < 0.3) {
          template = FIREWALL_KEY;
        } else if (act === 2 && Math.random() < 0.2) {
          template = ADMIN_KEYCARD;
        } else {
          template = pick(itemPool);
        }

        const item: InventoryItem = { ...template, id: genId() };
        const searchNarrative = pick(searchPool);

        const trapChance = act === 1 ? 0.05 : act === 2 ? 0.2 : 0.35;
        let hpChange = 0;
        let extraText = '';
        if (Math.random() < trapChance) {
          hpChange = -(Math.floor(Math.random() * 6) + 3);
          extraText = '\n\nBut it was booby-trapped! A shock hits your system.\n\n// THE ARCHITECT: "I rigged that one. Enjoy your prize AND the damage."';
        } else {
          extraText = `\n\nYou found: ${item.name}.\n\n// THE ARCHITECT: "Take it. It won't save you."`;
        }

        return {
          narrative: searchNarrative + extraText,
          mood: hpChange < 0 ? 'danger' : 'mystic',
          hpChange,
          manaChange: 0,
          newItem: item,
          intent: 'search',
        };
      }

      return {
        narrative: pick(SEARCH_NOTHING),
        mood: 'neutral',
        hpChange: 0,
        manaChange: 0,
        intent: 'search',
      };
    }

    default: {
      return {
        narrative: pick(UNKNOWN_RESPONSES),
        mood: 'neutral',
        hpChange: 0,
        manaChange: 0,
        intent: 'unknown',
      };
    }
  }
}

export { getLocationName, getAct };
