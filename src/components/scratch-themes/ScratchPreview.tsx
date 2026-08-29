import { useRef, useEffect, useState, useCallback } from "react";

/**
 * ScratchPreview — Interactive HTML5 Canvas scratch preview
 *
 * Replicates the Flutter Scratcher widget behavior:
 *   - Circular brush (30px equivalent at mobile scale, 40px at desktop)
 *   - 50% threshold → auto-reveal with cross-fade
 *   - Shows "Cashback Rs. XX" underneath
 *
 * The admin can scratch the preview to see exactly what users experience.
 * Click "Reset" to restore the overlay.
 */
interface ScratchPreviewProps {
  /** Presigned URL or local blob URL for the overlay texture image */
  imageUrl: string | null;
  /** Preview cashback amount displayed under the scratch layer */
  amount?: number;
  /** Card width in pixels */
  width?: number;
  /** Card height in pixels */
  height?: number;
}

function ScratchPreviewInstance({
  imageUrl,
  amount = 15,
  width = 300,
  height = 200,
}: ScratchPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const isDrawingRef = useRef(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const overlayReadyRef = useRef(false);

  // Brand colors matching the mobile app
  const ACCENT_LIME = "#D3D925";
  const CARD_BG = "#00564E";
  const PRIMARY_BG = "#003D38";
  const TEXT_SECONDARY = "#B7C7C3";
  const BRUSH_SIZE = 40;
  const THRESHOLD = 50; // Percent scratched to auto-reveal

  /**
   * Draw the initial overlay (image or solid lime fallback).
   */
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset composite operation
    ctx.globalCompositeOperation = "source-over";

    if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth > 0) {
      // Draw the uploaded texture as overlay
      ctx.drawImage(imageRef.current, 0, 0, width, height);

      // Draw "Scratch Here" hint on top of the image
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 14px Inter, Satoshi, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✦ Scratch Here ✦", width / 2, height / 2 + 5);
    } else {
      // Solid lime fallback (matches mobile default)
      ctx.fillStyle = ACCENT_LIME;
      ctx.fillRect(0, 0, width, height);

      // "Scratch Here" hint
      ctx.fillStyle = PRIMARY_BG;
      ctx.font = "bold 14px Inter, Satoshi, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✦ Scratch Here ✦", width / 2, height / 2 + 5);
    }

    overlayReadyRef.current = true;
  }, [width, height, ACCENT_LIME, PRIMARY_BG]);

  /**
   * Load the texture image and draw overlay once loaded.
   */
  useEffect(() => {
    overlayReadyRef.current = false;

    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageRef.current = img;
        drawOverlay();
      };
      img.onerror = () => {
        // Image failed to load — use fallback
        imageRef.current = null;
        drawOverlay();
      };
      img.src = imageUrl;
    } else {
      imageRef.current = null;
      drawOverlay();
    }
  }, [imageUrl, drawOverlay]);

  /**
   * Calculate what percentage of the canvas has been scratched.
   */
  const calculateScratchPercent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let transparent = 0;
    const total = width * height;

    // Check alpha channel (every 4th value)
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }

    return (transparent / total) * 100;
  }, [width, height]);

  /**
   * Scratch at the given position — erase the overlay using destination-out.
   */
  const scratch = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !overlayReadyRef.current || isRevealed) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, BRUSH_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();

      // Throttle percentage calculation (expensive on large canvases)
      const pct = calculateScratchPercent();
      setScratchPercent(Math.round(pct));

      if (pct >= THRESHOLD && !isRevealed) {
        setIsRevealed(true);
      }
    },
    [isRevealed, calculateScratchPercent]
  );

  /**
   * Get canvas-relative coordinates from a mouse/touch event.
   */
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [width, height]
  );

  // ── Mouse handlers ──────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    isDrawingRef.current = true;
    const { x, y } = getCanvasCoords(e);
    scratch(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    const { x, y } = getCanvasCoords(e);
    scratch(x, y);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  // ── Touch handlers ──────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const { x, y } = getCanvasCoords(e);
    scratch(x, y);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const { x, y } = getCanvasCoords(e);
    scratch(x, y);
  };

  const handleTouchEnd = () => {
    isDrawingRef.current = false;
  };

  /**
   * Reset the preview — redraw the overlay fresh.
   */
  const reset = () => {
    setIsRevealed(false);
    setScratchPercent(0);
    drawOverlay();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Scratch card container — mimics mobile card shape */}
      <div
        className="relative overflow-hidden select-none"
        style={{
          width,
          height,
          borderRadius: 24,
          background: CARD_BG,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: `0 10px 40px rgba(0, 86, 78, 0.25)`,
        }}
      >
        {/* Underlay: the cashback reveal content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-0"
          style={{
            opacity: isRevealed ? 1 : 0.2,
            transition: "opacity 300ms ease-out",
          }}
        >
          <span
            style={{
              color: TEXT_SECONDARY,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: 0.5,
            }}
          >
            Cashback
          </span>
          <span
            style={{
              color: ACCENT_LIME,
              fontSize: 28,
              fontWeight: 800,
              marginTop: 4,
            }}
          >
            Rs. {amount}
          </span>
        </div>

        {/* Canvas overlay (the scratchable layer) */}
        {!isRevealed && (
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
            style={{ width: "100%", height: "100%", touchAction: "none" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        )}

        {/* Revealed state overlay */}
        {isRevealed && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{
                background: "rgba(211, 217, 37, 0.15)",
                color: ACCENT_LIME,
              }}
            >
              ✓ Revealed
            </span>
          </div>
        )}
      </div>

      {/* Controls below the preview */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">
          {scratchPercent}% scratched
        </span>
        <button
          onClick={reset}
          className="text-xs text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default function ScratchPreview(props: ScratchPreviewProps) {
  return <ScratchPreviewInstance key={props.imageUrl || "default-overlay"} {...props} />;
}
