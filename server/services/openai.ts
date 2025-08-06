import OpenAI from "openai";
import type { PhilosophicalQuestion, JournalResponse, ImageResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generatePhilosophicalQuestions(): Promise<PhilosophicalQuestion[]> {
    const prompt = `Generate 5 philosophical questions for daily reflection. The first question should always be "How was your day?" and the remaining 4 should be diverse philosophical inquiries covering different areas like ethics, metaphysics, epistemology, existentialism, etc.

For each question, provide:
1. A category (e.g., "Moral Philosophy", "Existentialism", "Epistemology")
2. The question text
3. A relevant philosopher quote
4. 4 multiple choice options that represent different philosophical perspectives

Return the response in JSON format with this structure:
{
  "questions": [
    {
      "id": "1",
      "category": "Daily Reflection",
      "text": "How was your day?",
      "philosopherQuote": "\"The unexamined life is not worth living.\" — Socrates",
      "options": ["Fulfilling and meaningful", "Challenging but growth-oriented", "Routine and ordinary", "Difficult and draining"]
    },
    {
      "id": "2",
      "category": "Moral Philosophy",
      "text": "What does it mean to live a good life in your current circumstances?",
      "philosopherQuote": "\"Happiness depends upon ourselves.\" — Aristotle",
      "options": ["Pursuing virtue and moral excellence", "Finding balance between personal and social good", "Living authentically according to my values", "Making meaningful contributions to others"]
    }
  ]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are a philosophical guide who creates thoughtful questions for daily reflection. Focus on deep, meaningful inquiries that promote self-examination and growth."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.questions || [];
    } catch (error) {
      throw new Error(`Failed to generate philosophical questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async synthesizeJournalEntry(responses: Record<string, any>): Promise<JournalResponse> {
    const startTime = Date.now();

    // Extract and prioritize personal written responses
    const personalInsights: string[] = [];
    const multipleChoiceResponses: string[] = [];
    
    Object.values(responses).forEach((response: any) => {
      if (response.customAnswer && response.customAnswer.trim()) {
        personalInsights.push(response.customAnswer.trim());
      } else if (response.selectedOption) {
        multipleChoiceResponses.push(response.selectedOption);
      }
    });

    const prompt = `Based on the following philosophical reflection responses, create a cohesive, thoughtful journal entry that weaves together the insights and themes. The entry should be personal, contemplative, and philosophically rich.

PRIORITIZE PERSONAL WRITTEN RESPONSES: Give significantly more weight and attention to the personal written insights over multiple choice selections when crafting the journal entry.

Personal Written Insights (PRIORITIZE THESE):
${personalInsights.length > 0 ? personalInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n') : 'None provided'}

Multiple Choice Responses (secondary importance):
${multipleChoiceResponses.length > 0 ? multipleChoiceResponses.map((response, i) => `${i + 1}. ${response}`).join('\n') : 'None provided'}

All Responses (for context):
${JSON.stringify(responses, null, 2)}

Create a journal entry that:
1. PRIMARILY focuses on the personal written insights and makes them the centerpiece of the reflection
2. Uses multiple choice responses only as supporting context
3. Integrates the personal thoughts into a flowing, meaningful narrative
4. Connects the philosophical themes from the written responses
5. Shows personal growth and insight based on their own words
6. Maintains a reflective, contemplative tone
7. Is LESS THAN 200 words (keep it concise and focused)
8. Include a UNIQUE and SPECIFIC philosophical quote at the end that directly relates to the dominant themes in the PERSONAL WRITTEN responses

IMPORTANT: If there are personal written insights, make them the heart of the journal entry. The final entry should feel authentic to the person's own voice and thoughts. Select a philosophical quote that specifically resonates with the key themes and emotions expressed in their personal written responses.

Return the response in JSON format:
{
  "entry": "The complete journal entry text here...",
  "philosophicalQuote": "\"Quote text here\" — Philosopher Name"
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are a philosophical writing assistant who creates beautiful, meaningful journal entries from reflection responses. Write in first person with depth and authenticity. Keep entries concise and under 200 words while maintaining philosophical richness. Always include a relevant philosophical quote that resonates with the themes discussed."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const finalEntry = result.entry || "Unable to generate journal entry.";
      const philosophicalQuote = result.philosophicalQuote || "\"The unexamined life is not worth living.\" — Socrates";
      const generationTime = (Date.now() - startTime) / 1000;
      const wordCount = finalEntry.split(/\s+/).filter((word: string) => word.length > 0).length;

      return {
        finalEntry,
        philosophicalQuote,
        wordCount,
        generationTime,
        isDraft: true,
      };
    } catch (error) {
      throw new Error(`Failed to synthesize journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async reviseJournalEntry(currentEntry: string, revisionPrompt: string): Promise<JournalResponse> {
    const startTime = Date.now();

    const prompt = `Please revise the following journal entry based on the user's feedback and instructions.

Current journal entry:
${currentEntry}

User's revision request:
${revisionPrompt}

Create a revised journal entry that:
1. Addresses the user's specific feedback
2. Maintains the philosophical depth and personal reflection
3. Keeps the contemplative, authentic tone
4. Adjusts according to their preferences (word count, tone, style, etc.)
5. Include a FRESH philosophical quote at the end that fits the revised content

IMPORTANT: Based on the revised content and tone, select a NEW philosophical quote that matches the updated themes, mood, and insights. Consider the revision request when choosing the quote - if they asked for more hope, choose an uplifting quote; if they wanted more depth, choose something profound; etc.

Return the response in JSON format:
{
  "entry": "The revised journal entry text here...",
  "philosophicalQuote": "\"Quote text here\" — Philosopher Name"
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are a philosophical writing assistant who revises journal entries based on user feedback. Maintain authenticity and depth while incorporating their specific requests for changes in tone, length, style, or content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const finalEntry = result.entry || "Unable to revise journal entry.";
      const philosophicalQuote = result.philosophicalQuote || "\"The unexamined life is not worth living.\" — Socrates";
      const generationTime = (Date.now() - startTime) / 1000;
      const wordCount = finalEntry.split(/\s+/).filter((word: string) => word.length > 0).length;

      return {
        finalEntry,
        philosophicalQuote,
        wordCount,
        generationTime,
        isDraft: false,
      };
    } catch (error) {
      throw new Error(`Failed to revise journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateImageFromJournal(journalEntry: string): Promise<ImageResponse> {
    const startTime = Date.now();

    // List of famous artists known for various realistic and expressive styles
    const famousArtists = [
      "Leonardo da Vinci", "Vincent van Gogh", "Claude Monet", "Pablo Picasso",
      "Rembrandt van Rijn", "Johannes Vermeer", "Frida Kahlo", "Georgia O'Keeffe",
      "Salvador Dalí", "Edgar Degas", "Pierre-Auguste Renoir", "Paul Cézanne",
      "Henri Matisse", "Gustav Klimt", "Edward Hopper", "Andrew Wyeth",
      "John Singer Sargent", "Caravaggio", "Jean-Baptiste-Siméon Chardin", "Hokusai",
      "Ansel Adams", "Thomas Cole", "Albert Bierstadt", "Caspar David Friedrich"
    ];

    // Randomly select an artist
    const selectedArtist = famousArtists[Math.floor(Math.random() * famousArtists.length)];

    // List of possible subjects for realistic artwork
    const subjects = [
      "a contemplative portrait of a person in thoughtful pose",
      "a serene landscape with rolling hills and soft lighting",
      "a quiet forest scene with dappled sunlight",
      "a peaceful lakeside view at golden hour",
      "an elegant still life with books and flowers",
      "a majestic animal in its natural habitat",
      "a charming old building with weathered architecture",
      "a tranquil garden scene with blooming flowers",
      "a dramatic mountain vista with clouds",
      "a cozy interior scene with warm lighting",
      "a graceful bird in flight or perched peacefully",
      "a weathered tree standing alone in a field",
      "a quiet city street in soft morning light",
      "a peaceful seaside scene with gentle waves"
    ];

    // Randomly select a subject
    const selectedSubject = subjects[Math.floor(Math.random() * subjects.length)];

    // Create a prompt for DALL-E based on the journal content
    const imagePrompt = `Create a beautiful realistic artwork depicting ${selectedSubject} in the distinctive style of ${selectedArtist}. Use warm, contemplative colors including beiges, soft browns, muted golds, and gentle grays that evoke philosophical reflection and inner peace. The composition should capture the artist's characteristic technique, brushwork, and aesthetic approach. NO TEXT, NO LETTERS, NO WORDS, NO SYMBOLS should appear anywhere in this image - only the visual subject matter rendered in the artist's style.

The artwork should convey a sense of contemplation, serenity, and depth that complements philosophical journaling. Focus on ${selectedArtist}'s signature style, color palette, and artistic techniques while depicting this realistic subject.

IMPORTANT: Absolutely no text, writing, letters, or readable symbols of any kind should appear in this image. Only the artistic subject matter.

Emotional essence to capture: ${journalEntry.substring(0, 200)}`;

    try {
      const response = await this.client.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      });

      const imageUrl = response.data[0]?.url;
      const generationTime = (Date.now() - startTime) / 1000;

      return {
        imageUrl: imageUrl || "",
        prompt: imagePrompt,
        generationTime,
        artistStyle: selectedArtist,
      };
    } catch (error) {
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
