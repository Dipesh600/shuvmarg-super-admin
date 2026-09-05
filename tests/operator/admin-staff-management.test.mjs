import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("operator details exposes admin Staff beside Drivers", () => {
  const source = read("src/pages/admin/busowners/OperatorDetails.tsx");
  assert.match(source, /<TabsTrigger value="drivers"/);
  assert.match(source, /<TabsTrigger value="staff"/);
  assert.match(source, /<StaffTab brandId=\{brand\._id\} brandName=\{brand\.brandName\}/);
});

test("admin staff registry mirrors the driver management lifecycle", () => {
  const source = read("src/components/busowners/operator_tabs/StaffTab.tsx");
  for (const behavior of ["Add Staff", "Edit Details", "Retry Invitation", "Suspend Staff", "Return to Service", "Trip access", "Administrative record"]) {
    assert.match(source, new RegExp(behavior));
  }
  assert.match(source, /getConductorsByBrand/);
  assert.match(source, /updateConductorStatus/);
  assert.match(source, /accountBadge\(staff\)/);
  for (const delivery of ["PENDING", "QUEUED", "FAILED"]) {
    assert.match(source, new RegExp(`invitationDeliveryStatus === "${delivery}"`));
  }
});

test("staff API uses only authenticated admin conductor endpoints", () => {
  const source = read("src/api/conductorApi.ts");
  assert.match(source, /api\.get\(`\/brands\/\$\{encodeURIComponent\(brandId\)\}\/conductors`/);
  assert.match(source, /api\.post\("\/conductors", payload\)/);
  assert.match(source, /api\.patch\(`\/conductors\/\$\{encodeURIComponent\(conductorId\)\}\/status`/);
  assert.doesNotMatch(source, /\/busowner\//);
});

test("admin staff form clearly preserves linked phone identity", () => {
  const source = read("src/components/busowners/operator_tabs/StaffFormModal.tsx");
  assert.match(source, /disabled=\{editing\}/);
  assert.match(source, /verified account-change process/);
  assert.match(source, /Partner-app conductor account/);
});
