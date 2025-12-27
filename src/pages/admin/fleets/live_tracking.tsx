import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Bus, Clock, Fuel, Gauge, Navigation, AlertTriangle, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const trackingData = {
  buses: [
    { 
      id: "NP-BA-1234", 
      operator: "Nepal Express", 
      route: "Kathmandu - Pokhara", 
      status: "Moving",
      speed: 65,
      location: "Near Mugling",
      eta: "2h 15m",
      fuel: 75,
      driver: "Ramesh Thapa",
      passengers: 38,
      lastUpdate: "2 mins ago"
    },
    { 
      id: "NP-BA-2345", 
      operator: "Himalayan Tours", 
      route: "Kathmandu - Chitwan", 
      status: "Stopped",
      speed: 0,
      location: "Hetauda Rest Stop",
      eta: "1h 30m",
      fuel: 60,
      driver: "Krishna Sharma",
      passengers: 42,
      lastUpdate: "5 mins ago"
    },
    { 
      id: "NP-BA-3456", 
      operator: "Everest Transport", 
      route: "Kathmandu - Biratnagar", 
      status: "Moving",
      speed: 72,
      location: "Duhabi Highway",
      eta: "3h 45m",
      fuel: 45,
      driver: "Hari Prasad",
      passengers: 35,
      lastUpdate: "1 min ago"
    },
    { 
      id: "NP-BA-4567", 
      operator: "Nepal Express", 
      route: "Pokhara - Butwal", 
      status: "Delayed",
      speed: 0,
      location: "Traffic Hold - Butwal Entry",
      eta: "45m",
      fuel: 55,
      driver: "Suresh Limbu",
      passengers: 28,
      lastUpdate: "3 mins ago"
    },
    { 
      id: "NP-BA-5678", 
      operator: "Kathmandu Bus", 
      route: "Kathmandu - Janakpur", 
      status: "Moving",
      speed: 58,
      location: "Sindhuli Road",
      eta: "4h 20m",
      fuel: 80,
      driver: "Bikash Yadav",
      passengers: 40,
      lastUpdate: "Just now"
    },
  ],
  alerts: [
    { id: 1, type: "warning", message: "NP-BA-4567 is delayed due to traffic", time: "10 mins ago" },
    { id: 2, type: "info", message: "NP-BA-2345 stopped at rest area (scheduled)", time: "15 mins ago" },
    { id: 3, type: "alert", message: "Low fuel alert for NP-BA-3456", time: "30 mins ago" },
  ],
  stats: {
    totalActive: 189,
    moving: 156,
    stopped: 28,
    delayed: 5,
  },
};

const FleetTracking = () => {
  const navigate = useNavigate();
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBuses = trackingData.buses.filter(bus => {
    const matchesSearch = bus.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bus.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bus.driver.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || bus.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/fleets")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Live Fleet Tracking</h2>
          <p className="text-muted-foreground">Real-time bus location and status</p>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Search buses..." 
            className="w-[200px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="moving">Moving</SelectItem>
              <SelectItem value="stopped">Stopped</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bus className="h-4 w-4 text-primary" />
              Active Buses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackingData.stats.totalActive}</div>
            <p className="text-xs text-muted-foreground">Currently tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Navigation className="h-4 w-4 text-success" />
              Moving
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{trackingData.stats.moving}</div>
            <p className="text-xs text-muted-foreground">On route</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Stopped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackingData.stats.stopped}</div>
            <p className="text-xs text-muted-foreground">At rest areas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Delayed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{trackingData.stats.delayed}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live Map</CardTitle>
            <CardDescription>Real-time bus positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-[16/9] bg-muted/50 rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Simulated map with bus markers */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-muted/20">
                <div className="w-full h-full relative">
                  {/* Simulated bus markers */}
                  <div className="absolute top-[20%] left-[30%] flex flex-col items-center cursor-pointer hover:scale-110 transition-transform" onClick={() => setSelectedBus("NP-BA-1234")}>
                    <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center animate-pulse">
                      <Bus className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium mt-1 bg-background/80 px-1 rounded">NP-BA-1234</span>
                  </div>
                  <div className="absolute top-[45%] left-[50%] flex flex-col items-center cursor-pointer hover:scale-110 transition-transform" onClick={() => setSelectedBus("NP-BA-2345")}>
                    <div className="w-8 h-8 bg-muted-foreground rounded-full flex items-center justify-center">
                      <Bus className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium mt-1 bg-background/80 px-1 rounded">NP-BA-2345</span>
                  </div>
                  <div className="absolute top-[60%] left-[70%] flex flex-col items-center cursor-pointer hover:scale-110 transition-transform" onClick={() => setSelectedBus("NP-BA-3456")}>
                    <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center animate-pulse">
                      <Bus className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium mt-1 bg-background/80 px-1 rounded">NP-BA-3456</span>
                  </div>
                  <div className="absolute top-[35%] left-[15%] flex flex-col items-center cursor-pointer hover:scale-110 transition-transform" onClick={() => setSelectedBus("NP-BA-4567")}>
                    <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center">
                      <Bus className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium mt-1 bg-background/80 px-1 rounded">NP-BA-4567</span>
                  </div>
                  <div className="absolute top-[75%] left-[40%] flex flex-col items-center cursor-pointer hover:scale-110 transition-transform" onClick={() => setSelectedBus("NP-BA-5678")}>
                    <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center animate-pulse">
                      <Bus className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium mt-1 bg-background/80 px-1 rounded">NP-BA-5678</span>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 bg-background/90 p-3 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                  <span>Moving</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                  <span>Stopped</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-warning rounded-full"></div>
                  <span>Delayed</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Live Alerts</CardTitle>
            <CardDescription>Recent notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trackingData.alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                {alert.type === "warning" && <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />}
                {alert.type === "info" && <CheckCircle className="h-5 w-5 text-primary mt-0.5" />}
                {alert.type === "alert" && <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />}
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            ))}

            {selectedBus && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                <h4 className="font-medium text-sm mb-3">Selected: {selectedBus}</h4>
                {(() => {
                  const bus = trackingData.buses.find(b => b.id === selectedBus);
                  if (!bus) return null;
                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Route:</span>
                        <span>{bus.route}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Driver:</span>
                        <span>{bus.driver}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Speed:</span>
                        <span>{bus.speed} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ETA:</span>
                        <span>{bus.eta}</span>
                      </div>
                      <Button size="sm" className="w-full mt-2" onClick={() => navigate(`/admin/fleets/${selectedBus}`)}>
                        View Details
                      </Button>
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bus List Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Active Buses</CardTitle>
          <CardDescription>Detailed status of tracked vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bus ID</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>Fuel</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBuses.map((bus) => (
                <TableRow key={bus.id} className={selectedBus === bus.id ? "bg-muted/50" : ""}>
                  <TableCell className="font-medium">{bus.id}</TableCell>
                  <TableCell>{bus.route}</TableCell>
                  <TableCell>{bus.driver}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{bus.location}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      {bus.speed} km/h
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-muted-foreground" />
                      <Progress value={bus.fuel} className="w-16 h-2" />
                      <span className="text-xs">{bus.fuel}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{bus.eta}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        bus.status === "Moving" ? "default" : 
                        bus.status === "Delayed" ? "destructive" : 
                        "secondary"
                      }
                    >
                      {bus.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedBus(bus.id)}>
                        <MapPin className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/fleets/${bus.id}`)}>
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

export default FleetTracking;
