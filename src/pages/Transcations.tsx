"use client";

import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";

const transactions = [
  { id: "TXN-001234", user: "Rajesh Kumar", amount: "Rs. 1,450", method: "eSewa", status: "Success", date: "2024-01-28 14:32", route: "KTM-PKR" },
  { id: "TXN-001235", user: "Sita Sharma", amount: "Rs. 2,100", method: "Khalti", status: "Success", date: "2024-01-28 14:28", route: "KTM-CHT" },
  { id: "TXN-001236", user: "Mohan Thapa", amount: "Rs. 3,200", method: "Cash", status: "Pending", date: "2024-01-28 14:15", route: "KTM-BTR" },
  { id: "TXN-001237", user: "Gita Rai", amount: "Rs. 1,850", method: "eSewa", status: "Success", date: "2024-01-28 14:10", route: "PKR-BTW" },
  { id: "TXN-001238", user: "Krishna Gurung", amount: "Rs. 950", method: "Bank", status: "Failed", date: "2024-01-28 14:05", route: "KTM-JNK" },
];

const Transactions = () => {
  return (
    <SidebarProvider>
      <DashboardLayout>
        <div className="mb-4">
          <h2 className="text-3xl font-bold tracking-tight">Transaction Management</h2>
          <p className="text-muted-foreground mt-1">Monitor and manage all platform transactions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. 45,67,890</div>
              <p className="text-xs text-success">Today: Rs. 2,34,500</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.7%</div>
              <p className="text-xs text-success">Above benchmark</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Failed Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.3%</div>
              <p className="text-xs text-muted-foreground">67 today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg. Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. 1,450</div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <CardTitle>Transaction History</CardTitle>
              <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 w-full sm:max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by transaction ID, user, or amount..." className="pl-9 w-full" />
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr>
                    <th className="p-2 text-left">Transaction ID</th>
                    <th className="p-2 text-left">User</th>
                    <th className="p-2 text-left">Route</th>
                    <th className="p-2 text-left">Amount</th>
                    <th className="p-2 text-left">Payment Method</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Date & Time</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b">
                      <td className="p-2 font-medium">{txn.id}</td>
                      <td className="p-2">{txn.user}</td>
                      <td className="p-2">{txn.route}</td>
                      <td className="p-2 font-semibold">{txn.amount}</td>
                      <td className="p-2"><Badge variant="outline">{txn.method}</Badge></td>
                      <td className="p-2">
                        <Badge variant={txn.status as BadgeProps["variant"]}>
                          {txn.status}
                        </Badge>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">{txn.date}</td>
                      <td className="p-2 text-right">
                        <Button variant="ghost" size="sm">Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-3">
              {transactions.map((txn) => (
                <div key={txn.id} className="border rounded-lg p-3 shadow-sm bg-background space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{txn.id}</span>
                    <Badge variant={txn.status === "Success" ? "default" : txn.status === "Pending" ? "secondary" : "destructive"}>
                      {txn.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>User: {txn.user}</div>
                    <div>Route: {txn.route}</div>
                    <div>Amount: {txn.amount}</div>
                    <div>Method: {txn.method}</div>
                    <div>Date: {txn.date}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full">Details</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    </SidebarProvider>
  );
};

export default Transactions;
