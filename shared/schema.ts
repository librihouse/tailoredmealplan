import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscriptions Table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull(), // 'free', 'individual', 'family', 'starter', 'growth', 'professional', 'enterprise'
  status: text("status").notNull().default("active"), // active, cancelled, expired
  billingInterval: text("billing_interval").notNull().default("monthly"), // monthly, annual
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Plan Usage Tracking Table
export const planUsage = pgTable("plan_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: "cascade" }),
  billingPeriodStart: timestamp("billing_period_start").notNull(),
  billingPeriodEnd: timestamp("billing_period_end").notNull(),
  weeklyPlansUsed: integer("weekly_plans_used").default(0).notNull(),
  monthlyPlansUsed: integer("monthly_plans_used").default(0).notNull(),
  clientsUsed: integer("clients_used").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Profiles Table (for individual onboarding data)
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gender: text("gender"),
  age: integer("age"),
  height: real("height"), // in cm
  currentWeight: real("current_weight"), // in kg
  targetWeight: real("target_weight"), // in kg
  goal: text("goal"), // lose_weight, build_muscle, maintain, health
  activity: text("activity"), // sedentary, light, moderate, active, athlete
  diet: text("diet").array(), // array of dietary preferences
  religious: text("religious").default("none"), // none, halal, kosher, jain, hindu, buddhist
  conditions: text("conditions").array(), // array of health conditions
  allergies: text("allergies").array(), // array of allergies
  transitionInfo: text("transition_info"), // JSON string for trans-friendly support: { genderSpecify, isTransitioning, transitionMedications, additionalHealthInfo }
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Business Profiles Table (for professional onboarding data)
export const businessProfiles = pgTable("business_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  businessType: text("business_type"), // nutritionist, gym, clinic, etc.
  website: text("website"),
  phone: text("phone"),
  logoUrl: text("logo_url"),
  brandColors: text("brand_colors"), // JSON string (deprecated, use theme_colors)
  themeColors: text("theme_colors"), // JSON string: { primary: string, secondary: string, background: "light" | "dark" }
  tagline: text("tagline"),
  freeDailyPlanGenerated: boolean("free_daily_plan_generated").default(false),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlanUsageSchema = createInsertSchema(planUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBusinessProfileSchema = createInsertSchema(businessProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type PlanUsage = typeof planUsage.$inferSelect;
export type InsertPlanUsage = z.infer<typeof insertPlanUsageSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
