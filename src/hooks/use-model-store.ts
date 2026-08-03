import { create } from "zustand";

export type ModalType = "addAgent" | "addBusOwner" | "addBus" | "addCustomReport" | "editAgent" | "editBus" | "editBusOwner" | "editCommisionRate" | "editRefundProccess" | "editResolveDisputes" | "addRefundPolicy" | "editRefundPolicy" | "reuploadKycDocument" | "addUser" | "editUser";

interface ModalStore {
  type: ModalType | null;
  isOpen: boolean;
  data?:any
  onOpen: (type: ModalType,data?:any) => void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  onOpen: (type,data) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
}));
