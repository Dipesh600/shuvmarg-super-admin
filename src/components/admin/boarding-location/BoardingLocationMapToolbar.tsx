import type { RefObject } from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BoardingLocationMapToolbar({
  inputRef, value, searching, onChange, onSearch, onCurrentLocation,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  searching: boolean;
  onChange: (value: string) => void;
  onSearch: () => void;
  onCurrentLocation: () => void;
}) {
  return (
    <form className="absolute left-3 right-3 top-3 z-10 flex gap-2 rounded-xl border border-white/10 bg-[#0a0a0a]/95 p-2 shadow-xl" onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
      <MapPin className="ml-2 mt-2 size-4 shrink-0 text-[#F97316]" />
      <Input ref={inputRef} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search landmark, counter, gate or place" className="h-9 border-0 bg-transparent text-sm focus-visible:ring-0" />
      <Button type="submit" size="sm" className="h-9 bg-[#F97316] text-black hover:bg-[#fb923c]" disabled={searching}>{searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}<span className="hidden sm:inline">Search</span></Button>
      <Button type="button" variant="outline" size="sm" className="h-9" onClick={onCurrentLocation}><Crosshair className="size-4" /><span className="hidden xl:inline">Current location</span></Button>
    </form>
  );
}
