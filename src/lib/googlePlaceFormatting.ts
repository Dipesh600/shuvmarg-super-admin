type GoogleAddressLike = {
  formatted_address?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
};

const PLUS_CODE = /\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}\b/gi;
const POSTAL_CODE = /\b\d{5}\b/g;

export function normalizeGooglePlaceAddress(place?: GoogleAddressLike | string | null) {
  const formatted = typeof place === "string" ? place : place?.formatted_address;
  if (!formatted?.trim()) return null;
  const postalCodes = typeof place === "object" && place
    ? place.address_components
      ?.filter((item) => item.types.includes("postal_code"))
      .flatMap((item) => [item.long_name, item.short_name]) || []
    : [];
  const seen = new Set<string>();
  const parts = formatted.split(",").map((part) => {
    let clean = part.replace(PLUS_CODE, "");
    for (const postalCode of postalCodes) clean = clean.replace(postalCode, "");
    clean = clean.replace(POSTAL_CODE, "").replace(/\s+/g, " ").trim();
    return clean;
  }).filter(Boolean).filter((part) => {
    const key = part.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return parts.join(", ") || null;
}

export function isGooglePlusCode(value?: string | null) {
  if (!value) return false;
  PLUS_CODE.lastIndex = 0;
  return PLUS_CODE.test(value.trim());
}
