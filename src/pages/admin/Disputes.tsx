import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModal } from "@/hooks/use-model-store";

const disputes = [
  {
    id: "DSP-001",
    user: "Rajesh Kumar",
    type: "Booking Issue",
    priority: "High",
    status: "Open",
    created: "2024-01-28",
    assignedTo: "Team A",
  },
  {
    id: "DSP-002",
    user: "Sita Sharma",
    type: "Refund Request",
    priority: "Medium",
    status: "In Progress",
    created: "2024-01-27",
    assignedTo: "Team B",
  },
  {
    id: "DSP-003",
    user: "Mohan Thapa",
    type: "Service Quality",
    priority: "Low",
    status: "Open",
    created: "2024-01-27",
    assignedTo: "Unassigned",
  },
  {
    id: "DSP-004",
    user: "Gita Rai",
    type: "Payment Problem",
    priority: "High",
    status: "Resolved",
    created: "2024-01-26",
    assignedTo: "Team A",
  },
  {
    id: "DSP-005",
    user: "Krishna Gurung",
    type: "Booking Issue",
    priority: "Medium",
    status: "In Progress",
    created: "2024-01-26",
    assignedTo: "Team C",
  },
];
// id: string;
    // user: string;
    // type: string;
    // priority: string;
    // status: string;
    // created: string;
    // assignedTo: string;
const Disputes = () => {
  const {onOpen} = useModal();
  return (
    <>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Dispute Resolution Center
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage and resolve customer disputes
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Open Disputes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Avg. Resolution Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3 days</div>
              <p className="text-xs text-success">-0.5 days vs target</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Resolved Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">89% satisfaction</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                High Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-destructive">Urgent attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Booking Issues</span>
                <Badge>40%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Payment Problems</span>
                <Badge>25%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Service Quality</span>
                <Badge>20%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Refund Requests</span>
                <Badge>15%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Team Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      Team A - 23 resolved
                    </span>
                    <span className="text-sm text-muted-foreground">
                      92% satisfaction
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success"
                      style={{ width: "92%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      Team B - 18 resolved
                    </span>
                    <span className="text-sm text-muted-foreground">
                      88% satisfaction
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success"
                      style={{ width: "88%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      Team C - 15 resolved
                    </span>
                    <span className="text-sm text-muted-foreground">
                      85% satisfaction
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success"
                      style={{ width: "85%" }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispute ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-medium">{dispute.id}</TableCell>
                    <TableCell>{dispute.user}</TableCell>
                    <TableCell>{dispute.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          dispute.priority === "High"
                            ? "destructive"
                            : dispute.priority === "Medium"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {dispute.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          dispute.status === "Resolved"
                            ? "default"
                            : dispute.status === "In Progress"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {dispute.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{dispute.created}</TableCell>
                    <TableCell>{dispute.assignedTo}</TableCell>
                    <TableCell>
                      <Button
                      onClick={()=>onOpen("editResolveDisputes",{// id: string;
                          user: dispute.user,
                          type: dispute.type,
                          priority: dispute.priority,
                          status: dispute.status,
                          created:dispute.created,
                          assignedTo: dispute.assignedTo})}
                      variant="ghost" size="sm">
                        Resolve
                      </Button>
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

export default Disputes;
