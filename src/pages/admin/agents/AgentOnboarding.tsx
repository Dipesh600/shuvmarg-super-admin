import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  ClipboardCheck,
  Clock,
  Info,
  XCircle,
  Search,
  ChevronRight,
  User,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import {
  getAllAgents,
  getAgentDashboardData,
  type AgentListRecord,
} from "@/api/agentApi";
import { useAuth } from "@/providers/auth-context";

// ── Status definitions ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dot: string }
> = {
  PENDING: {
    label: "Pending Review",
    badgeClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-400",
  },
  MORE_INFO: {
    label: "More Info Requested",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
  },
  APPROVED: {
    label: "Approved",
    badgeClass: "bg-green-500/15 text-green-400 border-green-500/30",
    dot: "bg-green-400",
  },
  REJECTED: {
    label: "Rejected",
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
    dot: "bg-red-400",
  },
  SUSPENDED: {
    label: "Suspended",
    badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    dot: "bg-orange-400",
  },
  DRAFT: {
    label: "Draft",
    badgeClass: "bg-white/5 text-white/40 border-white/10",
    dot: "bg-white/20",
  },
};

type FilterTab = "ALL" | "PENDING" | "MORE_INFO" | "APPROVED" | "REJECTED";

export default function AgentOnboarding() {
  const [renderedAt] = useState(() => Date.now());
  const navigate = useNavigate();
  const { token } = useAuth();

  const [activeFilter, setActiveFilter] = useState<FilterTab>("PENDING");
  const [search, setSearch] = useState("");

  // ── Fetch all agents (backend supports ?status filter) ───────────────────
  const {
    data: allData,
    isLoading: allLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["agents", "all"],
    queryFn: () => getAllAgents(),
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });

  // ── Dashboard stats ───────────────────────────────────────────────────────
  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ["agentDashboard"],
    queryFn: getAgentDashboardData,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const dash = dashData?.data;

  // ── Filter + search agents ────────────────────────────────────────────────
  const agents: AgentListRecord[] = useMemo(() => allData?.data ?? [], [allData?.data]);

  const filtered = useMemo(() => {
    let list = agents;

    if (activeFilter !== "ALL") {
      list = list.filter((a) => a.applicationStatus === activeFilter);
    }

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

    return list;
  }, [agents, activeFilter, search]);

  // Counts per status for the tab badges
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: agents.length };
    agents.forEach((a) => {
      c[a.applicationStatus] = (c[a.applicationStatus] ?? 0) + 1;
    });
    return c;
  }, [agents]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "PENDING", label: "Pending" },
    { key: "MORE_INFO", label: "More Info" },
    { key: "ALL", label: "All" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
  ];

  // ── Urgency sort: PENDING first, then MORE_INFO, then by date desc ────────
  const sorted = useMemo(() => {
    const order: Record<string, number> = { PENDING: 0, MORE_INFO: 1, DRAFT: 2, APPROVED: 3, REJECTED: 4, SUSPENDED: 5 };
    return [...filtered].sort((a, b) => {
      const oDiff = (order[a.applicationStatus] ?? 99) - (order[b.applicationStatus] ?? 99);
      if (oDiff !== 0) return oDiff;
      return new Date(b.submittedAt ?? b.createdAt ?? 0).getTime() - new Date(a.submittedAt ?? a.createdAt ?? 0).getTime();
    });
  }, [filtered]);

  const isLoading = allLoading || dashLoading;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Agent Onboarding
          </h2>
          <p className="text-white/60 mt-1 text-sm">
            Review and action pending agent applications
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white w-fit"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Review"
          value={(dash?.pendingAgents ?? 0).toString()}
          icon={Clock}
          subtitle="Awaiting admin action"
          changeType="neutral"
        />
        <StatCard
          title="More Info Needed"
          value={(dash?.moreInfoAgents ?? 0).toString()}
          icon={Info}
          subtitle="Waiting on resubmission"
          changeType="neutral"
        />
        <StatCard
          title="Approved Today"
          value={(dash?.approvedAgents?.split(" ")[0] ?? "0").toString()}
          icon={ClipboardCheck}
          subtitle="Total approved agents"
          changeType="positive"
        />
        <StatCard
          title="Rejected"
          value={(dash?.rejectedAgents ?? 0).toString()}
          icon={XCircle}
          subtitle="Failed KYC review"
          changeType="negative"
        />
      </div>

      {/* ── Filter Tabs + Search ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
          {tabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            const count = counts[tab.key] ?? 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                      isActive
                        ? tab.key === "PENDING"
                          ? "bg-yellow-400/20 text-yellow-400"
                          : tab.key === "MORE_INFO"
                          ? "bg-blue-400/20 text-blue-400"
                          : "bg-white/15 text-white"
                        : "bg-white/5 text-white/40"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            placeholder="Search by name, phone, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/20"
          />
        </div>
      </div>

      {/* ── Applications List ── */}
      <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="text-base text-white flex items-center justify-between">
            <span>
              Applications
              {sorted.length > 0 && (
                <span className="ml-2 text-white/40 font-normal text-sm">
                  ({sorted.length})
                </span>
              )}
            </span>
            {(counts["PENDING"] ?? 0) > 0 && activeFilter !== "PENDING" && (
              <button
                onClick={() => setActiveFilter("PENDING")}
                className="text-xs text-yellow-400 flex items-center gap-1 hover:text-yellow-300 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                {counts["PENDING"]} need review
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-white/40">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading applications...
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/30">
              <ClipboardCheck className="h-10 w-10" />
              <p className="text-sm">
                {activeFilter === "PENDING"
                  ? "No pending applications 🎉"
                  : `No ${activeFilter.toLowerCase()} applications`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {sorted.map((agent) => {
                const sc = STATUS_CONFIG[agent.applicationStatus] ?? STATUS_CONFIG["DRAFT"];
                const isPending = agent.applicationStatus === "PENDING";
                const isMoreInfo = agent.applicationStatus === "MORE_INFO";
                const needsAction = isPending || isMoreInfo;

                const submittedDate = agent.submittedAt ?? agent.createdAt;
                const daysAgo = submittedDate
                  ? Math.floor(
                      (renderedAt - new Date(submittedDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : null;

                return (
                  <div
                    key={agent.id}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer group ${
                      needsAction ? "hover:bg-yellow-500/[0.03]" : ""
                    }`}
                    onClick={() =>
                      navigate(`/admin/kyc/agent/${agent.id}`)
                    }
                  >
                    {/* Status dot */}
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${sc.dot} ${
                        needsAction ? "animate-pulse" : ""
                      }`}
                    />

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {agent.profileImg ? (
                        <img
                          src={agent.profileImg}
                          alt={agent.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-white/30" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-white text-sm truncate">
                          {agent.name ?? "—"}
                        </p>
                        {needsAction && (
                          <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full font-mono">
                            {agent.agentId ?? "—"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/40">
                        {agent.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {agent.phone}
                          </span>
                        )}
                        {agent.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {agent.location}
                          </span>
                        )}
                        {daysAgo !== null && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {daysAgo === 0
                              ? "Today"
                              : daysAgo === 1
                              ? "Yesterday"
                              : `${daysAgo}d ago`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={`border text-xs ${sc.badgeClass}`}>
                        {sc.label}
                      </Badge>

                      {/* Urgency warning if waiting >2 days */}
                      {isPending && daysAgo !== null && daysAgo >= 2 && (
                        <span title={`Waiting ${daysAgo} days`} className="shrink-0">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                        </span>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        className={`gap-1 text-xs transition-all ${
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
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Empty state for no pending (all clear) ── */}
      {!isLoading && (counts["PENDING"] ?? 0) === 0 && (counts["MORE_INFO"] ?? 0) === 0 && (
        <Card className="border-green-500/20 bg-green-500/5 text-white">
          <CardContent className="py-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
              <ClipboardCheck className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-green-400">All clear!</p>
              <p className="text-sm text-white/50 mt-0.5">
                No pending or more-info applications right now. New submissions will appear here automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
