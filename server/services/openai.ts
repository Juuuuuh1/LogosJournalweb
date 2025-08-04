import OpenAI from "openai";
import type { PhilosophicalQuestion, JournalResponse } from "@shared/schema";

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
5. Is approximately 250-400 words

Return the response in JSON format:
{
  "entry": "The complete journal entry text here..."
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are a philosophical writing assistant who creates beautiful, meaningful journal entries from reflection responses. Write in first person with depth and authenticity."
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
      const generationTime = (Date.now() - startTime) / 1000;
      const wordCount = finalEntry.split(/\s+/).filter((word: string) => word.length > 0).length;

      return {
        finalEntry,
        wordCount,
        generationTime,
      };
    } catch (error) {
      throw new Error(`Failed to synthesize journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
