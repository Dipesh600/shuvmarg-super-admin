import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useModal } from "@/hooks/use-model-store";
import { useReuploadKycDocument } from "@/hooks/useReuploadKycDocument";
import { useState, useRef } from "react";
import { Loader2, UploadCloud, FileText, X } from "lucide-react";

const formSchema = z.object({
  document: z.custom<File | undefined>().refine((value): value is File => value instanceof File, "A new document file is required"),
});

export const ReuploadKycDocumentModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const { mutate: reupload, isPending } = useReuploadKycDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isModalOpen = isOpen && type === "reuploadKycDocument";
  const documentType = data?.documentType as string;
  const busOwnerId = data?.busOwnerId as string;
  const userId = typeof data?.userId === "string" ? data.userId : undefined;
  const documentLabel = data?.documentLabel as string;

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const {
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      document: undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!documentType || !busOwnerId || !values.document) return;

    const formData = new FormData();
    formData.append("id", busOwnerId);
    if (userId) formData.append("userId", userId);
    formData.append("documentType", documentType);
    formData.append("document", values.document);

    reupload(formData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  const handleClose = () => {
    reset();
    setSelectedFileName(null);
    onClose();
  };

  const removeFile = () => {
    setSelectedFileName(null);
    setValue("document", undefined);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            Re-upload {documentLabel || "Document"}
          </DialogTitle>
          <DialogDescription>
            Update the {documentLabel || documentType} for this bus owner.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>New Document File <span className="text-red-500">*</span></Label>
            
            {selectedFileName ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {selectedFileName}
                  </span>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                  onClick={removeFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div 
                className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors
                  ${errors.document ? 'border-destructive/50 bg-destructive/5' : 'border-muted-foreground/20'}
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Click to upload document</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (Max 5MB)</p>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png" 
                  className="hidden" 
                  onClick={(event) => { event.currentTarget.value = ""; }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setValue("document", file, { shouldValidate: true });
                      setSelectedFileName(file.name);
                    }
                  }}
                />
              </div>
            )}
            
            {errors.document && (
              <p className="text-xs font-medium text-destructive mt-1">
                {errors.document.message as string}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button disabled={isPending || !selectedFileName} type="submit" className="min-w-[120px]">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Update Document"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
