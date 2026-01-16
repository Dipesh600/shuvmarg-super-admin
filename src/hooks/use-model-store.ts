import { create } from "zustand";

export type ModalType = "addUser" | "addAgent" | "addBusOwner" | "addBus" | "addCustomReport" | "editUser" | "editAgent" | "editBus" | "editBusOwner" | "editCommisionRate" | "editRefundProccess" | "editResolveDisputes" | "addRefundPolicy" | "editRefundPolicy";

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
