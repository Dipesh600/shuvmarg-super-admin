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
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Reports & Documentation
            </h2>
            <p className="text-white/60 mt-1">
              Generate and download platform reports
            </p>
          </div>
          <Button
            onClick={() => onOpen("addCustomReport",{})}
            className="gap-2 cursor-pointer w-full md:w-auto bg-[#D3D925] hover:bg-[#b5bc1b] text-black font-semibold"
          >
            <FileText className="h-4 w-4" />
            Custom Report
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-4">
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-4 w-4 text-[#D3D925]" />
                Total Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-white">234</div>
              <p className="text-xs text-white/80 mt-1">
                Generated this month
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="h-4 w-4 text-[#D3D925]" />
                Scheduled Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-white">12</div>
              <p className="text-xs text-white/80 mt-1">Active schedules</p>
            </CardContent>
          </Card>
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <Download className="h-4 w-4 text-[#D3D925]" />
                Downloads
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-white">1,456</div>
              <p className="text-xs text-white/80 mt-1">Last 30 days</p>
            </CardContent>
          </Card>
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-4 w-4 text-[#D3D925]" />
                Report Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-white">+28%</div>
              <p className="text-xs text-white/80 mt-1">vs last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Available Reports */}
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-white">Available Reports</CardTitle>
            <CardDescription className="text-white/50">Scheduled and on-demand reports</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {reports.map((report, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors gap-4"
                >
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-2 flex-wrap">
                      <div className="p-2 rounded-md bg-white/5 border border-white/5">
                        <FileText className="h-4 w-4 text-[#D3D925]" />
                      </div>
                      <h3 className="font-semibold text-white">{report.name}</h3>
                      <Badge variant="outline" className="border-white/10 text-white bg-white/5">{report.frequency}</Badge>
                    </div>
                    <p className="text-sm text-white/60 mb-2">
                      {report.description}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 text-xs text-white/40">
                      <span>Last generated: {report.lastGenerated}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Size: {report.size}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 w-full sm:w-auto bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Link to={"/admin/reports/1"}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full sm:w-auto text-white/60 hover:text-white hover:bg-white/10"
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
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">Report Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                <span className="text-sm text-white/80">Financial Reports</span>
                <Badge variant="outline" className="border-white/10 text-white bg-white/5 text-xs">45</Badge>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                <span className="text-sm text-white/80">Operational Reports</span>
                <Badge variant="outline" className="border-white/10 text-white bg-white/5 text-xs">38</Badge>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                <span className="text-sm text-white/80">User Analytics</span>
                <Badge variant="outline" className="border-white/10 text-white bg-white/5 text-xs">32</Badge>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                <span className="text-sm text-white/80">Compliance Reports</span>
                <Badge variant="outline" className="border-white/10 text-white bg-white/5 text-xs">12</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <Button variant="outline" className="w-full justify-start gap-3 bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">
                <FileText className="h-4 w-4 text-[#D3D925]" />
                Generate Monthly Summary
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">
                <Calendar className="h-4 w-4 text-[#D3D925]" />
                Schedule New Report
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">
                <Download className="h-4 w-4 text-[#D3D925]" />
                Export All Data
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">
                <TrendingUp className="h-4 w-4 text-[#D3D925]" />
                View Report Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
    </>
  );
};

export default Reports;
