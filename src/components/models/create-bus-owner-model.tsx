import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/hooks/use-model-store";
import { Check, UploadCloud, X, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBusOwner, resendBusOwnerAccess } from "@/api/busOwnerApi";
import { toast } from "sonner";

const getRequestMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object" || !("response" in error)) return fallback;
  const response = (error as { response?: { data?: { message?: unknown } } }).response;
  return typeof response?.data?.message === "string" ? response.data.message : fallback;
};

export const AddBusOwnerDialog = () => {
  const { isOpen, type, onClose } = useModal();
  const isModelOpen = isOpen && type === "addBusOwner";
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    ownerName: "",
    phone: "",
    email: "",
    panNumber: "",
    registrationNumber: "",
    address: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    branchName: "",
    swiftCode: "",
    ownerNotes: "",
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    companyRegistrationCert: null,
    panCardImage: null,
    ownerCitizenship: null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
      if (!allowedTypes.has(file.type)) {
        toast.error("Use a PDF, JPG or PNG document.");
        e.target.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Each document must be 5 MB or smaller.");
        e.target.value = "";
        return;
      }
      setFiles({ ...files, [fieldName]: file });
    }
  };

  const removeFile = (fieldName: string) => {
    setFiles({ ...files, [fieldName]: null });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.companyName || !formData.ownerName || !formData.phone || !formData.address || !formData.panNumber || !formData.registrationNumber) {
        return toast.error("Please fill all required company and legal details.");
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.bankName || !formData.accountHolderName || !formData.accountNumber || !formData.branchName) {
        return toast.error("Please fill all required bank details.");
      }
      setStep(3);
    }
  };

  const handleBack = () => setStep(step - 1);

  const resendAccess = useMutation({
    mutationFn: resendBusOwnerAccess,
    onSuccess: (result) => {
      if (result.notification.status === "DELIVERED") {
        toast.success("Operator login SMS sent.");
      } else {
        toast.error("The operator login SMS still could not be delivered.");
      }
    },
    onError: (error: unknown) => {
      toast.error(getRequestMessage(error, "Could not resend operator access."));
    },
  });

  const { mutate: addOwner, isPending } = useMutation({
    mutationFn: createBusOwner,
    onSuccess: (result) => {
      if (result.notification?.status === "DELIVERED") {
        toast.success(
          result.credentialMode === "TEMPORARY_PASSWORD"
            ? "Bus owner registered. One-time login credentials were sent by SMS."
            : "Bus owner access enabled. The operator login link was sent by SMS."
        );
      } else {
        toast.warning("Bus owner registered, but the operator login SMS was not delivered.", {
          duration: 12_000,
          action: result.userId ? {
            label: "Resend",
            onClick: () => resendAccess.mutate(result.userId),
          } : undefined,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["busOwners"] });
      queryClient.invalidateQueries({ queryKey: ["busOwnerDashboard"] });
      handleClose();
    },
    onError: (error: unknown) => {
      toast.error(getRequestMessage(error, "Failed to create bus owner."));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 3) return;

    if (!files.companyRegistrationCert || !files.panCardImage || !files.ownerCitizenship) {
       return toast.error("Please upload the mandatory KYC documents.");
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });

    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        data.append(key, file);
      }
    });

    addOwner(data);
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      companyName: "", ownerName: "", phone: "", email: "", panNumber: "",
      registrationNumber: "", address: "", bankName: "", accountHolderName: "",
      accountNumber: "", branchName: "", swiftCode: "", ownerNotes: "",
    });
    setFiles({
      companyRegistrationCert: null, panCardImage: null,
      ownerCitizenship: null,
    });
    onClose();
  };

  // Step indicator UI
  const StepIndicator = ({ num, title }: { num: number; title: string }) => {
    const isActive = step === num;
    const isCompleted = step > num;
    return (
      <div className="flex flex-col items-center flex-1 relative z-10 transition-all">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${isActive ? "border-primary bg-primary text-primary-foreground" : isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background text-muted-foreground"}`}>
          {isCompleted ? <Check className="w-4 h-4" /> : num}
        </div>
        <span className={`text-xs mt-2 font-medium text-center ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
          {title}
        </span>
      </div>
    );
  };

  const FileUploader = ({ label, fieldName, required = false }: { label: string, fieldName: string, required?: boolean }) => {
    const file = files[fieldName];
    const fileInputRef = useRef<HTMLInputElement>(null);
    return (
      <div className="space-y-2">
        <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
        {file ? (
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
            <span className="text-sm truncate mr-2">{file.name}</span>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeFile(fieldName)}>
               <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div 
             className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
             onClick={() => fileInputRef.current?.click()}
          >
             <UploadCloud className="h-6 w-6 text-muted-foreground mb-2" />
             <p className="text-sm text-muted-foreground font-medium">Click to upload doc</p>
             <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (max 5 MB)</p>
             <input 
               ref={fileInputRef} 
               type="file" 
               accept=".pdf,.jpg,.jpeg,.png" 
               className="hidden" 
               onChange={(e) => handleFileChange(e, fieldName)}
             />
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isModelOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Bus Owner</DialogTitle>
          <DialogDescription>
            Register a new operator. They will enter PENDING KYC state.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Tracker */}
        <div className="relative flex justify-between items-start my-6 px-4">
          <div className="absolute top-4 left-[10%] right-[10%] h-[2px] bg-muted -z-0">
             <div className="h-full bg-primary transition-all duration-300" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} />
          </div>
          <StepIndicator num={1} title="Company" />
          <StepIndicator num={2} title="Bank" />
          <StepIndicator num={3} title="Documents" />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[50vh] overflow-y-auto px-2 custom-scrollbar">
            
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Business name" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Owner Name *</Label>
                    <Input name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Full name" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email (Optional)</Label>
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="owner@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="e.g. 98XXXXXXXX" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Business Address *</Label>
                  <Input name="address" value={formData.address} onChange={handleChange} placeholder="Full address" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PAN / VAT Number *</Label>
                    <Input name="panNumber" value={formData.panNumber} onChange={handleChange} placeholder="Ex: 3XXXX..." required />
                  </div>
                  <div className="space-y-2">
                    <Label>Registration Number *</Label>
                    <Input name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} placeholder="Reg number" required />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2">
                  <Label>Bank Name *</Label>
                  <Input name="bankName" value={formData.bankName} onChange={handleChange} placeholder="e.g. Nabil Bank" required />
                </div>
                <div className="space-y-2">
                  <Label>Account Holder Name *</Label>
                  <Input name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} placeholder="Must match bank record" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Number *</Label>
                    <Input name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="Account Number" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch Name *</Label>
                    <Input name="branchName" value={formData.branchName} onChange={handleChange} placeholder="Branch location" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Swift / IFSC Code (Optional)</Label>
                  <Input name="swiftCode" value={formData.swiftCode} onChange={handleChange} placeholder="SWIFT/IFSC" />
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
               <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FileUploader label="Company Registration" fieldName="companyRegistrationCert" required />
                    <FileUploader label="PAN Card" fieldName="panCardImage" required />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <FileUploader label="Owner Citizenship" fieldName="ownerCitizenship" required />
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label>Internal Notes (Optional)</Label>
                    <Textarea name="ownerNotes" value={formData.ownerNotes} onChange={handleChange} placeholder="Any specific notes or conditions..." rows={2} />
                  </div>
               </div>
            )}

          </div>

          <DialogFooter className="mt-6 flex justify-between sm:justify-between w-full">
            {step > 1 ? (
               <Button type="button" variant="outline" onClick={handleBack} disabled={isPending}>
                 Back
               </Button>
            ) : (
               <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                 Cancel
               </Button>
            )}

            {step < 3 ? (
               <Button type="button" onClick={handleNext}>
                 Next
               </Button>
            ) : (
               <Button type="submit" disabled={isPending}>
                 {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Submit & Create
               </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
