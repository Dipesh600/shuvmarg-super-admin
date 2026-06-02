import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ComingSoonTabProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

const ComingSoonTab = ({ icon: Icon, title, description }: ComingSoonTabProps) => (
    <Card className="flex flex-col items-center justify-center py-20 px-8 border-dashed border-2 bg-muted/10">
        <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 mb-6">
            <Icon className="h-10 w-10 text-primary/40" />
        </div>
        <h3 className="text-xl font-black tracking-tight mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm text-center max-w-md">{description}</p>
        <span className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-primary/50">Coming Soon</span>
    </Card>
);

export default ComingSoonTab;
