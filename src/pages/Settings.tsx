import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Bell, Lock, Database, Mail } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";

const Settings = () => {
  return (
    <SidebarProvider>
      <DashboardLayout>
        <div className="mb-4">
          <h2 className="text-3xl font-bold tracking-tight">Platform Settings</h2>
          <p className="text-muted-foreground mt-1">Manage system configuration and preferences</p>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Platform-wide configuration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input id="platform-name" defaultValue="Sumarg Platform" className="w-full" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input id="support-email" type="email" defaultValue="support@sumarg.com" className="w-full" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="support-phone">Support Phone</Label>
                <Input id="support-phone" defaultValue="+977-9801234567" className="w-full" />
              </div>
              <Button className="w-full sm:w-auto">Save Changes</Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure system notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["Email Notifications", "Receive alerts via email", "email-notif"],
                ["SMS Alerts", "Get SMS for critical events", "sms-notif"],
                ["Transaction Alerts", "Notify on high-value transactions", "transaction-notif"],
                ["Security Alerts", "Alert on security events", "security-notif"]
              ].map(([title, desc, id]) => (
                <div key={id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <Label htmlFor={id}>{title}</Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch id={id} defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage security and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for all admins</p>
                </div>
                <Switch id="two-factor" defaultChecked />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <Label htmlFor="session-timeout">Auto Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">Logout after inactivity</p>
                </div>
                <Switch id="session-timeout" defaultChecked />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="session-duration">Session Duration (minutes)</Label>
                <Input id="session-duration" type="number" defaultValue="60" className="w-full" />
              </div>
              <Button className="w-full sm:w-auto">Update Security</Button>
            </CardContent>
          </Card>

          {/* System Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Maintenance
              </CardTitle>
              <CardDescription>Database and system operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["Database Backup", "Last backup: 2 hours ago", "Backup Now"],
                ["Clear Cache", "Clear system cache", "Clear Cache"],
                ["System Logs", "View system activity logs", "View Logs"]
              ].map(([title, desc, btn], i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <Label>{title}</Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto">{btn}</Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>SMTP and email settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["SMTP Host", "smtp-host", "smtp.sumarg.com"],
                ["SMTP Port", "smtp-port", "587"],
                ["SMTP Username", "smtp-user", "noreply@sumarg.com"]
              ].map(([label, id, defaultValue], i) => (
                <div key={i} className="grid gap-2">
                  <Label htmlFor={id}>{label}</Label>
                  <Input id={id} defaultValue={defaultValue} className="w-full" />
                </div>
              ))}
              <Button className="w-full sm:w-auto">Save Email Settings</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </SidebarProvider>
  );
};

export default Settings;
