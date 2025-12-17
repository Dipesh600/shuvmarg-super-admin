import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Fingerprint, Lock } from "lucide-react";
import { motion } from "framer-motion";

 const  SuperAdminLogin = ()=> {
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="rounded-2xl shadow-xl border-slate-800 bg-slate-950/80 backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center">
              <ShieldCheck className="h-10 w-10 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Sumarg Platform Administration
            </CardTitle>
            <CardDescription className="text-slate-400">
              Super Admin Portal
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Admin ID */}
              <div className="space-y-2">
                <Label htmlFor="adminId" className="text-slate-300">
                  Admin ID
                </Label>
                <Input
                  id="adminId"
                  placeholder="SUMA-ADM-001"
                  required
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  className="bg-slate-900 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Minimum 8 characters, uppercase,
                  number & symbol
                </p>
              </div>

              {/* 2FA */}
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-slate-300">
                  2FA Code
                </Label>
                <Input
                  id="otp"
                  placeholder="123456"
                  required
                  className="bg-slate-900 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500">
                  Generated via Google Authenticator or SMS
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? "Verifying..." : "Secure Login"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Biometric Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default SuperAdminLogin;