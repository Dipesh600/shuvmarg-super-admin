import { api } from "./axios";

// get all agents
const getAllAgents = async () => {
  const { data } = await api.get("/getAllAgents");
  return data;
};

// get agent by id
const getAgentById = async (userId: string) => {
  const { data } = await api.post("/getAgentDetails", {
    id: userId,
  });
  return data;
};

// get agent dashboard data
const getAgentDashboardData = async () => {
  const { data } = await api.get("/agentDashboard");
  return data;
};

export { getAgentById, getAllAgents, getAgentDashboardData };