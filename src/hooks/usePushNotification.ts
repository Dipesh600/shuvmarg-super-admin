import { api } from "@/api/axios";
import { useMutation } from "@tanstack/react-query";

const useSendAllNotification = () => {
  return useMutation({
    mutationKey: ["sendAllNotifications"],
    mutationFn: async ({
      title,
      description,
    }: {
      title: string;
      description: string;
    }) => {
      await api.post("/push/sendAll", {
        title,
        description,
      });
    },
  });
};

const useSendUserNotification = (userId:string) => {
  return useMutation({
    mutationKey: ["sendUserNotification", userId],
    mutationFn: async ({
      
      description,
      title,
    }: {
      title: string;
      description: string;
    }) => {
     await api.post("/push/sendOne", {
        userId,
        title,
        description,
      });
    },
  });
};
export { useSendAllNotification, useSendUserNotification };
