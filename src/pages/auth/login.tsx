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
import { ShieldCheck, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/auth-context";
import { useMutation } from "@tanstack/react-query";
import { loginAdmin } from "@/api/authApi";
import { toast } from "sonner";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminLoginSchema,
  type SuperAdminLoginForm,
} from "@/validators/adminlogin.schema";
import DotsLoader from "@/components/ui/dotsLoader";

const loginErrorMessage = (error: unknown) => {
  const typed = error as { response?: { data?: { message?: string } } };
  return typed.response?.data?.message || "Login failed";
};

const SuperAdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SuperAdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ["login"],
    mutationFn: loginAdmin,
    onSuccess: (data) => {
      login(data.accessToken, data.admin);
      // console.log("Login successful:", data);
      toast.success("Login successful");
      navigate("/admin");
    },
    onError: (error: unknown) => {
      toast.error(loginErrorMessage(error));
    },
  });

  const onSubmit = (values: SuperAdminLoginForm) => {
    mutate(values);
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Admin ID */}
              <div className="space-y-2">
                <Label className="text-slate-300">Admin ID</Label>
                <Input
                  {...register("adminId")}
                  placeholder="SM-ADM-DIPESH"
                  className="bg-slate-900 border-slate-700 text-white"
                />
                {errors.adminId && (
                  <p className="text-xs text-red-500">
                    {errors.adminId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <Input
                  {...register("email")}
                  placeholder="Enter your email.."
                  className="bg-slate-900 border-slate-700 text-white"
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className="text-slate-300">Password</Label>
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="Enter your pass.."
                  className="bg-slate-900 border-slate-700 text-white"
                />
                {errors.password ? (
                  <p className="text-xs text-red-500">
                    {errors.password.message}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Minimum 8 characters,
                    uppercase, number & symbol
                  </p>
                )}
              </div>

              {/* OTP — always required */}
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Authenticator or recovery code{" "}
                  <span className="text-red-400 text-xs font-semibold">*required</span>
                </Label>
                <Input
                  {...register("otp")}
                  placeholder="6-digit code or recovery code"
                  className="bg-slate-900 border-slate-700 text-white tracking-widest text-center text-lg"
                  maxLength={16}
                  autoComplete="one-time-code"
                />
                {errors.otp ? (
                  <p className="text-xs text-red-500">{errors.otp.message}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Enter the current 6-digit code, or one unused recovery code
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-xl cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isPending ? <DotsLoader /> : "Secure Login"}
                </Button>

              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SuperAdminLogin;
