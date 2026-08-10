import { api } from "./axios";

export type EnrollmentKind = "root" | "invitation";
export type EnrollmentSetup = {
  qrCodeDataUrl: string;
  manualEntryKey: string;
  adminId: string;
  email: string;
};

const enrollmentPath = (kind: EnrollmentKind) =>
  kind === "root" ? "/auth/bootstrap/mfa" : "/auth/invitations/mfa";

export async function beginAdminEnrollment(
  kind: EnrollmentKind,
  token: string,
  password: string,
) {
  const { data } = await api.post(`${enrollmentPath(kind)}/begin`, { token, password });
  return data.data as EnrollmentSetup;
}

export async function confirmAdminEnrollment(
  kind: EnrollmentKind,
  token: string,
  otp: string,
) {
  const { data } = await api.post(`${enrollmentPath(kind)}/confirm`, { token, otp });
  return data.data as { recoveryCodes: string[] };
}

export type Administrator = {
  _id: string;
  adminId: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "SUB_ADMIN";
  isRootAdmin: boolean;
  lifecycleStatus: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
};

export async function listAdministrators() {
  const { data } = await api.get("/administrators");
  return data.data as Administrator[];
}

export async function inviteAdministrator(input: {
  email: string;
  adminId: string;
  role: Administrator["role"];
}) {
  const { data } = await api.post("/administrators/invitations", input);
  return data.data as { token: string; expiresAt: string; invitationId: string };
}

export async function setAdministratorStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
  const { data } = await api.patch(`/administrators/${id}/status`, { status });
  return data.data as { id: string; lifecycleStatus: string; isActive: boolean };
}
