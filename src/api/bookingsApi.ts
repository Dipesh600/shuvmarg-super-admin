import { api } from "./axios"

export const getAllBookings = async () => {
    try {
        const { data } = await api.get("/booking/getAllBookings")
        return data;
    } catch (error) {
        throw error;
    }
}

export const getBookingStats = async () => {
    try {
        const { data } = await api.get("/booking/stats");
        return data;
    } catch (error) {
        throw error;
    }
};

export const getBookingById = async (id: string) => {
    try {
        const { data } = await api.get(`/booking/getBookingById/${id}`);
        return data;
    } catch (error) {
        throw error;
    }
}