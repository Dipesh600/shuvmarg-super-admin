import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Plus,
  Trash2,
  Upload,
  Palette,
  RefreshCw,
  ImagePlus,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ScratchPreview from "./ScratchPreview";
import {
  listScratchThemes,
  createScratchTheme,
  updateScratchTheme,
  toggleScratchTheme,
  deleteScratchTheme,
  replaceScratchThemeImage,
  type ScratchTheme,
  type ScratchThemeListResponse,
} from "@/api/scratchThemeApi";

/**
 * ScratchThemeManager — Admin panel component for managing scratch card
 * overlay themes. Shows a gallery of themes, an interactive preview,
 * and controls for creating, editing, toggling, and deleting themes.
 */
export default function ScratchThemeManager() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // ── State ─────────────────────────────────────────────────────────
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScratchTheme | null>(null);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newWeight, setNewWeight] = useState(10);
  const [newActive, setNewActive] = useState(true);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);

  // Preview / edit state
  const [selectedTheme, setSelectedTheme] = useState<ScratchTheme | null>(null);
  const [editingWeight, setEditingWeight] = useState<string | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);

  // ── Data fetching ─────────────────────────────────────────────────
  const {
    data: themeData,
    isLoading,
    refetch,
  } = useQuery<ScratchThemeListResponse>({
    queryKey: ["scratchThemes"],
    queryFn: listScratchThemes,
    staleTime: 30 * 1000,
  });

  const themes = themeData?.data ?? [];
  const meta = themeData?.meta;

  // ── Mutations ─────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => {
      if (!newFile) throw new Error("Image file is required");
      return createScratchTheme(newName, newWeight, newActive, newFile);
    },
    onSuccess: (data) => {
      toast({ title: "Theme Created", description: `"${data.name}" is now live.` });
      queryClient.invalidateQueries({ queryKey: ["scratchThemes"] });
      resetCreateForm();
    },
    onError: (err: Error) => {
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleScratchTheme,
    onSuccess: (data) => {
      toast({
        title: data.isActive ? "Theme Activated" : "Theme Paused",
        description: `"${data.name}" is now ${data.isActive ? "in rotation" : "paused"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["scratchThemes"] });
    },
    onError: (err: Error) => {
      toast({ title: "Toggle Failed", description: err.message, variant: "destructive" });
    },
  });

  const weightMutation = useMutation({
    mutationFn: ({ id, weight }: { id: string; weight: number }) =>
      updateScratchTheme(id, { weight }),
    onSuccess: () => {
      toast({ title: "Weight Updated" });
      queryClient.invalidateQueries({ queryKey: ["scratchThemes"] });
      setEditingWeight(null);
    },
    onError: (err: Error) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
  });

  const replaceMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      replaceScratchThemeImage(id, file),
    onSuccess: (data) => {
      toast({ title: "Image Replaced", description: `"${data.name}" texture updated.` });
      queryClient.invalidateQueries({ queryKey: ["scratchThemes"] });
      setReplaceTarget(null);
    },
    onError: (err: Error) => {
      toast({ title: "Replace Failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteScratchTheme,
    onSuccess: () => {
      toast({ title: "Theme Deleted", description: `"${deleteTarget?.name}" has been removed.` });
      queryClient.invalidateQueries({ queryKey: ["scratchThemes"] });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      if (selectedTheme?.id === deleteTarget?.id) setSelectedTheme(null);
    },
    onError: (err: Error) => {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────
  const resetCreateForm = () => {
    setCreateDialogOpen(false);
    setNewName("");
    setNewWeight(10);
    setNewActive(true);
    setNewFile(null);
    setNewPreviewUrl(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFile(file);
      setNewPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleReplaceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && replaceTarget) {
      replaceMutation.mutate({ id: replaceTarget, file });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Scratch Card Themes
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage overlay textures for scratch-to-reveal cards. Active themes are
            randomly assigned to new bookings based on their probability weight.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Theme
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      {meta && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Total
                </span>
                <Palette className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold mt-1">{meta.totalThemes}</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Active
                </span>
                <Sparkles className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold mt-1 text-emerald-500">{meta.activeThemes}</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Weight Pool
                </span>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold mt-1">{meta.totalActiveWeight}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading themes...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && themes.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-16 gap-3 text-center">
            <Palette className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm font-medium">No themes yet</p>
            <p className="text-xs text-muted-foreground max-w-[360px]">
              All scratch cards currently use the default solid lime overlay.
              Add a theme to start showing custom textures to users.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 mt-2"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create First Theme
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Theme Grid + Preview Panel */}
      {!isLoading && themes.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Theme Gallery */}
          <div className="space-y-3">
            {themes.map((theme) => (
              <Card
                key={theme.id}
                className={`bg-muted/20 border-border/50 cursor-pointer transition-all hover:bg-muted/40 ${
                  selectedTheme?.id === theme.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedTheme(theme)}
              >
                <CardContent className="py-4 px-5">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div
                      className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-border/50"
                      style={{
                        background: theme.imageUrl
                          ? `url(${theme.imageUrl}) center/cover`
                          : "#D3D925",
                      }}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">
                          {theme.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            theme.isActive
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]"
                              : "bg-muted text-muted-foreground border-border text-[10px]"
                          }
                        >
                          {theme.isActive ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Weight: <strong>{theme.weight}</strong>
                        </span>
                        {theme.isActive && (
                          <span className="text-xs text-muted-foreground">
                            Probability: <strong>{theme.probability}%</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Weight editor */}
                      {editingWeight === theme.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={1000}
                            defaultValue={theme.weight}
                            className="w-16 h-7 rounded border border-input bg-transparent px-2 text-xs text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = Math.max(1, parseInt((e.target as HTMLInputElement).value) || 1);
                                weightMutation.mutate({ id: theme.id, weight: val });
                              }
                              if (e.key === "Escape") setEditingWeight(null);
                            }}
                            onBlur={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              if (val !== theme.weight) {
                                weightMutation.mutate({ id: theme.id, weight: val });
                              } else {
                                setEditingWeight(null);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingWeight(theme.id);
                          }}
                        >
                          edit weight
                        </button>
                      )}

                      {/* Toggle */}
                      <Switch
                        checked={theme.isActive}
                        onCheckedChange={() => toggleMutation.mutate(theme.id)}
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Replace image */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Replace image"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplaceTarget(theme.id);
                          replaceFileInputRef.current?.click();
                        }}
                      >
                        <ImagePlus className="h-3.5 w-3.5" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        title="Delete theme"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(theme);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Interactive Preview Panel */}
          <Card className="bg-muted/30 border-border/50 h-fit sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Interactive Preview</CardTitle>
              <CardDescription className="text-xs">
                Scratch below to preview exactly how users will see this theme
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 pb-6">
              <ScratchPreview
                imageUrl={selectedTheme?.imageUrl ?? null}
                amount={15}
              />
              <div className="text-center">
                <p className="text-xs font-medium">
                  {selectedTheme ? selectedTheme.name : "Default (Solid Lime)"}
                </p>
                {selectedTheme && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {selectedTheme.isActive
                      ? `${selectedTheme.probability}% chance per booking`
                      : "Paused — not in rotation"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleReplaceFileSelect}
      />

      {/* ════════════════════════════════════════════════════════════════
          CREATE DIALOG
          ════════════════════════════════════════════════════════════ */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => !open && resetCreateForm()}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Create New Theme
            </DialogTitle>
            <DialogDescription>
              Upload an overlay texture for scratch cards. The image will be
              compressed and served as a WebP for fast mobile loading.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Theme name */}
            <div className="space-y-2">
              <Label htmlFor="theme-name">Theme Name</Label>
              <input
                id="theme-name"
                type="text"
                placeholder="e.g. Dashain Special, Gold Ticket..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="theme-weight">Probability Weight</Label>
              <div className="flex items-center gap-3">
                <input
                  id="theme-weight"
                  type="range"
                  min={1}
                  max={100}
                  value={newWeight}
                  onChange={(e) => setNewWeight(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-mono w-8 text-center">{newWeight}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Higher weight = higher chance of being assigned. The exact
                probability depends on all active themes' total weight.
              </p>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Active on Creation</Label>
                <p className="text-[11px] text-muted-foreground">
                  Start assigning to new bookings immediately
                </p>
              </div>
              <Switch checked={newActive} onCheckedChange={setNewActive} />
            </div>

            {/* Image upload + preview */}
            <div className="space-y-2">
              <Label>Overlay Texture</Label>
              {newPreviewUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <ScratchPreview imageUrl={newPreviewUrl} amount={15} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewFile(null);
                      setNewPreviewUrl(null);
                    }}
                  >
                    Remove & Choose Another
                  </Button>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload image
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 mt-1">
                    JPEG, PNG, WebP • Max 5 MB
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetCreateForm}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newName.trim() || !newFile || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Theme"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION DIALOG
          ════════════════════════════════════════════════════════════ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Theme
            </DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <strong>"{deleteTarget?.name}"</strong> and remove its image from
              storage. Existing scratch cards that used this theme will fall back
              to the default solid color.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
