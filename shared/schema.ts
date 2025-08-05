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

export const generateQuestionsSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});

export const generateJournalSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  responses: z.record(z.any()),
});

export const reviseJournalSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  currentEntry: z.string().min(1, "Current entry is required"),
  revisionPrompt: z.string().min(1, "Revision instructions are required"),
});

export const generateImageSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  journalEntry: z.string().min(1, "Journal entry is required"),
});

export type ApiKeyConfig = z.infer<typeof apiKeyConfigSchema>;
export type GenerateQuestionsRequest = z.infer<typeof generateQuestionsSchema>;
export type GenerateJournalRequest = z.infer<typeof generateJournalSchema>;
export type ReviseJournalRequest = z.infer<typeof reviseJournalSchema>;
export type GenerateImageRequest = z.infer<typeof generateImageSchema>;

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
  type?: 'artwork' | 'sketch';
}
