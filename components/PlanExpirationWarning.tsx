"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PlanExpirationWarningProps {
  expiresAt: string;
  hoursRemaining: number;
  minutesRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  planType: "daily" | "weekly" | "monthly";
  planId: string;
}

export function PlanExpirationWarning({
  expiresAt,
  hoursRemaining,
  minutesRemaining,
  isExpired,
  isExpiringSoon,
  planType,
  planId,
}: PlanExpirationWarningProps) {
  const [timeRemaining, setTimeRemaining] = useState({
    hours: hoursRemaining,
    minutes: minutesRemaining,
  });

  useEffect(() => {
    // Update countdown every minute
    const interval = setInterval(() => {
      const now = new Date();
      const expiration = new Date(expiresAt);
      const remaining = expiration.getTime() - now.getTime();

      if (remaining <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0 });
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining({ hours, minutes });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (isExpired) {
    return (
      <Alert variant="destructive" className="mb-4 border-red-500/50 bg-red-900/20">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-red-200">Plan Expired</AlertTitle>
        <AlertDescription className="text-red-200">
          <div className="flex items-center justify-between mt-2">
            <p>
              This {planType} meal plan has expired. Free tier plans are available for 12 hours.
              Upgrade to keep your plans forever!
            </p>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90 text-black font-bold ml-4"
              onClick={() => {
                // Trigger upgrade modal - parent component should handle this
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('openUpgradeModal'));
                }
              }}
            >
              Upgrade Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isExpiringSoon) {
    return (
      <Alert className="mb-4 border-yellow-500/50 bg-yellow-900/20">
        <Clock className="h-4 w-4 text-yellow-400" />
        <AlertTitle className="text-yellow-200">Plan Expiring Soon</AlertTitle>
        <AlertDescription className="text-yellow-200">
          <div className="flex items-center justify-between mt-2">
            <p>
              This plan expires in{" "}
              <span className="font-bold">
                {timeRemaining.hours}h {timeRemaining.minutes}m
              </span>
              . Free tier plans are deleted after 12 hours.
            </p>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90 text-black font-bold ml-4"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('openUpgradeModal'));
                }
              }}
            >
              Upgrade to Keep
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mb-4 bg-primary/10 border-primary/30">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-gray-300">
              Expires in{" "}
              <span className="font-bold text-primary">
                {timeRemaining.hours}h {timeRemaining.minutes}m
              </span>
            </span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary/10 text-xs"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('openUpgradeModal'));
              }
            }}
          >
            Upgrade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

