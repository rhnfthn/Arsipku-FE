import { reactive } from "vue";

const state = reactive({
  isOpen: false,
  type: "info",
  title: "",
  message: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  isAlert: false, // Tambahkan ini
  resolve: null as ((value: boolean) => void) | null,
});

export const Alert = {
  confirm(
    title: string,
    message: string,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDanger = false,
  ) {
    state.type = isDanger ? "danger" : "question";
    state.title = title;
    state.message = message;
    state.confirmText = confirmText;
    state.cancelText = cancelText;
    state.isAlert = false; // Mode Konfirmasi (2 tombol)
    state.isOpen = true;

    return new Promise<boolean>((res) => {
      state.resolve = res;
    });
  },

  warning(title: string, message: string) {
    state.type = "warning";
    state.title = title;
    state.message = message;
    state.confirmText = "OK";
    state.isAlert = true; // Mode Alert (1 tombol)
    state.isOpen = true;

    return new Promise<boolean>((res) => {
      state.resolve = res;
    });
  },
};

export const useAlertState = () => state;
