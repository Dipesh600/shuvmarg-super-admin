import { useState, useEffect } from "react";
import { Smartphone, Globe, Paperclip } from "lucide-react";

interface PreviewData {
  couponCode: string;
  title: string;
  description: string;
  category?: string;
  imageUrl?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validTo: string;
  perUserLimit: number;
  designConfig?: {
    edges?: {
      top?: "smooth" | "ticket" | "torn" | "jagged";
      bottom?: "smooth" | "ticket" | "torn" | "jagged";
      left?: "smooth" | "ticket" | "torn" | "jagged";
      right?: "smooth" | "ticket" | "torn" | "jagged";
    };
    typography?: {
      titleAlignment?: "left" | "center" | "right";
      descAlignment?: "left" | "center" | "right";
      codeAlignment?: "left" | "center" | "right";
    };
    imageConfig?: {
      scale?: number;
      offsetX?: number;
      offsetY?: number;
      fit?: "cover" | "contain" | "fill";
    };
  };
}

const getEdgeConfig = (type: string, edge: 'top'|'bottom'|'left'|'right') => {
  let gap = 0, mask = '', size = '', pos = '', repeat = '';
  const isY = edge === 'left' || edge === 'right';
  
  if (type === 'ticket') {
    gap = 6;
    if (isY) {
      mask = `radial-gradient(circle at ${edge==='left'?'0px':'6px'} 12px, transparent 6px, black 6.5px)`;
      size = `6px 24px`;
      pos = `${edge==='left'?'0px':'100%'} 0px`;
      repeat = `repeat-y`;
    } else {
      mask = `radial-gradient(circle at 12px ${edge==='top'?'0px':'6px'}, transparent 6px, black 6.5px)`;
      size = `24px 6px`;
      pos = `0px ${edge==='top'?'0px':'100%'}`;
      repeat = `repeat-x`;
    }
  } else if (type === 'torn') {
    gap = 8;
    if (isY) {
      mask = `radial-gradient(circle at ${edge==='left'?'0px':'8px'} 16px, transparent 8px, black 8.5px)`;
      size = `8px 32px`;
      pos = `${edge==='left'?'0px':'100%'} 0px`;
      repeat = `repeat-y`;
    } else {
      mask = `radial-gradient(circle at 16px ${edge==='top'?'0px':'8px'}, transparent 8px, black 8.5px)`;
      size = `32px 8px`;
      pos = `0px ${edge==='top'?'0px':'100%'}`;
      repeat = `repeat-x`;
    }
  } else if (type === 'jagged') {
    gap = 4;
    if (isY) {
      mask = `radial-gradient(circle at ${edge==='left'?'0px':'4px'} 8px, transparent 4px, black 4.5px)`;
      size = `4px 16px`;
      pos = `${edge==='left'?'0px':'100%'} 0px`;
      repeat = `repeat-y`;
    } else {
      mask = `radial-gradient(circle at 8px ${edge==='top'?'0px':'4px'}, transparent 4px, black 4.5px)`;
      size = `16px 4px`;
      pos = `0px ${edge==='top'?'0px':'100%'}`;
      repeat = `repeat-x`;
    }
  }
  return { gap, mask, size, pos, repeat };
};

const generateMaskStyle = (edges: any) => {
  if (!edges) return {};
  const e = {
    top: edges.top || 'smooth',
    bottom: edges.bottom || 'smooth',
    left: edges.left || 'smooth',
    right: edges.right || 'smooth'
  };
  
  if (e.top === 'smooth' && e.bottom === 'smooth' && e.left === 'smooth' && e.right === 'smooth') {
    return {};
  }

  const masks = [];
  const sizes = [];
  const positions = [];
  const repeats = [];
  
  const tc = getEdgeConfig(e.top, 'top');
  const bc = getEdgeConfig(e.bottom, 'bottom');
  const lc = getEdgeConfig(e.left, 'left');
  const rc = getEdgeConfig(e.right, 'right');
  
  // Base center
  masks.push(`linear-gradient(black, black)`);
  sizes.push(`calc(100% - ${lc.gap + rc.gap}px) calc(100% - ${tc.gap + bc.gap}px)`);
  positions.push(`${lc.gap}px ${tc.gap}px`);
  repeats.push(`no-repeat`);
  
  if (tc.gap > 0) { masks.push(tc.mask); sizes.push(tc.size); positions.push(tc.pos); repeats.push(tc.repeat); }
  if (bc.gap > 0) { masks.push(bc.mask); sizes.push(bc.size); positions.push(bc.pos); repeats.push(bc.repeat); }
  if (lc.gap > 0) { masks.push(lc.mask); sizes.push(lc.size); positions.push(lc.pos); repeats.push(lc.repeat); }
  if (rc.gap > 0) { masks.push(rc.mask); sizes.push(rc.size); positions.push(rc.pos); repeats.push(rc.repeat); }
  
  const maskImage = masks.join(', ');
  const maskSize = sizes.join(', ');
  const maskPosition = positions.join(', ');
  const maskRepeat = repeats.join(', ');
  
  return {
    WebkitMaskImage: maskImage,
    WebkitMaskSize: maskSize,
    WebkitMaskPosition: maskPosition,
    WebkitMaskRepeat: maskRepeat,
    maskImage: maskImage,
    maskSize: maskSize,
    maskPosition: maskPosition,
    maskRepeat: maskRepeat,
  };
};

interface CouponLivePreviewProps {
  data: PreviewData;
}

const UnifiedPreview = ({ data, scale = 1 }: { data: PreviewData; scale?: number }) => {
  const isOperator = data.category === "Operator Offer";
  const isExclusive = data.category === "Exclusive";

  const design = data.designConfig || {};

  let maskStyle = {};
  
  // Default values based on category logic if edges are not defined
  if (!design.edges) {
    if (isExclusive) {
      maskStyle = generateMaskStyle({ top: 'torn', bottom: 'torn', left: 'torn', right: 'torn' });
    } else if (isOperator) {
      maskStyle = generateMaskStyle({ top: 'smooth', bottom: 'smooth', left: 'ticket', right: 'ticket' });
    } else {
      maskStyle = generateMaskStyle({ top: 'smooth', bottom: 'smooth', left: 'ticket', right: 'ticket' }); // Default 'stamp-edge'
    }
  } else {
    maskStyle = generateMaskStyle(design.edges);
  }

  const bgClass = isOperator ? "bg-white" : "bg-[#F8F1E3]";

  // Image Config
  const imgConf = design.imageConfig || {};
  const imgFitClass = imgConf.fit === "cover" ? "object-cover" : 
                      imgConf.fit === "fill" ? "object-fill" : "object-contain";
  // scale is stored as 0-300 (100 = 1x), offsets as -50 to 50 (%)
  const imgScale = (imgConf.scale ?? 100) / 100;
  const imgOffsetX = imgConf.offsetX ?? 0;
  const imgOffsetY = imgConf.offsetY ?? 0;

  // Typography Config
  const typo = design.typography || {};
  const titleAlignClass = typo.titleAlignment === 'center' ? 'text-center' : typo.titleAlignment === 'right' ? 'text-right' : 'text-left';
  const descAlignClass = typo.descAlignment === 'center' ? 'text-center' : typo.descAlignment === 'right' ? 'text-right' : 'text-left';
  const codeAlignClass = typo.codeAlignment === 'center' ? 'self-center' : typo.codeAlignment === 'right' ? 'self-end' : 'self-start';
  
  const fallbackImage = isExclusive ? "/images/offers/gift.webp" : isOperator ? "/images/offers/ticket.webp" : "/images/offers/bus.webp";
  
  const [imgError, setImgError] = useState(false);
  
  useEffect(() => {
    setImgError(false);
  }, [data.imageUrl, fallbackImage]);

  const displayImageUrl = (!data.imageUrl || imgError) ? null : data.imageUrl;

  const title = data.title || "Offer Title";
  const code = data.couponCode || "YOURCODE";
  const desc = data.description || "Offer description will appear here";

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "center center", width: "100%", maxWidth: "450px" }}>
      <div className="relative group w-full aspect-[1.75/1] min-h-[220px] shrink-0 hover:z-50 cursor-pointer">
        {/* Orange background layer */}
        <div className="absolute inset-0 rounded-2xl drop-shadow-xl z-0 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-[1.02]">
          <div className="absolute inset-0 orange-grid-bg rounded-2xl"></div>
        </div>
        
        {/* Main white/cream card */}
        <div className={`relative ${bgClass} rounded-2xl h-full p-5 flex items-center justify-between shadow-md overflow-hidden transition-transform duration-300 group-hover:-rotate-2 group-hover:-translate-x-1.5 group-hover:-translate-y-1.5`} style={maskStyle}>
           <div className="absolute inset-0 opacity-50 mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'url(/images/image.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
           <div className="absolute top-0 bottom-0 right-[45%] w-px border-l-2 border-dashed border-gray-300 opacity-60 z-20" />
           <Paperclip className="absolute -top-3 right-[calc(45%-14px)] w-8 h-8 text-gray-400 drop-shadow-sm z-30 -rotate-12" />
           
           <div className={`relative z-10 flex flex-col w-[55%] pr-2 h-full justify-center items-stretch`}>
             {isExclusive ? (
               <span className={`bg-[#ff7828] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2 shrink-0 self-start`}>{data.category || "Exclusive"}</span>
             ) : (
               <span className={`bg-[#ff7828]/10 text-[#ff7828] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2 shrink-0 self-start`}>{data.category || "General Offer"}</span>
             )}
             
             <h3 className={`text-[#015db8] text-[20px] sm:text-[24px] font-black font-display uppercase leading-[1.05] tracking-tight mb-2 line-clamp-2 ${titleAlignClass}`} title={title}>{title}</h3>
             <p className={`text-gray-600 text-[10px] sm:text-xs font-medium mb-3 line-clamp-2 ${descAlignClass}`} title={desc}>{desc}</p>
             
             <div className={`inline-flex items-center border border-dashed border-[#ff7828]/50 px-2 py-1 rounded-md bg-white ${codeAlignClass}`}>
               <span className="text-gray-500 font-medium text-[10px] sm:text-xs mr-2">Code</span>
               <span className="text-[#ff7828] font-bold text-xs sm:text-sm">{code}</span>
             </div>
           </div>
           
           <div className="relative z-10 w-[45%] flex flex-col justify-between items-end h-full pt-1">
             <div className="w-full flex justify-center items-center relative flex-grow pl-2">
               {displayImageUrl ? (
                 <img 
                   key={displayImageUrl} 
                   src={displayImageUrl} 
                   alt="Offer visual" 
                   className={`w-full h-full ${imgFitClass} drop-shadow-md`} 
                   style={{
                     transform: `scale(${imgScale}) translate(${imgOffsetX}%, ${imgOffsetY}%)`,
                     transformOrigin: 'center center',
                     transition: 'transform 0.15s ease',
                   }}
                   onError={() => setImgError(true)} 
                 />
               ) : (
                 <span className="text-[#015db8] text-xl md:text-2xl font-black uppercase tracking-widest mt-4">
                   Offer
                 </span>
               )}
             </div>
              <p className="text-[9px] sm:text-[10px] font-medium tracking-wide mt-2 text-right text-gray-400">
                * T&C apply
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main exported component ─────────────────────────────────────────────────
export const CouponLivePreview = ({ data }: CouponLivePreviewProps) => {
  const [tab, setTab] = useState<"mobile" | "web">("mobile");

  return (
    <div className="flex flex-col h-full relative">
      <style dangerouslySetInnerHTML={{__html: `
        .orange-grid-bg {
          background-color: #ff7828;
          background-image: linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
          background-size: 14px 14px;
          background-position: center;
        }
      `}} />

      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 bg-[#121212]/50 border border-white/5 rounded-xl mb-6 self-start">
        <button
          onClick={() => setTab("mobile")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "mobile"
              ? "bg-[#D3D925] text-[#121212] font-bold shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Mobile
        </button>
        <button
          onClick={() => setTab("web")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "web"
              ? "bg-[#D3D925] text-[#121212] font-bold shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Globe className="w-4 h-4" />
          Website
        </button>
      </div>

      {/* Preview label */}
      <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live Preview — updates as you type
      </p>

      {/* Preview Container */}
      <div className="flex items-center justify-center flex-1 min-h-[250px] w-full border border-dashed border-white/10 rounded-2xl bg-black/20 p-4">
        {tab === "mobile" ? (
          <UnifiedPreview data={data} scale={0.85} />
        ) : (
          <UnifiedPreview data={data} scale={1} />
        )}
      </div>

      {/* Context hint */}
      <p className="text-[11px] text-muted-foreground text-center mt-4">
        {tab === "mobile"
          ? "Preview showing how coupon appears on mobile app screens"
          : "Preview showing how coupon appears on the main website"}
      </p>
    </div>
  );
};

export default CouponLivePreview;
