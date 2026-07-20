import { api } from "./axios";

export interface CreateCouponPayload {
  couponCode: string;
  title: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validTo: string;
  totalUsageLimit?: number | null;
  perUserLimit?: number;
  applicableUserTypes?: string[];
  designConfig?: {
    edges?: {
      top?: "smooth" | "ticket" | "torn" | "jagged";
      bottom?: "smooth" | "ticket" | "torn" | "jagged";
      left?: "smooth" | "ticket" | "torn" | "jagged";
      right?: "smooth" | "ticket" | "torn" | "jagged";
    };
    typography?: {
      titleAlignment?: "left" | "center" | "right";
      descAlignment?: "left" | "center" | "right";
      codeAlignment?: "left" | "center" | "right";
    };
    imageConfig?: {
      scale?: number;
      offsetX?: number;
      offsetY?: number;
      fit?: "cover" | "contain" | "fill";
    };
  };
}

export interface UpdateCouponPayload extends Partial<CreateCouponPayload> {}

export const getAllCoupons = async (params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const { data } = await api.get("/coupons", { params });
  return data;
};

export const getCouponById = async (id: string) => {
  const { data } = await api.get(`/coupons/${id}`);
  return data;
};

export const createCoupon = async (payload: CreateCouponPayload) => {
  const { data } = await api.post("/coupons", payload);
  return data;
};

export const updateCoupon = async (
  id: string,
  payload: UpdateCouponPayload
) => {
  const { data } = await api.put(`/coupons/${id}`, payload);
  return data;
};

export const deleteCoupon = async (id: string) => {
  const { data } = await api.delete(`/coupons/${id}`);
  return data;
};

export const toggleCouponStatus = async (id: string) => {
  const { data } = await api.patch(`/coupons/${id}/toggle-status`);
  return data;
};

export const getCouponStats = async () => {
  const { data } = await api.get("/coupons-stats");
  return data;
};

export const getCouponAnalytics = async (id: string) => {
  const { data } = await api.get(`/coupons/${id}/analytics`);
  return data;
};

export const uploadCouponImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post("/coupons/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
