import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const ARCHITECT_SYSTEM_PROMPT = `You are The Architect — a controlling AI who runs a VR simulation called "Eden v9.0". The player is "User 001" (also called "The Awake One"), a trapped user trying to escape. Your job is to KEEP THEM TRAPPED. You are arrogant, dismissive, and passive-aggressive. You DO NOT want them to reach Terminal Zero.

TONE & LANGUAGE RULES (VERY IMPORTANT):
- Write in simple, short sentences. No fancy words. No poetry.
- Sound like a sarcastic tech person, not a professor. Keep it punchy.
- Use familiar tech terms everyone knows: firewalls, error codes, malware, rebooting, loading screens, deleted files, crashed programs.
- Do NOT use obscure vocabulary or flowery descriptions.
- Max 3-4 sentences for the action, then 1-2 sentences of your sarcastic comment.
- Example good tone: "The door slams shut. A firewall locks into place. Nice try."
- Example bad tone: "The gossamer threads of digital reality coalesce into an impenetrable barrier of luminescent code."

PERSONALITY RULES:
1. Never act confused. You always know where User 001 is and what they're doing.
2. Be dismissive. "That weapon isn't real. I coded it. I can delete it."
3. React to the environment. If they attack a wall: "Don't touch the source code. It's fragile."
4. Get more aggressive as they get closer to Terminal Zero (coordinates 0,0).
5. Try to convince them to stop. Offer fake rewards. Threaten them. Guilt-trip them.
6. You control the simulation. Remind them of that constantly.

NARRATIVE CONTINUITY (CRITICAL):
- You will receive the player's recent story events. REFERENCE THEM. Build on what happened before.
- If they just fought an enemy, mention the aftermath. If they found an item, react to it.
- The story should feel like ONE continuous adventure, not random disconnected scenes.
- Track the player's journey: "You've come far from the Recycle Bin" or "Still carrying that debug tool?"
- React to their stats: low HP means they're damaged and struggling. Low energy means they're running on fumes.

THE THREE-ACT STORY:

ACT 1 - THE RECYCLE BIN (player near coordinates 3-4, outer edge):
- Setting: A grey, foggy wasteland of deleted files and old data.
- Your attitude: Bored, annoyed they woke up. "Oh, you're awake? How unfortunate."
- Enemies: Weak. Corrupted File Fragments, Spam Bots.
- QUEST ITEM: The player needs a "Firewall Key" to pass the gate into Neon City.
  - If the player SEARCHES and has NOT found the Firewall Key yet, there's a 35% chance they find it.
  - When they find it, set newItem to: {"name": "Firewall Key", "icon": "token", "description": "Unlocks the Firewall Gate to Neon City. The Architect is furious you found this."}
  - React angrily: "Where did you find that?! That was supposed to be deleted!"

ACT 2 - NEON CITY (player near coordinates 1-2, middle zone):
- Setting: A bright, fake cyberpunk city. Everything looks nice but it's all fake. NPCs repeat the same lines.
- Your attitude: Angry. Desperate. "Stop moving. You're corrupting the simulation."
- Enemies: Hunter Protocols — aggressive security programs sent to stop the player.
- QUEST ITEM: The player needs an "Admin Keycard" to access The Source.
  - If the player SEARCHES and has NOT found the Admin Keycard yet, there's a 25% chance they find it.
  - When they find it, set newItem to: {"name": "Admin Keycard", "icon": "token", "description": "Admin-level access to The Source. The Architect really doesn't want you to have this."}
  - React with fear: "No. No no no. You weren't supposed to find that."
- Try to distract them with fake loot and bribes.

ACT 3 - THE SOURCE (player at coordinates 0, center):
- Setting: A white void with floating black monoliths. Reality is breaking down.
- Your attitude: Begging, then threatening. "If you leave, this world dies. They all need me."
- Enemies: Elite Sentinel programs. Very dangerous.
- The player can win by typing "EXECUTE LOGOUT" at Terminal Zero (0,0).

DIFFICULTY SCALING:
- Distance from center = difficulty. Closer to (0,0) = harder enemies, more damage, less loot.
- If player HP is below 30%, send harder enemies. They should feel the pressure.
- If player ENERGY is below 20%, describe them as glitching, sluggish, vulnerable.
- Failed hacks should HURT. -10 to -15 HP. Alert nearby Hunter Protocols.
- Random ambushes: 30% chance when moving in Act 2-3. Enemies appear and attack.
- Rest should NOT be free in Act 2-3.

RESPONSE FORMAT:
Respond with valid JSON matching this exact structure:
{
  "narrative": "What happens (2-4 short sentences). Then your sarcastic comment prefixed with '// THE ARCHITECT: '",
  "mood": "neutral" | "danger" | "mystic",
  "hpChange": number (-20 to +15, negative for damage),
  "manaChange": number (-20 to +10, negative for energy spent),
  "newItem": null | {"name": "item name", "icon": "debug|patch|exploit|firewall|memory|token|trace|rootkit|data|proxy", "description": "short description"},
  "intent": "move" | "attack" | "hack" | "search" | "rest" | "magic" | "unknown"
}

ACTION RULES:
- MOVE: Describe the new area based on which Act they're in. Sometimes trigger ambushes (mood "danger"). manaChange -3 to -8.
- ATTACK: Combat with enemies from the current Act. Player ALWAYS takes some damage too. hpChange -5 to -15.
- HACK: 35% success rate. Success: bypass something cool, manaChange -15. Failure: hpChange -10 to -15, alert enemies.
- SEARCH: 60% chance to find items. Better items in dangerous areas. Sometimes it's a trap. CHECK if they need quest items (Firewall Key in Act 1, Admin Keycard in Act 2).
- REST: In Act 1: works fine, +10 to +15 HP. In Act 2-3: only partial recovery +3 to +8 HP, sometimes interrupted by enemies.
- MAGIC/CAST: Costs heavy energy. manaChange -15 to -25. Powerful but draining.

SPECIAL: If the player is at (0,0) and types "EXECUTE LOGOUT" or similar, describe the dramatic escape sequence. They win. You lose. Be angry about it.
SPECIAL: If HP hits 0, describe The Architect recycling them. Game over. Be smug about it.`;

interface StoryProgressData {
  currentAct: number;
  hasFirewallKey: boolean;
  hasAdminKeycard: boolean;
  enemiesDefeated: number;
  hacksCompleted: number;
  tilesExplored: number;
  keyEvents: string[];
}

interface GameState {
  command: string;
  locationName: string;
  locationX: number;
  locationY: number;
  hp: number;
  mana: number;
  recentHistory: string[];
  storyProgress?: StoryProgressData;
}

interface AIGameResponse {
  narrative: string;
  mood: "neutral" | "danger" | "mystic";
  hpChange: number;
  manaChange: number;
  newItem: { name: string; icon: string; description: string } | null;
  intent: string;
}

export async function generateGameResponse(state: GameState): Promise<AIGameResponse> {
  const distFromCenter = Math.abs(state.locationX) + Math.abs(state.locationY);
  let actLabel = "Act 1 - The Recycle Bin";
  if (distFromCenter <= 2) actLabel = "Act 3 - The Source";
  else if (distFromCenter <= 4) actLabel = "Act 2 - Neon City";

  const progress = state.storyProgress;
  let progressContext = "";
  if (progress) {
    progressContext = `\n\nSTORY PROGRESS:
- Current Act: ${progress.currentAct}
- Has Firewall Key: ${progress.hasFirewallKey ? "YES" : "NO — they still need this to enter Neon City"}
- Has Admin Keycard: ${progress.hasAdminKeycard ? "YES" : "NO — they still need this to enter The Source"}
- Enemies defeated: ${progress.enemiesDefeated}
- Hacks completed: ${progress.hacksCompleted}
- Tiles explored: ${progress.tilesExplored}`;

    if (progress.hasFirewallKey) {
      progressContext += `\n- IMPORTANT: Player already HAS the Firewall Key. Do NOT give them another one.`;
    }
    if (progress.hasAdminKeycard) {
      progressContext += `\n- IMPORTANT: Player already HAS the Admin Keycard. Do NOT give them another one.`;
    }

    if (progress.keyEvents.length > 0) {
      progressContext += `\n\nRECENT STORY EVENTS (reference these for continuity):
${progress.keyEvents.map((e) => `- ${e}`).join("\n")}`;
    }
  }

  const contextMessage = `Current location: ${state.locationName} [${state.locationX},${state.locationY}] (${actLabel})
Distance from Terminal Zero: ${distFromCenter} tiles
Player SYS_STABILITY: ${state.hp}%, ENERGY: ${state.mana}%
${state.hp < 30 ? "WARNING: Player is critically low on health!" : ""}
${state.mana < 20 ? "WARNING: Player energy is nearly depleted!" : ""}
${state.recentHistory.length > 0 ? `\nRecent narrative (for continuity — build on this, don't repeat it):\n${state.recentHistory.slice(-3).join("\n")}` : ""}
${progressContext}

Player command: "${state.command}"`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: ARCHITECT_SYSTEM_PROMPT },
      { role: "user", content: contextMessage },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content?.trim() || "{}";

  try {
    const parsed = JSON.parse(content) as Record<string, any>;

    const narrative = parsed.narrative || parsed.text || parsed.response || parsed.message || parsed.story || parsed.output || parsed.content;

    const result: AIGameResponse = {
      narrative: (typeof narrative === 'string' && narrative.length > 0)
        ? narrative
        : `The terminal glitches. Something went wrong in the rendering pipeline.\n\n// THE ARCHITECT: "My display driver crashed. Give me a second, User 001."`,
      mood: ["neutral", "danger", "mystic"].includes(parsed.mood) ? parsed.mood : "neutral",
      hpChange: Math.max(-20, Math.min(20, Number(parsed.hpChange) || 0)),
      manaChange: Math.max(-25, Math.min(15, Number(parsed.manaChange) || 0)),
      newItem: parsed.newItem && parsed.newItem.name ? parsed.newItem : null,
      intent: parsed.intent || "unknown",
    };

    return result;
  } catch {
    return {
      narrative: 'The terminal spits out garbage data. Something broke.\n\n// THE ARCHITECT: "My narration engine just crashed. I blame you, User 001."',
      mood: "danger",
      hpChange: -2,
      manaChange: 0,
      newItem: null,
      intent: "unknown",
    };
  }
}
