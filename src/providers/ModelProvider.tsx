import AddBusDialog from "@/components/models/create--bus-model";
import { AddAgentDialog } from "@/components/models/create-agent-model";
import { AddBusOwnerDialog } from "@/components/models/create-bus-owner-model";
import CustomReportDialog from "@/components/models/create-custom-report-model";
import { AddUserDialog } from "@/components/models/create-user-model";
import { useState, useEffect } from "react";
const ModelProvider = () => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, [isMounted]);
  if (!isMounted) {
    return null;
  }
  return (
    <>
      <AddUserDialog />
      <AddAgentDialog />
      <AddBusOwnerDialog />
      <AddBusDialog />
      <CustomReportDialog />
    </>
  );
};
export default ModelProvider;
