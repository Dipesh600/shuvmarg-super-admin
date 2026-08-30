import { create } from "zustand";

export type ModalType = "addAgent" | "addBusOwner" | "addBus" | "addCustomReport" | "editAgent" | "editBus" | "editBusOwner" | "editCommisionRate" | "editRefundProccess" | "editResolveDisputes" | "addRefundPolicy" | "editRefundPolicy" | "reuploadKycDocument" | "addUser" | "editUser";

type EditablePerson = { _id?: string; id?: string; name?: string; email?: string; phone?: string; address?: string; status?: string; agencyName?: string; location?: string; commission?: string; panNumber?: string; bankDetails?: string };
type EditableBus = { _id?: string; id?: string; type?: string; route?: string; capacity?: number; manufacturingYear?: number; chassisNumber?: string; engineNumber?: string; gpsDeviceId?: string; amenities?: string[]; status?: string };
type EditableOwner = EditablePerson & { busOwnerDoc?: { _id?: string; companyName?: string; taxRegistration?: { panNumber?: string | null; registrationNumber?: string | null }; bankDetails?: { bankName?: string | null; accountNumber?: string | null; accountHolderName?: string | null; branchName?: string | null; swiftCode?: string | null } } };
export interface ModalPayload {
  _id?: string; id?: string; type?: string; rate?: number; message?: string;
  data?: EditablePerson; agent?: EditablePerson; bus?: EditableBus; busOwner?: EditableOwner;
  documentType?: string; busOwnerId?: string; userId?: string | EditablePerson; documentLabel?: string;
  policyName?: string; refundPercentage?: number; deductionPercentage?: number; description?: string; minHours?: number; maxHours?: number | null; color?: string;
  status?: string; booking?: { ticketId?: string; paymentMethod?: string }; user?: { name?: string; phone?: string };
  route?: string; tripDate?: string; departureTime?: string; originalAmount?: number; cancellationCharge?: number;
  refundAmount?: number; reason?: string; processedAt?: string; completedAt?: string; refundGateway?: string; refundGatewayId?: string; remarks?: string;
  tripId?: { fromStopName?: string; toStopName?: string; tripDate?: string }; seats?: string[];
  totalAmount?: number; gateway?: string; transactionId?: string;
}

interface ModalStore {
  type: ModalType | null;
  isOpen: boolean;
  data: ModalPayload;
  onOpen: (type: ModalType, data?: ModalPayload) => void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
}));
