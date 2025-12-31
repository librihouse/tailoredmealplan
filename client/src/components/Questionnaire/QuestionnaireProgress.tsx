"use client";

import { cn } from "@/lib/utils";

interface QuestionnaireProgressProps {
  currentPage: number;
  totalPages: number;
}

export function QuestionnaireProgress({ currentPage, totalPages }: QuestionnaireProgressProps) {
  const progress = (currentPage / totalPages) * 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 z-50">
      <div className="container max-w-screen-md mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Page {currentPage} of {totalPages}
          </span>
          <span className="text-sm font-bold text-primary">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden border border-white/10">
          <div
            className={cn(
              "h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(132,204,22,0.5)]"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

