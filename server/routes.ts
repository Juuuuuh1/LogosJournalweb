import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { OpenAIService } from "./services/openai";
import { 
  apiKeyConfigSchema, 
  generateImageSchema,
  findImageSchema,
  insertJournalEntrySchema,
  journalEntryIdSchema 
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
    'restaurant', 'shopping', 'studying', 'exercise', 'yoga', 'meditation',
    'dog', 'pet', 'weather', 'outside', 'outdoor', 'nature', 'walk'
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
  
  return Array.from(new Set(personalKeywords)).slice(0, 3); // Remove duplicates and limit to top 3
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

// Function to search Unsplash for free images (requires API key setup)
async function searchUnsplashImages(query: string): Promise<any[]> {
  // Always use fallback images as Unsplash API requires proper setup
  return getFallbackPhilosophicalImages(query);
}

// Track used images to avoid repetition per session
const usedImageUrls = new Map<string, Set<string>>();

// Helper function to get or create session image tracking
function getSessionUsedImages(sessionId: string = 'default'): Set<string> {
  if (!usedImageUrls.has(sessionId)) {
    usedImageUrls.set(sessionId, new Set<string>());
  }
  return usedImageUrls.get(sessionId)!;
}

// Fallback philosophical images when API is not available
function getFallbackPhilosophicalImages(query: string, sessionId: string = 'default'): any[] {
  const queryLower = query.toLowerCase();
  const sessionUsedImages = getSessionUsedImages(sessionId);
  
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
      },
      {
        urls: { regular: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'Person walking dog in peaceful park',
        alt_description: 'Dog walking scene representing outdoor enjoyment'
      },
      {
        urls: { regular: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'Beautiful sunny day perfect for outdoor activities',
        alt_description: 'Sunny weather scene for outdoor reflection'
      },
      {
        urls: { regular: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'Dog enjoying nature and fresh air',
        alt_description: 'Pet outdoors representing joy and freedom'
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
      },
      {
        urls: { regular: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'People sitting together in a busy cafe',
        alt_description: 'Cafe scene with multiple people socializing'
      },
      {
        urls: { regular: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'Restaurant atmosphere with diners',
        alt_description: 'People dining together in restaurant setting'
      },
      {
        urls: { regular: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800' },
        user: { name: 'Unsplash Community' },
        description: 'Group of friends having coffee',
        alt_description: 'Multiple people enjoying beverages together'
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
  } else if (queryLower.includes('dog') || queryLower.includes('pet') || queryLower.includes('walk') || queryLower.includes('outside') || queryLower.includes('outdoor') || queryLower.includes('weather')) {
    selectedCategory = 'nature';
  }

  const selectedImages = imageCategories[selectedCategory as keyof typeof imageCategories] || imageCategories.nature;
  
  // Filter out already used images for this session
  const availableImages = selectedImages.filter(img => !sessionUsedImages.has(img.urls.regular));
  
  // If all images in category are used, reset the session
  if (availableImages.length === 0) {
    sessionUsedImages.clear();
    const randomImage = selectedImages[Math.floor(Math.random() * selectedImages.length)];
    sessionUsedImages.add(randomImage.urls.regular);
    return [randomImage];
  }
  
  // Return a random unused image from the selected category
  const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
  sessionUsedImages.add(randomImage.urls.regular);
  return [randomImage];
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
        message: "Invalid API key format" 
      });
    }
  });

  // Note: Question generation and journal synthesis now happen directly from frontend to OpenAI
  // These routes are kept for potential future server-side functionality

  // Generate image based on journal content
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { apiKey, journalEntry } = generateImageSchema.parse(req.body);
      const openaiService = new OpenAIService(apiKey);
      const imageResponse = await openaiService.generateImageFromJournal(journalEntry);
      
      res.json(imageResponse);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to generate image" 
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
        // Extract personal content keywords from journal entry
        const personalKeywords = extractPersonalKeywords(journalEntry);
        const extractedThemes = extractThemesFromText(journalEntry);
        
        // Prioritize personal keywords if found
        if (personalKeywords.length > 0) {
          searchQuery = personalKeywords.join(' ');
        } else {
          searchQuery = extractedThemes.join(' ');
        }
      }
      
      // Try searching for external images first, but always fallback to curated images with session tracking
      const searchResults = await searchUnsplashImages(searchQuery);
      
      if (searchResults && searchResults.length > 0) {
        // Use external search results if available
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
        return;
      }

      // Always fallback to curated images with session tracking
      const sessionId = req.headers['x-session-id'] as string || `session_${Date.now()}`;
      const fallbackResults = getFallbackPhilosophicalImages(searchQuery, sessionId);
      const generationTime = (Date.now() - startTime) / 1000;
      
      if (fallbackResults && fallbackResults.length > 0) {
        const selectedImage = fallbackResults[0];
        const response = {
          imageUrl: selectedImage.urls.regular,
          title: selectedImage.alt_description || selectedImage.description || "Curated philosophical image",
          source: "Curated Collection",
          license: "Unsplash License",
          description: selectedImage.description || selectedImage.alt_description || "A thoughtfully selected image for reflection",
          generationTime,
          type: 'found' as const,
          artistStyle: `Photo by ${selectedImage.user.name}`,
        };

        res.json(response);
        return;
      }

      // If no images found at all
      res.status(404).json({ 
        message: "No suitable images found for your journal content" 
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to find relevant image" 
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
        message: "Failed to fetch journal entries" 
      });
    }
  });

  // Get specific journal entry
  app.get("/api/journal-entries/:id", async (req, res) => {
    try {
      const { id } = journalEntryIdSchema.parse(req.params);
      const entry = await storage.getJournalEntry(id);
      
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      res.json({ entry });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid journal entry ID" });
      }
      res.status(500).json({ 
        message: "Failed to fetch journal entry" 
      });
    }
  });

  // Proxy endpoint for downloading images (to avoid CORS issues)
  app.get("/api/download-image", async (req, res) => {
    try {
      const { url, filename } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "Image URL is required" });
      }

      // Security: Validate URL to prevent SSRF attacks
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Only allow HTTPS URLs from trusted domains
      const allowedHosts = [
        'oaidalleapiprodscus.blob.core.windows.net', // OpenAI DALL-E images
        'cdn.openai.com', // OpenAI CDN
        'images.unsplash.com', // Unsplash images (if used)
      ];

      if (parsedUrl.protocol !== 'https:') {
        return res.status(400).json({ message: "Only HTTPS URLs are allowed" });
      }

      if (!allowedHosts.includes(parsedUrl.hostname)) {
        return res.status(400).json({ message: "URL domain not allowed" });
      }

      // Fetch the image from the validated external URL
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(404).json({ message: "Image not found or expired" });
      }

      // Validate content type is an image
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        return res.status(400).json({ message: "URL does not point to a valid image" });
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      
      // Validate file size (max 10MB)
      if (imageBuffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "Image file too large" });
      }
      
      // Sanitize filename to prevent path traversal
      const sanitizedFilename = (filename as string || 'image.png')
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/^\.+/, '')
        .substring(0, 100);
      
      // Set appropriate headers for download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
      res.setHeader('Content-Length', imageBuffer.length);
      
      // Send the image buffer
      res.send(imageBuffer);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to download image" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
