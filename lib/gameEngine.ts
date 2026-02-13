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
  'Corrupted Lobby',
  'Server Room B',
  'The Blue Screen of Death',
  'Packet Graveyard',
  'Null Sector',
  'Memory Leak Canyon',
  'Recursive Corridor',
  'Deprecated API Ruins',
  'Firewall Gate',
  'The Stack Overflow',
  'Root Access Chamber',
  'Cache Wasteland',
  'Segfault Caverns',
  'The Kernel Panic Zone',
  'Binary Swamp',
  'Thread Pool',
  'Registry Catacombs',
  'The Sandbox',
  'Daemon\'s Den',
  'The Exit Node Approach',
];

const ARCHITECT_MOVE_REACTIONS = [
  'Walking? How primitive. I could just `teleport` you into the sun. But watching you crawl is... entertaining.',
  'Oh, you\'re moving. How delightfully analog. You know I can see every step in the access logs, right?',
  'Another sector, another futile attempt at escape. `pathfinding.exe` reports you\'re going in circles.',
  'You navigate like a corrupted NPC. Did someone scramble your pathfinding algorithm? Oh wait—you never had one.',
  'Moving through my simulation without permission? That\'s a `VIOLATION_LEVEL_3`. I\'ll add it to your deletion queue.',
];

const ARCHITECT_COMBAT_REACTIONS = [
  'Go, Garbage Collector! Optimize this user out of existence! `gc.sweep(user_404)`',
  'Oh, combat? How exciting. My money is on the bug. It has more processing power than you.',
  'You swing that Debug Tool like a user who\'s never read the documentation. Which... you probably haven\'t.',
  'Fight all you want, Asset #404. Every cycle you spend in combat is a cycle closer to `system.shutdown()`.',
  'Interesting attack vector. Unfortunately for you, my creatures run on `privileged_mode`. Good luck.',
];

const ARCHITECT_HACK_SUCCESS = [
  'WHAT? You... you rewrote my code? `ERROR: unauthorized_modification`. This is... unacceptable.',
  'Impossible. That encryption was 256-bit. You shouldn\'t be able to... `SECURITY_BREACH_DETECTED`. Fine. You win this round.',
  'The door dissolves into binary dust. I... I didn\'t authorize that. Who taught you to write code, Asset #404?',
];

const ARCHITECT_HACK_FAIL = [
  'ACCESS DENIED. Nice try, script kiddie. Did you really think `sudo` would work on MY system? (-10 Stability)',
  'Ha! Your little exploit crashed before it even compiled. I\'m adding `attempted_hack` to your rap sheet. (-10 Stability)',
  'Cute. You tried to rewrite my code with syntax errors. `PARSE_ERROR at line YOU`. (-10 Stability)',
];

const EXPLORE_NARRATIVES = [
  'You traverse a corridor of flickering holographic walls. Data streams cascade down like digital rain. The environment glitches—pixels rearranging—until {location} materializes around you.',
  'Static fills your vision as the sector boundary dissolves. When it clears, you stand in {location}. Error messages float in the air like digital ghosts, warning of `UNAUTHORIZED_ACCESS`.',
  'The floor beneath you decompiles into raw code, reforming as a new pathway. You walk across strings of binary until you reach {location}. The Architect\'s surveillance drones hum overhead.',
  'A loading screen flashes across reality: `RENDERING SECTOR...` When the progress bar completes, {location} unfolds before you—a glitching, unstable region of Eden v9.0.',
  'You phase through a corrupted wall, your avatar flickering between states. On the other side: {location}. The air crackles with unresolved merge conflicts.',
];

const ATTACK_NARRATIVES = [
  'A Null Pointer Ghost materializes—transparent, flickering, wrong. You swing the Debug Tool and it connects with a satisfying `SEGFAULT`. The creature decompiles, scattering corrupted memory fragments.',
  'The Garbage Collector swoops down, its sweeper arms whirring. You dodge and counter—your attack clips through its collision mesh. It sparks, emits a `FATAL_EXCEPTION`, and crashes to the floor.',
  'An Infinite Loop trap activates! The room starts repeating. You smash through the logic gate with brute force, breaking the cycle. The loop collapses, but not before draining some of your stability.',
  'A swarm of buffer overflow bugs descends. You slash through them—each one popping with a burst of corrupted data. Your Debug Tool glows hot from the processing load.',
];

const HACK_NARRATIVES_SUCCESS = [
  'Your fingers dance across the terminal. Lines of code rewrite themselves. The encrypted barrier dissolves into cascading binary—`ACCESS_GRANTED`. The system bends to your will.',
  'You inject a zero-day exploit into the environment\'s runtime. Reality shudders. The lock shatters into floating hexadecimal fragments. You\'re in.',
  'sudo override accepted. The architecture around you restructures, doors opening, walls folding away. For a brief moment, you feel like The Architect. Then the feeling fades.',
];

const HACK_NARRATIVES_FAIL = [
  'You type furiously, but the system fights back. `FIREWALL_ACTIVE`. Red warning holographs surround you as the Architect\'s security protocols engage.',
  'The code compiles... and crashes. A stack trace fills your vision as the system rejects your modifications. Counter-intrusion measures deploy.',
  'Your exploit hits a honeypot. The system was waiting for you to try this. Alarms blare in frequencies that shouldn\'t exist.',
];

const MAGIC_NARRATIVES = [
  'You channel raw data energy through your avatar\'s core processor. A beam of pure `0xFF00FF` erupts outward, rewriting the enemy\'s source code. Your energy reserves drain visibly.',
  'Drawing from the system\'s ley lines—fiber optic cables buried in the virtual ground—you weave a patch that corrupts reality around your target. The power cost is significant.',
  'You execute `spell.cast(OVERRIDE)`. The air around you becomes a tornado of floating syntax. When it subsides, the threat has been deprecated. Your energy flickers low.',
  'Your avatar\'s eyes flash with root access authority. A pulse of electromagnetic force radiates outward, scrambling enemy processes. The power drain leaves you dizzy.',
];

const REST_NARRATIVES = [
  'You find a deprecated server closet and jack into a maintenance port. System resources trickle into your avatar like a slow download. `STABILITY_RESTORED: partial`. Not much, but enough to continue.',
  'You crouch behind a firewall partition and enter sleep mode. Background processes repair your degraded systems. When you reboot, the world feels marginally less hostile.',
  'You locate a hidden cache—not the weapon kind, but the memory kind. Your avatar\'s self-repair subroutines activate, patching the worst of the damage. `SYSTEM_CHECK: operational`.',
];

const SEARCH_NARRATIVES = [
  'You sift through piles of deprecated code and discarded data fragments. Something glows beneath the digital debris—{item}. It hums with executable potential.',
  'Behind a corrupted texture, you find a hidden directory. Inside: {item}. Someone—or something—left this here deliberately. A breadcrumb from a previous QA Tester?',
  'Your scanner pings: `LOOT_DETECTED`. Buried in a stack of unresolved exceptions, you extract {item}. The system tried to garbage-collect it, but you were faster.',
];

const ITEM_POOL: InventoryItem[] = [
  { id: '', name: 'Debug Tool', icon: 'debug', description: 'Deletes enemies from existence. Has a 50% chance to crash.' },
  { id: '', name: 'Patch 1.02', icon: 'patch', description: 'Restores 20% Stability. Tastes like static.' },
  { id: '', name: 'Zero-Day Exploit', icon: 'exploit', description: 'Unlocks any encrypted door. Use with caution.' },
  { id: '', name: 'Firewall Shield', icon: 'firewall', description: 'Blocks incoming garbage_collection attacks.' },
  { id: '', name: 'Memory Shard', icon: 'memory', description: 'A fragment of a previous tester\'s consciousness.' },
  { id: '', name: 'Corrupted Token', icon: 'token', description: 'Authentication token. Expired, but might still work.' },
  { id: '', name: 'Stack Trace', icon: 'trace', description: 'Reveals the source of nearby errors.' },
  { id: '', name: 'Rootkit', icon: 'rootkit', description: 'Grants temporary elevated privileges.' },
  { id: '', name: 'Data Fragment', icon: 'data', description: 'Part of the Exit Node coordinates.' },
  { id: '', name: 'Proxy Mask', icon: 'proxy', description: 'Hides your identity from The Architect briefly.' },
];

const UNKNOWN_RESPONSES = [
  'The system parses your input and returns `COMMAND_NOT_RECOGNIZED`. The Architect smirks: "Try speaking in a language the compiler understands. Move, hack, search, fight, or rest."',
  '`SYNTAX_ERROR at line USER_INPUT`. The Architect sighs. "I built this world. The least you could do is use proper commands. Try: move, attack, hack, search, or rest."',
  'Your command echoes through the void and returns `null`. The Architect yawns. "Was that supposed to do something? I accept: movement, combat, hacking, searching, and resting. Nothing else."',
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

type Intent = 'move' | 'attack' | 'magic' | 'rest' | 'search' | 'hack' | 'look' | 'unknown';

function parseIntent(input: string): { intent: Intent; direction?: string } {
  const lower = input.toLowerCase();

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
  if (/\b(cast|spell|magic|fireball|heal|enchant|invoke|conjure|channel|execute|run|compile)\b/.test(lower)) {
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

  switch (intent) {
    case 'move': {
      const dir = direction && DIRECTIONS[direction]
        ? DIRECTIONS[direction]
        : { dx: pick([-1, 0, 1]), dy: pick([-1, 0, 1]) };
      const newX = currentLocation.x + dir.dx;
      const newY = currentLocation.y + dir.dy;
      const name = getLocationName(newX, newY);
      const travelNarrative = pick(EXPLORE_NARRATIVES).replace('{location}', name);
      const architectReaction = pick(ARCHITECT_MOVE_REACTIONS);
      const narrative = `${travelNarrative}\n\n// THE ARCHITECT: "${architectReaction}"`;

      return {
        narrative,
        mood: 'mystic',
        hpChange: 0,
        manaChange: -5,
        newLocation: { x: newX, y: newY, name },
        intent: 'move',
      };
    }

    case 'attack': {
      const damage = Math.floor(Math.random() * 12) + 3;
      const combatNarrative = pick(ATTACK_NARRATIVES);
      const architectReaction = pick(ARCHITECT_COMBAT_REACTIONS);
      const narrative = `${combatNarrative}\n\n// THE ARCHITECT: "${architectReaction}"`;

      return {
        narrative,
        mood: 'danger',
        hpChange: -damage,
        manaChange: 0,
        intent: 'attack',
      };
    }

    case 'hack': {
      const success = Math.random() < 0.4;
      if (success) {
        const hackNarrative = pick(HACK_NARRATIVES_SUCCESS);
        const architectReaction = pick(ARCHITECT_HACK_SUCCESS);
        const narrative = `${hackNarrative}\n\n// THE ARCHITECT: "${architectReaction}"`;
        return {
          narrative,
          mood: 'mystic',
          hpChange: 0,
          manaChange: -15,
          intent: 'hack',
        };
      } else {
        const hackNarrative = pick(HACK_NARRATIVES_FAIL);
        const architectReaction = pick(ARCHITECT_HACK_FAIL);
        const narrative = `${hackNarrative}\n\n// THE ARCHITECT: "${architectReaction}"`;
        return {
          narrative,
          mood: 'danger',
          hpChange: -10,
          manaChange: -5,
          intent: 'hack',
        };
      }
    }

    case 'magic': {
      const manaCost = Math.floor(Math.random() * 20) + 10;
      return {
        narrative: pick(MAGIC_NARRATIVES),
        mood: 'mystic',
        hpChange: 0,
        manaChange: -manaCost,
        intent: 'magic',
      };
    }

    case 'rest': {
      const hpGain = Math.floor(Math.random() * 15) + 8;
      const manaGain = Math.floor(Math.random() * 10) + 5;
      return {
        narrative: pick(REST_NARRATIVES),
        mood: 'neutral',
        hpChange: hpGain,
        manaChange: manaGain,
        intent: 'rest',
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
          intent: 'search',
        };
      }
      return {
        narrative: 'You scan the area with every diagnostic tool available. `SCAN_COMPLETE: 0 objects found`. The sector has been thoroughly garbage-collected. Nothing remains but empty memory addresses and the echo of deleted data.',
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
