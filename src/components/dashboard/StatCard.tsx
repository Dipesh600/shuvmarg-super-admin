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
    <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
        <CardTitle className="text-sm font-semibold text-white/80">
          {title}
        </CardTitle>
        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
          <Icon className="h-4 w-4 text-[#D3D925] shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-4">
        <div className="text-2xl font-bold text-white">{value}</div>

        {change && (
          <p
            className={cn(
              "inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md mt-1",
              changeType === "positive" && "text-[#D3D925] bg-[#D3D925]/10 border border-[#D3D925]/20",
              changeType === "negative" && "text-rose-400 bg-rose-500/10 border border-rose-500/20",
              changeType === "neutral" && "text-white/70 bg-white/5 border border-white/10"
            )}
          >
            {change}
          </p>
        )}

        {subtitle && (
          <p className="text-xs text-white/80 mt-1 block">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
