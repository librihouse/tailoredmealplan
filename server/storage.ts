import { type User, type InsertUser, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
}

// Fallback to in-memory storage if DATABASE_URL is not set (for development without DB)
export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { randomUUID } = await import("crypto");
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

// Use database storage if DATABASE_URL is available and db is configured, otherwise fall back to memory
export const storage = process.env.DATABASE_URL && db
  ? new DatabaseStorage() 
  : new MemStorage();
