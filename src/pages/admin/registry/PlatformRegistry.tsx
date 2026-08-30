import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Globe, MapPin, Route, Sparkles } from "lucide-react";
import { getAllRouteRequests } from "@/api/platformRegistryApi";
import { BoardingLocationWorkspace } from "@/components/admin/boarding-location/BoardingLocationWorkspace";
import { CorridorWorkspace } from "@/components/admin/corridor-registry/CorridorWorkspace";
import { StopRegistryWorkspace } from "@/components/admin/stop-registry/StopRegistryWorkspace";
import RouteRequestsPanel from "./RouteRequestsPanel";

const PlatformRegistry = () => {
  const { data: routeReqData } = useQuery({
    queryKey: ["routeRequests", "PENDING"],
    queryFn: () => getAllRouteRequests("PENDING"),
    staleTime: 30_000,
  });
  const pendingRouteRequests = routeReqData?.data.length ?? 0;

  return (
    <div className="container mx-auto space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-5">
        <div className="rounded-[1.5rem] bg-[#D3D925] p-4 text-black shadow-2xl shadow-[#D3D925]/20"><Database className="size-9" /></div>
        <div><h1 className="text-5xl font-bold tracking-tighter">Platform Registry</h1><p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/50">5-Layer Infrastructure System</p></div>
      </div>

      <div className="rounded-2xl border border-[#D3D925]/10 bg-[#D3D925]/10 p-5 text-sm font-medium text-white/50"><strong className="text-white">Build order:</strong> Start with <strong>Stop Registry</strong>, declare <strong>Corridors</strong>, then build directional <strong>Route Variants</strong> and their canonical stop sequences.</div>

      <Tabs defaultValue="stops" className="w-full">
        <TabsList className="mb-8 inline-flex h-auto gap-1 rounded-[2rem] border border-white/5 bg-white/5 p-2">
          <TabsTrigger value="stops" className="flex items-center gap-2 rounded-2xl border border-transparent px-8 py-3.5 text-sm font-bold data-[state=active]:bg-[#0a0a0a] data-[state=active]:text-[#D3D925] data-[state=active]:shadow-xl"><MapPin className="size-4" />Stop Registry</TabsTrigger>
          <TabsTrigger value="corridors" className="flex items-center gap-2 rounded-2xl border border-transparent px-8 py-3.5 text-sm font-bold data-[state=active]:bg-[#0a0a0a] data-[state=active]:text-[#D3D925] data-[state=active]:shadow-xl"><Globe className="size-4" />Corridors</TabsTrigger>
          <TabsTrigger value="hubs" className="flex items-center gap-2 rounded-2xl border border-transparent px-8 py-3.5 text-sm font-bold data-[state=active]:bg-[#0a0a0a] data-[state=active]:text-[#D3D925] data-[state=active]:shadow-xl"><Sparkles className="size-4" />Boarding Locations</TabsTrigger>
          <TabsTrigger value="route-requests" className="flex items-center gap-2 rounded-2xl border border-transparent px-8 py-3.5 text-sm font-bold data-[state=active]:bg-[#0a0a0a] data-[state=active]:text-[#D3D925] data-[state=active]:shadow-xl"><Route className="size-4" />Route Requests{pendingRouteRequests > 0 && <span className="ml-1 rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-white">{pendingRouteRequests}</span>}</TabsTrigger>
        </TabsList>

        <Card className="overflow-hidden rounded-[2.5rem] border-none border-white/5 bg-[#121212]/30 shadow-xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] backdrop-blur-md">
          <CardHeader className="border-b border-white/5 bg-white/5 pb-4"><CardTitle className="flex items-center gap-2 text-white">Infrastructure Control</CardTitle><CardDescription className="font-medium">Platform-level route graph management.</CardDescription></CardHeader>
          <CardContent className="p-8">
            <TabsContent value="stops" className="mt-0 animate-in fade-in duration-300"><StopRegistryWorkspace /></TabsContent>
            <TabsContent value="corridors" className="mt-0 animate-in fade-in duration-300"><CorridorWorkspace /></TabsContent>
            <TabsContent value="hubs" className="mt-0 animate-in fade-in duration-300"><BoardingLocationWorkspace /></TabsContent>
            <TabsContent value="route-requests" className="mt-0 animate-in fade-in duration-300"><RouteRequestsPanel /></TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default PlatformRegistry;
