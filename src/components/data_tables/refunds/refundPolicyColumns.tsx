import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useModal } from "@/hooks/use-model-store";

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";

interface RefundPolicy {
    id:string,
  policyName: string;
  refundPercentage: number;
  deductionPercentage: number;
  description: string;
  minHours: number;
  maxHours: number;
  color: string;
}
export const refundPolicyColumns: ColumnDef<RefundPolicy>[] = [
  {
    accessorKey: "policyName",
    header: "Policy Name",
    cell: ({ row }) => {
      const { policyName, color } = row.original;
      return (
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-medium">{policyName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const { description } = row.original;
      return (
        <div className="max-w-[300px] truncate text-muted-foreground">
          {description}
        </div>
      );
    },
  },
  {
    accessorKey: "refundPercentage",
    header: "Refund %",
    cell: ({ row }) => {
      const { refundPercentage } = row.original;
      return <Badge variant={"Success"}>{refundPercentage}%</Badge>;
    },
  },
  {
    accessorKey: "deductionPercentage",
    header: "Deduction %",
    cell: ({ row }) => {
      const { deductionPercentage } = row.original;
      return <Badge variant={"destructive"}>{deductionPercentage}%</Badge>;
    },
  },
  {
    accessorKey: "deductionPercerentage",
    header: "Visual",
    cell: ({ row }) => {
      const { refundPercentage } = row.original;
      return <Progress value={refundPercentage} className="h-2 w-24" />;
    },
  },
  {
    accessorKey: "maxHours",
    header: "Hours Range",
    cell: ({ row }) => {
      const { maxHours, minHours } = row.original;
      return <div>{maxHours + minHours}+ </div>;
    },
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const { onOpen } = useModal();
      const {
        color,
        deductionPercentage,
        description,
        maxHours,
        minHours,
        policyName,
        refundPercentage,
        id
      } = row.original;
      return (
        <Button
          onClick={() =>
            onOpen("editRefundPolicy", {
              color,
              deductionPercentage,
              description,
              maxHours,
              minHours,
              policyName,
              refundPercentage,
              id
            })
          }
          className="cursor-pointer"
          variant="ghost"
          size="sm"
        >
          <Pencil className="h-3 w-3" />
          <span>Edit</span>
        </Button>
      );
    },
  },
];
