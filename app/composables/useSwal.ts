// composables/useSwal.ts
import Swal from "sweetalert2";

export const useSwal = () => {
  // Konfigurasi dasar
  const baseConfig = {
    width: 400,
    padding: "20px",
    buttonsStyling: false,
    timer: 3000,
    timerProgressBar: true,
    confirmButtonText: "OK",
    customClass: {
      icon: "!my-3 !mx-auto",
      popup: "rounded-2xl",
      title: "!p-0 !m-0 !mb-2",
      htmlContainer: "!m-0 !p-0",
      actions: "!w-full !mt-5 !p-0 !gap-0", // Default: tombol full width
      confirmButton:
        "w-full bg-primary hover:bg-primary-600 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all",
    },
  };

  // Helper untuk Error
  const error = (title: string, message: string) => {
    return Swal.fire({
      ...baseConfig,
      icon: "error",
      title: `<span class="font-bold text-lg">${title}</span>`,
      html: `<div class="text-gray-500 text-sm">${message}</div>`,
    });
  };

  // Helper untuk Warning
  const warning = (title: string, message: string) => {
    return Swal.fire({
      ...baseConfig,
      icon: "warning",
      title: `<span class="font-bold text-lg">${title}</span>`,
      html: `<div class="text-gray-500 text-sm">${message}</div>`,
    });
  };

  // Helper untuk Success
  const success = (title: string, message: string) => {
    return Swal.fire({
      ...baseConfig,
      icon: "success",
      title: `<span class="font-bold text-lg">${title}</span>`,
      html: `<div class="text-gray-500 text-sm">${message}</div>`,
    });
  };

  const confirm = (
    title: string,
    message: string,
    confirmText: string = "Ya, Lanjutkan",
    cancelText: string = "Batal",
    isDestructive: boolean = false,
  ) => {
    return Swal.fire({
      ...baseConfig,
      timer: 0,
      timerProgressBar: false,
      icon: "question",
      title: `<span class="font-bold text-lg">${title}</span>`,
      html: `<div class="text-gray-500 text-sm">${message}</div>`,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      customClass: {
        ...baseConfig.customClass,
        actions: "!w-full !mt-6 !p-0 !flex !gap-3 !justify-center",
        confirmButton: `flex-1 ${
          isDestructive
            ? "bg-red-500 hover:bg-red-600 focus:ring-red-200"
            : "bg-primary hover:bg-primary-600 focus:ring-primary-200"
        } text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all focus:ring-4`,
        cancelButton:
          "flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg shadow-sm transition-all focus:ring-4 focus:ring-gray-100",
      },
    }).then((result) => {
      return result.isConfirmed; // hanya return true/false
    });
  };

  return {
    Alert: { error, warning, success, confirm },
  };
};
