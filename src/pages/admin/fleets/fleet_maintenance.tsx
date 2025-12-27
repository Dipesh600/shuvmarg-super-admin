import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Wrench, Calendar, DollarSign, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const maintenanceData = {
  busId: "NP-BA-1234",
  busType: "Deluxe",
  operator: "Nepal Express Pvt. Ltd.",
  currentMileage: 125000,
  lastServiceMileage: 120000,
  nextServiceMileage: 130000,
  healthScore: 85,
  upcomingTasks: [
    { id: "SCH-001", task: "Oil Change", dueDate: "2024-02-15", mileage: "130,000 km", priority: "Medium", status: "Scheduled" },
    { id: "SCH-002", task: "Brake Inspection", dueDate: "2024-02-20", mileage: "130,000 km", priority: "High", status: "Scheduled" },
    { id: "SCH-003", task: "Tire Rotation", dueDate: "2024-03-01", mileage: "135,000 km", priority: "Low", status: "Scheduled" },
  ],
  maintenanceHistory: [
    { id: "MNT-001", date: "2024-01-10", type: "Regular Service", cost: "NPR 15,000", description: "Oil change, brake check, tire rotation", technician: "Ram Bahadur", status: "Completed" },
    { id: "MNT-002", date: "2023-10-15", type: "Repair", cost: "NPR 25,000", description: "AC compressor replacement", technician: "Krishna Sharma", status: "Completed" },
    { id: "MNT-003", date: "2023-07-20", type: "Regular Service", cost: "NPR 12,000", description: "Full inspection and minor repairs", technician: "Ram Bahadur", status: "Completed" },
    { id: "MNT-004", date: "2023-04-10", type: "Emergency", cost: "NPR 45,000", description: "Engine overhaul", technician: "Hari Prasad", status: "Completed" },
    { id: "MNT-005", date: "2023-01-15", type: "Regular Service", cost: "NPR 18,000", description: "Annual inspection and certification", technician: "Ram Bahadur", status: "Completed" },
  ],
  parts: [
    { id: "PRT-001", name: "Engine Oil", lastReplaced: "2024-01-10", nextDue: "2024-04-10", status: "Good" },
    { id: "PRT-002", name: "Brake Pads", lastReplaced: "2023-10-15", nextDue: "2024-02-15", status: "Due Soon" },
    { id: "PRT-003", name: "Air Filter", lastReplaced: "2023-07-20", nextDue: "2024-01-20", status: "Overdue" },
    { id: "PRT-004", name: "Tires (Front)", lastReplaced: "2023-04-10", nextDue: "2024-04-10", status: "Good" },
    { id: "PRT-005", name: "Battery", lastReplaced: "2023-01-15", nextDue: "2025-01-15", status: "Good" },
  ],
  costs: {
    thisMonth: "NPR 15,000",
    thisYear: "NPR 115,000",
    average: "NPR 9,583/month",
  },
};

const BusMaintenance = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [addMaintenanceOpen, setAddMaintenanceOpen] = useState(false);

  const handleAddMaintenance = () => {
    toast({
      title: "Maintenance Record Added",
      description: "New maintenance record has been logged successfully.",
    });
    setAddMaintenanceOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/fleet/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Maintenance Management</h2>
          <p className="text-muted-foreground">Bus: {id || maintenanceData.busId}</p>
        </div>
        <Dialog open={addMaintenanceOpen} onOpenChange={setAddMaintenanceOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Maintenance Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Maintenance Record</DialogTitle>
              <DialogDescription>Log a new maintenance activity for this bus</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Maintenance Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular Service</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Cost (NPR)</Label>
                <Input type="number" placeholder="Enter cost" />
              </div>
              <div className="space-y-2">
                <Label>Technician</Label>
                <Input placeholder="Enter technician name" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe the maintenance work performed" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddMaintenanceOpen(false)}>Cancel</Button>
              <Button onClick={handleAddMaintenance}>Save Record</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceData.healthScore}%</div>
            <Progress value={maintenanceData.healthScore} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Current Mileage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceData.currentMileage.toLocaleString()} km</div>
            <p className="text-xs text-muted-foreground">Next service at {maintenanceData.nextServiceMileage.toLocaleString()} km</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceData.costs.thisMonth}</div>
            <p className="text-xs text-muted-foreground">Avg: {maintenanceData.costs.average}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Year Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceData.costs.thisYear}</div>
            <p className="text-xs text-muted-foreground">Total maintenance costs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Parts Status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Parts Status</CardTitle>
            <CardDescription>Component health overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {maintenanceData.parts.map((part) => (
              <div key={part.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{part.name}</p>
                  <p className="text-xs text-muted-foreground">Due: {part.nextDue}</p>
                </div>
                <Badge 
                  variant={
                    part.status === "Good" ? "default" : 
                    part.status === "Due Soon" ? "secondary" : 
                    "destructive"
                  }
                >
                  {part.status === "Overdue" && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {part.status === "Good" && <CheckCircle className="h-3 w-3 mr-1" />}
                  {part.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tabs for History and Scheduled */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Maintenance Records</CardTitle>
            <CardDescription>Scheduled and completed maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="history">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              </TabsList>
              <TabsContent value="history" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceData.maintenanceHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.id}</TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>
                          <Badge variant={
                            record.type === "Regular Service" ? "default" : 
                            record.type === "Emergency" ? "destructive" : 
                            "secondary"
                          }>
                            {record.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.technician}</TableCell>
                        <TableCell>{record.cost}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="scheduled" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceData.upcomingTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.id}</TableCell>
                        <TableCell>{task.task}</TableCell>
                        <TableCell>{task.dueDate}</TableCell>
                        <TableCell>{task.mileage}</TableCell>
                        <TableCell>
                          <Badge variant={
                            task.priority === "High" ? "destructive" : 
                            task.priority === "Medium" ? "secondary" : 
                            "outline"
                          }>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{task.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default BusMaintenance;
