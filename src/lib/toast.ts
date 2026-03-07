"use client";

import { toast } from "sonner";

export const toastError = (message: string) => {
  toast.error(message, {
    duration: 5000,
    position: "top-right",
  });
};

export const toastSuccess = (message: string) => {
  toast.success(message, {
    duration: 4000,
    position: "top-right",
  });
};

export const toastWarning = (message: string) => {
  toast.warning(message, {
    duration: 4000,
    position: "top-right",
  });
};

export const toastInfo = (message: string) => {
  toast.info(message, {
    duration: 3000,
    position: "top-right",
  });
};

// Convenience function for common error messages
export const showErrorToast = (error: any, defaultMessage = "Terjadi kesalahan") => {
  const message = error?.message || defaultMessage;
  toastError(message);
};

// Convenience function for success messages
export const showSuccessToast = (message: string) => {
  toastSuccess(message);
};