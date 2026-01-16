import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
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
    id:string
  transactionId: string;
  type: TransactionType;
  amount: string;
  paymentDate: string;
  method: PaymentMethod;
};



export const UserTranscation: ColumnDef<UserTranscation>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: "transactionId",
    header: "transactionId",
  },

  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const { type } = row.original;
      return (
        <Badge variant={type === "none" ? "default" : "destructive"}>
          {type === "none" ? "Payment" : "Refunded"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "paymentDate",
    header: "PaymentDate",
    cell: ({ row }) => {
      const { paymentDate } = row.original;
      const date = new Date(paymentDate);
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
      const { method } = row.original;
      return <Badge variant={methodVariantMap[method]}>{method}</Badge>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const { transactionId } = row.original;
      const navigate = useNavigate();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigate(`${window.location}/${transactionId}`)}
            >
              View Transcation Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
           
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
