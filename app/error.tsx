"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  // Don't show error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  const errorMessage = isProduction 
    ? "An unexpected error occurred. Please try again." 
    : (error.message || "An unexpected error occurred");

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-6 p-8 max-w-md">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
        <h2 className="font-heading text-3xl font-bold uppercase">Something went wrong!</h2>
        <p className="text-gray-400">{errorMessage}</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="outline">
            Try again
          </Button>
          <Link href="/">
            <Button>Go home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

