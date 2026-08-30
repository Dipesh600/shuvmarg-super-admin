type ApiErrorShape = {
  message?: unknown;
  response?: { data?: { message?: unknown } };
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") return fallback;
  const candidate = error as ApiErrorShape;
  const serverMessage = candidate.response?.data?.message;
  if (typeof serverMessage === "string" && serverMessage.trim()) return serverMessage;
  if (typeof candidate.message === "string" && candidate.message.trim()) return candidate.message;
  return fallback;
};
