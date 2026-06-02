import { z } from "zod";

export const adminLoginSchema = z.object({
  adminId: z
    .string()
    .min(5, "Admin Code is required")
    .regex(/^SUMA-ADM-\d+$/, "Invalid Admin ID format (e.g. SUMA-ADM-001)"),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),

  // OTP is MANDATORY — Google Authenticator code is always required
  otp: z
    .string()
    .min(1, "Google Authenticator OTP is required")
    .regex(/^\d{6}$/, "OTP must be exactly 6 numeric digits"),
});

export type SuperAdminLoginForm = z.infer<
  typeof adminLoginSchema
>;
