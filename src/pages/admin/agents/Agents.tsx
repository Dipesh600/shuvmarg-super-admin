"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UserCog,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  ClipboardList,
  Search,
  ChevronRight,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Info,
  ContactRound,
} from "lucide-react";
import { useModal } from "@/hooks/use-model-store";
import { columns } from "@/components/data_tables/agents/columns";
import { DataTable } from "@/components/DataTable";
import { getAllAgents, getAgentDashboardData } from "@/api/agentApi";
import { useAuth } from "@/providers/AuthProvider";
import AgentsSkeleton from "@/components/Skeletion_Loading/AgentsSkeletion";

// ── Application status config ─────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; dot: string }> = {
  PENDING:   { label: "Pending Review",       badgeClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-400" },
  MORE_INFO: { label: "More Info Requested",  badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",      dot: "bg-blue-400"   },
  APPROVED:  { label: "Approved",             badgeClass: "bg-green-500/15 text-green-400 border-green-500/30",   dot: "bg-green-400"  },
  REJECTED:  { label: "Rejected",             badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",         dot: "bg-red-400"    },
  SUSPENDED: { label: "Suspended",            badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30",dot: "bg-orange-400" },
  DRAFT:     { label: "Draft",                badgeClass: "bg-white/5 text-white/40 border-white/10",             dot: "bg-white/20"   },
};

type AppFilter = "ALL" | "PENDING" | "MORE_INFO" | "APPROVED" | "REJECTED";

// ── Mobile agent card (for directory tab) ─────────────────────────────────────
const mobileAgents = [
  { id: "SUMA-AGT-001", name: "Ram Bahadur Thapa", location: "Kathmandu",  status: "Verified",  commission: "Rs. 45,600", performance: "92%", applications: 67 },
  { id: "SUMA-AGT-002", name: "Sita Devi",          location: "Pokhara",    status: "Verified",  commission: "Rs. 38,200", performance: "88%", applications: 54 },
  { id: "SUMA-AGT-003", name: "Hari Prasad Sharma", location: "Biratnagar", status: "Pending",   commission: "Rs. 12,400", performance: "75%", applications: 23 },
];

// ─────────────────────────────────────────────────────────────────────────────

const Agents = () => {
  const { onOpen } = useModal();
  const { token } = useAuth();
  const navigate = useNavigate();

  // ── Active tab ───────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<"directory" | "applications">("directory");

  // ── Applications sub-filter ──────────────────────────────────────────────────
  const [appFilter, setAppFilter] = useState<AppFilter>("PENDING");
  const [search, setSearch] = useState("");

  // ── Data fetching ────────────────────────────────────────────────────────────
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["agents", "all"],
    queryFn: () => getAllAgents(),
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["agentDashboard"],
    queryFn: getAgentDashboardData,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const agentDashboard = dashboardData?.data;
  const allAgents: any[] = data?.data ?? [];

  // ── Directory table data ─────────────────────────────────────────────────────
  const agentTableData = allAgents
    .filter((a) => a.applicationStatus === "APPROVED")
    .map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      profileImg: agent.profileImg,
      email: agent.email,
      location: agent.location,
      status: agent.applicationStatus,
      commission: agent.commission,
      performance: "90%",
      applications: agent.totalBookings ?? 0,
    }));

  // ── Applications queue data ──────────────────────────────────────────────────
  const appCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: allAgents.length };
    allAgents.forEach((a) => {
      c[a.applicationStatus] = (c[a.applicationStatus] ?? 0) + 1;
    });
    return c;
  }, [allAgents]);

  const filteredApps = useMemo(() => {
    let list = appFilter === "ALL" ? allAgents : allAgents.filter((a) => a.applicationStatus === appFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.phone?.includes(q) ||
          a.agentId?.toLowerCase().includes(q) ||
          a.location?.toLowerCase().includes(q)
      );
    }
    // Urgency sort: PENDING first, then MORE_INFO, then others; within each group by date desc
    const order: Record<string, number> = { PENDING: 0, MORE_INFO: 1, DRAFT: 2, APPROVED: 3, REJECTED: 4, SUSPENDED: 5 };
    return [...list].sort((a, b) => {
      const od = (order[a.applicationStatus] ?? 9) - (order[b.applicationStatus] ?? 9);
      if (od !== 0) return od;
      return new Date(b.submittedAt ?? b.createdAt).getTime() - new Date(a.submittedAt ?? a.createdAt).getTime();
    });
  }, [allAgents, appFilter, search]);

  const pendingCount = agentDashboard?.pendingAgents ?? 0;
  const moreInfoCount = agentDashboard?.moreInfoAgents ?? 0;

  const appFilterTabs: { key: AppFilter; label: string }[] = [
    { key: "PENDING",   label: "Pending" },
    { key: "MORE_INFO", label: "More Info" },
    { key: "ALL",       label: "All" },
    { key: "APPROVED",  label: "Approved" },
    { key: "REJECTED",  label: "Rejected" },
  ];

  // ── Loading / error ──────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="text-white/60 py-12 text-center">
        Error: {error instanceof Error ? error.message : "An error occurred"}
      </div>
    );
  }
  if (isLoading || isDashboardLoading) {
    return <AgentsSkeleton />;
  }

  return (
    <>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Agent Management</h2>
          <p className="text-white/60 mt-1 font-medium text-sm">
            Manage all agents and review onboarding applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={() => navigate("/admin/agents/leads")}
            className="gap-2 cursor-pointer font-bold rounded-xl h-10 bg-white/5 hover:bg-white/10"
          >
            <ContactRound className="h-4 w-4" /> Agent Leads
          </Button>
          <Button
            onClick={() => onOpen("addAgent", {})}
            className="gap-2 cursor-pointer font-bold rounded-xl h-10 bg-white/5 hover:bg-white/10"
          >
            <UserCog className="h-4 w-4" /> New Agent
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Agents"
          value={(agentDashboard?.totalAgents || 0).toString()}
          icon={UserCog}
          subtitle="Approved, pending & active"
          changeType="neutral"
        />
        <StatCard
          title="Approved"
          value={(agentDashboard?.approvedAgents?.split(" ")[0] || 0).toString()}
          icon={CheckCircle}
          subtitle={agentDashboard?.approvedAgents || "0% of total"}
          changeType="positive"
        />
        <StatCard
          title="Pending Review"
          value={(agentDashboard?.pendingAgents || 0).toString()}
          icon={Clock}
          subtitle="Awaiting verification"
          changeType="neutral"
        />
        <StatCard
          title="Rejected"
          value={(agentDashboard?.rejectedAgents || 0).toString()}
          icon={XCircle}
          subtitle="Failed KYC"
          changeType="negative"
        />
      </div>

      {/* ── Main Tabs ── */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5 w-fit mb-6">
        <button
          onClick={() => setTab("directory")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "directory"
              ? "bg-white/10 text-white shadow-sm"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          <Users className="h-4 w-4" />
          Directory
          <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${tab === "directory" ? "bg-white/15 text-white" : "bg-white/5 text-white/30"}`}>
            {agentDashboard?.approvedAgents?.split(" ")[0] ?? 0}
          </span>
        </button>
        <button
          onClick={() => setTab("applications")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "applications"
              ? "bg-white/10 text-white shadow-sm"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Applications
          {(pendingCount + moreInfoCount) > 0 && (
            <span className={`flex items-center gap-1 text-xs rounded-full px-1.5 py-0.5 font-bold ${
              tab === "applications"
                ? "bg-amber-400/25 text-amber-400"
                : "bg-amber-400/15 text-amber-400"
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {pendingCount + moreInfoCount}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1 — DIRECTORY                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === "directory" && (
        <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">Agent Directory</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <DataTable columns={columns} data={agentTableData} />
            </div>
            {/* Mobile */}
            <div className="md:hidden flex flex-col gap-3">
              {mobileAgents.map((agent) => (
                <div key={agent.id} className="border border-white/5 rounded-xl p-3 bg-white/[0.02] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white text-sm">{agent.id}</span>
                    <Badge variant={agent.status as BadgeProps["variant"]}>{agent.status}</Badge>
                  </div>
                  <div className="text-sm text-white/60 space-y-1">
                    <div>Name: {agent.name}</div>
                    <div>Location: {agent.location}</div>
                    <div>Commission: {agent.commission}</div>
                    <div>Performance: {agent.performance}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full text-white/60">Manage</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2 — APPLICATIONS                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === "applications" && (
        <div className="space-y-4">
          {/* Sub-filter + search row */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
              {appFilterTabs.map((f) => {
                const isActive = appFilter === f.key;
                const count = appCounts[f.key] ?? 0;
                return (
                  <button
                    key={f.key}
                    onClick={() => setAppFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white/80"
                    }`}
                  >
                    {f.label}
                    {count > 0 && (
                      <span className={`text-[10px] rounded-full px-1.5 font-bold ${
                        isActive
                          ? f.key === "PENDING" ? "bg-yellow-400/20 text-yellow-400"
                          : f.key === "MORE_INFO" ? "bg-blue-400/20 text-blue-400"
                          : "bg-white/15 text-white"
                          : "bg-white/5 text-white/40"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <Input
                placeholder="Name, phone, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
          </div>

          {/* Applications list */}
          <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
            <CardHeader className="border-b border-white/5 py-3 px-5">
              <CardTitle className="text-sm text-white flex items-center justify-between">
                <span>
                  Applications
                  {filteredApps.length > 0 && (
                    <span className="ml-2 text-white/40 font-normal">({filteredApps.length})</span>
                  )}
                </span>
                {pendingCount > 0 && appFilter !== "PENDING" && (
                  <button
                    onClick={() => setAppFilter("PENDING")}
                    className="text-xs text-amber-400 flex items-center gap-1 hover:text-amber-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    {pendingCount} need review →
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3 text-white/30">
                  <ClipboardList className="h-8 w-8" />
                  <p className="text-sm">
                    {appFilter === "PENDING" ? "No pending applications 🎉" : `No ${appFilter.toLowerCase()} applications`}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredApps.map((agent) => {
                    const sc = STATUS_CONFIG[agent.applicationStatus] ?? STATUS_CONFIG["DRAFT"];
                    const needsAction = agent.applicationStatus === "PENDING" || agent.applicationStatus === "MORE_INFO";
                    const submittedDate = agent.submittedAt ?? agent.createdAt;
                    const daysAgo = submittedDate
                      ? Math.floor((Date.now() - new Date(submittedDate).getTime()) / 86400000)
                      : null;

                    return (
                      <div
                        key={agent.id}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                        onClick={() => navigate(`/admin/kyc/agent/${agent.id}`)}
                      >
                        {/* Status dot */}
                        <div className={`w-2 h-2 rounded-full shrink-0 ${sc.dot} ${needsAction ? "animate-pulse" : ""}`} />

                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {agent.profileImg ? (
                            <img src={agent.profileImg} alt={agent.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 text-white/30" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-white text-sm truncate">{agent.name ?? "—"}</p>
                            <span className="text-[10px] text-white/30 font-mono hidden sm:inline">{agent.agentId}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/40">
                            {agent.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{agent.phone}</span>}
                            {agent.location && <span className="flex items-center gap-1 hidden sm:flex"><MapPin className="h-3 w-3" />{agent.location}</span>}
                            {daysAgo !== null && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={`border text-[10px] px-2 ${sc.badgeClass}`}>{sc.label}</Badge>
                          {needsAction && daysAgo !== null && daysAgo >= 2 && (
                            <span title={`Waiting ${daysAgo} days`}>
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                            </span>
                          )}
                          {agent.applicationStatus === "MORE_INFO" && (
                            <Info className="h-3.5 w-3.5 text-blue-400" />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`gap-1 text-xs h-8 px-3 transition-all ${
                              needsAction
                                ? "text-[#D3D925] hover:bg-[#D3D925]/10"
                                : "text-white/40 hover:text-white/70"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/kyc/agent/${agent.id}`);
                            }}
                          >
                            {needsAction ? "Review" : "View"}
                            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All-clear banner */}
          {pendingCount === 0 && moreInfoCount === 0 && (
            <Card className="border-green-500/20 bg-green-500/5 text-white">
              <CardContent className="py-4 flex items-center gap-4">
                <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                <div>
                  <p className="font-semibold text-green-400 text-sm">All clear!</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    No pending or more-info applications. New submissions will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
};

export default Agents;
