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
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-6 p-8 max-w-md">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
        <h2 className="font-heading text-3xl font-bold uppercase">Something went wrong!</h2>
        <p className="text-gray-400">{error.message || "An unexpected error occurred"}</p>
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

