import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { CreateDriverPayload, LicenseType, DriverProfile, DriverStatus } from "@/api/driverApi";
import { createDriverWithFiles, updateDriverWithFiles } from "@/api/driverApi";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, UserCheck, Upload, FileText, ImageIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// ── File picker button ──────────────────────────────────────────────────────────
const FilePicker: React.FC<{
  label: string;
  accept?: string;
  value: File | null;
  currentUrl?: string;
  onChange: (f: File | null) => void;
  icon?: React.ReactNode;
}> = ({ label, accept = "image/*,application/pdf", value, currentUrl: _currentUrl, onChange, icon }) => {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      <div
        className="flex items-center gap-3 h-9 px-3 rounded-xl border border-dashed border-muted-foreground/30
                   bg-muted/20 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
        onClick={() => ref.current?.click()}
      >
        {icon || <Upload className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
        <span className="text-xs text-muted-foreground truncate min-w-0">
          {value ? value.name : "Click to upload"}
        </span>
        {value && (
          <button
            type="button"
            className="ml-auto text-[10px] text-red-500 font-black hover:text-red-700 flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
          >
            ✕
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
};

// ── Expiry status pill ──────────────────────────────────────────────────────────
const ExpiryStatus: React.FC<{ dateStr?: string | null }> = ({ dateStr }) => {
  if (!dateStr) return null;
  const expiry = new Date(dateStr);
  const diff = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
  if (diff < 0) return (
    <span className="flex items-center gap-1 text-[10px] font-black text-red-600">
      <AlertTriangle className="h-3 w-3" /> EXPIRED
    </span>
  );
  if (diff < 30) return (
    <span className="flex items-center gap-1 text-[10px] font-black text-amber-600">
      <AlertTriangle className="h-3 w-3" /> Expires in {diff}d
    </span>
  );
  return <span className="text-[10px] text-muted-foreground">{expiry.toLocaleDateString()}</span>;
};

interface DriverFormModalProps {
  brandId: string;
  brandName: string;
  driver?: DriverProfile; // If present, modal acts in Edit mode
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Tab = "details" | "documents";

const INITIAL: CreateDriverPayload = {
  brandId: "",
  fullName: "",
  phone: "",
  email: "",
  gender: "",
  address: "",
  licenseNumber: "",
  licenseType: "HV",
  licenseExpiry: "",
  medicalCertExpiry: "",
  experienceYears: 0,
  previousEmployer: "",
  notes: "",
};

const DriverFormModal: React.FC<DriverFormModalProps> = ({
  brandId, brandName, driver, isOpen, onClose, onSuccess,
}) => {
  const isEdit = !!driver;
  const [tab, setTab] = useState<Tab>("details");
  
  const [form, setForm] = useState<CreateDriverPayload & { status?: DriverStatus }>(
    isEdit
      ? {
          brandId:           brandId,
          fullName:          driver!.fullName,
          phone:             driver!.phone,
          email:             driver!.email || "",
          gender:            driver!.gender || "",
          address:           driver!.address || "",
          licenseNumber:     driver!.licenseNumber,
          licenseType:       driver!.licenseType,
          licenseExpiry:     driver!.licenseExpiry ? driver!.licenseExpiry.split("T")[0] : "",
          medicalCertExpiry: driver!.medicalCertExpiry ? driver!.medicalCertExpiry.split("T")[0] : "",
          experienceYears:   driver!.experienceYears,
          previousEmployer:  driver!.previousEmployer || "",
          notes:             driver!.notes || "",
          status:            driver!.status,
        }
      : { ...INITIAL, brandId }
  );

  const set = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const [licenseDocFile,    setLicenseDocFile]    = useState<File | null>(null);
  const [medicalCertFile,   setMedicalCertFile]   = useState<File | null>(null);
  const [photoFile,         setPhotoFile]         = useState<File | null>(null);

  const mut = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        licenseDoc: licenseDocFile,
        medicalCertDoc: medicalCertFile,
        photo: photoFile,
      };
      if (isEdit) {
        return updateDriverWithFiles(driver!._id, payload);
      }
      return createDriverWithFiles(payload as any);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Driver updated successfully." : "Driver added. Pending document review.");
      if (!isEdit) {
        setForm({ ...INITIAL, brandId });
        setTab("details");
        setLicenseDocFile(null);
        setMedicalCertFile(null);
        setPhotoFile(null);
      }
      onSuccess();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || (isEdit ? "Update failed" : "Failed to create driver")),
  });

  const handleClose = () => {
    if (!isEdit) {
      setLicenseDocFile(null);
      setMedicalCertFile(null);
      setPhotoFile(null);
      setForm({ ...INITIAL, brandId });
      setTab("details");
    }
    onClose();
  };

  const isFormValid = form.fullName.trim() && form.phone.trim() && form.licenseNumber.trim() && form.licenseType && form.licenseExpiry;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-2 shadow-2xl">

        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight text-primary uppercase">
                {isEdit ? "Edit Driver" : "Add Driver"}
              </DialogTitle>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {isEdit ? driver!.fullName : brandName}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            {(["details", "documents"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {t === "details" ? "1. Details" : "2. Documents"}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Tab 1 — Details */}
        {tab === "details" && (
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Full Name *
                </Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="e.g. Ram Bahadur Thapa"
                  className="h-9 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Phone *
                </Label>
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="h-9 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Email
                </Label>
                <Input
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="optional"
                  className="h-9 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Gender
                </Label>
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger className="h-9 rounded-xl">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Experience (years)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.experienceYears}
                  onChange={(e) => set("experienceYears", Number(e.target.value))}
                  className="h-9 rounded-xl"
                />
              </div>

              {isEdit && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operational Status</Label>
                  <Select value={form.status} onValueChange={(v) => set("status", v as DriverStatus)}>
                    <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className={isEdit ? "space-y-1" : "col-span-2 space-y-1"}>
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Previous Employer
                </Label>
                <Input
                  value={form.previousEmployer}
                  onChange={(e) => set("previousEmployer", e.target.value)}
                  placeholder="Previous bus company (optional)"
                  className="h-9 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 — Documents */}
        {tab === "documents" && (
          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  License Number *
                </Label>
                <Input
                  value={form.licenseNumber}
                  onChange={(e) => set("licenseNumber", e.target.value.toUpperCase())}
                  placeholder="e.g. NL123456789"
                  className="h-9 rounded-xl font-mono tracking-widest"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  License Type *
                </Label>
                <Select value={form.licenseType} onValueChange={(v) => set("licenseType", v as LicenseType)}>
                  <SelectTrigger className="h-9 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="HV">HV — Heavy Vehicle (Bus)</SelectItem>
                    <SelectItem value="LV">LV — Light Vehicle (Hiace)</SelectItem>
                    <SelectItem value="TRK">TRK — Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  License Expiry *
                </Label>
                <Input
                  type="date"
                  value={form.licenseExpiry}
                  onChange={(e) => set("licenseExpiry", e.target.value)}
                  className="h-9 rounded-xl"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Medical Certificate Expiry
                </Label>
                <Input
                  type="date"
                  value={form.medicalCertExpiry}
                  onChange={(e) => set("medicalCertExpiry", e.target.value)}
                  className="h-9 rounded-xl"
                />
                <p className="text-[9px] text-muted-foreground mt-1">
                  DoTM Nepal requires a valid medical fitness certificate for heavy vehicle drivers.
                </p>
              </div>

              <div className="col-span-2 space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Internal Notes
                </Label>
                <Input
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Optional admin notes"
                  className="h-9 rounded-xl"
                />
              </div>
            </div>

            {/* Document Uploads */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Driving Licence</p>
                {isEdit && <ExpiryStatus dateStr={form.licenseExpiry} />}
              </div>
              <FilePicker
                label="License Document (PDF or Image)"
                accept="image/*,application/pdf"
                value={licenseDocFile}
                currentUrl={isEdit ? driver!.licenseDoc : undefined}
                onChange={setLicenseDocFile}
                icon={<FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
              />
              
              <div className="flex items-center justify-between mt-4 border-t pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Medical Certificate</p>
                {isEdit && <ExpiryStatus dateStr={form.medicalCertExpiry} />}
              </div>
              <FilePicker
                label="Medical Certificate (PDF or Image)"
                accept="image/*,application/pdf"
                value={medicalCertFile}
                currentUrl={isEdit ? driver!.medicalCertDoc : undefined}
                onChange={setMedicalCertFile}
                icon={<FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
              />

              <div className="mt-4 border-t pt-4">
                <FilePicker
                  label="Driver Photo"
                  accept="image/*"
                  value={photoFile}
                  currentUrl={isEdit ? driver!.photo : undefined}
                  onChange={setPhotoFile}
                  icon={<ImageIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="p-6 pt-0 flex gap-2">
          <Button variant="outline" className="flex-1 h-10 rounded-xl font-black text-xs uppercase" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 h-10 rounded-xl font-black text-xs uppercase"
            disabled={!isFormValid || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Save Changes" : "Create Driver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DriverFormModal;
