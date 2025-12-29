import { api } from "./axios";

const getDashBoardData = async () => {
  const data = await api.get("/dashboard");
  return data.data;
};
export { getDashBoardData };