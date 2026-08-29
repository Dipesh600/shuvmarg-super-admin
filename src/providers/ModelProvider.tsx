import AddBusDialog from "@/components/models/create--bus-model";
import { AddAgentDialog } from "@/components/models/create-agent-model";
import { AddBusOwnerDialog } from "@/components/models/create-bus-owner-model";
import CustomReportDialog from "@/components/models/create-custom-report-model";
import { AddRefundPolicyDialog } from "@/components/models/create-refund-policy-model";

import { EditAgentDialog } from "@/components/models/edit-agent-model";
import { EditBusDialog } from "@/components/models/edit-bus-model";
import { EditBusOwnerDialog } from "@/components/models/edit-bus-owner-model";
import { EditCommissionRateDialog } from "@/components/models/edit-commission-model";
import { ReviewRefundDialog } from "@/components/models/edit-refund-model";
import { EditRefundPolicyDialog } from "@/components/models/edit-refund-policy-model";
import { ResolveDisputeDialog } from "@/components/models/edit-resolve-disputes";

import { ReuploadKycDocumentModal } from "@/components/models/reupload-kyc-document-model";
const ModelProvider = () => {
  return (
    <>
      <AddAgentDialog />
      <AddBusOwnerDialog />
      <AddBusDialog />
      <EditAgentDialog />
      <EditBusOwnerDialog />
      <EditBusDialog />
      <CustomReportDialog />
      <EditCommissionRateDialog />
      <ReviewRefundDialog/>
      <ResolveDisputeDialog/>
      <AddRefundPolicyDialog/>
      <EditRefundPolicyDialog/>
      <ReuploadKycDocumentModal />
    </>
  );
};
export default ModelProvider;
