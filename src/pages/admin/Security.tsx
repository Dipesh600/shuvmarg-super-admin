import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const securityLogs = [
  { id: 1, type: "Login", user: "SUMA-ADM-001", action: "Successful admin login", status: "Success", timestamp: "2024-01-28 14:32:15" },
  { id: 2, type: "Access", user: "SUMA-ADM-002", action: "Accessed financial reports", status: "Success", timestamp: "2024-01-28 14:28:45" },
  { id: 3, type: "Failed", user: "Unknown", action: "Failed login attempt from IP 192.168.1.100", status: "Warning", timestamp: "2024-01-28 14:15:22" },
  { id: 4, type: "Change", user: "SUMA-ADM-001", action: "Updated user permissions", status: "Success", timestamp: "2024-01-28 14:10:08" },
  { id: 5, type: "Alert", user: "System", action: "Unusual activity detected", status: "Critical", timestamp: "2024-01-28 14:05:33" },
];

const Security = () => {
  return (
    <>
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-3xl font-bold tracking-tight">Security & Access Control</h2>
          <p className="text-muted-foreground mt-1">Monitor security events and manage access</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">Secure</div>
              <p className="text-xs text-emerald-500">All systems operational</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-primary">Across all platforms</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Failed Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-red-500">Last 24 hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                2FA Enabled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100%</div>
              <p className="text-xs text-green-400">All admins protected</p>
            </CardContent>
          </Card>
        </div>

        {/* Security Metrics, Access Levels, Recent Alerts */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {["SSL Certificate", "Firewall Status", "DDoS Protection"].map((metric) => (
                <div key={metric} className="flex justify-between items-center">
                  <span className="text-sm">{metric}</span>
                  <Badge variant="default">Valid</Badge>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <span className="text-sm">Last Security Scan</span>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Access Levels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["Super Admins", 3],
                ["Admin Users", 12],
                ["Support Staff", 28],
                ["Read-Only Access", 45],
              ].map(([level, count]) => (
                <div key={level} className="flex justify-between items-center">
                  <span className="text-sm">{level}</span>
                  <Badge>{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: AlertTriangle, text: "Multiple login attempts", time: "15 mins ago", color: "text-warning" },
                { icon: CheckCircle, text: "Security scan completed", time: "2 hours ago", color: "text-success" },
                { icon: Shield, text: "Backup completed successfully", time: "6 hours ago", color: "text-primary" },
              ].map((alert, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <alert.icon className={`h-4 w-4 mt-0.5 ${alert.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.text}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Security Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Security Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {securityLogs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                    <Badge
                      variant={
                        log.status === "Success"
                          ? "default"
                          : log.status === "Warning"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {log.type}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.user} • {log.timestamp}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto">Details</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
    </>
  );
};

export default Security;
