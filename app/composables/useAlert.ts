// composables/useAlert.ts
import { reactive } from "vue";

const state = reactive({
  isOpen: false,
  type: "info",
  title: "",
  message: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  isAlert: false,
  isLoading: false,
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
    state.isAlert = false;
    state.isLoading = false;
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
    state.isAlert = true;
    state.isLoading = false;
    state.isOpen = true;

    return new Promise<boolean>((res) => {
      state.resolve = res;
    });
  },

  // TAMBAHKAN INI: Fungsi untuk menutup alert manual
  close() {
    state.isOpen = false;
    state.isLoading = false;
  },
};

export const useAlertState = () => state;
