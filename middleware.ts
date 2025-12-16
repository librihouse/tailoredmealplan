import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/meal-plans",
  "/settings",
  "/onboarding",
  "/professional-onboarding",
  "/customer-type-selection",
];

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth",
  "/login",
  "/signup",
  "/pricing",
  "/how-it-works",
  "/features",
  "/professionals",
  "/about",
  "/contact",
  "/help",
  "/privacy",
  "/terms",
  "/cookies",
  "/forgot-password",
  "/reset-password",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // For protected routes, we'll let the client-side ProtectedRoute component handle auth
  // This middleware can be extended to check for auth tokens in cookies/headers if needed
  
  // Allow all requests to pass through - client-side auth handling
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

