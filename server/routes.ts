import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { generateGameResponse, generateSpeechAudio } from "./gameAI";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/game/command", async (req, res) => {
    try {
      const { command, locationName, locationX, locationY, hp, mana, recentHistory } = req.body;

      if (!command) {
        return res.status(400).json({ error: "Command is required" });
      }

      const response = await generateGameResponse({
        command,
        locationName: locationName || "Unknown Sector",
        locationX: locationX || 0,
        locationY: locationY || 0,
        hp: hp || 100,
        mana: mana || 100,
        recentHistory: recentHistory || [],
      });

      res.json(response);
    } catch (error) {
      console.error("Error processing game command:", error);
      res.status(500).json({
        narrative: 'The system shudders. `CRITICAL_ERROR: AI_MODULE_TIMEOUT`.\n\n// THE ARCHITECT: "Even I have limits, Asset #404. Try again."',
        mood: "danger",
        hpChange: 0,
        manaChange: 0,
        newItem: null,
        intent: "unknown",
      });
    }
  });

  app.post("/api/game/speak", async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const audioBuffer = await generateSpeechAudio(text);

      if (audioBuffer.length === 0) {
        return res.status(204).send();
      }

      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("Content-Length", audioBuffer.length);
      res.send(audioBuffer);
    } catch (error) {
      console.error("Error generating speech:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
