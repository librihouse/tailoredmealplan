/**
 * Authentication Helper Routes
 * Provides endpoints to help with testing (auto-confirm users)
 */

import { Router } from "express";
import { supabaseAdmin } from "../supabase";
import { log } from "../index";

const router = Router();

/**
 * POST /api/auth/auto-confirm
 * Auto-confirm a user's email (for testing only)
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set
 */
router.post("/auto-confirm", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ 
        error: "Service role key not configured. Please disable email confirmation in Supabase dashboard instead." 
      });
    }

    // Use admin client to update user's email_confirmed status
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      log(`Error auto-confirming user: ${error.message}`, "auth");
      return res.status(500).json({ error: "Failed to confirm user: " + error.message });
    }

    log(`User ${userId} auto-confirmed for testing`, "auth");

    res.json({
      success: true,
      message: "User email confirmed successfully",
      user: data.user,
    });
  } catch (error: any) {
    log(`Error in auth/auto-confirm: ${error.message}`, "auth");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

