import { api } from "./axios";

export const getAllFleets = async()=>{
    try {
        const {data} = await api.get("/fleet/getAllFleet");
        return data;
    } catch (error) {
        console.error(error);
    }
}