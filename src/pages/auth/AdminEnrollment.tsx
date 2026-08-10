import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { beginAdminEnrollment, confirmAdminEnrollment, type EnrollmentKind, type EnrollmentSetup } from "@/api/adminSecurityApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const message = (error: unknown) => {
  const candidate = error as { response?: { data?: { message?: string } } };
  return candidate.response?.data?.message || "Enrollment could not be completed";
};

export default function AdminEnrollment() {
  const [params, setParams] = useSearchParams();
  const [kind] = useState<EnrollmentKind>(params.get("kind") === "invitation" ? "invitation" : "root");
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [setup, setSetup] = useState<EnrollmentSetup | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (params.has("token")) setParams({ kind }, { replace: true });
  }, [kind, params, setParams]);

  const begin = async () => {
    setBusy(true);
    try { setSetup(await beginAdminEnrollment(kind, token.trim(), password)); }
    catch (error) { toast.error(message(error)); }
    finally { setBusy(false); }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const result = await confirmAdminEnrollment(kind, token.trim(), otp.trim());
      setCodes(result.recoveryCodes);
      setSetup(null);
    } catch (error) { toast.error(message(error)); }
    finally { setBusy(false); }
  };

  const saveCodes = () => {
    const blob = new Blob([codes.join("\n") + "\n"], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "shuvmarg-admin-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
    <Card className="mx-auto max-w-xl border-slate-800 bg-slate-900">
      <CardHeader>
        <ShieldCheck className="mb-2 h-9 w-9 text-[#D3D925]" />
        <CardTitle>{kind === "root" ? "Activate the root administrator" : "Activate your administrator account"}</CardTitle>
        <CardDescription>Enrollment is one-time. Shuvmarg requires an authenticator before this account can sign in.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!setup && codes.length === 0 && <>
          <div className="space-y-2"><Label>One-time enrollment token</Label><Input value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" /></div>
          <div className="space-y-2"><Label>{kind === "root" ? "Bootstrap password" : "Create a strong password"}</Label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /></div>
          <Button className="w-full bg-[#D3D925] text-black hover:bg-[#bbc11f]" disabled={busy || !token.trim() || !password} onClick={begin}>Verify and set up authenticator</Button>
        </>}
        {setup && <>
          <div className="rounded-xl border border-slate-700 bg-white p-4"><img className="mx-auto w-64" src={setup.qrCodeDataUrl} alt="Authenticator enrollment QR code" /></div>
          <p className="text-sm text-slate-300">Scan with Google Authenticator. If scanning fails, enter this key manually:</p>
          <div className="flex gap-2"><code className="min-w-0 flex-1 break-all rounded bg-slate-950 p-3">{setup.manualEntryKey}</code><Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(setup.manualEntryKey)} aria-label="Copy setup key"><Copy /></Button></div>
          <div className="space-y-2"><Label>6-digit authenticator code</Label><Input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="text-center text-xl tracking-[0.35em]" /></div>
          <Button className="w-full bg-[#D3D925] text-black hover:bg-[#bbc11f]" disabled={busy || otp.length !== 6} onClick={confirm}>Confirm and activate account</Button>
        </>}
        {codes.length > 0 && <>
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">These recovery codes are shown once. Store them in a password manager. Each code works only once.</div>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-4 font-mono text-sm">{codes.map((code) => <span key={code}>{code}</span>)}</div>
          <div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={() => navigator.clipboard.writeText(codes.join("\n"))}><Copy className="mr-2 h-4 w-4" />Copy</Button><Button className="flex-1 bg-[#D3D925] text-black" onClick={saveCodes}><Download className="mr-2 h-4 w-4" />Download</Button></div>
          <Button className="w-full" asChild><a href="/auth/login">Continue to secure login</a></Button>
        </>}
      </CardContent>
    </Card>
  </main>;
}
