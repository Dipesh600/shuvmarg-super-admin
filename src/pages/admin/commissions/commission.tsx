import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Percent, TrendingUp, Wallet, Clock, Download, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModal } from "@/hooks/use-model-store";

const commissionRates = [
  { id: 1, type: "Standard Agent", rate: 5, transactions: 1250, earned: "Rs. 1,25,000" },
  { id: 2, type: "Premium Agent", rate: 7, transactions: 890, earned: "Rs. 1,56,450" },
  { id: 3, type: "Bus Owner Direct", rate: 3, transactions: 2100, earned: "Rs. 94,500" },
  { id: 4, type: "Online Booking", rate: 2, transactions: 5600, earned: "Rs. 2,24,000" },
];

const pendingPayouts = [
  { id: "PAY-001", agent: "Ram Bahadur Thapa", amount: "Rs. 12,500", period: "Dec 1-15", status: "Pending", dueDate: "Dec 20, 2024" },
  { id: "PAY-002", agent: "Sita Sharma", amount: "Rs. 8,900", period: "Dec 1-15", status: "Processing", dueDate: "Dec 20, 2024" },
  { id: "PAY-003", agent: "Bikram KC", amount: "Rs. 15,200", period: "Dec 1-15", status: "Pending", dueDate: "Dec 20, 2024" },
  { id: "PAY-004", agent: "Gita Rai", amount: "Rs. 6,750", period: "Dec 1-15", status: "Approved", dueDate: "Dec 20, 2024" },
];

const commissionHistory = [
  { id: "COM-001", agent: "Ram Bahadur Thapa", booking: "BK-78901", amount: "Rs. 250", rate: "5%", date: "Dec 18, 2024", status: "Paid" },
  { id: "COM-002", agent: "Sita Sharma", booking: "BK-78902", amount: "Rs. 175", rate: "5%", date: "Dec 18, 2024", status: "Paid" },
  { id: "COM-003", agent: "Premium Tours", booking: "BK-78903", amount: "Rs. 420", rate: "7%", date: "Dec 17, 2024", status: "Pending" },
  { id: "COM-004", agent: "Bikram KC", booking: "BK-78904", amount: "Rs. 300", rate: "5%", date: "Dec 17, 2024", status: "Paid" },
  { id: "COM-005", agent: "Gita Rai", booking: "BK-78905", amount: "Rs. 150", rate: "5%", date: "Dec 16, 2024", status: "Pending" },
];

const Commissions = () => {
  const {onOpen}= useModal();
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Commission Management</h2>
          <p className="text-muted-foreground mt-1">Manage commission rates and agent payouts</p>
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
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. 5,99,950</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. 43,350</div>
            <p className="text-xs text-muted-foreground">12 agents awaiting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.25%</div>
            <p className="text-xs text-muted-foreground">Across all transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Paid</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. 2,45,000</div>
            <p className="text-xs text-muted-foreground">156 payouts processed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rates">Commission Rates</TabsTrigger>
          <TabsTrigger value="payouts">Pending Payouts</TabsTrigger>
          <TabsTrigger value="history">Commission History</TabsTrigger>
        </TabsList>

        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <CardTitle>Commission Rate Structure</CardTitle>
              <CardDescription>Manage commission rates for different booking types</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Total Earned</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionRates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">{rate.type}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rate.rate}%</Badge>
                      </TableCell>
                      <TableCell>{rate.transactions.toLocaleString()}</TableCell>
                      <TableCell>{rate.earned}</TableCell>
                      <TableCell className="w-[200px]">
                        <Progress value={(rate.transactions / 6000) * 100} className="h-2" />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" onClick={()=>onOpen("editCommisionRate",{id:rate.id,type:rate.type,rate:rate.rate})} size="sm">Edit Rate</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payouts</CardTitle>
              <CardDescription>Commission payouts awaiting processing</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payout ID</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-mono text-sm">{payout.id}</TableCell>
                      <TableCell className="font-medium">{payout.agent}</TableCell>
                      <TableCell>{payout.amount}</TableCell>
                      <TableCell>{payout.period}</TableCell>
                      <TableCell>{payout.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant={
                          payout.status === "Approved" ? "default" :
                          payout.status === "Processing" ? "secondary" : "outline"
                        }>
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Process</Button>
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
              <CardTitle>Commission History</CardTitle>
              <CardDescription>Recent commission transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionHistory.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-mono text-sm">{commission.id}</TableCell>
                      <TableCell className="font-medium">{commission.agent}</TableCell>
                      <TableCell>{commission.booking}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{commission.rate}</Badge>
                      </TableCell>
                      <TableCell>{commission.amount}</TableCell>
                      <TableCell>{commission.date}</TableCell>
                      <TableCell>
                        <Badge variant={commission.status === "Paid" ? "default" : "secondary"}>
                          {commission.status}
                        </Badge>
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

export default Commissions;
