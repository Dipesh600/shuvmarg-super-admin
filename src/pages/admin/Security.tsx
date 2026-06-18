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
          <h2 className="text-3xl font-bold tracking-tight text-white">Security & Access Control</h2>
          <p className="text-white/60 mt-1">Monitor security events and manage access</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-4">
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-4 w-4 text-[#D3D925]" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-white">Secure</div>
              <p className="text-xs text-white/80 mt-1">All systems operational</p>
            </CardContent>
          </Card>
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="h-4 w-4 text-[#D3D925]" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-white">127</div>
              <p className="text-xs text-white/80 mt-1">Across all platforms</p>
            </CardContent>
          </Card>
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-4 w-4 text-[#D3D925]" />
                Failed Attempts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-white">8</div>
              <p className="text-xs text-white/80 mt-1">Last 24 hours</p>
            </CardContent>
          </Card>
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle className="h-4 w-4 text-[#D3D925]" />
                2FA Enabled
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-white">100%</div>
              <p className="text-xs text-white/80 mt-1">All admins protected</p>
            </CardContent>
          </Card>
        </div>

        {/* Security Metrics, Access Levels, Recent Alerts */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-4">
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">Security Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {["SSL Certificate", "Firewall Status", "DDoS Protection"].map((metric) => (
                <div key={metric} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <span className="text-sm text-white/80">{metric}</span>
                  <Badge variant="outline" className="border-white/10 text-white bg-white/5 text-xs">Valid</Badge>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-white/80">Last Security Scan</span>
                <span className="text-xs text-white/50">2 hours ago</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">Access Levels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {[
                ["Super Admins", 3],
                ["Admin Users", 12],
                ["Support Staff", 28],
                ["Read-Only Access", 45],
              ].map(([level, count]) => (
                <div key={level as string} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <span className="text-sm text-white/80">{level}</span>
                  <Badge variant="outline" className="border-white/10 text-white bg-white/5 text-xs">{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {[
                { icon: AlertTriangle, text: "Multiple login attempts", time: "15 mins ago", color: "text-[#D3D925]" },
                { icon: CheckCircle, text: "Security scan completed", time: "2 hours ago", color: "text-[#D3D925]" },
                { icon: Shield, text: "Backup completed successfully", time: "6 hours ago", color: "text-[#D3D925]" },
              ].map((alert, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <div className={`p-2 rounded-md bg-white/5 border border-white/5`}>
                    <alert.icon className={`h-4 w-4 ${alert.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/90">{alert.text}</p>
                    <p className="text-xs text-white/50 mt-0.5">{alert.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Security Activity Log */}
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-white">Security Activity Log</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3">
              {securityLogs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-white/10 rounded-lg gap-2 bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase tracking-wider font-bold ${
                        log.status === "Success"
                          ? "border-white/10 text-white bg-white/5"
                          : log.status === "Warning"
                          ? "border-white/10 text-white bg-white/5"
                          : "border-white/10 text-white bg-white/5"
                      }`}
                    >
                      {log.type}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-white">{log.action}</p>
                      <p className="text-xs text-white/50 mt-0.5">{log.user} • {log.timestamp}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto text-white/60 hover:text-white hover:bg-white/10">Details</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
    </>
  );
};

export default Security;
