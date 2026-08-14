import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Bell, Lock, Database, Mail } from "lucide-react";
import AdministratorAccessPanel from "@/components/admin/security/AdministratorAccessPanel";

const Settings = () => {
  return (
    <>
        <div className="mb-4">
          <h2 className="text-3xl font-bold tracking-tight text-white">Platform Settings</h2>
          <p className="text-white/60 mt-1">Manage system configuration and preferences</p>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {/* General Settings */}
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <SettingsIcon className="h-5 w-5 text-[#D3D925]" />
                General Settings
              </CardTitle>
              <CardDescription className="text-white/50">Platform-wide configuration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="platform-name" className="text-white/80">Platform Name</Label>
                <Input id="platform-name" defaultValue="Sumarg Platform" className="w-full bg-white/5 border-white/10 text-white focus-visible:ring-[#D3D925]" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="support-email" className="text-white/80">Support Email</Label>
                <Input id="support-email" type="email" defaultValue="support@sumarg.com" className="w-full bg-white/5 border-white/10 text-white focus-visible:ring-[#D3D925]" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="support-phone" className="text-white/80">Support Phone</Label>
                <Input id="support-phone" defaultValue="+977-9801234567" className="w-full bg-white/5 border-white/10 text-white focus-visible:ring-[#D3D925]" />
              </div>
              <Button className="w-full sm:w-auto bg-[#D3D925] hover:bg-[#b5bc1b] text-black font-semibold border-0">Save Changes</Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <Bell className="h-5 w-5 text-[#D3D925]" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-white/50">Configure system notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {[
                ["Email Notifications", "Receive alerts via email", "email-notif"],
                ["SMS Alerts", "Get SMS for critical events", "sms-notif"],
                ["Transaction Alerts", "Notify on high-value transactions", "transaction-notif"],
                ["Security Alerts", "Alert on security events", "security-notif"]
              ].map(([title, desc, id]) => (
                <div key={id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <div>
                    <Label htmlFor={id} className="text-white/80">{title}</Label>
                    <p className="text-sm text-white/50">{desc}</p>
                  </div>
                  <Switch id={id} defaultChecked className="data-[state=checked]:bg-[#D3D925]" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="h-5 w-5 text-[#D3D925]" />
                Security Settings
              </CardTitle>
              <CardDescription className="text-white/50">Manage security and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div>
                  <Label className="text-white/80">Two-factor authentication</Label>
                  <p className="text-sm text-white/50">Enforced for every administrator during activation</p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">ENFORCED</span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div>
                  <Label className="text-white/80">Session security</Label>
                  <p className="text-sm text-white/50">1-hour token · 1-hour inactivity logout · no silent refresh</p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">ENFORCED</span>
              </div>
              <p className="text-sm text-white/50">These controls are security policy, not user-editable display settings.</p>
            </CardContent>
          </Card>

          {/* System Maintenance */}
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="h-5 w-5 text-[#D3D925]" />
                System Maintenance
              </CardTitle>
              <CardDescription className="text-white/50">Database and system operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {[
                ["Database Backup", "Last backup: 2 hours ago", "Backup Now"],
                ["Clear Cache", "Clear system cache", "Clear Cache"],
                ["System Logs", "View system activity logs", "View Logs"]
              ].map(([title, desc, btn], i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <div>
                    <Label className="text-white/80">{title}</Label>
                    <p className="text-sm text-white/50">{desc}</p>
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">{btn}</Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <Mail className="h-5 w-5 text-[#D3D925]" />
                Email Configuration
              </CardTitle>
              <CardDescription className="text-white/50">SMTP and email settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {[
                ["SMTP Host", "smtp-host", "smtp.sumarg.com"],
                ["SMTP Port", "smtp-port", "587"],
                ["SMTP Username", "smtp-user", "noreply@sumarg.com"]
              ].map(([label, id, defaultValue], i) => (
                <div key={i} className="grid gap-2">
                  <Label htmlFor={id} className="text-white/80">{label}</Label>
                  <Input id={id} defaultValue={defaultValue} className="w-full bg-white/5 border-white/10 text-white focus-visible:ring-[#D3D925]" />
                </div>
              ))}
              <Button className="w-full sm:w-auto bg-[#D3D925] hover:bg-[#b5bc1b] text-black font-semibold border-0">Save Email Settings</Button>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6"><AdministratorAccessPanel /></div>
    </>
  );
};

export default Settings;
