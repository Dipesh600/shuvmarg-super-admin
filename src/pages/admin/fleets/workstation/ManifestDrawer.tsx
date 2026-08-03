import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Users, IndianRupee, Ticket, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { useTripManifest } from "@/hooks/useFleetWorkstation";

interface ManifestDrawerProps {
    fleetId: string;
    tripId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManifestDrawer({ fleetId, tripId, open, onOpenChange }: ManifestDrawerProps) {
    const { data: response, isLoading, isError } = useTripManifest(fleetId, tripId || "", open && !!tripId);

    if (!tripId) return null;

    const manifestData = response?.data;
    const trip = manifestData?.trip;
    const bookings = manifestData?.bookings || [];
    const summary = manifestData?.summary || {};

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl flex flex-col gap-0 p-0 border-l border-border/40">
                {/* ── HEADER ────────────────────────────────────────────── */}
                <div className="px-6 py-4 border-b bg-muted/20">
                    <SheetHeader>
                        <SheetTitle className="text-xl font-black flex items-center gap-2">
                            Trip Manifest
                            {trip && (
                                <Badge variant="outline" className="text-[10px] tracking-wider uppercase ml-2">
                                    {trip.tripId}
                                </Badge>
                            )}
                        </SheetTitle>
                        <SheetDescription>
                            {trip ? (
                                <span className="flex items-center gap-2 mt-1">
                                    <span className="font-bold">{new Date(trip.tripDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
                                    <span className="opacity-40">•</span>
                                    <span>{trip.departureTime} → {trip.arrivalTime}</span>
                                    <span className="opacity-40">•</span>
                                    <span className="capitalize">{trip.status}</span>
                                </span>
                            ) : "Loading trip details..."}
                        </SheetDescription>
                    </SheetHeader>
                </div>

                {/* ── LOADING / ERROR STATE ─────────────────────────────── */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center flex-1 space-y-3 opacity-50">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm font-bold tracking-tight">Fetching passenger manifest...</p>
                    </div>
                )}

                {isError && (
                    <div className="flex flex-col items-center justify-center flex-1 space-y-3 text-destructive opacity-80">
                        <AlertCircle className="w-8 h-8" />
                        <p className="text-sm font-bold tracking-tight">Failed to load manifest</p>
                    </div>
                )}

                {/* ── CONTENT ───────────────────────────────────────────── */}
                {!isLoading && !isError && manifestData && (
                    <div className="flex flex-col flex-1 min-h-0">
                        
                        {/* Summary Bar */}
                        <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b bg-background shrink-0">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1">
                                    <Users className="w-3 h-3" /> Bookings
                                </p>
                                <p className="text-xl font-black tracking-tighter">{summary.totalBookings}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Boarded
                                </p>
                                <p className="text-xl font-black tracking-tighter text-white">{summary.boardedCount}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> Cancelled
                                </p>
                                <p className="text-xl font-black tracking-tighter text-white">{summary.cancelledCount}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1">
                                    <IndianRupee className="w-3 h-3" /> Revenue
                                </p>
                                <p className="text-xl font-black tracking-tighter">Rs. {summary.totalRevenue.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Booking List */}
                        <ScrollArea className="flex-1 p-6">
                            {bookings.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="font-bold">No bookings found</p>
                                    <p className="text-sm opacity-60">This trip currently has no passengers.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 pb-8">
                                    {bookings.map((booking: any) => (
                                        <BookingCard key={booking._id} booking={booking} />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

// ─── BOOKING CARD COMPONENT ──────────────────────────────────────────────────

function BookingCard({ booking }: { booking: any }) {
    const isCancelled = booking.status === "cancelled";
    const isNoShow = booking.status === "no_show";

    return (
        <Card className={`overflow-hidden transition-all ${isCancelled ? "border-white/10 bg-white/5" : isNoShow ? "border-white/10 bg-white/5" : ""}`}>
            {/* Card Header (ID & Status) */}
            <div className={`px-4 py-2 border-b flex items-center justify-between ${
                isCancelled ? "bg-white/5" : 
                isNoShow ? "bg-white/5" : 
                booking.boardingConfirmed ? "bg-white/5" : "bg-muted/30"
            }`}>
                <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 opacity-50" />
                    <span className="text-sm font-bold">{booking.ticketId}</span>
                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 ml-2">
                        {new Date(booking.bookedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                </div>
                <Badge variant={isCancelled ? "destructive" : "outline"} className={`uppercase text-[10px] font-black tracking-wider ${
                    booking.boardingConfirmed && !isCancelled ? "bg-white/5 text-white border-white/10" : 
                    isNoShow ? "bg-white/5 text-white border-white/10" : ""
                }`}>
                    {isCancelled ? "Cancelled" : booking.boardingConfirmed ? "Boarded" : isNoShow ? "No Show" : booking.status}
                </Badge>
            </div>

            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                    
                    {/* Left Column: Passengers & Journey */}
                    <div className="p-4 space-y-4">
                        {/* Passengers */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Passengers</p>
                            <div className="space-y-2">
                                {booking.passengerDetails?.map((p: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between bg-muted/30 rounded-md p-2 border border-border/40">
                                        <div>
                                            <p className="text-sm font-bold">{p.name}</p>
                                            <p className="text-[10px] font-medium text-muted-foreground uppercase">
                                                {p.age} Yrs • {p.gender}
                                                {p.idType && ` • ${p.idType.replace("_", " ")}`}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="">{p.seatNo}</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Boarding / Dropping */}
                        {(!isCancelled && (booking.boardingPoint?.name || booking.droppingPoint?.name)) && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Journey</p>
                                <div className="text-xs space-y-1.5 border-l-2 border-primary/20 pl-3">
                                    {booking.boardingPoint?.name && (
                                        <div className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                                            <div>
                                                <span className="font-bold">{booking.boardingPoint.name}</span>
                                                <span className="text-muted-foreground ml-1">@ {booking.boardingPoint.time || "TBD"}</span>
                                            </div>
                                        </div>
                                    )}
                                    {booking.droppingPoint?.name && (
                                        <div className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full border-2 border-primary mt-1 shrink-0 bg-background" />
                                            <div>
                                                <span className="font-bold">{booking.droppingPoint.name}</span>
                                                <span className="text-muted-foreground ml-1">@ {booking.droppingPoint.time || "TBD"}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Financials & Exceptions */}
                    <div className="p-4 space-y-4 bg-muted/10">
                        
                        {/* Payment / Financials */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Payment Details</p>
                            <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Original Fare</span>
                                    <span>Rs. {booking.originalAmount?.toLocaleString() || booking.totalAmount?.toLocaleString()}</span>
                                </div>
                                
                                {booking.discountAmount > 0 && (
                                    <div className="flex justify-between text-white">
                                        <span>Discount {booking.couponCode ? `(${booking.couponCode})` : ""}</span>
                                        <span>- Rs. {booking.discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                
                                {booking.smMoneyUsed > 0 && (
                                    <div className="flex justify-between text-white">
                                        <span>SM Money Used</span>
                                        <span>- Rs. {booking.smMoneyUsed.toLocaleString()}</span>
                                    </div>
                                )}
                                
                                <Separator className="my-1" />
                                
                                <div className="flex justify-between font-bold">
                                    <span>Gateway Paid</span>
                                    <span>Rs. {booking.gatewayAmount ? booking.gatewayAmount.toLocaleString() : booking.totalAmount?.toLocaleString()}</span>
                                </div>
                                
                                <div className="flex justify-between font-black">
                                    <span>Total Paid</span>
                                    <span>Rs. {booking.totalAmount?.toLocaleString()}</span>
                                </div>

                                <div className="mt-3 bg-background border rounded-md p-2 flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-muted-foreground">Method</span>
                                        <Badge variant="outline" className="text-[10px] uppercase font-black">{booking.paymentMethod || "OTHER"}</Badge>
                                    </div>
                                    {booking.transactionId && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground">Txn ID</span>
                                            <span className="text-xs">{booking.transactionId}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">Channel</span>
                                        <span className="text-xs">{booking.bookedVia || "APP"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cancellation / Refund Block */}
                        {isCancelled && (
                            <div className="mt-4 border border-white/10 bg-white/5 rounded-lg p-3 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Cancellation Info
                                </p>
                                <p className="text-sm font-medium">{booking.cancellationReason || "No reason provided"}</p>
                                
                                {booking.refundId && (
                                    <div className="mt-2 pt-2 border-t border-white/10 text-xs">
                                        <div className="flex justify-between font-bold">
                                            <span>Refund Amount</span>
                                            <span>Rs. {booking.refundId.refundAmount?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-muted-foreground">Status</span>
                                            <Badge variant="outline" className="text-[9px] uppercase border-white/10 text-white">
                                                {booking.refundId.status}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
