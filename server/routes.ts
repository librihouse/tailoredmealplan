import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import mealPlanRouter from "./routes/mealplan";
import razorpayRouter from "./routes/razorpay";
import profileRouter from "./routes/profile";
import authRouter from "./routes/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Meal plan routes with quota checking
  app.use("/api/mealplan", mealPlanRouter);

  // Razorpay payment routes
  app.use("/api/razorpay", razorpayRouter);

  // Profile management routes
  app.use("/api/profile", profileRouter);

  // Auth helper routes (for testing)
  app.use("/api/auth", authRouter);

  return httpServer;
}
