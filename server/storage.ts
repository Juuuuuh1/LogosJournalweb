import { type JournalEntry, type InsertJournalEntry } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntry(id: string): Promise<JournalEntry | undefined>;
  getJournalEntriesByDate(limit?: number): Promise<JournalEntry[]>;
}

export class MemStorage implements IStorage {
  private journalEntries: Map<string, JournalEntry>;

  constructor() {
    this.journalEntries = new Map();
  }

  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const id = randomUUID();
    const entry: JournalEntry = { 
      ...insertEntry, 
      id,
      finalEntry: insertEntry.finalEntry || null,
      createdAt: new Date()
    };
    this.journalEntries.set(id, entry);
    return entry;
  }

  async getJournalEntry(id: string): Promise<JournalEntry | undefined> {
    return this.journalEntries.get(id);
  }

  async getJournalEntriesByDate(limit = 10): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
