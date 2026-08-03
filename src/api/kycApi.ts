import { api } from "./axios";

/**
 * Fetches a private S3 document through the secure server-side proxy.
 * Returns a temporary object URL (blob) that is only valid in the current
 * browser session — the raw S3 presigned URL is never exposed to the client.
 *
 * @param s3Key - The S3 object key (e.g. "owners/xxx/kyc/company-registration/file.pdf")
 * @returns { blobUrl, mimeType } or null on failure.
 */
export const fetchDocumentAsBlob = async (
  s3Key: string
): Promise<{ blobUrl: string; mimeType: string } | null> => {
  try {
    const token = sessionStorage.getItem("sumarg_admin_token");
    const baseUrl = import.meta.env.VITE_API_URL;
    const response = await fetch(
      `${baseUrl}/api/admin/documents/view?key=${encodeURIComponent(s3Key)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // Use the actual Content-Type from the server — don't guess from extension
    const mimeType = response.headers.get("Content-Type") ?? "application/octet-stream";
    const blob = await response.blob();
    return { blobUrl: URL.createObjectURL(blob), mimeType };
  } catch (err) {
    console.error("[fetchDocumentAsBlob] Failed:", err);
    return null;
  }
};

export const getAllKyc = async () => {
  try {
    const { data } = await api.get("/kyc/unified-list");
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const getOwnerKycDetail = async (busOwnerId:string) => {
  try {
    const {data}= await api.post("/getBusOwnerKycDetails",{
      id:busOwnerId
    });
    return data;
  } catch (error) {
    console.log(error)
  }
}

export const getOwnerDetail = async(busOwnerId:string)=>{
  try {
    const {data} = await api.post("/getBusOwnerDetails",{
      id:busOwnerId
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const updateOwnerKycStatus = async(payload: any) => {
  const { data } = await api.patch("/busOwnerKycStatus", payload);
  return data;
};