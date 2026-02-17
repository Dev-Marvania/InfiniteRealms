import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { generateGameResponse } from "./gameAI";

const COMMAND_MAX_LENGTH = 500;
const LOCATION_NAME_MAX_LENGTH = 100;
const MAX_RECENT_HISTORY = 10;
const HISTORY_ENTRY_MAX_LENGTH = 500;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

function getRateLimitKey(req: Request): string {
  const forwarded = req.header("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.ip || "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

function sanitizeString(input: unknown, maxLength: number): string {
  if (typeof input !== "string") return "";
  return input.slice(0, maxLength).replace(/[^\x20-\x7E\n\r\t]/g, "").trim();
}

function sanitizeNumber(input: unknown, min: number, max: number, fallback: number): number {
  const num = Number(input);
  if (isNaN(num)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(num)));
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/game/command", async (req: Request, res: Response) => {
    try {
      const clientKey = getRateLimitKey(req);
      if (isRateLimited(clientKey)) {
        return res.status(429).json({
          narrative: 'SYSTEM OVERLOAD. Too many commands. Cool down.\n\n// THE ARCHITECT: "Patience, User 001. Even I have limits."',
          mood: "danger",
          hpChange: 0,
          manaChange: 0,
          newItem: null,
          intent: "unknown",
        });
      }

      const { command, locationName, locationX, locationY, hp, mana, recentHistory } = req.body;

      const sanitizedCommand = sanitizeString(command, COMMAND_MAX_LENGTH);
      if (!sanitizedCommand) {
        return res.status(400).json({ error: "Command is required" });
      }

      const sanitizedHistory = Array.isArray(recentHistory)
        ? recentHistory
            .slice(0, MAX_RECENT_HISTORY)
            .map((entry: unknown) => sanitizeString(entry, HISTORY_ENTRY_MAX_LENGTH))
            .filter((entry: string) => entry.length > 0)
        : [];

      const response = await generateGameResponse({
        command: sanitizedCommand,
        locationName: sanitizeString(locationName, LOCATION_NAME_MAX_LENGTH) || "Unknown Sector",
        locationX: sanitizeNumber(locationX, -10, 10, 0),
        locationY: sanitizeNumber(locationY, -10, 10, 0),
        hp: sanitizeNumber(hp, 0, 100, 100),
        mana: sanitizeNumber(mana, 0, 100, 100),
        recentHistory: sanitizedHistory,
      });

      res.json(response);
    } catch {
      res.status(500).json({
        narrative: 'The system shudders. `CRITICAL_ERROR: AI_MODULE_TIMEOUT`.\n\n// THE ARCHITECT: "Even my systems have limits, User 001. Try again."',
        mood: "danger",
        hpChange: 0,
        manaChange: 0,
        newItem: null,
        intent: "unknown",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
