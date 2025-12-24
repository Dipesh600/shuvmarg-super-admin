import { z } from "zod";

export const adminLoginSchema = z.object({
  adminCode: z
    .string()
    .min(5, "Admin Code is required")
    // .regex(/^SUMA-ADM-\d+$/, "Invalid Admin ID format"),
,
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Minimum 8 characters")
    // .regex(/[A-Z]/, "Must contain an uppercase letter")
    // .regex(/[0-9]/, "Must contain a number")
    // .regex(/[^A-Za-z0-9]/, "Must contain a symbol"
        
    // ),
,
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});

export type SuperAdminLoginForm = z.infer<
  typeof adminLoginSchema
>;
