import type { AxiosError } from "axios";
import { api } from "./axios";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScratchTheme {
  id: string;
  name: string;
  imageKey: string;
  imageUrl: string | null;   // Presigned S3 URL (computed)
  weight: number;
  isActive: boolean;
  createdAt: string;
  probability: number;       // Computed % (read-only)
}

export interface ScratchThemeMeta {
  totalThemes: number;
  activeThemes: number;
  totalActiveWeight: number;
}

export interface ScratchThemeListResponse {
  data: ScratchTheme[];
  meta: ScratchThemeMeta;
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * GET /scratch-themes — list all themes with presigned URLs + computed probabilities
 */
export const listScratchThemes = async (): Promise<ScratchThemeListResponse> => {
  try {
    const { data } = await api.get("/scratch-themes");
    return { data: data.data, meta: data.meta };
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to fetch scratch themes");
  }
};

/**
 * POST /scratch-themes — create a new theme with image upload.
 * Uses FormData for multipart/form-data.
 */
export const createScratchTheme = async (
  name: string,
  weight: number,
  isActive: boolean,
  imageFile: File
): Promise<ScratchTheme> => {
  try {
    const fd = new FormData();
    fd.append("name", name);
    fd.append("weight", String(weight));
    fd.append("isActive", String(isActive));
    fd.append("image", imageFile);

    const { data } = await api.post("/scratch-themes", fd);
    return data.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to create scratch theme");
  }
};

/**
 * PATCH /scratch-themes/:id — update theme metadata (name, weight, isActive)
 */
export const updateScratchTheme = async (
  themeId: string,
  updates: Partial<Pick<ScratchTheme, "name" | "weight" | "isActive">>
): Promise<ScratchTheme> => {
  try {
    const { data } = await api.patch(`/scratch-themes/${themeId}`, updates);
    return data.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to update scratch theme");
  }
};

/**
 * PATCH /scratch-themes/:id/image — replace the overlay image
 */
export const replaceScratchThemeImage = async (
  themeId: string,
  imageFile: File
): Promise<ScratchTheme> => {
  try {
    const fd = new FormData();
    fd.append("image", imageFile);

    const { data } = await api.patch(`/scratch-themes/${themeId}/image`, fd);
    return data.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to replace theme image");
  }
};

/**
 * PATCH /scratch-themes/:id/toggle — quick toggle active status
 */
export const toggleScratchTheme = async (
  themeId: string
): Promise<ScratchTheme> => {
  try {
    const { data } = await api.patch(`/scratch-themes/${themeId}/toggle`);
    return data.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to toggle scratch theme");
  }
};

/**
 * DELETE /scratch-themes/:id — permanently delete theme + S3 image
 */
export const deleteScratchTheme = async (themeId: string): Promise<void> => {
  try {
    await api.delete(`/scratch-themes/${themeId}`);
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || "Failed to delete scratch theme");
  }
};
