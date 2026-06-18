import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowRight, CalendarClock, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type PaymentMethod = "esewa" | "khalti" | "upi" | "card";
export type TransactionType = "none" | "refund";

const methodVariantMap: Record<PaymentMethod, BadgeProps["variant"]> = {
  esewa: "esewa",
  khalti: "khalti",
  upi: "outline",
  card: "secondary",
};

export type UserTranscation = {
  id: string;
  transactionId: string;
  type: TransactionType;
  amount: string;
  paymentDate: string;
  method: PaymentMethod;
};

export const UserTranscation: ColumnDef<UserTranscation>[] = [
  {
    accessorKey: "transactionId",
    header: "Transaction ID",
    cell: ({ row }) => {
      const { transactionId } = row.original;
      return (
        <span className="font-mono text-xs text-muted-foreground uppercase bg-white/5 px-2 py-1 rounded">
          #{transactionId.slice(-8)}
        </span>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const { type } = row.original;
      return (
        <Badge 
          className="capitalize px-2 py-0.5"
          variant="outline"
          style={{
            backgroundColor: type === "none" ? "rgba(211, 217, 37, 0.1)" : "rgba(244, 63, 94, 0.1)",
            color: type === "none" ? "#D3D925" : "#f43f5e",
            borderColor: type === "none" ? "rgba(211, 217, 37, 0.2)" : "rgba(244, 63, 94, 0.2)",
          }}
        >
          {type === "none" ? "Payment" : "Refunded"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const { amount } = row.original;
      return <span className="font-semibold text-white/90">Rs. {Number(amount).toLocaleString("en-IN")}</span>;
    },
  },
  {
    accessorKey: "paymentDate",
    header: "Date",
    cell: ({ row }) => {
      const { paymentDate } = row.original;
      const date = new Date(paymentDate);
      return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
           <CalendarClock className="h-3.5 w-3.5" />
           {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </div>
      );
    },
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
      const { method } = row.original;
      return (
        <div className="flex items-center gap-2">
           <CreditCard className="h-4 w-4 text-muted-foreground" />
           <Badge variant={methodVariantMap[method]} className="uppercase tracking-wider text-[10px]">
             {method}
           </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const { transactionId } = row.original;
      const navigate = useNavigate();
      return (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-white hover:bg-white/10"
          onClick={() => navigate(`/admin/transactions/${transactionId}`)}
          title="View Transaction Details"
        >
          <ArrowRight className="h-4 w-4" />
          <span className="sr-only">View Details</span>
        </Button>
      );
    },
  },
];
