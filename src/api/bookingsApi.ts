import { api } from "./axios"

export interface BookingRouteSummary {
    from?: string;
    to?: string;
    duration?: string;
    distance?: string;
}

export interface BookingBusSummary {
    _id: string;
    busName?: string;
    busNumber?: string;
    busType?: string;
}

export interface BookingTripSummary {
    _id: string;
    routeId?: BookingRouteSummary | null;
    busId?: BookingBusSummary | null;
    tripDate?: string;
    departureTime?: string;
    arrivalTime?: string;
    fromStopName?: string;
    toStopName?: string;
    shift?: string;
}

export interface BookingCustomerSummary {
    _id: string;
    profilePicture?: string;
    name?: string;
    phone?: string;
    email?: string;
}

export interface BookingCouponSummary {
    _id: string;
    couponCode?: string;
    title?: string;
    discountType?: "percentage" | "fixed";
    discountValue?: number;
    maxDiscountAmount?: number;
}

export interface BookingPointSummary {
    name?: string;
    time?: string;
}

export interface BookingPassenger {
    seatNo?: string;
    name?: string;
    age?: number;
    gender?: string;
    idType?: string;
    idNumber?: string;
}

export interface AdminBookingDetail {
    ticketId: string;
    status: string;
    bookedAt: string;
    tripId?: BookingTripSummary | null;
    userId?: BookingCustomerSummary | null;
    couponUsed?: BookingCouponSummary | null;
    discountAmount?: number;
    smMoneyUsed?: number;
    totalAmount?: number;
    originalAmount?: number;
    gatewayAmount?: number;
    seats?: string[];
    passengerDetails?: BookingPassenger[];
    boardingPoint?: BookingPointSummary | null;
    droppingPoint?: BookingPointSummary | null;
    bookedDepartureTime?: string;
    bookedArrivalTime?: string;
    bookedFrom?: string;
    bookedTo?: string;
    paymentMethod: string;
    bookedVia?: string;
    boardingConfirmed?: boolean;
    transactionId?: string;
    couponCode?: string;
    cancellationReason?: string;
    cancelledBy?: string;
}

export interface BookingDetailResponse {
    success?: boolean;
    data?: AdminBookingDetail | null;
    message?: string;
}

export const getAllBookings = async () => {
    const { data } = await api.get("/booking/getAllBookings")
    return data;
}

export const getBookingStats = async () => {
    const { data } = await api.get("/booking/stats");
    return data;
};

export const getBookingById = async (id: string): Promise<BookingDetailResponse> => {
    const { data } = await api.get<BookingDetailResponse>(`/booking/getBookingById/${id}`);
    return data;
}
