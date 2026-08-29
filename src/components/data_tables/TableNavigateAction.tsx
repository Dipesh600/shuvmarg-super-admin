import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TableNavigateActionProps {
  to: string;
  label: string;
  title?: string;
  muted?: boolean;
}

export const TableNavigateAction = ({ to, label, title, muted = false }: TableNavigateActionProps) => {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={muted
        ? "h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10"
        : "h-8 w-8 rounded-full text-white hover:bg-white/10"}
      onClick={() => navigate(to)}
      aria-label={label}
      title={title}
    >
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
};
