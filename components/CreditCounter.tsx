"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditCounterProps {
  used: number;
  limit: number;
  resetDate?: Date;
}

export function CreditCounter({ used, limit, resetDate }: CreditCounterProps) {
  const remaining = limit - used;
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const formatDate = (date?: Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <Card className="bg-gray-900/50 border-white/10 mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 border border-primary/30 p-2 rounded-lg">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Credits</h3>
                {resetDate && (
                  <p className="text-xs text-gray-400">
                    Resets on {formatDate(resetDate)}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-white">
                {remaining}
              </div>
              <div className="text-sm text-gray-400">
                of {limit.toLocaleString()} remaining
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={cn(
                "font-mono font-bold",
                isAtLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-primary"
              )}>
                {used.toLocaleString()} / {limit.toLocaleString()} used
              </span>
              <span className="text-gray-400">
                {percentage.toFixed(1)}%
              </span>
            </div>
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-800 border border-white/10">
              <div
                className={cn(
                  "h-full transition-all duration-500 ease-out",
                  isAtLimit 
                    ? "bg-red-500" 
                    : isNearLimit 
                    ? "bg-yellow-500" 
                    : "bg-primary"
                )}
                style={{ width: `${percentage}%` }}
              />
              {isAtLimit && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">Limit Reached</span>
                </div>
              )}
            </div>
            {isAtLimit && (
              <p className="text-xs text-red-400 font-medium">
                You've used all your credits. Upgrade to continue generating plans.
              </p>
            )}
            {isNearLimit && !isAtLimit && (
              <p className="text-xs text-yellow-400 font-medium">
                Running low on credits. Consider upgrading for more.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

