import {
  users,
  meetings,
  integrations,
  type User,
  type UpsertUser,
  type Meeting,
  type InsertMeeting,
  type Integration,
  type InsertIntegration,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Meeting operations
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  getMeeting(id: number, userId: string): Promise<Meeting | undefined>;
  getMeetingsByUser(userId: string): Promise<Meeting[]>;
  updateMeeting(id: number, updates: Partial<Meeting>): Promise<Meeting>;
  deleteMeeting(id: number, userId: string): Promise<void>;
  searchMeetings(userId: string, query: string): Promise<Meeting[]>;
  
  // Integration operations
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  getIntegrations(userId: string): Promise<Integration[]>;
  updateIntegration(id: number, updates: Partial<Integration>): Promise<Integration>;
  deleteIntegration(id: number, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Meeting operations
  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [createdMeeting] = await db.insert(meetings).values(meeting).returning();
    return createdMeeting;
  }

  async getMeeting(id: number, userId: string): Promise<Meeting | undefined> {
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, id), eq(meetings.userId, userId)));
    return meeting;
  }

  async getMeetingsByUser(userId: string): Promise<Meeting[]> {
    return await db
      .select()
      .from(meetings)
      .where(eq(meetings.userId, userId))
      .orderBy(desc(meetings.createdAt));
  }

  async updateMeeting(id: number, updates: Partial<Meeting>): Promise<Meeting> {
    const [updatedMeeting] = await db
      .update(meetings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(meetings.id, id))
      .returning();
    return updatedMeeting;
  }

  async deleteMeeting(id: number, userId: string): Promise<void> {
    await db
      .delete(meetings)
      .where(and(eq(meetings.id, id), eq(meetings.userId, userId)));
  }

  async searchMeetings(userId: string, query: string): Promise<Meeting[]> {
    return await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.userId, userId),
          or(
            ilike(meetings.title, `%${query}%`),
            ilike(meetings.summary, `%${query}%`),
            ilike(meetings.participants, `%${query}%`)
          )
        )
      )
      .orderBy(desc(meetings.createdAt));
  }

  // Integration operations
  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [createdIntegration] = await db
      .insert(integrations)
      .values(integration)
      .returning();
    return createdIntegration;
  }

  async getIntegrations(userId: string): Promise<Integration[]> {
    return await db
      .select()
      .from(integrations)
      .where(eq(integrations.userId, userId))
      .orderBy(desc(integrations.createdAt));
  }

  async updateIntegration(id: number, updates: Partial<Integration>): Promise<Integration> {
    const [updatedIntegration] = await db
      .update(integrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(integrations.id, id))
      .returning();
    return updatedIntegration;
  }

  async deleteIntegration(id: number, userId: string): Promise<void> {
    await db
      .delete(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
