import type { AdminFleetLayoutChoice } from "@/features/admin-fleet-seat-layout/types";

const STORAGE_PREFIX = "shuvmarg:admin-fleet-registration:v1";
const DATABASE_NAME = "shuvmarg-admin-drafts";
const FILE_STORE = "fleet-registration-files";

export interface AdminFleetDraftFiles {
  imageFront: File | null;
  imageBack: File | null;
  imageSide: File | null;
  imageInside: File | null;
  fitnessCert: File | null;
  insurance: File | null;
  bluebook: File | null;
  routePermit: File | null;
}

export interface AdminFleetDraft {
  step: number;
  brandId: string;
  busName: string;
  busNumber: string;
  busType: string;
  vehicleType: string;
  registrationYear: string;
  selectedAmenityIds: string[];
  seatLayoutChoice: AdminFleetLayoutChoice | null;
  createdFleetId: string | null;
  fitnessCertValidTill: string;
  insurancePolicyNumber: string;
  insuranceValidTill: string;
  routePermitValidTill: string;
  selectedCorridorId: string;
  selectedVariantId?: string;
  servedStopIds?: string[];
  isRequestingRoute: boolean;
  requestOriginCity: string;
  requestDestinationCity: string;
  requestViaStops: string;
  files: AdminFleetDraftFiles;
}

function storageKey(ownerId: string, brandId?: string) {
  return `${STORAGE_PREFIX}:${ownerId}:${brandId || "owner"}`;
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(FILE_STORE)) request.result.createObjectStore(FILE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function writeFiles(key: string, files: AdminFleetDraftFiles) {
  const database = await openDatabase();
  if (!database) return;
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(FILE_STORE, "readwrite");
    transaction.objectStore(FILE_STORE).put(files, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function readFiles(key: string): Promise<AdminFleetDraftFiles | null> {
  const database = await openDatabase();
  if (!database) return null;
  const value = await new Promise<AdminFleetDraftFiles | null>((resolve, reject) => {
    const request = database.transaction(FILE_STORE, "readonly").objectStore(FILE_STORE).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return value;
}

export function hasMeaningfulAdminFleetDraft(draft: AdminFleetDraft) {
  return Boolean(
    draft.brandId.trim()
    || draft.busName.trim()
    || draft.busNumber.trim()
    || draft.registrationYear.trim()
    || draft.selectedAmenityIds.length
    || draft.seatLayoutChoice
    || draft.createdFleetId
    || draft.fitnessCertValidTill
    || draft.insurancePolicyNumber.trim()
    || draft.insuranceValidTill
    || draft.routePermitValidTill
    || draft.selectedCorridorId
    || Boolean(draft.selectedVariantId)
    || Boolean(draft.servedStopIds?.length)
    || draft.isRequestingRoute
    || draft.requestOriginCity.trim()
    || draft.requestDestinationCity.trim()
    || draft.requestViaStops.trim()
    || Object.values(draft.files).some(Boolean)
  );
}

export async function saveAdminFleetDraft(ownerId: string, brandId: string | undefined, draft: AdminFleetDraft) {
  if (!hasMeaningfulAdminFleetDraft(draft)) return;
  const key = storageKey(ownerId, brandId);
  const { files, ...serializable } = draft;
  localStorage.setItem(key, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), draft: serializable }));
  await writeFiles(key, files);
}

export async function loadAdminFleetDraft(ownerId: string, brandId?: string): Promise<AdminFleetDraft | null> {
  const key = storageKey(ownerId, brandId);
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (parsed?.version !== 1 || !parsed.draft) return null;
  const files = await readFiles(key);
  return {
    ...parsed.draft,
    brandId: parsed.draft.brandId || "",
    selectedVariantId: parsed.draft.selectedVariantId || "",
    servedStopIds: parsed.draft.servedStopIds || [],
    files: files || {
      imageFront: null, imageBack: null, imageSide: null, imageInside: null,
      fitnessCert: null, insurance: null, bluebook: null, routePermit: null,
    },
  } as AdminFleetDraft;
}

export async function deleteAdminFleetDraft(ownerId: string, brandId?: string) {
  const key = storageKey(ownerId, brandId);
  localStorage.removeItem(key);
  const database = await openDatabase();
  if (!database) return;
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(FILE_STORE, "readwrite");
    transaction.objectStore(FILE_STORE).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
