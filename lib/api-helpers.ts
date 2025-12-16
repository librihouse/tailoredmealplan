/**
 * Next.js API Route Helpers
 * Authentication and request utilities for Next.js API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/server/supabase";

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  user?: any;
}

/**
 * Get authorization token from request headers
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Authenticate request using Supabase token
 * Returns user info or throws error response
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ userId: string; user: any } | NextResponse> {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized: No token provided" },
      { status: 401 }
    );
  }

  const user = await getUserFromToken(token);
  
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or expired token. Please sign in again." },
      { status: 401 }
    );
  }

  return { userId: user.id, user };
}

/**
 * Log helper for API routes
 */
export function log(message: string, source = "api") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

