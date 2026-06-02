// authStore.ts is intentionally kept minimal.
// All authentication state is managed by AuthProvider (sessionStorage-backed).
// This file is retained for compatibility with any legacy imports.
// DO NOT add persist middleware here — it would bypass the tab-close logout.
export {};
