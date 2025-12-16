import { type User, type InsertUser, users, type Subscription, type InsertSubscription, subscriptions, type PlanUsage, type InsertPlanUsage, planUsage } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { db } from "./db";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Subscription methods
  getActiveSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription>;
  
  // Usage tracking methods
  getCurrentUsage(userId: string): Promise<PlanUsage | undefined>;
  createUsage(usage: InsertPlanUsage): Promise<PlanUsage>;
  updateUsage(id: string, data: Partial<PlanUsage>): Promise<PlanUsage>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getActiveSubscription(userId: string): Promise<Subscription | undefined> {
    if (!db) throw new Error("Database not configured");
    const result = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      )
      .limit(1);
    return result[0];
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(subscriptions).values(subscription).returning();
    return result[0];
  }

  async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription> {
    if (!db) throw new Error("Database not configured");
    const result = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return result[0];
  }

  async getCurrentUsage(userId: string): Promise<PlanUsage | undefined> {
    if (!db) throw new Error("Database not configured");
    const now = new Date();
    const result = await db
      .select()
      .from(planUsage)
      .where(
        and(
          eq(planUsage.userId, userId),
          // Add date range check if needed
        )
      )
      .orderBy(planUsage.billingPeriodStart)
      .limit(1);
    return result[0];
  }

  async createUsage(usage: InsertPlanUsage): Promise<PlanUsage> {
    if (!db) throw new Error("Database not configured");
    const result = await db.insert(planUsage).values(usage).returning();
    return result[0];
  }

  async updateUsage(id: string, data: Partial<PlanUsage>): Promise<PlanUsage> {
    if (!db) throw new Error("Database not configured");
    const result = await db
      .update(planUsage)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(planUsage.id, id))
      .returning();
    return result[0];
  }
}

// Fallback to in-memory storage if DATABASE_URL is not set (for development without DB)
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private subscriptions: Map<string, Subscription>;
  private usage: Map<string, PlanUsage>;

  constructor() {
    this.users = new Map();
    this.subscriptions = new Map();
    this.usage = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { randomUUID } = await import("crypto");
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async getActiveSubscription(userId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      (sub) => sub.userId === userId && sub.status === "active"
    );
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const { randomUUID } = await import("crypto");
    const id = randomUUID();
    const now = new Date();
    const sub: Subscription = {
      ...subscription,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.subscriptions.set(id, sub);
    return sub;
  }

  async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription> {
    const sub = this.subscriptions.get(id);
    if (!sub) throw new Error("Subscription not found");
    const updated = { ...sub, ...data, updatedAt: new Date() };
    this.subscriptions.set(id, updated);
    return updated;
  }

  async getCurrentUsage(userId: string): Promise<PlanUsage | undefined> {
    return Array.from(this.usage.values()).find(
      (u) => u.userId === userId
    );
  }

  async createUsage(usage: InsertPlanUsage): Promise<PlanUsage> {
    const { randomUUID } = await import("crypto");
    const id = randomUUID();
    const now = new Date();
    const usageRecord: PlanUsage = {
      ...usage,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.usage.set(id, usageRecord);
    return usageRecord;
  }

  async updateUsage(id: string, data: Partial<PlanUsage>): Promise<PlanUsage> {
    const usageRecord = this.usage.get(id);
    if (!usageRecord) throw new Error("Usage record not found");
    const updated = { ...usageRecord, ...data, updatedAt: new Date() };
    this.usage.set(id, updated);
    return updated;
  }
}

// Use database storage if DATABASE_URL is available and db is configured, otherwise fall back to memory
export const storage = process.env.DATABASE_URL && db
  ? new DatabaseStorage() 
  : new MemStorage();
