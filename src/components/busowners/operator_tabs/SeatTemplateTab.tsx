import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, Plus, Eye, Edit, Trash2, Loader2, Search, Activity, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import { 
    useFetchSeatTemplatesByUser, 
    useDeleteSeatTemplate, 
    useToggleSeatTemplateStatus 
} from "@/hooks/useSeatTemplates";

// Modals
import CreateSeatTemplateModal from "./CreateSeatTemplateModal";
import UpdateSeatTemplateModal from "./UpdateSeatTemplateModal";
import ViewSeatTemplateModal from "./ViewSeatTemplateModal";

const SeatTemplateTab = ({ ownerId }: { ownerId: string }) => {
  const { data: response, isLoading, isError, refetch } = useFetchSeatTemplatesByUser(ownerId);
  const deleteMutation = useDeleteSeatTemplate();
  const toggleMutation = useToggleSeatTemplateStatus();

  const templates = response?.data || [];

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string }>({
    isOpen: false,
    id: null,
    name: ""
  });

  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = templates.filter((t: any) => 
    t.templateName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openDeleteConfirm = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    if (deleteModal.id) {
      await deleteMutation.mutateAsync(deleteModal.id);
      setDeleteModal({ isOpen: false, id: null, name: "" });
    }
  };

  const handleToggle = async (id: string) => {
    await toggleMutation.mutateAsync(id);
  };

  const closeModals = () => {
    setActiveTemplateId(null);
    setModalType(null);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-6 rounded-2xl border-2 border-dashed border-muted">
        <div>
          <h3 className="text-xl font-black tracking-tighter flex items-center gap-2 text-primary">
            <LayoutGrid className="h-5 w-5" /> Seat Layout Templates
          </h3>
          <p className="text-sm text-muted-foreground font-medium italic opacity-70">Define and manage bus seat arrangements</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search layout name..." 
              className="pl-9 bg-background border-2 font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 h-10 px-5 font-bold uppercase transition-all hover:tracking-widest shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Create Template
          </Button>
        </div>
      </div>

      <Card className="border-2 border-muted shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black tracking-tighter leading-none mb-1">Registered Layouts</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Total {templates.length} templates available</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-primary opacity-20" />
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synchronizing Layout Database...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-destructive font-bold mb-4 opacity-70 italic tracking-tighter text-lg">Server Connection Dropped</p>
              <Button variant="outline" onClick={() => refetch()} size="sm" className="font-bold border-destructive text-destructive">Retry Fetch</Button>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <LayoutGrid className="h-8 w-8 text-muted-foreground opacity-30" />
              </div>
              <p className="text-lg font-black tracking-tighter text-primary">No Matching Templates</p>
              <p className="text-sm text-muted-foreground font-medium italic opacity-60">Try adjusting your search filters.</p>
            </div>
          ) : (
            <div className="rounded-md overflow-x-auto min-h-[300px]">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary">Template Name</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary text-center">Total Seats</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary text-center">Breakdown (A/B/C)</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary text-center">Status</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary text-right pr-6">Operations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((t: any) => (
                    <TableRow key={t._id} className="hover:bg-primary/[0.02] transition-colors border-b last:border-0">
                      <TableCell className="align-middle py-4">
                        <div className="flex flex-col">
                           <span className="font-black tracking-tight text-sm text-foreground">{t.templateName}</span>
                           <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase opacity-40">System ID: {t._id}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="align-middle py-4 text-center">
                         <div className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-primary/10 border-2 border-primary/20 px-2">
                           <span className="font-black text-xs text-primary">{t.totalSeats}</span>
                         </div>
                      </TableCell>

                      <TableCell className="align-middle py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                           <span className="bg-muted px-1.5 py-0.5 rounded" title="Seat A">{t.seata?.length || 0}A</span>
                           <span className="opacity-30">•</span>
                           <span className="bg-muted px-1.5 py-0.5 rounded" title="Seat B">{t.seatb?.length || 0}B</span>
                           <span className="opacity-30">•</span>
                           <span className="bg-muted px-1.5 py-0.5 rounded" title="Seat C">{t.seatc?.length || 0}C</span>
                        </div>
                      </TableCell>

                      <TableCell className="align-middle py-4 text-center">
                        <Badge 
                          variant={t.isActive ? "default" : "secondary"} 
                          className={`uppercase text-[9px] font-black tracking-widest py-0.5 transition-all
                                     ${t.isActive ? 'shadow-sm shadow-primary/20' : 'bg-muted/50 opacity-60'}`}
                        >
                          {t.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      <TableCell className="align-middle py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => {
                              setActiveTemplateId(t._id);
                              setModalType("view");
                            }}
                            title="Visual Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => {
                              setActiveTemplateId(t._id);
                              setModalType("edit");
                            }}
                            title="Edit Configuration"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-8 w-8 transition-colors
                                       ${t.isActive ? 'hover:bg-destructive/10 hover:text-destructive' : 'hover:bg-success/10 hover:text-success'}`}
                            onClick={() => handleToggle(t._id)}
                            title={t.isActive ? "Deactivate Template" : "Activate Template"}
                            disabled={toggleMutation.isPending}
                          >
                            {t.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => openDeleteConfirm(t._id, t.templateName)}
                            title="Delete Permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Modals */}
      <CreateSeatTemplateModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        userId={ownerId} 
      />
      
      <UpdateSeatTemplateModal 
        id={activeTemplateId} 
        isOpen={modalType === "edit"} 
        onClose={closeModals} 
      />
      
      <ViewSeatTemplateModal 
        id={activeTemplateId} 
        isOpen={modalType === "view"} 
        onClose={closeModals} 
      />

      {/* Delete Confirmation Popup */}
      <Dialog 
        open={deleteModal.isOpen} 
        onOpenChange={(open) => !open && setDeleteModal({ isOpen: false, id: null, name: "" })}
      >
        <DialogContent className="sm:max-w-[425px] border-2 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-destructive tracking-tighter flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Layout Template?
            </DialogTitle>
            <DialogDescription className="font-bold text-sm pt-4 text-muted-foreground italic">
              Warning: You are about to wipe <span className="text-foreground font-black">{deleteModal.name}</span>. 
              Existing fleets using this projection might be impacted. 
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/5 p-3 rounded-lg border border-destructive/10 mt-2">
             <p className="text-[10px] font-black uppercase text-destructive text-center tracking-[0.2em]">Destructive Operation</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-6 pt-6 border-t font-black">
            <DialogClose asChild>
              <Button variant="outline" className="font-bold flex-1 uppercase tracking-widest text-xs h-11 border-2">Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="font-bold shadow-lg shadow-destructive/20 flex-1 uppercase tracking-widest text-xs h-11 transition-all hover:tracking-[0.1em]"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Deleting...</>
              ) : (
                "Yes, Purge Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeatTemplateTab;
