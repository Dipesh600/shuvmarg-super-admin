import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useModal } from "@/hooks/use-model-store";
import { Link } from "react-router-dom";

const reports = [
  {
    name: "Daily Revenue Report",
    description: "Complete revenue breakdown by routes and payment methods",
    frequency: "Daily",
    lastGenerated: "2024-01-28 06:00 AM",
    size: "2.4 MB",
  },
  {
    name: "User Analytics Report",
    description: "User registration, engagement, and retention metrics",
    frequency: "Weekly",
    lastGenerated: "2024-01-27 11:00 PM",
    size: "5.1 MB",
  },
  {
    name: "Fleet Performance Report",
    description: "Bus utilization, maintenance schedules, and route efficiency",
    frequency: "Weekly",
    lastGenerated: "2024-01-27 11:00 PM",
    size: "3.8 MB",
  },
  {
    name: "Agent Commission Report",
    description: "Agent performance and commission calculations",
    frequency: "Monthly",
    lastGenerated: "2024-01-01 12:00 AM",
    size: "8.2 MB",
  },
  {
    name: "Financial Reconciliation",
    description: "Complete financial reconciliation with transaction details",
    frequency: "Monthly",
    lastGenerated: "2024-01-01 12:00 AM",
    size: "12.5 MB",
  },
  {
    name: "Compliance Report",
    description: "Regulatory compliance and document verification status",
    frequency: "Quarterly",
    lastGenerated: "2024-01-01 12:00 AM",
    size: "15.3 MB",
  },
];

const Reports = () => {
  const { onOpen } = useModal();

  return (
    <>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Reports & Documentation
            </h2>
            <p className="text-muted-foreground mt-1">
              Generate and download platform reports
            </p>
          </div>
          <Button
            onClick={() => onOpen("addCustomReport")}
            className="gap-2 cursor-pointer active:bg-blue-800 w-full md:w-auto"
          >
            <FileText className="h-4 w-4" />
            Custom Report
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Total Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">234</div>
              <p className="text-xs text-muted-foreground">
                Generated this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-sky-700" />
                Scheduled Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-sky-700">Active schedules</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Download className="h-4 w-4 text-cyan-700" />
                Downloads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,456</div>
              <p className="text-xs text-cyan-700">Last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-fuchsia-500" />
                Report Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+28%</div>
              <p className="text-xs text-fuchsia-500">vs last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Available Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
            <CardDescription>Scheduled and on-demand reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {reports.map((report, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-2 flex-wrap">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{report.name}</h3>
                      <Badge variant="outline">{report.frequency}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {report.description}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 text-xs text-muted-foreground">
                      <span>Last generated: {report.lastGenerated}</span>
                      <span>•</span>
                      <span>Size: {report.size}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Link to={"/admin/reports/1"}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      View
                    </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categories & Quick Actions */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Financial Reports</span>
                <Badge>45</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Operational Reports</span>
                <Badge>38</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">User Analytics</span>
                <Badge>32</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Compliance Reports</span>
                <Badge>12</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                Generate Monthly Summary
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4" />
                Schedule New Report
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Download className="h-4 w-4" />
                Export All Data
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <TrendingUp className="h-4 w-4" />
                View Report Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
    </>
  );
};

export default Reports;
