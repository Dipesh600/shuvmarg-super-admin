import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { fetchDocumentAsBlob } from "@/api/kycApi";

interface DocumentViewerModalProps {
  /** S3 object key returned from the API (e.g. "owners/.../kyc/.../file.pdf") */
  s3Key: string | null;
  /** Human-readable label shown in the dialog title */
  title?: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Secure inline document viewer.
 *
 * Flow:
 *   1. On open, fetches the document from the backend proxy as a Blob.
 *   2. Creates a temporary object URL valid only for this browser session.
 *   3. Renders PDFs in an <iframe> and images in an <img>.
 *   4. Revokes the object URL on close — no trace left.
 *
 * The raw S3 presigned URL NEVER reaches the browser.
 */
export default function DocumentViewerModal({
  s3Key,
  title = "Document Viewer",
  open,
  onClose,
}: DocumentViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("application/pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgRotation, setImgRotation] = useState(0);
  const [imgZoom, setImgZoom] = useState(1);
  const prevBlobUrl = useRef<string | null>(null);

  // Load the document whenever the modal opens with a new key
  useEffect(() => {
    if (!open || !s3Key) return;

    setLoading(true);
    setError(null);
    setBlobUrl(null);
    setImgRotation(0);
    setImgZoom(1);

    fetchDocumentAsBlob(s3Key).then((result) => {
      setLoading(false);
      if (!result) {
        setError("Failed to load document. Please try again.");
        return;
      }

      // MIME type comes from the actual HTTP Content-Type header (set by the proxy)
      setMimeType(result.mimeType);
      prevBlobUrl.current = result.blobUrl;
      setBlobUrl(result.blobUrl);
    });

    // Revoke the blob URL when the key changes or modal closes
    return () => {
      if (prevBlobUrl.current) {
        URL.revokeObjectURL(prevBlobUrl.current);
        prevBlobUrl.current = null;
      }
    };
  }, [open, s3Key]);

  const handleClose = () => {
    // Revoke immediately on close
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setError(null);
    onClose();
  };

  const handleDownload = () => {
    if (!blobUrl || !s3Key) return;
    const link = document.createElement("a");
    link.href = blobUrl;
    const filename = s3Key.split("/").pop() ?? "document";
    link.download = filename;
    link.click();
  };

  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
        {/* ── Header ── */}
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-bold truncate pr-4">
            {title}
          </DialogTitle>
          <div className="flex items-center gap-2 flex-shrink-0 mr-8">
            {isImage && blobUrl && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  title="Zoom out"
                  onClick={() => setImgZoom((z) => Math.max(0.3, z - 0.2))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-10 text-center">
                  {Math.round(imgZoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  title="Zoom in"
                  onClick={() => setImgZoom((z) => Math.min(3, z + 0.2))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  title="Rotate"
                  onClick={() => setImgRotation((r) => (r + 90) % 360)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </>
            )}
            {blobUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 rounded-lg text-xs"
                onClick={handleDownload}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden relative bg-muted/30">
          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">Loading document…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* PDF viewer — uses <embed> (not <iframe>) so Brave shields don't block blob URLs */}
          {!loading && !error && blobUrl && isPdf && (
            <embed
              src={blobUrl}
              type="application/pdf"
              className="w-full h-full border-0"
              title={title}
            />
          )}

          {/* Image viewer */}
          {!loading && !error && blobUrl && isImage && (
            <div className="absolute inset-0 flex items-center justify-center overflow-auto p-4">
              <img
                src={blobUrl}
                alt={title}
                style={{
                  transform: `rotate(${imgRotation}deg) scale(${imgZoom})`,
                  transition: "transform 0.2s ease",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  borderRadius: "8px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                }}
              />
            </div>
          )}

          {/* Unknown file type fallback */}
          {!loading && !error && blobUrl && !isPdf && !isImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <p className="text-sm">Preview not available for this file type.</p>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download to view
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
