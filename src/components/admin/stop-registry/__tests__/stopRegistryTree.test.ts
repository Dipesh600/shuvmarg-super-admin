import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { AdminStop } from "../stopRegistryTypes";
import { buildStopTree, getChildStopsForParent, findParentStop, getDescendantStopIds } from "../stopRegistryTree";
import { filterStops, DEFAULT_STOP_FILTERS } from "../stopRegistryFilters";

const MOCK_STOPS: AdminStop[] = [
  {
    id: "1",
    _id: "1",
    code: "KTM",
    name: "Kathmandu",
    type: "CITY",
    province: "Bagmati",
    district: "Kathmandu",
    municipality: "KMC",
    aliases: ["Kantipur", "Yen"],
    parentStopId: null,
    isSearchable: true,
    isRouteStop: true,
    verificationStatus: "VERIFIED",
    status: "ACTIVE",
  },
  {
    id: "2",
    _id: "2",
    code: "KLK",
    name: "Kalanki",
    type: "JUNCTION",
    province: "Bagmati",
    district: "Kathmandu",
    municipality: "KMC",
    aliases: ["Kalanki Chowk"],
    parentStopId: "1",
    isSearchable: true,
    isRouteStop: true,
    verificationStatus: "VERIFIED",
    status: "ACTIVE",
  },
  {
    id: "3",
    _id: "3",
    code: "NBP",
    name: "New Bus Park",
    type: "TERMINAL",
    province: "Bagmati",
    district: "Kathmandu",
    municipality: "Gongabu",
    aliases: ["Gongabu"],
    parentStopId: "1",
    isSearchable: true,
    isRouteStop: true,
    verificationStatus: "VERIFIED",
    status: "ACTIVE",
  },
  {
    id: "4",
    _id: "4",
    code: "PKR",
    name: "Pokhara",
    type: "CITY",
    province: "Gandaki",
    district: "Kaski",
    municipality: "Pokhara Metro",
    aliases: [],
    parentStopId: null,
    isSearchable: true,
    isRouteStop: false,
    verificationStatus: "VERIFIED",
    status: "ACTIVE",
  },
  {
    id: "5",
    _id: "5",
    code: "ORP",
    name: "Orphan Stop",
    type: "TOWN",
    province: "Lumbini",
    district: "Rupandehi",
    municipality: "Butwal",
    aliases: [],
    parentStopId: "999", // Missing parent ID
    isSearchable: false,
    isRouteStop: true,
    verificationStatus: "PENDING",
    status: "ACTIVE",
  },
];

test("buildStopTree builds correct parent-child hierarchy and sorts alphabetically", () => {
  const tree = buildStopTree(MOCK_STOPS);

  assert.equal(tree.length, 3); // Kathmandu, Orphan Stop, Pokhara (sorted)
  assert.equal(tree[0].stop.name, "Kathmandu");
  assert.equal(tree[0].children.length, 2); // Kalanki, New Bus Park
  assert.equal(tree[0].children[0].stop.name, "Kalanki");
  assert.equal(tree[0].children[1].stop.name, "New Bus Park");

  assert.equal(tree[1].stop.name, "Orphan Stop");
  assert.equal(tree[2].stop.name, "Pokhara");
});

test("buildStopTree handles self-parenting safely without infinite loops", () => {
  const selfParentingStops: AdminStop[] = [
    {
      id: "100",
      _id: "100",
      code: "SELF",
      name: "Self Loop",
      type: "CITY",
      province: null,
      district: null,
      municipality: null,
      aliases: [],
      parentStopId: "100", // Self parent!
      isSearchable: true,
      isRouteStop: true,
      verificationStatus: "VERIFIED",
      status: "ACTIVE",
    },
  ];

  const tree = buildStopTree(selfParentingStops);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].stop.name, "Self Loop");
  assert.equal(tree[0].children.length, 0); // No infinite recursion
});

test("buildStopTree handles circular parent chains safely without stack overflow", () => {
  const cyclicStops: AdminStop[] = [
    {
      id: "A",
      code: "A",
      name: "Node A",
      type: "CITY",
      province: null,
      district: null,
      municipality: null,
      aliases: [],
      parentStopId: "B",
      isSearchable: true,
      isRouteStop: true,
      verificationStatus: "VERIFIED",
      status: "ACTIVE",
    },
    {
      id: "B",
      code: "B",
      name: "Node B",
      type: "CITY",
      province: null,
      district: null,
      municipality: null,
      aliases: [],
      parentStopId: "A",
      isSearchable: true,
      isRouteStop: true,
      verificationStatus: "VERIFIED",
      status: "ACTIVE",
    },
  ];

  const tree = buildStopTree(cyclicStops);
  // Cyclic loops are rendered as root stops safely
  assert.ok(tree.length > 0);
});

test("filterStops preserves ancestor stops when child matches search", () => {
  const filters = {
    ...DEFAULT_STOP_FILTERS,
    search: "Kalanki",
  };

  const filtered = filterStops(MOCK_STOPS, filters);
  const ids = filtered.map((s) => s.id);

  assert.ok(ids.includes("2")); // Kalanki matches search
  assert.ok(ids.includes("1")); // Kathmandu preserved as parent!
  assert.equal(ids.includes("4"), false); // Pokhara excluded
});

test("filterStops handles role, status, verification, and hierarchy filters", () => {
  // Searchable role filter
  const searchableOnly = filterStops(MOCK_STOPS, {
    ...DEFAULT_STOP_FILTERS,
    role: "searchable",
  });
  assert.equal(searchableOnly.some((s) => s.id === "5"), false);

  // Pending verification filter
  const pendingOnly = filterStops(MOCK_STOPS, {
    ...DEFAULT_STOP_FILTERS,
    verification: "PENDING",
  });
  assert.equal(pendingOnly.length, 1);
  assert.equal(pendingOnly[0].id, "5");

  // Top-level stops filter
  const topLevelOnly = filterStops(MOCK_STOPS, {
    ...DEFAULT_STOP_FILTERS,
    parentRelation: "top_level",
  });
  const topIds = topLevelOnly.map((s) => s.id);
  assert.ok(topIds.includes("1"));
  assert.ok(topIds.includes("4"));
  assert.ok(topIds.includes("5")); // Orphan is top-level
  assert.equal(topIds.includes("2"), false); // Child Kalanki excluded
});

test("helper tree functions return accurate relationships and descendants", () => {
  const childrenOfKtm = getChildStopsForParent("1", MOCK_STOPS);
  assert.equal(childrenOfKtm.length, 2);

  const ktmParent = findParentStop(MOCK_STOPS[1], MOCK_STOPS);
  assert.equal(ktmParent?.name, "Kathmandu");

  const descendants = getDescendantStopIds("1", MOCK_STOPS);
  assert.ok(descendants.has("2"));
  assert.ok(descendants.has("3"));
});

test("Regression boundary: PlatformRegistry mounts StopRegistryWorkspace and preserves other tabs", async () => {
  const content = await readFile(
    new URL("../../../../pages/admin/registry/PlatformRegistry.tsx", import.meta.url),
    "utf-8"
  );

  assert.match(content, /StopRegistryWorkspace/);
  assert.match(content, /TabsContent value="stops"/);
  assert.match(content, /TabsContent value="corridors"/);
  assert.match(content, /TabsContent value="hubs"/);
  assert.match(content, /TabsContent value="route-requests"/);
  assert.match(content, /TabsContent value="discovery"/);
});
