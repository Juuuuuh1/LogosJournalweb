import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  questions: jsonb("questions").notNull(),
  responses: jsonb("responses").notNull(),
  finalEntry: text("final_entry"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

// API Request/Response schemas
export const apiKeyConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});

// Note: Question generation and journal schemas moved to frontend
// These were removed as OpenAI calls now happen directly from frontend

export const generateImageSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  journalEntry: z.string().min(1, "Journal entry is required"),
});

export const findImageSchema = z.object({
  journalEntry: z.string().min(1, "Journal entry is required"),
  searchTerms: z.string().optional(),
});

export type ApiKeyConfig = z.infer<typeof apiKeyConfigSchema>;
export type GenerateImageRequest = z.infer<typeof generateImageSchema>;
export type FindImageRequest = z.infer<typeof findImageSchema>;

export interface PhilosophicalQuestion {
  id: string;
  category: string;
  text: string;
  philosopherQuote: string;
  options: string[];
}

export interface QuestionResponse {
  questionId: string;
  selectedOption?: string;
  customAnswer?: string;
}

export interface JournalResponse {
  finalEntry: string;
  philosophicalQuote: string;
  wordCount: number;
  generationTime: number;
  isDraft?: boolean;
}

export interface ImageResponse {
  imageUrl: string;
  prompt: string;
  generationTime: number;
  artistStyle: string;
  type?: 'artwork' | 'sketch' | 'found';
}

export interface FoundImageResponse {
  imageUrl: string;
  title: string;
  source: string;
  license: string;
  description: string;
  generationTime: number;
  type: 'found';
}
