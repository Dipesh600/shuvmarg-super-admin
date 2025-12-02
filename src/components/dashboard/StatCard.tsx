import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  subtitle
}: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-all duration-200 w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
      </CardHeader>

      <CardContent>
        <div className="text-xl sm:text-2xl font-bold">{value}</div>

        {change && (
          <p
            className={cn(
              "text-[10px] sm:text-xs mt-1",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}
          >
            {change}
          </p>
        )}

        {subtitle && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
