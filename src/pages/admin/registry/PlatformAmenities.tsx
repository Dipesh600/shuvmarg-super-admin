import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Zap, Plus, Search, Pencil, Trash2, Loader2, CheckCircle2,
  // Bus & Travel (domain-specific)
  Bus, BedDouble, Hotel, GlassWater, Fuel, Moon, Mountain,
  Ticket, Gauge, Landmark, QrCode, AlarmClock, ShowerHead,
  FlaskConical, CalendarDays, BusFront, Waves, Tent,
  Cigarette, CigaretteOff, Footprints, Newspaper,
  // Connectivity
  Wifi, Globe, Rss, Phone, Smartphone,
  // Climate
  Wind, Snowflake, Thermometer, Sun, AirVent,
  // Entertainment
  Tv, Music, Headphones, Volume2, Radio,
  // Food & Drink
  Coffee, Utensils, Sandwich, Droplets, Wine,
  // Power
  Plug, Battery, BatteryCharging, Usb, BatteryFull,
  // Comfort
  Star, Crown, Gem, Sofa, Heart,
  // Safety & Security
  Shield, Lock, Camera, Eye, Siren,
  // Accessibility
  Accessibility, Baby, PawPrint, Users, UserCheck,
  // Storage
  Package, Luggage, Briefcase, Backpack, Archive,
  // Health
  Activity, Cross, Stethoscope, Pill, HeartPulse,
  // Navigation
  MapPin, Navigation, Compass, Map, Route,
  // Eco & Environment
  Leaf, Recycle, Sprout, TreePine, Flower2,
  // Service & Misc
  Bell, Clock, Gift, Umbrella, BookOpen,
  AlertTriangle, ToggleLeft, ToggleRight, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/api/axios";

// ── API helpers (inline — no new file needed) ──────────────────────────────
const getAllGlobalAmenities = async () => {
  const { data } = await api.get("/amenities/global");
  return data;
};
const createGlobalAmenity = async (payload: any) => {
  const { data } = await api.post("/amenities/createGlobal", payload);
  return data;
};
const updateAmenity = async ({ id, payload }: { id: string; payload: any }) => {
  const { data } = await api.patch(`/amenities/${id}`, payload);
  return data;
};
const deleteAmenity = async (id: string) => {
  const { data } = await api.delete(`/amenities/${id}`);
  return data;
};

// ── Icon picker data (75 icons across 11 categories) ───────────────────────
const ICON_OPTIONS = [
  // ── 🚌 Bus & Travel (domain-specific) ────────────────────────────────────
  { label: "Bus",          value: "bus",           Icon: Bus },
  { label: "Bus Front",    value: "bus-front",     Icon: BusFront },
  { label: "Sleeper",      value: "bed-double",    Icon: BedDouble },
  { label: "Hotel Stop",   value: "hotel",         Icon: Hotel },
  { label: "Water Bottle", value: "flask",         Icon: FlaskConical },
  { label: "Drinking Water",value: "glass-water",  Icon: GlassWater },
  { label: "Fuel Stop",    value: "fuel",          Icon: Fuel },
  { label: "Night Service",value: "moon",          Icon: Moon },
  { label: "Hill Route",   value: "mountain",      Icon: Mountain },
  { label: "Ticket",       value: "ticket",        Icon: Ticket },
  { label: "Speed",        value: "gauge",         Icon: Gauge },
  { label: "Landmark",     value: "landmark",      Icon: Landmark },
  { label: "QR Boarding",  value: "qr-code",       Icon: QrCode },
  { label: "Wake-up Call", value: "alarm-clock",   Icon: AlarmClock },
  { label: "Restroom",     value: "shower-head",   Icon: ShowerHead },
  { label: "Schedule",     value: "calendar-days", Icon: CalendarDays },
  { label: "River Route",  value: "waves",         Icon: Waves },
  { label: "Adventure",    value: "tent",          Icon: Tent },
  { label: "Smoking",      value: "cigarette",     Icon: Cigarette },
  { label: "No Smoking",   value: "no-smoking",    Icon: CigaretteOff },
  { label: "Walking",      value: "footprints",    Icon: Footprints },
  { label: "Newspaper",    value: "newspaper",     Icon: Newspaper },
  // ── Connectivity ─────────────────────────────────────────────────────────
  { label: "WiFi",         value: "wifi",          Icon: Wifi },
  { label: "Internet",     value: "globe",         Icon: Globe },
  { label: "Signal",       value: "rss",           Icon: Rss },
  { label: "Phone",        value: "phone",         Icon: Phone },
  { label: "Mobile",       value: "smartphone",    Icon: Smartphone },
  // ── Climate ─────────────────────────────────────────────────────────────
  { label: "A/C",          value: "wind",          Icon: Wind },
  { label: "AC Vent",      value: "air-vent",      Icon: AirVent },
  { label: "Heating",      value: "thermometer",   Icon: Thermometer },
  { label: "Cooling",      value: "snowflake",     Icon: Snowflake },
  { label: "Sunroof",      value: "sun",           Icon: Sun },
  // ── Entertainment ───────────────────────────────────────────────────────
  { label: "TV",           value: "tv",            Icon: Tv },
  { label: "Music",        value: "music",         Icon: Music },
  { label: "Headphones",   value: "headphones",    Icon: Headphones },
  { label: "Audio",        value: "volume2",       Icon: Volume2 },
  { label: "Radio",        value: "radio",         Icon: Radio },
  // ── Food & Drink ─────────────────────────────────────────────────────────
  { label: "Tea/Coffee",   value: "coffee",        Icon: Coffee },
  { label: "Meals",        value: "utensils",      Icon: Utensils },
  { label: "Snacks",       value: "sandwich",      Icon: Sandwich },
  { label: "Water",        value: "droplets",      Icon: Droplets },
  { label: "Beverages",    value: "wine",          Icon: Wine },
  // ── Power ─────────────────────────────────────────────────────────────────
  { label: "Charging",     value: "plug",          Icon: Plug },
  { label: "Battery",      value: "battery",       Icon: Battery },
  { label: "Fast Charge",  value: "battery-charging", Icon: BatteryCharging },
  { label: "USB Port",     value: "usb",           Icon: Usb },
  { label: "Full Power",   value: "battery-full",  Icon: BatteryFull },
  // ── Comfort ───────────────────────────────────────────────────────────────
  { label: "Premium",      value: "star",          Icon: Star },
  { label: "Luxury",       value: "crown",         Icon: Crown },
  { label: "VIP",          value: "gem",           Icon: Gem },
  { label: "Lounge",       value: "sofa",          Icon: Sofa },
  { label: "Comfort",      value: "heart",         Icon: Heart },
  // ── Safety & Security ─────────────────────────────────────────────────────
  { label: "Insurance",    value: "shield",        Icon: Shield },
  { label: "Locked",       value: "lock",          Icon: Lock },
  { label: "CCTV",         value: "camera",        Icon: Camera },
  { label: "Monitored",    value: "eye",           Icon: Eye },
  { label: "Emergency",    value: "siren",         Icon: Siren },
  // ── Accessibility ─────────────────────────────────────────────────────────
  { label: "Accessible",   value: "accessibility", Icon: Accessibility },
  { label: "Baby Care",    value: "baby",          Icon: Baby },
  { label: "Pet Friendly", value: "paw-print",     Icon: PawPrint },
  { label: "Group",        value: "users",         Icon: Users },
  { label: "Verified",     value: "user-check",    Icon: UserCheck },
  // ── Storage ───────────────────────────────────────────────────────────────
  { label: "Parcel",       value: "package",       Icon: Package },
  { label: "Luggage",      value: "luggage",       Icon: Luggage },
  { label: "Briefcase",    value: "briefcase",     Icon: Briefcase },
  { label: "Backpack",     value: "backpack",      Icon: Backpack },
  { label: "Archive",      value: "archive",       Icon: Archive },
  // ── Health ────────────────────────────────────────────────────────────────
  { label: "Health",       value: "activity",      Icon: Activity },
  { label: "First Aid",    value: "cross",         Icon: Cross },
  { label: "Medical",      value: "stethoscope",   Icon: Stethoscope },
  { label: "Pharmacy",     value: "pill",          Icon: Pill },
  { label: "Pulse",        value: "heart-pulse",   Icon: HeartPulse },
  // ── Navigation ────────────────────────────────────────────────────────────
  { label: "GPS",          value: "map-pin",       Icon: MapPin },
  { label: "Navigation",   value: "navigation",    Icon: Navigation },
  { label: "Compass",      value: "compass",       Icon: Compass },
  { label: "Map",          value: "map",           Icon: Map },
  { label: "Route",        value: "route",         Icon: Route },
  // ── Eco & Environment ─────────────────────────────────────────────────────
  { label: "Eco",          value: "leaf",          Icon: Leaf },
  { label: "Recycled",     value: "recycle",       Icon: Recycle },
  { label: "Green",        value: "sprout",        Icon: Sprout },
  { label: "Nature",       value: "tree-pine",     Icon: TreePine },
  { label: "Floral",       value: "flower2",       Icon: Flower2 },
  // ── Service & Misc ────────────────────────────────────────────────────────
  { label: "Alerts",       value: "bell",          Icon: Bell },
  { label: "On-Time",      value: "clock",         Icon: Clock },
  { label: "Gifts",        value: "gift",          Icon: Gift },
  { label: "Weather",      value: "umbrella",      Icon: Umbrella },
  { label: "Reading",      value: "book-open",     Icon: BookOpen },
  { label: "Other",        value: "zap",           Icon: Zap },
];

const iconFromValue = (value: string) => {
  const found = ICON_OPTIONS.find((o) => o.value === value);
  return found ? found.Icon : Zap;
};

// ── Amenity Card ────────────────────────────────────────────────────────────
const AmenityCard = ({
  amenity,
  onEdit,
  onDelete,
}: {
  amenity: any;
  onEdit: (a: any) => void;
  onDelete: (id: string, name: string) => void;
}) => {
  const Icon = iconFromValue(amenity.icon);
  return (
    <div className="group relative flex flex-col gap-4 p-5 rounded-2xl border-2 border-muted bg-[#0a0a0a] hover:border-[#D3D925]/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      {/* Status dot */}
      <div className={cn(
        "absolute top-3 right-3 w-2 h-2 rounded-full",
        amenity.status ? "bg-[#D3D925]" : "bg-white/30"
      )} />

      {/* Icon + Name */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-[#D3D925]/10 border border-[#D3D925]/20 text-[#D3D925] shrink-0 group-hover:bg-[#D3D925] group-hover:text-black transition-all duration-300">
          {React.createElement(Icon, { className: "h-5 w-5" })}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight truncate">{amenity.name}</p>
          <p className="text-[10px] text-white/50 mt-0.5 line-clamp-2 font-medium">
            {amenity.description || "No description provided."}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-muted">
        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest text-[#D3D925] border-[#D3D925]/20 bg-[#D3D925]/10">
          Global
        </Badge>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={() => onEdit(amenity)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(amenity._id, amenity.name)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Create / Edit Modal ─────────────────────────────────────────────────────
const AmenityFormModal = ({
  isOpen,
  onClose,
  editTarget,
}: {
  isOpen: boolean;
  onClose: () => void;
  editTarget: any | null;
}) => {
  const qc = useQueryClient();
  const isEdit = !!editTarget;

  const [name, setName] = useState(editTarget?.name || "");
  const [description, setDescription] = useState(editTarget?.description || "");
  const [icon, setIcon] = useState(editTarget?.icon || "zap");
  const [status, setStatus] = useState(editTarget?.status ?? true);

  // Reset form when target changes
  React.useEffect(() => {
    setName(editTarget?.name || "");
    setDescription(editTarget?.description || "");
    setIcon(editTarget?.icon || "zap");
    setStatus(editTarget?.status ?? true);
  }, [editTarget]);

  const createMutation = useMutation({
    mutationFn: createGlobalAmenity,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["globalAmenities"] });
      toast.success("Amenity added to platform catalog.");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to create amenity."),
  });

  const updateMutation = useMutation({
    mutationFn: updateAmenity,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["globalAmenities"] });
      toast.success("Amenity updated.");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to update amenity."),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("Amenity name is required."); return; }
    const payload = { name: name.trim(), description: description.trim(), icon, status };
    if (isEdit) {
      updateMutation.mutate({ id: editTarget._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#D3D925]" />
            {isEdit ? "Edit Amenity" : "Add Platform Amenity"}
          </DialogTitle>
          <p className="text-xs text-white/50">
            {isEdit ? "Update this amenity in the global catalog." : "This amenity will be available to all bus operators on the platform."}
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest">Amenity Name *</Label>
            <Input
              placeholder="e.g. Free WiFi, Air Conditioning, USB Charging"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 font-bold"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Description</Label>
            <Textarea
              placeholder="Briefly describe what this amenity offers passengers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none min-h-[70px] font-medium"
            />
          </div>

          {/* Icon Picker */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Icon <span className="normal-case font-medium text-white/50/60">({ICON_OPTIONS.length} available — hover for label)</span>
            </Label>
            <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {ICON_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setIcon(value)}
                  title={label}
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center transition-all border-2 relative group/icon",
                    icon === value
                      ? "bg-[#D3D925] text-black border-primary shadow-lg shadow-[#D3D925]/20 scale-105"
                      : "bg-white/5 text-white/50 border-transparent hover:border-muted hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {/* Tooltip */}
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-foreground text-background text-[9px] font-bold whitespace-nowrap opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none z-50">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Status toggle (edit only) */}
          {isEdit && (
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-white/[0.02]">
              <button type="button" onClick={() => setStatus(!status)}>
                {status
                  ? <ToggleRight className="h-6 w-6 text-[#D3D925]" />
                  : <ToggleLeft className="h-6 w-6 text-white/50" />}
              </button>
              <div>
                <p className="text-xs font-bold">{status ? "Active" : "Inactive"}</p>
                <p className="text-[10px] text-white/50">
                  {status ? "Visible to operators when setting up fleets." : "Hidden from operators."}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="font-bold min-w-[130px]">
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
              : isEdit ? <><CheckCircle2 className="h-4 w-4 mr-2" />Update Amenity</>
              : <><Plus className="h-4 w-4 mr-2" />Add to Catalog</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Delete Confirm Modal ────────────────────────────────────────────────────
const DeleteConfirmModal = ({
  target,
  onClose,
}: {
  target: { id: string; name: string } | null;
  onClose: () => void;
}) => {
  const qc = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteAmenity(target!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["globalAmenities"] });
      toast.success(`"${target?.name}" removed from catalog.`);
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to delete amenity."),
  });

  return (
    <Dialog open={!!target} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="p-4 rounded-2xl bg-white/5 border-2 border-white/10">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Delete this amenity?</h3>
            <p className="text-sm text-white/50 mt-1">
              <strong>"{target?.name}"</strong> can only be deleted when no fleet uses it. Deactivate it to hide it from new selections while preserving existing fleet records.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => mutate()}
            disabled={isPending}
            className="font-bold min-w-[120px]"
          >
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Checking...</> : "Delete if unused"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Main Page ───────────────────────────────────────────────────────────────
const PlatformAmenities = () => {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["globalAmenities"],
    queryFn: getAllGlobalAmenities,
    staleTime: 60_000,
  });

  const amenities: any[] = data?.data || [];
  const filtered = amenities.filter((a) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (a: any) => { setEditTarget(a); setFormOpen(true); };
  const openDelete = (id: string, name: string) => setDeleteTarget({ id, name });

  const activeCount = amenities.filter((a) => a.status).length;

  return (
    <div className="container mx-auto pb-16 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page header */}
      <div className="flex items-center gap-5">
        <div className="p-4 rounded-[1.5rem] bg-[#D3D925] shadow-2xl shadow-[#D3D925]/20 text-black">
          <Zap className="w-9 h-9" />
        </div>
        <div>
          <h1 className="text-5xl font-bold tracking-tighter">Amenities Catalog</h1>
          <p className="text-white/50 font-bold uppercase tracking-widest text-xs mt-1">
            Platform-Level Service Registry
          </p>
        </div>
      </div>

      {/* Context banner */}
      <div className="p-5 rounded-2xl bg-[#D3D925]/10 border border-[#D3D925]/10 text-sm font-medium text-white/50">
        <strong className="text-white">How it works:</strong> Amenities defined here form the <strong>global catalog</strong>. When a bus operator registers a fleet, they pick from this list. You can also let them create custom amenities specific to their operation.
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Amenities", value: amenities.length, color: "text-[#D3D925]" },
          { label: "Active", value: activeCount, color: "text-[#D3D925]" },
          { label: "Inactive", value: amenities.length - activeCount, color: "text-white/50" },
        ].map((kpi) => (
          <div key={kpi.label} className="p-5 rounded-2xl border-2 border-muted bg-[#0a0a0a] text-center space-y-1">
            <p className={cn("text-3xl font-bold", kpi.color)}>{kpi.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Search amenities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 font-medium text-sm"
          />
        </div>
        <Button onClick={openCreate} className="h-10 px-6 font-bold gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Add Amenity
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Zap className="h-10 w-10 text-white/50 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Loading catalog...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 border-2 border-dashed rounded-3xl">
          <div className="p-5 rounded-2xl bg-white/[0.04]">
            <Zap className="h-10 w-10 text-white/40" />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">
              {search ? "No matching amenities." : "No amenities in the catalog yet."}
            </p>
            <p className="text-sm text-white/50 mt-1">
              {search ? "Try a different search term." : "Add your first amenity to get started."}
            </p>
          </div>
          {!search && (
            <Button onClick={openCreate} variant="outline" className="font-bold gap-2 mt-2">
              <Plus className="h-4 w-4" /> Add First Amenity
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((amenity) => (
            <AmenityCard
              key={amenity._id}
              amenity={amenity}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
          {/* Add new card */}
          <button
            onClick={openCreate}
            className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-[#D3D925]/20 text-[#D3D925]/40 hover:border-primary/50 hover:text-[#D3D925] hover:bg-[#D3D925]/10 transition-all duration-300 min-h-[140px]"
          >
            <Plus className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Add New</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <AmenityFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        editTarget={editTarget}
      />
      <DeleteConfirmModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default PlatformAmenities;
