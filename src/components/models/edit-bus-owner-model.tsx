import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModal } from "@/hooks/use-model-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBusOwner } from "@/api/busOwnerApi";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { getErrorMessage } from "@/lib/error-message";

export function EditBusOwnerDialog() {
  const { isOpen, type, data } = useModal();
  const busOwner = data?.busOwner;
  const instanceKey = isOpen && type === "editBusOwner"
    ? `open-${busOwner?.busOwnerDoc?._id || busOwner?._id || busOwner?.email || "owner"}`
    : "closed";

  return <EditBusOwnerDialogInstance key={instanceKey} />;
}

function EditBusOwnerDialogInstance() {
  const { isOpen, onClose, type, data } = useModal();
  const isModelOpen = isOpen && type === "editBusOwner";
  const queryClient = useQueryClient();
  const busOwner = data?.busOwner;

  const [formData, setFormData] = useState(() => {
    const email = busOwner?.email || "";
    return {
      name: busOwner?.name || "",
      email: email.endsWith("@shuvmarg.internal") ? "" : email,
      phone: busOwner?.phone || "",
      address: busOwner?.address || "",
      companyName: busOwner?.busOwnerDoc?.companyName || "",
      panNumber: busOwner?.busOwnerDoc?.taxRegistration?.panNumber || "",
      registrationNumber: busOwner?.busOwnerDoc?.taxRegistration?.registrationNumber || "",
      bankName: busOwner?.busOwnerDoc?.bankDetails?.bankName || "",
      accountNumber: busOwner?.busOwnerDoc?.bankDetails?.accountNumber || "",
      accountHolderName: busOwner?.busOwnerDoc?.bankDetails?.accountHolderName || "",
      branchName: busOwner?.busOwnerDoc?.bankDetails?.branchName || "",
      swiftCode: busOwner?.busOwnerDoc?.bankDetails?.swiftCode || "",
    };
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const { mutate: updateOwner, isPending } = useMutation({
    mutationFn: updateBusOwner,
    onSuccess: () => {
      toast.success("Bus Owner profile updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["busOwners"] });
      queryClient.invalidateQueries({ queryKey: ["busOwner", busOwner?.busOwnerDoc?._id] });
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to update bus owner."));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busOwner?.busOwnerDoc?._id) return;

    updateOwner({
      id: busOwner.busOwnerDoc._id,
      ...formData,
    });
  };

  return (
    <Dialog open={isModelOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Edit Bus Owner Profile</DialogTitle>
          <DialogDescription>
            Update company details and contact information. 
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Section: Company Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Company Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" value={formData.companyName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN / VAT Number *</Label>
                <Input id="panNumber" value={formData.panNumber} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number *</Label>
                <Input id="registrationNumber" value={formData.registrationNumber} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {/* Section: Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Primary Contact</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Owner Name *</Label>
                <Input id="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleChange} />
                <p className="text-[10px] text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Changing email affects login credentials.
                </p>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Business Address *</Label>
                <Input id="address" value={formData.address} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {/* Section: Bank Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Bank Account</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                <Input id="accountHolderName" value={formData.accountHolderName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input id="bankName" value={formData.bankName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchName">Branch Name *</Label>
                <Input id="branchName" value={formData.branchName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input id="accountNumber" value={formData.accountNumber} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="swiftCode">SWIFT / IFSC Code</Label>
                <Input id="swiftCode" value={formData.swiftCode} onChange={handleChange} />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
