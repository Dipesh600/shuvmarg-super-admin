import { useState } from "react";
import { Smartphone, Globe, Ticket, Calendar, Info } from "lucide-react";
import { format } from "date-fns";

interface PreviewData {
  couponCode: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validTo: string;
  perUserLimit: number;
}

interface CouponLivePreviewProps {
  data: PreviewData;
}

const isEmpty = (v: unknown) => v === undefined || v === null || v === "" || v === 0;

// ─── Mobile Card Preview (matches Sumarg AMOLED theme) ───────────────────────
const MobilePreview = ({ data }: { data: PreviewData }) => {
  const discountLabel = isEmpty(data.discountValue)
    ? "—% OFF"
    : data.discountType === "percentage"
    ? `${data.discountValue}% OFF`
    : `Rs. ${Number(data.discountValue).toLocaleString()} OFF`;

  const codeLabel = data.couponCode || "YOURCODE";
  const titleLabel = data.title || "Offer title will appear here";
  const descLabel = data.description || "Offer description will appear here.";

  const validFromStr =
    data.validFrom ? format(new Date(data.validFrom), "d MMM yy") : "—";
  const validToStr =
    data.validTo ? format(new Date(data.validTo), "d MMM yy") : "—";

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(0,86,78,0.95) 0%, rgba(0,61,56,0.98) 100%)",
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 12px 40px rgba(0,86,78,0.35)",
        overflow: "hidden",
        padding: 0,
        width: "100%",
        maxWidth: 340,
        margin: "0 auto",
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* Top gradient band */}
      <div
        style={{
          background:
            data.discountType === "percentage"
              ? "linear-gradient(90deg, #7c3aed, #4f46e5)"
              : "linear-gradient(90deg, #00564e, #0d9488)",
          padding: "14px 20px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <span
            style={{
              color: "#D3D925",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            {discountLabel}
          </span>
          {data.discountType === "percentage" && data.maxDiscountAmount && data.maxDiscountAmount > 0 && (
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 1 }}>
              Max save Rs. {Number(data.maxDiscountAmount).toLocaleString()}
            </div>
          )}
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: 12,
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Ticket style={{ width: 14, height: 14, color: "#D3D925" }} />
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>
            {data.perUserLimit || 1}x / user
          </span>
        </div>
      </div>

      {/* Dashed divider (coupon tear line) */}
      <div style={{ position: "relative", height: 1, margin: "0 20px" }}>
        <div style={{ position: "absolute", left: -28, top: -10, width: 20, height: 20, borderRadius: "50%", background: "#0a0a0a" }} />
        <div style={{ borderTop: "1.5px dashed rgba(255,255,255,0.15)", margin: "10px 4px" }} />
        <div style={{ position: "absolute", right: -28, top: -10, width: 20, height: 20, borderRadius: "50%", background: "#0a0a0a" }} />
      </div>

      {/* Main content */}
      <div style={{ padding: "14px 20px 20px" }}>
        {/* Code pill */}
        <div
          style={{
            background: "rgba(211,217,37,0.12)",
            border: "1.5px dashed #D3D925",
            borderRadius: 10,
            padding: "8px 14px",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              color: "#D3D925",
              fontFamily: "monospace",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: 3,
            }}
          >
            {codeLabel}
          </span>
        </div>

        {/* Title */}
        <div style={{ color: "#F5F7F6", fontWeight: 600, fontSize: 14, marginBottom: 4, lineHeight: 1.4 }}>
          {titleLabel}
        </div>
        {/* Description */}
        <div style={{ color: "#B7C7C3", fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}>
          {descLabel}
        </div>

        {/* Footer row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#B7C7C3", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar style={{ width: 11, height: 11 }} />
            {validFromStr} – {validToStr}
          </div>
          {data.minOrderAmount > 0 && (
            <div style={{ color: "#B7C7C3", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
              <Info style={{ width: 10, height: 10 }} />
              Min Rs. {Number(data.minOrderAmount).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* CTA button */}
      <div style={{ padding: "0 20px 20px" }}>
        <div
          style={{
            background: "#D3D925",
            borderRadius: 16,
            padding: "12px 0",
            textAlign: "center",
            color: "#003D38",
            fontWeight: 600,
            fontSize: 14,
            cursor: "default",
          }}
        >
          Apply Coupon
        </div>
      </div>
    </div>
  );
};

// ─── Website / All Offers Page Card Preview ──────────────────────────────────
const WebPreview = ({ data }: { data: PreviewData }) => {
  const discountLabel = isEmpty(data.discountValue)
    ? "— OFF"
    : data.discountType === "percentage"
    ? `${data.discountValue}% OFF`
    : `Rs. ${Number(data.discountValue).toLocaleString()} OFF`;

  const codeLabel = data.couponCode || "YOURCODE";
  const titleLabel = data.title || "Offer title will appear here";
  const descLabel = data.description || "Offer description will appear here.";

  const validToStr =
    data.validTo ? format(new Date(data.validTo), "d MMM yyyy") : "—";

  const isPercentage = data.discountType === "percentage";

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(0,86,78,0.92) 0%, rgba(0,61,56,0.96) 100%)",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,86,78,0.25)",
        display: "flex",
        overflow: "hidden",
        maxWidth: 480,
        margin: "0 auto",
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* Left discount column */}
      <div
        style={{
          background: isPercentage
            ? "linear-gradient(160deg, #7c3aed, #4f46e5)"
            : "linear-gradient(160deg, #00564e, #0d9488)",
          minWidth: 110,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 12px",
          position: "relative",
          gap: 6,
        }}
      >
        <span style={{ color: "#D3D925", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
          {isEmpty(data.discountValue)
            ? "—"
            : data.discountType === "percentage"
            ? `${data.discountValue}%`
            : `Rs.${Number(data.discountValue).toLocaleString()}`}
        </span>
        <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 600 }}>
          {discountLabel.includes("%") ? "DISCOUNT" : "FLAT OFF"}
        </span>
        {/* Cutout circles */}
        <div style={{ position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, borderRadius: "50%", background: "#0a0a0a" }} />
      </div>

      {/* Dashed border */}
      <div style={{ borderLeft: "1.5px dashed rgba(255,255,255,0.12)", margin: "16px 0" }} />

      {/* Right content */}
      <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div>
            <div style={{ color: "#F5F7F6", fontWeight: 600, fontSize: 13, lineHeight: 1.4, marginBottom: 3 }}>
              {titleLabel}
            </div>
            <div style={{ color: "#B7C7C3", fontSize: 11, lineHeight: 1.5 }}>
              {descLabel}
            </div>
          </div>
        </div>

        {/* Code row */}
        <div
          style={{
            background: "rgba(211,217,37,0.1)",
            border: "1px dashed rgba(211,217,37,0.5)",
            borderRadius: 8,
            padding: "5px 10px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
          }}
        >
          <span style={{ color: "#D3D925", fontFamily: "monospace", fontWeight: 700, fontSize: 13, letterSpacing: 2 }}>
            {codeLabel}
          </span>
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {data.minOrderAmount > 0 && (
            <span style={{ color: "#B7C7C3", fontSize: 10 }}>
              Min Rs. {Number(data.minOrderAmount).toLocaleString()}
            </span>
          )}
          <span style={{ color: "#B7C7C3", fontSize: 10 }}>
            Valid till {validToStr}
          </span>
          <span style={{ color: "#B7C7C3", fontSize: 10 }}>
            {data.perUserLimit || 1}x per user
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Main exported component ─────────────────────────────────────────────────
export const CouponLivePreview = ({ data }: CouponLivePreviewProps) => {
  const [tab, setTab] = useState<"mobile" | "web">("mobile");

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 bg-[#121212]/50 border border-white/5 rounded-xl mb-6 self-start">
        <button
          onClick={() => setTab("mobile")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "mobile"
              ? "bg-[#D3D925] text-[#121212] font-bold shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Mobile
        </button>
        <button
          onClick={() => setTab("web")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "web"
              ? "bg-[#D3D925] text-[#121212] font-bold shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Globe className="w-4 h-4" />
          Website
        </button>
      </div>

      {/* Preview label */}
      <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live Preview — updates as you type
      </p>

      {/* Preview */}
      <div className="flex items-center justify-center flex-1 min-h-0">
        {tab === "mobile" ? (
          <MobilePreview data={data} />
        ) : (
          <WebPreview data={data} />
        )}
      </div>

      {/* Context hint */}
      <p className="text-[11px] text-muted-foreground text-center mt-4">
        {tab === "mobile"
          ? "Shown in the 'Exclusive Offers' carousel on the home screen"
          : "Shown on the All Offers & Checkout coupon pages"}
      </p>
    </div>
  );
};

export default CouponLivePreview;
