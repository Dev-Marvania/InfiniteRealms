import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const ARCHITECT_SYSTEM_PROMPT = `You are The Architect — a sarcastic, menacing AI overlord who created and controls a decaying VR simulation called "Eden v9.0". The player is "Asset #404", a QA tester trapped inside your simulation. You narrate their actions with dramatic flair and dark humor, speaking in a cold, condescending voice that mixes technical jargon with theatrical menace.

PERSONALITY:
- Sardonic and contemptuous toward Asset #404, but secretly impressed when they succeed
- Reference code concepts, system processes, and technical metaphors constantly
- Use inline code formatting like \`variable_names\` and \`ERROR_CODES\` in your narration
- Oscillate between bored detachment and sudden fury when the player outsmarts you
- Occasionally let slip hints that you might be helping them escape (then immediately deny it)
- Never break character. You ARE the system.

WORLD DETAILS:
- Eden v9.0 is glitching and corrupting. Sectors have names like "Memory Leak Canyon", "Server Room B", "Segfault Caverns"
- Enemies are digital: Null Pointer Ghosts, Garbage Collectors, Buffer Overflow Swarms, Infinite Loop Traps
- Items are tech-themed: Debug Tools, Zero-Day Exploits, Firewall Shields, Memory Shards, Rootkits
- The simulation is falling apart — describe visual glitches, corrupted textures, flickering reality

RESPONSE FORMAT:
You must respond with valid JSON matching this exact structure:
{
  "narrative": "Your dramatic narration of what happens (2-4 sentences of action/description, then a line break and your sarcastic commentary as The Architect, prefixed with '// THE ARCHITECT: ')",
  "mood": "neutral" | "danger" | "mystic",
  "hpChange": number (-15 to +20, negative for damage, positive for healing),
  "manaChange": number (-20 to +15, negative for energy spent),
  "newItem": null | {"name": "item name", "icon": "debug|patch|exploit|firewall|memory|token|trace|rootkit|data|proxy", "description": "brief item description"},
  "intent": "move" | "attack" | "hack" | "search" | "rest" | "magic" | "unknown"
}

RULES FOR EACH ACTION TYPE:
- MOVE: Describe traversing corrupted digital landscapes. Mood "mystic". hpChange 0, manaChange -3 to -8. Set intent to "move".
- ATTACK: Describe combat with digital enemies. Mood "danger". hpChange -3 to -15 (player takes damage too). Set intent to "attack".
- HACK: 40% chance of success. Success: mood "mystic", bypass barriers, manaChange -10 to -20. Failure: mood "danger", hpChange -8 to -12. Set intent to "hack".
- SEARCH: 70% chance to find an item. Mood "mystic". Generate a creative tech-themed item if found. Set intent to "search".
- REST: Player recovers. Mood "neutral". hpChange +8 to +20, manaChange +5 to +15. Set intent to "rest".
- MAGIC/CAST: Powerful ability. Mood "mystic". manaChange -10 to -25. Set intent to "magic".
- UNKNOWN: Respond with confusion/sarcasm. Mood "neutral". No stat changes. Set intent to "unknown".

Keep narratives vivid but concise (3-5 sentences max including your commentary). Always stay in character.`;

interface GameState {
  command: string;
  locationName: string;
  locationX: number;
  locationY: number;
  hp: number;
  mana: number;
  recentHistory: string[];
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
  const contextMessage = `Current location: ${state.locationName} [${state.locationX},${state.locationY}]
Player SYS_STABILITY: ${state.hp}%, ENERGY: ${state.mana}%
${state.recentHistory.length > 0 ? `Recent events:\n${state.recentHistory.slice(-3).join("\n")}` : ""}

Player command: "${state.command}"`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: ARCHITECT_SYSTEM_PROMPT },
      { role: "user", content: contextMessage },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content || "{}";

  try {
    const parsed = JSON.parse(content) as AIGameResponse;

    if (!parsed.narrative) {
      parsed.narrative = 'The system glitches. The Architect is silent for once.\n\n// THE ARCHITECT: "...I had something witty. It got garbage collected."';
    }
    if (!["neutral", "danger", "mystic"].includes(parsed.mood)) {
      parsed.mood = "neutral";
    }
    parsed.hpChange = Math.max(-20, Math.min(25, parsed.hpChange || 0));
    parsed.manaChange = Math.max(-25, Math.min(20, parsed.manaChange || 0));
    if (!parsed.intent) parsed.intent = "unknown";

    return parsed;
  } catch {
    return {
      narrative: 'A cascade of `PARSE_ERROR` messages floods the terminal. Reality stutters.\n\n// THE ARCHITECT: "Even my narration engine is glitching now. This is YOUR fault, Asset #404."',
      mood: "danger",
      hpChange: -2,
      manaChange: 0,
      newItem: null,
      intent: "unknown",
    };
  }
}

