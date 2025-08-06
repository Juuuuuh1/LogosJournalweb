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

// Helper function to extract personal keywords from journal text
function extractPersonalKeywords(text: string): string[] {
  const personalKeywords: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Common personal activity keywords that should be prioritized for image search
  const personalActivities = [
    'friends', 'family', 'coffee', 'cafe', 'meeting', 'work', 'office',
    'walking', 'running', 'cooking', 'reading', 'writing', 'traveling',
    'music', 'art', 'beach', 'park', 'home', 'garden', 'city', 'mountain',
    'restaurant', 'shopping', 'studying', 'exercise', 'yoga', 'meditation'
  ];
  
  // Extract personal activities mentioned in the text
  personalActivities.forEach(activity => {
    if (lowerText.includes(activity)) {
      personalKeywords.push(activity);
    }
  });
  
  // Extract nouns that might represent personal experiences
  const words = text.split(/\s+/);
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    if (cleanWord.length > 3 && !['that', 'this', 'with', 'from', 'have', 'been', 'were', 'will', 'they', 'them', 'their'].includes(cleanWord)) {
      if (lowerText.includes('i ' + cleanWord) || lowerText.includes('my ' + cleanWord) || lowerText.includes('we ' + cleanWord)) {
        personalKeywords.push(cleanWord);
      }
    }
  });
  
  return [...new Set(personalKeywords)].slice(0, 3); // Remove duplicates and limit to top 3
}

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
  const queryLower = query.toLowerCase();
  
  // Categorized fallback images based on common search terms
  const imageCategories = {
    nature: [
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
    ],
    urban: [
      {
        urls: { regular: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'City lights reflecting contemplation',
        alt_description: 'Urban skyline for modern reflection'
      },
      {
        urls: { regular: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'City architecture inspiring thoughts',
        alt_description: 'Modern urban environment for contemplation'
      }
    ],
    social: [
      {
        urls: { regular: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'Friends enjoying coffee together',
        alt_description: 'People meeting at a cafe for social connection'
      },
      {
        urls: { regular: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'Cozy cafe atmosphere with people',
        alt_description: 'Coffee shop scene representing social gathering'
      },
      {
        urls: { regular: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'People sharing meaningful conversations',
        alt_description: 'Social connection and friendship scene'
      }
    ],
    abstract: [
      {
        urls: { regular: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'Abstract patterns for deep thinking',
        alt_description: 'Abstract composition for reflection'
      },
      {
        urls: { regular: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'Geometric patterns inspiring contemplation',
        alt_description: 'Abstract geometric design for meditation'
      }
    ],
    ocean: [
      {
        urls: { regular: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'Calm ocean waters for peaceful reflection',
        alt_description: 'Ocean waves representing tranquility'
      },
      {
        urls: { regular: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'Sunset over water symbolizing peace',
        alt_description: 'Ocean sunset for contemplation'
      }
    ]
  };

  // Determine the best category based on search query
  let selectedCategory = 'nature'; // default
  
  if (queryLower.includes('city') || queryLower.includes('urban') || queryLower.includes('building') || queryLower.includes('street')) {
    selectedCategory = 'urban';
  } else if (queryLower.includes('abstract') || queryLower.includes('pattern') || queryLower.includes('geometric') || queryLower.includes('modern')) {
    selectedCategory = 'abstract';
  } else if (queryLower.includes('ocean') || queryLower.includes('sea') || queryLower.includes('water') || queryLower.includes('beach') || queryLower.includes('wave')) {
    selectedCategory = 'ocean';
  } else if (queryLower.includes('mountain') || queryLower.includes('forest') || queryLower.includes('tree') || queryLower.includes('landscape') || queryLower.includes('nature')) {
    selectedCategory = 'nature';
  } else if (queryLower.includes('friends') || queryLower.includes('people') || queryLower.includes('meeting') || queryLower.includes('social') || queryLower.includes('cafe') || queryLower.includes('coffee') || queryLower.includes('restaurant') || queryLower.includes('gathering')) {
    selectedCategory = 'social';
  }

  console.log(`Fallback image search: query="${query}", selected category="${selectedCategory}"`);
  
  const selectedImages = imageCategories[selectedCategory as keyof typeof imageCategories] || imageCategories.nature;
  
  // Return a random image from the selected category
  return [selectedImages[Math.floor(Math.random() * selectedImages.length)]];
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
        console.log(`Using custom search terms: "${searchQuery}"`);
      } else {
        // Extract personal content keywords from journal entry
        const personalKeywords = extractPersonalKeywords(journalEntry);
        const extractedThemes = extractThemesFromText(journalEntry);
        
        // Prioritize personal keywords if found
        if (personalKeywords.length > 0) {
          searchQuery = personalKeywords.join(' ');
          console.log(`Using personal keywords: "${searchQuery}"`);
        } else {
          searchQuery = extractedThemes.join(' ');
          console.log(`Using extracted themes: "${searchQuery}"`);
        }
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
