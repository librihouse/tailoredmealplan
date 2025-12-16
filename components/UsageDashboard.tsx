import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageProps {
  weeklyPlansUsed: number;
  weeklyPlansLimit: number;
  monthlyPlansUsed: number;
  monthlyPlansLimit: number;
  clientsUsed: number;
  clientsLimit: number;
  resetDate: Date;
}

export function UsageDashboard({
  weeklyPlansUsed,
  weeklyPlansLimit,
  monthlyPlansUsed,
  monthlyPlansLimit,
  clientsUsed,
  clientsLimit,
  resetDate,
}: UsageProps) {
  const weeklyPercentage = weeklyPlansLimit > 0 
    ? Math.min((weeklyPlansUsed / weeklyPlansLimit) * 100, 100) 
    : 0;
  const monthlyPercentage = monthlyPlansLimit > 0
    ? Math.min((monthlyPlansUsed / monthlyPlansLimit) * 100, 100)
    : 0;
  const clientsPercentage = clientsLimit > 0 && clientsLimit !== Infinity
    ? Math.min((clientsUsed / clientsLimit) * 100, 100)
    : 0;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  const UsageCard = ({
    title,
    used,
    limit,
    percentage,
    icon: Icon,
    tooltip,
  }: {
    title: string;
    used: number;
    limit: number | typeof Infinity;
    percentage: number;
    icon: React.ComponentType<{ className?: string }>;
    tooltip?: string;
  }) => {
    const isUnlimited = limit === Infinity;
    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    return (
      <Card className="bg-gray-900/50 border-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-medium text-white">{title}</CardTitle>
            </div>
            {tooltip && (
              <span className="text-xs text-gray-500" title={tooltip}>ℹ️</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={cn(
                "font-mono font-bold",
                isAtLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-white"
              )}>
                {used}
              </span>
              <span className="text-gray-400">
                / {isUnlimited ? "∞" : limit.toLocaleString()}
              </span>
            </div>
            {!isUnlimited && (
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-800">
                <div
                  className={cn(
                    "h-full transition-all",
                    isAtLimit ? "bg-red-500" : isNearLimit ? "bg-yellow-500" : "bg-primary"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}
            {isAtLimit && (
              <p className="text-xs text-red-400 mt-1">
                Limit reached. Upgrade to continue.
              </p>
            )}
            {isNearLimit && !isAtLimit && (
              <p className="text-xs text-yellow-400 mt-1">
                Approaching limit
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Current Usage</h3>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Resets on {formatDate(resetDate)}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <UsageCard
          title="Weekly Plans"
          used={weeklyPlansUsed}
          limit={weeklyPlansLimit}
          percentage={weeklyPercentage}
          icon={Calendar}
          tooltip="Includes daily (1-7 day) meal plans. Perfect for check-ins and adjustments."
        />

        <UsageCard
          title="Monthly Plans"
          used={monthlyPlansUsed}
          limit={monthlyPlansLimit}
          percentage={monthlyPercentage}
          icon={Calendar}
          tooltip="Full 30-day comprehensive meal plans with detailed grocery lists."
        />

        <UsageCard
          title="Active Clients"
          used={clientsUsed}
          limit={clientsLimit}
          percentage={clientsPercentage}
          icon={Users}
        />
      </div>
    </div>
  );
}

