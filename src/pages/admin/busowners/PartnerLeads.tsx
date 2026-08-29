import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Users,
  Phone,
  CheckCircle,
  TrendingUp,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import {
  getPartnerLeads,
  getPartnerLeadStats,
  updatePartnerLead,
  type PartnerLead,
  type LeadStats,
} from "@/api/partnerLeadApi";
import { format } from "date-fns";

// ── Filter types ───────────────────────────────────────────────────────────────
type LeadTypeFilter = "all" | "contact_form" | "otp_verified";
type StatusFilter   = "all" | "new" | "contacted" | "converted";

// ── Badge helpers ──────────────────────────────────────────────────────────────
function LeadTypeBadge({ type }: { type: PartnerLead["leadType"] }) {
  if (type === "otp_verified") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{
          background: "rgba(122,29,27,0.15)",
          color: "#D96B62",
          border: "1px solid rgba(122,29,27,0.25)",
        }}
      >
        <Phone className="h-2.5 w-2.5" />
        OTP Verified
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{
        background: "rgba(201,154,74,0.15)",
        color: "#C99A4A",
        border: "1px solid rgba(201,154,74,0.3)",
      }}
    >
      Contact Form
    </span>
  );
}

function StatusBadge({ status }: { status: PartnerLead["status"] }) {
  const map: Record<string, { bg: string; color: string; border: string; label: string }> = {
    new: {
      bg: "rgba(255,255,255,0.08)",
      color: "#AAAAAA",
      border: "rgba(255,255,255,0.1)",
      label: "New",
    },
    contacted: {
      bg: "rgba(21,101,192,0.15)",
      color: "#64B5F6",
      border: "rgba(21,101,192,0.25)",
      label: "Contacted",
    },
    converted: {
      bg: "rgba(46,125,50,0.15)",
      color: "#81C784",
      border: "rgba(46,125,50,0.25)",
      label: "Converted",
    },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

// ── Notes popover ──────────────────────────────────────────────────────────────
function NotesCell({
  lead,
  onSave,
  isSaving,
}: {
  lead: PartnerLead;
  onSave: (id: string, notes: string) => void;
  isSaving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(lead.notes ?? "");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={lead.notes ?? "Add note"}
        className="flex items-center gap-1 text-[12px] transition-colors"
        style={{ color: lead.notes ? "#C99A4A" : "rgba(255,255,255,0.25)" }}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {lead.notes ? "View note" : "Add note"}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 w-64 rounded-xl p-3 shadow-2xl"
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.1)",
            top: "calc(100% + 6px)",
          }}
        >
          <textarea
            rows={3}
            className="w-full text-[12px] resize-none rounded-lg px-2 py-1.5 outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            }}
            placeholder="Add a note…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setOpen(false)}
              className="text-[11px] text-white/40 hover:text-white/70 px-2 py-1"
            >
              Cancel
            </button>
            <button
              disabled={isSaving}
              onClick={() => {
                onSave(lead._id, text);
                setOpen(false);
              }}
              className="text-[11px] font-semibold px-3 py-1 rounded-lg disabled:opacity-50"
              style={{ background: "rgba(122,29,27,0.5)", color: "#D96B62" }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const PartnerLeads = () => {
  const { token }   = useAuth();
  const queryClient = useQueryClient();

  const [leadTypeFilter, setLeadTypeFilter] = useState<LeadTypeFilter>("all");
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>("all");
  const [search, setSearch]                 = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage]                     = useState(1);
  const [updatingId, setUpdatingId]         = useState<string | null>(null);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((window as any)._busLeadSearchTimer);
    (window as any)._busLeadSearchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["partnerLeads", leadTypeFilter, statusFilter, debouncedSearch, page],
    queryFn: () =>
      getPartnerLeads({
        leadType: leadTypeFilter !== "all" ? leadTypeFilter : undefined,
        status:   statusFilter   !== "all" ? statusFilter   : undefined,
        search:   debouncedSearch || undefined,
        page,
        limit: 20,
      }),
    enabled: !!token,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const { data: statsData } = useQuery({
    queryKey: ["partnerLeadStats"],
    queryFn:  getPartnerLeadStats,
    enabled:  !!token,
    staleTime: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PartnerLead["status"] }) =>
      updatePartnerLead(id, { status }),
    onMutate:  ({ id }) => setUpdatingId(id),
    onSettled: () => {
      setUpdatingId(null);
      queryClient.invalidateQueries({ queryKey: ["partnerLeads"] });
      queryClient.invalidateQueries({ queryKey: ["partnerLeadStats"] });
    },
  });

  const notesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      updatePartnerLead(id, { notes }),
    onMutate:  ({ id }) => setUpdatingId(id),
    onSettled: () => {
      setUpdatingId(null);
      queryClient.invalidateQueries({ queryKey: ["partnerLeads"] });
    },
  });

  const leads: PartnerLead[]         = data?.data?.data ?? [];
  const stats: LeadStats | undefined = statsData?.data?.data;
  const totalPages                   = data?.data?.totalPages ?? 1;
  const totalCount                   = data?.data?.total ?? 0;

  if (isError) {
    return (
      <div className="text-white/60 py-12 text-center">
        Failed to load leads. Please refresh.
      </div>
    );
  }

  return (
    <>
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Partner Leads</h2>
          <p className="text-white/60 mt-1 font-medium text-sm">
            Prospects who expressed interest in joining Shuv Marg as bus operators
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 text-[12px] text-white/50 hover:text-white/80 transition-colors px-3 py-2 rounded-lg"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Leads"
          value={(stats?.total ?? 0).toString()}
          icon={Users}
          subtitle="All sources"
          changeType="neutral"
        />
        <StatCard
          title="OTP Verified"
          value={(stats?.otpVerified ?? 0).toString()}
          icon={Phone}
          subtitle="High-intent drop-offs"
          changeType="positive"
        />
        <StatCard
          title="Contact Form"
          value={(stats?.contactForm ?? 0).toString()}
          icon={TrendingUp}
          subtitle="Requested callback"
          changeType="neutral"
        />
        <StatCard
          title="Converted"
          value={(stats?.converted ?? 0).toString()}
          icon={CheckCircle}
          subtitle={`${stats?.conversionRate ?? "0.0"}% conversion rate`}
          changeType="positive"
        />
      </div>

      {/* LEADS TABLE */}
      <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-white">Lead Directory</CardTitle>

              {/* Search */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  minWidth: "220px",
                }}
              >
                <Search className="h-3.5 w-3.5 text-white/30 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name or phone…"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="bg-transparent outline-none text-white/80 placeholder:text-white/30 w-full"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Lead Type Filter */}
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                {(["all", "contact_form", "otp_verified"] as LeadTypeFilter[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setLeadTypeFilter(t); setPage(1); }}
                    className="px-3 py-1 rounded-md text-[12px] font-medium transition-all"
                    style={{
                      background: leadTypeFilter === t ? "rgba(255,255,255,0.15)" : "transparent",
                      color:      leadTypeFilter === t ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {t === "all" ? "All Types" : t === "contact_form" ? "Contact Form" : "OTP Verified"}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                {(["all", "new", "contacted", "converted"] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                    className="px-3 py-1 rounded-md text-[12px] font-medium transition-all capitalize"
                    style={{
                      background: statusFilter === s ? "rgba(255,255,255,0.15)" : "transparent",
                      color:      statusFilter === s ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {s === "all" ? "All Status" : s}
                  </button>
                ))}
              </div>

              {(leadTypeFilter !== "all" || statusFilter !== "all" || debouncedSearch) && (
                <button
                  onClick={() => {
                    setLeadTypeFilter("all");
                    setStatusFilter("all");
                    setSearch("");
                    setDebouncedSearch("");
                    setPage(1);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                  style={{
                    background: "rgba(122,29,27,0.2)",
                    color: "#D96B62",
                    border: "1px solid rgba(122,29,27,0.3)",
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="h-10 w-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/60 font-medium">No leads found</p>
              <p className="text-white/30 text-sm mt-1">
                {leadTypeFilter !== "all" || statusFilter !== "all" || debouncedSearch
                  ? "Try clearing the filters."
                  : "Leads will appear here once someone expresses interest."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {[
                        "Name / Phone",
                        "District",
                        "Type",
                        "Phone Verified",
                        "Status",
                        "Date",
                        "Update Status",
                        "Notes",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left pb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40 px-3 first:pl-0"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leads.map((lead) => (
                      <tr
                        key={lead._id}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Name / Phone */}
                        <td className="py-4 pr-3 pl-0">
                          <div className="font-medium text-white">
                            {lead.fullName || (
                              <span className="text-white/30 italic">—</span>
                            )}
                          </div>
                          <div className="text-[12px] text-white/50 mt-0.5 font-mono">
                            +977 {lead.phone}
                          </div>
                        </td>

                        {/* District */}
                        <td className="py-4 px-3 text-white/70 text-[13px]">
                          {lead.district || <span className="text-white/30">—</span>}
                        </td>

                        {/* Lead Type */}
                        <td className="py-4 px-3">
                          <LeadTypeBadge type={lead.leadType} />
                        </td>

                        {/* Phone Verified */}
                        <td className="py-4 px-3">
                          {lead.phoneVerified ? (
                            <span className="text-[#81C784] text-[12px] font-medium flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Yes
                            </span>
                          ) : (
                            <span className="text-white/30 text-[12px]">No</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-3">
                          <StatusBadge status={lead.status} />
                        </td>

                        {/* Date */}
                        <td className="py-4 px-3 text-white/40 text-[12px]">
                          {format(new Date(lead.createdAt), "dd MMM yyyy")}
                        </td>

                        {/* Update Status */}
                        <td className="py-4 px-3">
                          {lead.status !== "converted" ? (
                            <select
                              value={lead.status}
                              disabled={updatingId === lead._id}
                              onChange={(e) =>
                                statusMutation.mutate({
                                  id: lead._id,
                                  status: e.target.value as PartnerLead["status"],
                                })
                              }
                              className="text-[12px] rounded-lg px-2 py-1 outline-none cursor-pointer disabled:opacity-50"
                              style={{
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#FFFFFF",
                              }}
                            >
                              <option value="new"       style={{ background: "#1a1a1a" }}>New</option>
                              <option value="contacted" style={{ background: "#1a1a1a" }}>Contacted</option>
                              <option value="converted" style={{ background: "#1a1a1a" }}>Converted</option>
                            </select>
                          ) : (
                            <span className="text-[12px] text-white/30 italic">—</span>
                          )}
                        </td>

                        {/* Notes */}
                        <td className="py-4 px-3">
                          <NotesCell
                            lead={lead}
                            onSave={(id, notes) => notesMutation.mutate({ id, notes })}
                            isSaving={updatingId === lead._id}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
                  <p className="text-[12px] text-white/40">
                    Showing {leads.length} of {totalCount} leads
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-lg"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-[12px] text-white/60 px-2">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-lg"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default PartnerLeads;
