import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("admin driver form collects only the requested identity and licence data", () => {
  const form = read("src/components/busowners/operator_tabs/CreateDriverModal.tsx");
  for (const field of ["fullName", "phone", "gender", "experienceYears", "licenseNumber", "licenseType", "licenseExpiry", "licenseDoc"]) {
    assert.match(form, new RegExp(field));
  }
  for (const removed of ["previousEmployer", "medicalCertFile", "photoFile", "form.email"]) {
    assert.doesNotMatch(form, new RegExp(removed.replace(".", "\\.")));
  }
  const card = read("src/components/busowners/operator_tabs/DriversTab.tsx");
  assert.doesNotMatch(card, /Medical Cert|medicalCertExpiry/);
  const preview = read("src/components/busowners/operator_tabs/DriverDocumentPreview.tsx");
  assert.doesNotMatch(preview, /before approval/);
});

test("admin driver API sends the licence through multipart upload", () => {
  const api = read("src/api/driverApi.ts");
  assert.match(api, /new FormData/);
  assert.match(api, /fd\.append\("licenseDoc"/);
  assert.doesNotMatch(api, /fd\.append\("medicalCertDoc"|fd\.append\("photo"/);
});

test("legacy pending drivers cannot bypass the security pipeline with manual approval", () => {
  const list = read("src/components/busowners/operator_tabs/DriversTab.tsx");
  const form = read("src/components/busowners/operator_tabs/CreateDriverModal.tsx");
  assert.match(list, /Security update required/);
  assert.match(list, /Complete Security Check/);
  assert.doesNotMatch(list, /approveDriver|Approve Driver|Pending Review/);
  assert.match(form, /needsSecurityRefresh/);
  assert.match(form, /New License Document Required/);
  assert.match(form, /Run Security Checks/);
  const api = read("src/api/driverApi.ts");
  assert.doesNotMatch(api, /approveDriver|\/drivers\/\$\{driverId\}\/approve/);
});

test("admin distinguishes duty readiness from account activation and handles SMS failure honestly", () => {
  const list = read("src/components/busowners/operator_tabs/DriversTab.tsx");
  const form = read("src/components/busowners/operator_tabs/CreateDriverModal.tsx");
  const api = read("src/api/driverApi.ts");
  for (const copy of ["Account setup pending", "Account active", "Retry setup SMS"]) {
    assert.match(list, new RegExp(copy));
  }
  for (const state of ["NOT_LINKED", "INVITED", "ACTIVE", "SUSPENDED", "REMOVED"]) {
    assert.match(list, new RegExp(`accessStatus === "${state}"`));
  }
  for (const delivery of ["PENDING", "QUEUED", "FAILED"]) {
    assert.match(list, new RegExp(`invitationDeliveryStatus === "${delivery}"`));
  }
  assert.doesNotMatch(list, /Send login SMS/);
  assert.match(api, /resendDriverAccessMessage/);
  assert.match(form, /notificationStatus === "FAILED"/);
  assert.doesNotMatch(form, /Driver created and ready\. Activation SMS queued\./);
});
