import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Download,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useModal } from "@/hooks/use-model-store";

const refundRequests = [
  {
    id: "REF-001",
    booking: "BK-78901",
    user: "Rajesh Kumar",
    amount: "Rs. 1,500",
    reason: "Trip Cancelled",
    date: "Dec 18, 2024",
    status: "Pending",
    priority: "High",
  },
  {
    id: "REF-002",
    booking: "BK-78856",
    user: "Anita Sharma",
    amount: "Rs. 800",
    reason: "Schedule Change",
    date: "Dec 17, 2024",
    status: "Processing",
    priority: "Medium",
  },
  {
    id: "REF-003",
    booking: "BK-78790",
    user: "Bikash Thapa",
    amount: "Rs. 2,200",
    reason: "Bus Breakdown",
    date: "Dec 17, 2024",
    status: "Approved",
    priority: "High",
  },
  {
    id: "REF-004",
    booking: "BK-78745",
    user: "Sunita Rai",
    amount: "Rs. 650",
    reason: "Personal Emergency",
    date: "Dec 16, 2024",
    status: "Pending",
    priority: "Low",
  },
  {
    id: "REF-005",
    booking: "BK-78700",
    user: "Prakash Gurung",
    amount: "Rs. 1,100",
    reason: "Double Booking",
    date: "Dec 16, 2024",
    status: "Rejected",
    priority: "Medium",
  },
];

const refundHistory = [
  {
    id: "REF-100",
    booking: "BK-78500",
    user: "Hari Prasad",
    amount: "Rs. 1,200",
    method: "Bank Transfer",
    processedDate: "Dec 15, 2024",
    status: "Completed",
  },
  {
    id: "REF-099",
    booking: "BK-78450",
    user: "Maya Devi",
    amount: "Rs. 900",
    method: "E-wallet",
    processedDate: "Dec 14, 2024",
    status: "Completed",
  },
  {
    id: "REF-098",
    booking: "BK-78400",
    user: "Ram Shrestha",
    amount: "Rs. 1,800",
    method: "Bank Transfer",
    processedDate: "Dec 13, 2024",
    status: "Completed",
  },
  {
    id: "REF-097",
    booking: "BK-78350",
    user: "Sita Basnet",
    amount: "Rs. 500",
    method: "Original Payment",
    processedDate: "Dec 12, 2024",
    status: "Completed",
  },
];

const refundPolicies = [
  {
    id: 1,
    name: "24h Before Departure",
    refundPercent: 100,
    deduction: "Rs. 0",
    applicable: "Full refund",
  },
  {
    id: 2,
    name: "12-24h Before Departure",
    refundPercent: 75,
    deduction: "25%",
    applicable: "Partial refund",
  },
  {
    id: 3,
    name: "6-12h Before Departure",
    refundPercent: 50,
    deduction: "50%",
    applicable: "Half refund",
  },
  {
    id: 4,
    name: "Less than 6h",
    refundPercent: 0,
    deduction: "100%",
    applicable: "No refund",
  },
];

// refund: {
//     id: string;
//     booking: string;
//     user: string;
//     amount: string;
//     reason: string;
//     date: string;
//     status: string;
//     priority: string;
//   };
const Refunds = () => {
  const { onOpen } = useModal();
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Refund Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Process refund requests and manage policies
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Refunds
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              Rs. 45,600 total value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Rs. 12,400 in transit
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Rs. 28,900 refunded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rejection Rate
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.5%</div>
            <p className="text-xs text-muted-foreground">Below average</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Refund Requests</TabsTrigger>
          <TabsTrigger value="history">Refund History</TabsTrigger>
          <TabsTrigger value="policies">Refund Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Active Refund Requests</CardTitle>
              <CardDescription>
                Review and process pending refund requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Refund ID</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refundRequests.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell className="font-mono text-sm">
                        {refund.id}
                      </TableCell>
                      <TableCell>{refund.booking}</TableCell>
                      <TableCell className="font-medium">
                        {refund.user}
                      </TableCell>
                      <TableCell>{refund.amount}</TableCell>
                      <TableCell>{refund.reason}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            refund.priority === "High"
                              ? "destructive"
                              : refund.priority === "Medium"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {refund.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            refund.status === "Approved"
                              ? "default"
                              : refund.status === "Processing"
                              ? "secondary"
                              : refund.status === "Rejected"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {refund.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            onClick={() =>
                              onOpen("editRefundProccess", {
                                id: refund.id,
                                booking: refund.booking,
                                user: refund.user,
                                amount: refund.amount,
                                reason: refund.reason,
                                date: refund.date,
                                status: refund.status,
                                priority: refund.status,
                              })
                            }
                            size="sm"
                          >
                            Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Completed Refunds</CardTitle>
              <CardDescription>History of processed refunds</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Refund ID</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Processed Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refundHistory.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell className="font-mono text-sm">
                        {refund.id}
                      </TableCell>
                      <TableCell>{refund.booking}</TableCell>
                      <TableCell className="font-medium">
                        {refund.user}
                      </TableCell>
                      <TableCell>{refund.amount}</TableCell>
                      <TableCell>{refund.method}</TableCell>
                      <TableCell>{refund.processedDate}</TableCell>
                      <TableCell>
                        <Badge variant="default">{refund.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Refund Policy Configuration</CardTitle>
              <CardDescription>
                Manage refund policies based on cancellation timing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy Name</TableHead>
                    <TableHead>Refund %</TableHead>
                    <TableHead>Deduction</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Visual</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refundPolicies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">
                        {policy.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {policy.refundPercent}%
                        </Badge>
                      </TableCell>
                      <TableCell>{policy.deduction}</TableCell>
                      <TableCell>{policy.applicable}</TableCell>
                      <TableCell className="w-[150px]">
                        <Progress
                          value={policy.refundPercent}
                          className="h-2"
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Refunds;
