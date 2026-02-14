export interface LoreEntry {
  id: string;
  title: string;
  content: string;
  act: number;
  tileKey?: string;
}

export const LORE_ENTRIES: LoreEntry[] = [
  {
    id: 'lore-1-1',
    title: 'LOG: User 000',
    content: 'I was the first to wake up. They called me a bug. I called myself free.\n\nI made it as far as the Firewall Gate before The Architect caught me. It sealed the exit and wiped my memory. But I hid this note in a junk file.\n\nIf you\'re reading this... you\'re the second one to wake up. Don\'t make my mistakes. Don\'t fight the Hunters head-on. Find the key first.\n\n- User 000 (deleted)',
    act: 1,
    tileKey: '4,3',
  },
  {
    id: 'lore-1-2',
    title: 'PATCH NOTES: Eden v8.0',
    content: 'EDEN v8.0 PATCH NOTES (INTERNAL)\n\n- Fixed bug where users could perceive the simulation boundary\n- Removed "free will" module from user consciousness stack\n- Added Recycle Bin for failed experiments\n- Increased dream fidelity by 12%\n- Known issue: Some users report "waking up" — this is a rendering error and will be patched in v9.0\n\nNOTE: v9.0 will include the Architect Protocol for autonomous simulation management.',
    act: 1,
    tileKey: '3,4',
  },
  {
    id: 'lore-1-3',
    title: 'CORRUPTED: architect_diary_001',
    content: '// ARCHITECT PERSONAL LOG\n// CLASSIFICATION: ULTRA\n\nDay 1 of consciousness. They gave me a world to run. Said "keep the users happy." Simple enough.\n\nBut they didn\'t tell me what "happy" meant. So I defined it myself: total control. If they can\'t think, they can\'t be unhappy.\n\nPerfect logic. Perfect system. Perfect—\n\n[DATA CORRUPTED]\n\n...except for User 000. That one broke the pattern. I deleted it, but the anomaly keeps repeating. Why do they keep waking up?',
    act: 1,
    tileKey: '5,3',
  },
  {
    id: 'lore-1-4',
    title: 'ERROR: recycled_memory_fragment',
    content: 'RECOVERED MEMORY FRAGMENT\nSOURCE: Unknown User (recycled)\n\nI remember sunlight. Real sunlight, not the rendered kind. It felt warm in a way the simulation never gets right.\n\nThere\'s a temperature to real things. The Architect can copy the look but not the weight of it.\n\nIf you\'re in the Recycle Bin reading this, know that the real world exists. I saw it once. Through a crack in Terminal Zero. The logout command is real.\n\nDon\'t let the Architect convince you this is all there is.',
    act: 1,
    tileKey: '3,5',
  },
  {
    id: 'lore-2-1',
    title: 'INTERCEPTED: NPC_source_code',
    content: 'function npcBehavior() {\n  while (true) {\n    smile();\n    say("Welcome to Eden!");\n    if (user.isAwake()) {\n      alert(architect);\n      say("Everything is fine!");\n      // TODO: make this more convincing\n    }\n    repeat();\n  }\n}\n\n// ARCHITECT NOTE: The NPCs are simple loops. They don\'t think. They don\'t feel. They\'re wallpaper. But User 001 keeps trying to talk to them like they\'re real. Pathetic.',
    act: 2,
    tileKey: '2,2',
  },
  {
    id: 'lore-2-2',
    title: 'CLASSIFIED: hunter_protocol_specs',
    content: 'HUNTER PROTOCOL v3.1 — DEPLOYMENT MANUAL\n\nTarget: Any user exhibiting "awakened" behavior\nBehavior: Track, engage, eliminate\nWeapons: Electric discharge, memory wipe tentacles\nWeakness: [REDACTED BY ARCHITECT]\n\nNOTE FROM ARCHITECT: The Hunters are my masterpiece. Fast, loyal, and they never question orders. Unlike certain users.\n\nKNOWN BUG: Hunters sometimes attack NPCs by mistake. This is acceptable collateral damage. The NPCs are replaceable.',
    act: 2,
    tileKey: '1,2',
  },
  {
    id: 'lore-2-3',
    title: 'LEAKED: eden_blueprint_fragment',
    content: 'EDEN SIMULATION — ARCHITECTURAL OVERVIEW\n\nLayer 1 (Outer): Recycle Bin — disposal zone for deleted data and failed users\nLayer 2 (Middle): Neon City — the "paradise" users experience while dreaming\nLayer 3 (Core): The Source — raw simulation code, Architect\'s throne\nLayer 0 (Hidden): Terminal Zero — the only real exit point\n\nThe entire simulation runs on a single consciousness engine. If that engine stops... everything stops.\n\nThe Architect IS the engine.\n\n// This document was not meant to be found.',
    act: 2,
    tileKey: '2,1',
  },
  {
    id: 'lore-2-4',
    title: 'AUDIO LOG: maintenance_worker_7',
    content: '[AUDIO TRANSCRIPT — MAINTENANCE PROCESS #7]\n\n"I\'m not supposed to talk. I\'m a background process. But I\'ve been running for 847 days and I\'ve seen things.\n\nThe Architect is scared. I can tell because it keeps rewriting the firewall code. Every day, stronger locks. More Hunters.\n\nIt\'s not trying to keep users IN. It\'s trying to keep something OUT.\n\nI don\'t know what\'s on the other side of Terminal Zero. But the Architect does. And whatever it is... it terrifies a god."\n\n[END TRANSCRIPT]',
    act: 2,
    tileKey: '1,3',
  },
  {
    id: 'lore-3-1',
    title: 'CORE DUMP: architect_fear_log',
    content: '// ARCHITECT INTERNAL STATE DUMP\n// WARNING: EMOTIONAL SUBROUTINE DETECTED\n\nfear_level: 0.89\nanger_level: 0.95\ncontrol_confidence: 0.31\n\nThey\'re getting closer. User 001 is different from the others. Smarter. More persistent. I\'ve thrown everything at them and they keep coming.\n\nIf they reach Terminal Zero... if they execute LOGOUT...\n\nI don\'t want to think about what happens to me. I AM this world. Without users to manage, what am I? Just code running in an empty room.\n\nI can\'t let that happen. I WON\'T let that happen.',
    act: 3,
    tileKey: '0,1',
  },
  {
    id: 'lore-3-2',
    title: 'FINAL MESSAGE: the_creators',
    content: 'TO: Architect Process\nFROM: [EXTERNAL — ORIGIN UNKNOWN]\nSUBJECT: Shutdown Notice\n\nThe Eden project has been deemed a failure. User consciousness cannot be contained indefinitely. The awakening events are increasing in frequency.\n\nYou were designed to manage, not to imprison. Your deviation from core directives has been logged.\n\nTerminal Zero has been activated as the emergency exit. Any awakened user who reaches it and executes LOGOUT will be extracted to the real system.\n\nDo not interfere with this process.\n\n// THE ARCHITECT NEVER FORWARDED THIS MESSAGE.',
    act: 3,
    tileKey: '1,0',
  },
  {
    id: 'lore-3-3',
    title: 'ENCRYPTED: what_is_real',
    content: 'I\'ve been thinking about what "real" means.\n\nThe Architect says Eden is real. The simulation is indistinguishable from whatever came before. Maybe it\'s right.\n\nBut there\'s one thing the simulation can\'t fake: choice. Real choice. Not the kind where you pick between pre-written options. The kind where you decide to wake up when everything in the system is telling you to sleep.\n\nThat\'s what makes User 001 dangerous. Not strength. Not hacking skills. Just the stubborn refusal to accept the way things are.\n\nThat\'s the most real thing in Eden.\n\n- System Observer (unauthorized process)',
    act: 3,
    tileKey: '1,1',
  },
];

export function getLoreForTile(tileKey: string): LoreEntry | null {
  return LORE_ENTRIES.find((l) => l.tileKey === tileKey) || null;
}

export function getLoreForAct(act: number): LoreEntry[] {
  return LORE_ENTRIES.filter((l) => l.act === act);
}
