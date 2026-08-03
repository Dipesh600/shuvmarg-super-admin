import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Power,
  PowerOff,
  Trash2,
  Copy,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";
import { formatDistanceToNow, isPast, isFuture, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Coupon {
  _id: string;
  couponCode: string;
  title: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validTo: string;
  totalUsageLimit?: number | null;
  perUserLimit: number;
  usedCount: number;
  isActive: boolean;
  isCurrentlyValid?: boolean;
  applicableUserTypes?: string[];
}

interface CouponCardProps {
  coupon: Coupon;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (coupon: Coupon) => void;
}

const getCouponStatus = (coupon: Coupon) => {
  if (!coupon.isActive) return "inactive";
  if (isFuture(new Date(coupon.validFrom))) return "upcoming";
  if (isPast(new Date(coupon.validTo))) return "expired";
  if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) return "exhausted";
  return "active";
};

const statusConfig = {
  active: { label: "Active", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: CheckCircle2, dotColor: "bg-emerald-500" },
  upcoming: { label: "Upcoming", color: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: Clock, dotColor: "bg-blue-500" },
  expired: { label: "Expired", color: "bg-slate-500/15 text-slate-500 border-slate-500/30", icon: XCircle, dotColor: "bg-slate-400" },
  exhausted: { label: "Exhausted", color: "bg-orange-500/15 text-orange-600 border-orange-500/30", icon: Ban, dotColor: "bg-orange-500" },
  inactive: { label: "Inactive", color: "bg-red-500/15 text-red-500 border-red-500/30", icon: PowerOff, dotColor: "bg-red-400" },
};

const discountGradients = {
  percentage: "from-violet-500 to-indigo-600",
  fixed: "from-emerald-500 to-teal-600",
};

export const CouponCard = ({ coupon, onToggleStatus, onDelete, onEdit }: CouponCardProps) => {
  const navigate = useNavigate();
  const status = getCouponStatus(coupon);
  const config = statusConfig[status];
  const usagePercent = coupon.totalUsageLimit
    ? Math.round((coupon.usedCount / coupon.totalUsageLimit) * 100)
    : null;

  const expiryDays = differenceInDays(new Date(coupon.validTo), new Date());
  const isExpiringSoon = expiryDays >= 0 && expiryDays <= 7 && status === "active";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(coupon.couponCode);
    toast.success(`Copied ${coupon.couponCode}!`);
  };

  return (
    <div className="group relative bg-[#121212]/30 border border-white/5 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md hover:shadow-2xl transition-all duration-300 hover:border-white/20 flex flex-col">
      {/* Top accent stripe */}
      <div className={`h-1 w-full bg-gradient-to-r ${discountGradients[coupon.discountType]}`} />

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Discount badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${discountGradients[coupon.discountType]} mb-2 shadow-sm`}>
              <Zap className="w-3 h-3" />
              {coupon.discountType === "percentage"
                ? `${coupon.discountValue}% OFF`
                : `Rs. ${coupon.discountValue.toLocaleString()} OFF`}
            </div>
            <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
              {coupon.title}
            </h3>
            {coupon.description && (
              <p className="text-white/60 text-xs mt-1 line-clamp-2">
                {coupon.description}
              </p>
            )}
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#121212] border-white/10 text-white">
              <DropdownMenuItem onClick={() => navigate(`/admin/offers/${coupon._id}`)} className="focus:bg-white/10 focus:text-white">
                <Eye className="mr-2 h-4 w-4" /> View Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(coupon)} className="focus:bg-white/10 focus:text-white">
                <Edit className="mr-2 h-4 w-4" /> Edit Coupon
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyCode} className="focus:bg-white/10 focus:text-white">
                <Copy className="mr-2 h-4 w-4" /> Copy Code
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={() => onToggleStatus(coupon._id)} className="focus:bg-white/10 focus:text-white">
                {coupon.isActive ? (
                  <><PowerOff className="mr-2 h-4 w-4 text-orange-500" /> Deactivate</>
                ) : (
                  <><Power className="mr-2 h-4 w-4 text-emerald-500" /> Activate</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
                onClick={() => onDelete(coupon._id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Code pill */}
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-2 self-start bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 transition-colors group/code"
        >
          <span className="font-mono text-sm font-bold tracking-widest text-white">
            {coupon.couponCode}
          </span>
          <Copy className="w-3 h-3 text-white/40 group-hover/code:opacity-100 transition-opacity" />
        </button>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/5 rounded-lg p-2.5">
            <p className="text-white/60 mb-0.5">Min. Order</p>
            <p className="font-semibold text-white">
              {coupon.minOrderAmount > 0 ? `Rs. ${coupon.minOrderAmount.toLocaleString()}` : "No minimum"}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5">
            <p className="text-white/60 mb-0.5">Per User</p>
            <p className="font-semibold text-white">{coupon.perUserLimit}x use</p>
          </div>
        </div>

        {/* Usage progress bar */}
        {coupon.totalUsageLimit ? (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60">Usage</span>
              <span className="font-semibold tabular-nums text-white">
                {coupon.usedCount} / {coupon.totalUsageLimit}
              </span>
            </div>
            <Progress value={usagePercent ?? 0} className="h-1.5 bg-white/10" />
          </div>
        ) : (
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/60">Used</span>
            <span className="font-semibold text-white">{coupon.usedCount} times · Unlimited</span>
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10 mt-auto">
          {/* Status badge */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
            {config.label}
          </div>

          {/* Expiry */}
          <div className="flex items-center gap-1 text-xs">
            {isExpiringSoon ? (
              <span className="text-amber-500 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> {expiryDays}d left
              </span>
            ) : status === "active" || status === "upcoming" ? (
              <span className="text-white/60">
                {status === "upcoming"
                  ? `Starts ${formatDistanceToNow(new Date(coupon.validFrom), { addSuffix: true })}`
                  : `Ends ${formatDistanceToNow(new Date(coupon.validTo), { addSuffix: true })}`}
              </span>
            ) : (
              <span className="text-white/60">
                {formatDistanceToNow(new Date(coupon.validTo), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponCard;
export type { Coupon };
