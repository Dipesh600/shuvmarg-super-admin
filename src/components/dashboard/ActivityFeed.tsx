import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserPlus,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  type LucideIcon,
} from "lucide-react";

// --------------------------
// 1️⃣ Type Definitions
// --------------------------
type ActivityType = "registration" | "verification" | "transaction" | "alert";

interface ActivityItem {
  id: number;
  type: ActivityType;
  message: string;
  time: string;
  icon: LucideIcon;
  color: string;
}

// --------------------------
// 2️⃣ Activity Data
// --------------------------
const activities: ActivityItem[] = [
  {
    id: 1,
    type: "registration",
    message: "New user registered: Rajesh Kumar",
    time: "2 mins ago",
    icon: UserPlus,
   color: "text-blue-500",      // registrations
  },
  {
    id: 2,
    type: "verification",
    message: "Agent verification completed: SUMA-AGT-234",
    time: "15 mins ago",
    icon: CheckCircle,
   color: "text-green-500",     // verification
  },
  {
    id: 3,
    type: "transaction",
    message: "High-value transaction: Rs. 25,000",
    time: "28 mins ago",
    icon: DollarSign,
color: "text-yellow-500",    // transaction
  },
  {
    id: 4,
    type: "alert",
    message: "Bus maintenance due: NP-BA-1234",
    time: "1 hour ago",
    icon: AlertTriangle,
   color: "text-red-500",       // alert
  },
  {
    id: 5,
    type: "registration",
    message: "New agent application: Kathmandu",
    time: "2 hours ago",
    icon: UserPlus,
  color: "text-blue-500",     // registrations
  },
];

// --------------------------
// 3️⃣ Component
// --------------------------
export function ActivityFeed() {
  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Live Activity Stream</CardTitle>
        <CardDescription>Real-time platform activities</CardDescription>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
           {activities.map((activity) => {
  const Icon = activity.icon;

  return (
    <div key={activity.id} className="flex items-start gap-3">
      <div
        className={`
          p-2 rounded-lg 
          bg-muted 
          dark:bg-muted/50 
          flex items-center justify-center
        `}
      >
        <Icon
          className={`
            h-4 w-4 
            ${activity.color}
            dark:${activity.color}
          `}
        />
      </div>

      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">
          {activity.message}
        </p>
        <p className="text-xs text-muted-foreground">
          {activity.time}
        </p>
      </div>
    </div>
  );
})}

          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
