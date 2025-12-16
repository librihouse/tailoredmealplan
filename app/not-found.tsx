import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-6 p-8 max-w-md">
        <FileQuestion className="h-16 w-16 text-gray-500 mx-auto" />
        <h1 className="font-heading text-4xl font-bold uppercase">404</h1>
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="text-gray-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90 text-black font-bold">
            Go to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

