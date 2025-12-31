"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Download, 
  Trash2,
  Calendar,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  id: string;
  type: "daily" | "weekly" | "monthly";
  createdAt: string;
  dailyCalories?: number;
  duration?: number;
  onView?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

export function PlanCard({
  id,
  type,
  createdAt,
  dailyCalories,
  duration,
  onView,
  onDownload,
  onDelete,
}: PlanCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTypeLabel = (planType: string) => {
    const safeType = planType || 'daily';
    return safeType.charAt(0).toUpperCase() + safeType.slice(1);
  };

  return (
    <Card className="bg-gray-900/50 border-white/10 hover:border-primary/50 transition-all group">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {getTypeLabel(type)}
          </Badge>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(createdAt)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {dailyCalories && (
            <div>
              <p className="text-sm text-gray-400">Daily Calories</p>
              <p className="text-xl font-bold text-white">
                {dailyCalories.toLocaleString()} kcal
              </p>
            </div>
          )}
          {duration && (
            <div>
              <p className="text-sm text-gray-400">Duration</p>
              <p className="text-lg font-semibold text-white">
                {duration} {duration === 1 ? "day" : "days"}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
          {onView && (
            <Link href={`/dashboard/plans/${id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs border-white/20 hover:bg-white/10"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </Link>
          )}
          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs border-white/20 hover:bg-white/10"
              onClick={onDownload}
            >
              <Download className="h-3 w-3 mr-1" />
              PDF
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

