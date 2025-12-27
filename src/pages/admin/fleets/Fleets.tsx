import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bus, MapPin, Wrench, AlertTriangle } from "lucide-react";
import { useModal } from "@/hooks/use-model-store";
import { columns } from "@/components/data_tables/fleet/columns";
import { DataTable } from "@/components/DataTable";

const buses = [
  {
    id: "NP-BA-1234",
    operator: "Nepal Express",
    route: "Kathmandu - Pokhara",
    status: "Active",
    capacity: 42,
    gps: "Online",
    lastService: "2024-01-10",
  },
  {
    id: "NP-BA-2345",
    operator: "Himalayan Tours",
    route: "Kathmandu - Chitwan",
    status: "Active",
    capacity: 36,
    gps: "Online",
    lastService: "2024-01-15",
  },
  {
    id: "NP-BA-3456",
    operator: "Everest Transport",
    route: "Kathmandu - Biratnagar",
    status: "Maintenance",
    capacity: 48,
    gps: "Offline",
    lastService: "2023-12-20",
  },
  {
    id: "NP-BA-4567",
    operator: "Nepal Express",
    route: "Pokhara - Butwal",
    status: "Active",
    capacity: 40,
    gps: "Online",
    lastService: "2024-01-18",
  },
  {
    id: "NP-BA-5678",
    operator: "Kathmandu Bus",
    route: "Kathmandu - Janakpur",
    status: "Pending",
    capacity: 38,
    gps: "Offline",
    lastService: "2024-01-05",
  },
];

const Fleet = () => {
  const { onOpen } = useModal();
  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Fleet Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitor and manage bus fleet operations
          </p>
        </div>
        <Button
          onClick={() => onOpen("addBus")}
          className="gap-2 w-full md:w-auto"
        >
          <Bus className="h-4 w-4" /> Add Bus
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bus className="h-4 w-4 text-primary" /> Total Buses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs dark:text-blue-500 text-blue-500">
              Registered fleet
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500 darkt:ext-green-500/40" />{" "}
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">189</div>
            <p className="text-xs text-green-500 darkt:text-green-500">
              77% operational
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wrench className="h-4 w-4 text-yellow-500 darkt:text-yellow-500/40" />{" "}
              Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-yellow-500 darkt:text-yellow-500/40">
              Under service
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-500" />{" "}
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">33</div>
            <p className="text-xs text-orange-500 dark:text-orange-500">
              Awaiting verification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Directory */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <DataTable columns={columns} data={buses} />
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {buses.map((bus) => (
              <div
                key={bus.id}
                className="border rounded-lg p-3 shadow-sm bg-background space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{bus.id}</span>
                  <Badge variant={bus.status as BadgeProps["variant"]}>
                    {bus.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>Operator: {bus.operator}</div>
                  <div>Route: {bus.route}</div>
                  <div>Capacity: {bus.capacity} seats</div>
                  <div>GPS: {bus.gps}</div>
                  <div>Last Service: {bus.lastService}</div>
                </div>
                <Button variant="ghost" size="sm" className="w-full">
                  Track
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default Fleet;
