import { z } from "zod";

export const adminLoginSchema = z.object({
  adminId: z
    .string()
    .min(5, "Admin Code is required")
    .regex(/^(?:SM-ADM-[A-Z0-9]{3,24}|SUMA-ADM-\d{3})$/, "Invalid Admin ID format (e.g. SM-ADM-DIPESH)"),

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

  otp: z
    .string()
    .min(1, "Authenticator or recovery code is required")
    .regex(/^(\d{6}|[a-fA-F0-9]{16})$/, "Enter a 6-digit code or 16-character recovery code"),
});

export type SuperAdminLoginForm = z.infer<
  typeof adminLoginSchema
>;
