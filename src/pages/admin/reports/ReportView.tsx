import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2, Printer, RefreshCw, Calendar, FileText, Settings, Clock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const ReportView = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock report data
  const report = {
    id: id || "RPT-001",
    name: "Daily Revenue Report",
    description: "Complete revenue breakdown by routes and payment methods",
    frequency: "Daily",
    lastGenerated: "2024-01-28 06:00 AM",
    nextScheduled: "2024-01-29 06:00 AM",
    size: "2.4 MB",
    format: "PDF",
    createdBy: "System",
    status: "Completed",
    dateRange: "2024-01-27 to 2024-01-28",
    summary: {
      totalRevenue: "Rs. 4,56,780",
      transactions: 312,
      avgTicketPrice: "Rs. 1,464",
      growthRate: "+12.5%"
    },
    revenueByRoute: [
      { route: "Kathmandu - Pokhara", transactions: 89, revenue: "Rs. 1,28,550", share: "28.1%" },
      { route: "Kathmandu - Chitwan", transactions: 67, revenue: "Rs. 1,00,500", share: "22.0%" },
      { route: "Kathmandu - Biratnagar", transactions: 54, revenue: "Rs. 86,400", share: "18.9%" },
      { route: "Pokhara - Butwal", transactions: 48, revenue: "Rs. 57,600", share: "12.6%" },
      { route: "Kathmandu - Janakpur", transactions: 32, revenue: "Rs. 48,000", share: "10.5%" },
      { route: "Others", transactions: 22, revenue: "Rs. 35,730", share: "7.9%" }
    ],
    paymentMethods: [
      { method: "eSewa", transactions: 145, amount: "Rs. 2,10,340", percentage: "46.0%" },
      { method: "Khalti", transactions: 98, amount: "Rs. 1,42,230", percentage: "31.1%" },
      { method: "Bank Transfer", transactions: 42, amount: "Rs. 61,040", percentage: "13.4%" },
      { method: "Cash", transactions: 27, amount: "Rs. 43,170", percentage: "9.5%" }
    ],
    hourlyBreakdown: [
      { hour: "06:00 - 09:00", transactions: 78, revenue: "Rs. 1,13,580" },
      { hour: "09:00 - 12:00", transactions: 92, revenue: "Rs. 1,34,720" },
      { hour: "12:00 - 15:00", transactions: 45, revenue: "Rs. 65,880" },
      { hour: "15:00 - 18:00", transactions: 62, revenue: "Rs. 90,520" },
      { hour: "18:00 - 21:00", transactions: 35, revenue: "Rs. 52,080" }
    ]
  };

  const handleDownload = (format: string) => {
    toast.success(`Downloading report as ${format}`);
  };

  const handleShare = () => {
    toast.success("Share link copied to clipboard");
  };

  const handlePrint = () => {
    toast.success("Preparing report for printing");
  };

  const handleRegenerate = () => {
    toast.success("Report regeneration started");
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/reports")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{report.name}</h2>
          <p className="text-muted-foreground mt-1">{report.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleRegenerate}>
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </Button>
          <Button className="gap-2" onClick={() => handleDownload("PDF")}>
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Report Meta Information */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Report ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">{report.id}</p>
            <p className="text-xs text-muted-foreground mt-1">Format: {report.format} • {report.size}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-secondary" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-sm">{report.dateRange}</p>
            <Badge variant="outline" className="mt-1">{report.frequency}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-sm">{report.lastGenerated}</p>
            <p className="text-xs text-muted-foreground mt-1">Next: {report.nextScheduled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4 text-success" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default">{report.status}</Badge>
            <p className="text-xs text-muted-foreground mt-2">By: {report.createdBy}</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">{report.summary.totalRevenue}</p>
            <Badge variant="secondary" className="mt-2">{report.summary.growthRate}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold">{report.summary.transactions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg. Ticket Price</p>
            <p className="text-2xl font-bold">{report.summary.avgTicketPrice}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Growth Rate</p>
            <p className="text-2xl font-bold text-success">{report.summary.growthRate}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue by Route */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Route</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.revenueByRoute.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.route}</TableCell>
                    <TableCell className="text-right">{item.transactions}</TableCell>
                    <TableCell className="text-right">{item.revenue}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{item.share}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.paymentMethods.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant="secondary">{item.method}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.transactions}</TableCell>
                    <TableCell className="text-right font-medium">{item.amount}</TableCell>
                    <TableCell className="text-right">{item.percentage}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Transaction Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time Slot</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead>Distribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.hourlyBreakdown.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.hour}</TableCell>
                  <TableCell className="text-right">{item.transactions}</TableCell>
                  <TableCell className="text-right font-medium">{item.revenue}</TableCell>
                  <TableCell>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(item.transactions / 92) * 100}%` }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Download Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" className="gap-2" onClick={() => handleDownload("PDF")}>
              <FileText className="h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleDownload("Excel")}>
              <FileText className="h-4 w-4" />
              Download Excel
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleDownload("CSV")}>
              <FileText className="h-4 w-4" />
              Download CSV
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleDownload("JSON")}>
              <FileText className="h-4 w-4" />
              Download JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ReportView;
