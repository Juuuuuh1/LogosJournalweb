import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { OpenAIService } from "./services/openai";
import { 
  apiKeyConfigSchema, 
  generateQuestionsSchema, 
  generateJournalSchema,
  insertJournalEntrySchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Validate OpenAI API Key
  app.post("/api/validate-key", async (req, res) => {
    try {
      const { apiKey } = apiKeyConfigSchema.parse(req.body);
      const openaiService = new OpenAIService(apiKey);
      const isValid = await openaiService.validateApiKey();
      
      res.json({ valid: isValid });
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid request" 
      });
    }
  });

  // Generate philosophical questions
  app.post("/api/generate-questions", async (req, res) => {
    try {
      const { apiKey } = generateQuestionsSchema.parse(req.body);
      const openaiService = new OpenAIService(apiKey);
      const questions = await openaiService.generatePhilosophicalQuestions();
      
      res.json({ questions });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate questions" 
      });
    }
  });

  // Generate journal entry from responses
  app.post("/api/generate-journal", async (req, res) => {
    try {
      const { apiKey, responses } = generateJournalSchema.parse(req.body);
      const openaiService = new OpenAIService(apiKey);
      const journalResponse = await openaiService.synthesizeJournalEntry(responses);
      
      // Save to storage
      const journalEntry = await storage.createJournalEntry({
        date: new Date().toISOString().split('T')[0],
        questions: [], // Could store the original questions if needed
        responses,
        finalEntry: journalResponse.finalEntry,
      });
      
      res.json({ 
        ...journalResponse,
        entryId: journalEntry.id 
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate journal entry" 
      });
    }
  });

  // Get recent journal entries
  app.get("/api/journal-entries", async (req, res) => {
    try {
      const entries = await storage.getJournalEntriesByDate(5);
      res.json({ entries });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch journal entries" 
      });
    }
  });

  // Get specific journal entry
  app.get("/api/journal-entries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const entry = await storage.getJournalEntry(id);
      
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      res.json({ entry });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch journal entry" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
