import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { OpenAIService } from "./services/openai";
import { 
  apiKeyConfigSchema, 
  generateQuestionsSchema, 
  generateJournalSchema,
  reviseJournalSchema,
  generateImageSchema,
  findImageSchema,
  insertJournalEntrySchema 
} from "@shared/schema";

// Helper function to extract themes from journal text
function extractThemesFromText(text: string): string[] {
  // Simple keyword extraction for philosophical themes
  const philosophicalKeywords = [
    'mindfulness', 'reflection', 'wisdom', 'peace', 'growth', 'nature', 
    'contemplation', 'meditation', 'journey', 'discovery', 'inspiration',
    'balance', 'harmony', 'serenity', 'enlightenment', 'understanding'
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  const themes = philosophicalKeywords.filter(keyword => 
    words.some(word => word.includes(keyword) || keyword.includes(word))
  );
  
  // Add some general philosophical search terms if none found
  if (themes.length === 0) {
    themes.push('philosophy', 'reflection', 'contemplation');
  }
  
  return themes.slice(0, 3); // Limit to top 3 themes
}

// Function to search Unsplash for free images
async function searchUnsplashImages(query: string): Promise<any[]> {
  try {
    // Using Unsplash's public API endpoint for search
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      {
        headers: {
          'Authorization': 'Client-ID your-unsplash-access-key' // This would need to be set up
        }
      }
    );
    
    if (!response.ok) {
      // Fallback to a curated list of philosophical images
      return getFallbackPhilosophicalImages(query);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    // Return fallback images if API fails
    return getFallbackPhilosophicalImages(query);
  }
}

// Fallback philosophical images when API is not available
function getFallbackPhilosophicalImages(query: string): any[] {
  const fallbackImages = [
    {
      urls: { regular: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' },
      user: { name: 'Unsplash Community' },
      description: 'Peaceful mountain landscape for reflection',
      alt_description: 'Mountain view representing contemplation'
    },
    {
      urls: { regular: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800' },
      user: { name: 'Unsplash Community' },
      description: 'Forest path symbolizing life journey',
      alt_description: 'Forest path for philosophical reflection'
    },
    {
      urls: { regular: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800' },
      user: { name: 'Unsplash Community' },
      description: 'Serene lake representing inner peace',
      alt_description: 'Calm lake for meditation and reflection'
    }
  ];
  
  // Return a random image from the fallback collection
  return [fallbackImages[Math.floor(Math.random() * fallbackImages.length)]];
}

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

  // Revise journal entry based on user feedback
  app.post("/api/revise-journal", async (req, res) => {
    try {
      const { apiKey, currentEntry, revisionPrompt } = reviseJournalSchema.parse(req.body);
      const openaiService = new OpenAIService(apiKey);
      const revisedJournal = await openaiService.reviseJournalEntry(currentEntry, revisionPrompt);
      
      res.json(revisedJournal);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to revise journal entry" 
      });
    }
  });

  // Generate image based on journal content
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { apiKey, journalEntry } = generateImageSchema.parse(req.body);
      const openaiService = new OpenAIService(apiKey);
      const imageResponse = await openaiService.generateImageFromJournal(journalEntry);
      
      res.json(imageResponse);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate image" 
      });
    }
  });

  // Find relevant non-copyrighted images from the web
  app.post("/api/find-image", async (req, res) => {
    try {
      const { journalEntry, searchTerms } = findImageSchema.parse(req.body);
      const startTime = Date.now();
      
      // Use provided search terms or extract themes from journal entry
      let searchQuery: string;
      if (searchTerms && searchTerms.trim()) {
        searchQuery = searchTerms.trim();
      } else {
        const extractedThemes = extractThemesFromText(journalEntry);
        searchQuery = extractedThemes.join(' ');
      }
      
      // Search for Creative Commons/royalty-free images
      const searchResults = await searchUnsplashImages(searchQuery);
      
      if (!searchResults || searchResults.length === 0) {
        return res.status(404).json({ 
          message: "No suitable images found for your journal content" 
        });
      }

      // Select the most relevant image
      const selectedImage = searchResults[0];
      const generationTime = (Date.now() - startTime) / 1000;

      const response = {
        imageUrl: selectedImage.urls.regular,
        title: selectedImage.alt_description || selectedImage.description || "Philosophical reflection",
        source: "Unsplash",
        license: "Unsplash License",
        description: selectedImage.description || selectedImage.alt_description || "Image related to your philosophical reflection",
        generationTime,
        type: 'found' as const,
        artistStyle: `Photo by ${selectedImage.user.name}`,
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to find relevant image" 
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
