import { api } from "./axios"

export const getAllBookings = async () => {
    const { data } = await api.get("/booking/getAllBookings")
    return data;
}

export const getBookingStats = async () => {
    const { data } = await api.get("/booking/stats");
    return data;
};

export const getBookingById = async (id: string) => {
    const { data } = await api.get(`/booking/getBookingById/${id}`);
    return data;
}
