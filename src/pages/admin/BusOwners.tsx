"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bus, Building2, TrendingUp } from "lucide-react";
import { useModal } from "@/hooks/use-model-store";

const busOwners = [
  { id: "OWN-001", company: "Nepal Express Travels", owner: "Deepak Adhikari", fleet: 24, revenue: "Rs. 8,45,000", status: "Verified", type: "Large" },
  { id: "OWN-002", company: "Himalayan Tours", owner: "Binod Thapa", fleet: 8, revenue: "Rs. 3,20,000", status: "Verified", type: "Medium" },
  { id: "OWN-003", company: "Kathmandu Bus Service", owner: "Anita Shrestha", fleet: 3, revenue: "Rs. 1,45,000", status: "Pending", type: "Small" },
  { id: "OWN-004", company: "Everest Transport", owner: "Rajesh Gurung", fleet: 18, revenue: "Rs. 6,75,000", status: "Verified", type: "Large" },
];

const BusOwners = () => {
  const {onOpen} = useModal()
  return (
    <>
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Bus Owner Management</h2>
            <p className="text-muted-foreground mt-1">Manage bus owners and fleet operations</p>
          </div>
          <Button onClick={()=>onOpen("addBusOwner")} className="gap-2 active:bg-blue-800 cursor-pointer w-full sm:w-auto">
            <Building2 className="h-4 w-4" />
            Add Owner
          </Button>
        </div>

        {/* KPI CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">Registered companies</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Small Fleet (1-5)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">57% of owners</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Medium Fleet (6-15)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">29% of owners</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Large Fleet (16+)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">22</div>
              <p className="text-xs text-success">14% of owners</p>
            </CardContent>
          </Card>
        </div>

        {/* BUS OWNER DIRECTORY */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <CardTitle>Bus Owner Directory</CardTitle>
              <Badge variant="outline" className="gap-2">
                <TrendingUp className="h-3 w-3" /> Total Fleet: 245 Buses
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr>
                    <th className="p-2 text-left">Owner ID</th>
                    <th className="p-2 text-left">Company</th>
                    <th className="p-2 text-left">Owner Name</th>
                    <th className="p-2 text-left">Fleet Size</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Monthly Revenue</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {busOwners.map((owner) => (
                    <tr key={owner.id} className="border-b">
                      <td className="p-2 font-medium">{owner.id}</td>
                      <td className="p-2 font-medium">{owner.company}</td>
                      <td className="p-2">{owner.owner}</td>
                      <td className="p-2 flex items-center gap-1">
                        <Bus className="h-4 w-4 text-muted-foreground" />
                        {owner.fleet}
                      </td>
                      <td className="p-2"><Badge variant="outline">{owner.type}</Badge></td>
                      <td className="p-2">{owner.revenue}</td>
                      <td className="p-2">
                        <Badge variant={owner.status as BadgeProps["variant"]}>
                          {owner.status}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-3">
              {busOwners.map((owner) => (
                <div key={owner.id} className="border rounded-lg p-3 shadow-sm bg-background space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{owner.id}</span>
                    <Badge variant={owner.status as BadgeProps["variant"]}>
                      {owner.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Company: {owner.company}</div>
                    <div>Owner: {owner.owner}</div>
                    <div>Fleet: {owner.fleet}</div>
                    <div>Type: {owner.type}</div>
                    <div>Revenue: {owner.revenue}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full">View</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
    </>
  );
};

export default BusOwners;
