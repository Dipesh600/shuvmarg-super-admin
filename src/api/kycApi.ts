import { api } from "./axios";

export const getAllKyc = async () => {
  try {
    const { data } = await api.get("/kyc/unified-list");
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const getOwnerKycDetail = async (busOwnerId:string) => {
  try {
    const {data}= await api.post("/getBusOwnerKycDetails",{
      id:busOwnerId
    });
    return data;
  } catch (error) {
    console.log(error)
  }
}

export const getOwnerDetail = async(busOwnerId:string)=>{
  try {
    const {data} = await api.post("/getBusOwnerDetails",{
      id:busOwnerId
    });
    return data;
  } catch (error) {
    console.log(error);
  }
}