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

    const prompt = `Based on the following philosophical reflection responses, create a cohesive, thoughtful journal entry that weaves together the insights and themes. The entry should be personal, contemplative, and philosophically rich.

Responses:
${JSON.stringify(responses, null, 2)}

Create a journal entry that:
1. Integrates all the responses into a flowing narrative
2. Connects the philosophical themes
3. Shows personal growth and insight
4. Maintains a reflective, contemplative tone
5. Is LESS THAN 200 words (keep it concise and focused)
6. Include a UNIQUE and SPECIFIC philosophical quote at the end that directly relates to the dominant themes in these particular responses

IMPORTANT: Select a philosophical quote that specifically resonates with the key themes, emotions, and insights expressed in these responses. Consider quotes from various philosophers like Aristotle, Kant, Nietzsche, Sartre, Marcus Aurelius, Lao Tzu, Confucius, Buddha, Rumi, etc. Choose one that feels most relevant to this person's specific reflections today.

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

    // Create a prompt for DALL-E based on the journal content
    const imagePrompt = `Create an abstract, contemplative artwork that visually represents the philosophical themes and emotions in this journal entry. The style should be artistic, thoughtful, and serene - suitable for philosophical reflection. Use warm, muted colors and symbolic elements that capture the essence of personal growth and contemplation. Avoid literal representations and focus on mood, atmosphere, and abstract concepts.

Journal entry themes: ${journalEntry.substring(0, 500)}`;

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
