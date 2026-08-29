import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const config = JSON.parse(
  await readFile(new URL("../../vercel.json", import.meta.url), "utf8"),
);

const globalHeaders = config.headers.find(({ source }) => source === "/(.*)");
const headers = new Map(
  (globalHeaders?.headers ?? []).map(({ key, value }) => [key, value]),
);

test("Vercel applies the security baseline to every admin route", () => {
  assert.ok(globalHeaders, "a global header rule is required");
  assert.equal(headers.get("Strict-Transport-Security"), "max-age=31536000; includeSubDomains");
  assert.equal(headers.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.equal(headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(headers.get("X-Frame-Options"), "DENY");
  assert.equal(headers.get("Cross-Origin-Opener-Policy"), "same-origin");
  assert.equal(headers.get("Cross-Origin-Resource-Policy"), "same-origin");
  assert.equal(headers.get("X-Permitted-Cross-Domain-Policies"), "none");
  assert.equal(
    headers.get("Permissions-Policy"),
    "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
  );
});

test("content policy permits required maps, API, font, and blob flows", () => {
  const policy = headers.get("Content-Security-Policy");
  assert.ok(policy, "Content-Security-Policy is required");

  for (const directive of [
    "default-src 'self'",
    "https://api.shuvmarg.com",
    "https://api-staging.shuvmarg.com",
    "https://*.googleapis.com",
    "https://*.gstatic.com",
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
    "frame-ancestors 'none'",
    "object-src 'self' blob:",
    "upgrade-insecure-requests",
  ]) {
    assert.match(policy, new RegExp(directive.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("single-page application rewrite remains configured", () => {
  assert.deepEqual(config.rewrites, [
    { source: "/(.*)", destination: "/index.html" },
  ]);
});
