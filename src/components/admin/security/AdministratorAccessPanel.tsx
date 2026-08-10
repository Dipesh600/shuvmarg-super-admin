import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { inviteAdministrator, listAdministrators, setAdministratorStatus, type Administrator } from "@/api/adminSecurityApi";
import { useAuth } from "@/providers/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const errorMessage = (error: unknown) => {
  const typed = error as { response?: { data?: { message?: string } } };
  return typed.response?.data?.message || "Administrator invitation failed";
};

export default function AdministratorAccessPanel() {
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [adminId, setAdminId] = useState("");
  const [role, setRole] = useState<Administrator["role"]>("ADMIN");
  const [inviteLink, setInviteLink] = useState("");
  const administrators = useQuery({
    queryKey: ["administrators"], queryFn: listAdministrators,
    enabled: admin?.isRootAdmin === true,
  });
  const invite = useMutation({
    mutationFn: inviteAdministrator,
    onSuccess: (result) => {
      const link = `${window.location.origin}/auth/enroll?kind=invitation&token=${encodeURIComponent(result.token)}`;
      setInviteLink(link);
      setEmail(""); setAdminId("");
      queryClient.invalidateQueries({ queryKey: ["administrators"] });
      toast.success("One-time administrator invitation created");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "SUSPENDED" }) => setAdministratorStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["administrators"] }),
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (!admin?.isRootAdmin) return <Card className="border-white/5 bg-[#121212]/30"><CardHeader><CardTitle className="text-white">Administrator access</CardTitle><CardDescription>Only the immutable root administrator can invite or manage administrators.</CardDescription></CardHeader></Card>;

  return <Card className="border-white/5 bg-[#121212]/30 text-white">
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#D3D925]" />Administrator access</CardTitle>
      <CardDescription>Accounts cannot be seeded. The root creates a one-time invitation and the recipient must enroll MFA.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <section className="space-y-3">
        <h3 className="font-semibold">Invite an administrator</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1"><Label>Email</Label><Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@shuvmarg.com" /></div>
          <div className="space-y-1"><Label>Admin ID</Label><Input value={adminId} onChange={(event) => setAdminId(event.target.value.toUpperCase())} placeholder="SUMA-ADM-002" /></div>
          <div className="space-y-1"><Label>Role</Label><select className="h-9 w-full rounded-md border border-white/10 bg-black px-3" value={role} onChange={(event) => setRole(event.target.value as Administrator["role"])}><option value="SUPER_ADMIN">Super admin</option><option value="ADMIN">Admin</option><option value="SUB_ADMIN">Sub admin</option></select></div>
        </div>
        <Button disabled={invite.isPending || !email || !adminId} onClick={() => invite.mutate({ email, adminId, role })} className="bg-[#D3D925] text-black hover:bg-[#bbc11f]"><UserPlus className="mr-2 h-4 w-4" />Create one-time invitation</Button>
        {inviteLink && <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3"><p className="mb-2 text-sm text-amber-100">Copy this link now. It expires in 24 hours and is not stored in readable form.</p><div className="flex gap-2"><Input readOnly value={inviteLink} /><Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(inviteLink)} aria-label="Copy invitation link"><Copy /></Button></div></div>}
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold">Administrators</h3>
        {administrators.isLoading && <p className="text-sm text-white/50">Loading administrators…</p>}
        {administrators.data?.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-3"><div><p className="font-medium">{item.adminId} · {item.email}</p><p className="text-sm text-white/50">{item.role}{item.isRootAdmin ? " · immutable root" : ""}</p></div><div className="flex items-center gap-2"><Badge variant="outline">{item.lifecycleStatus}</Badge><Badge variant="outline">MFA {item.twoFactorEnabled ? "on" : "pending"}</Badge>{!item.isRootAdmin && item.twoFactorEnabled && <Button size="sm" variant="outline" disabled={changeStatus.isPending} onClick={() => changeStatus.mutate({ id: item._id, status: item.lifecycleStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED" })}>{item.lifecycleStatus === "SUSPENDED" ? "Reactivate" : "Suspend"}</Button>}</div></div>)}
      </section>
    </CardContent>
  </Card>;
}
