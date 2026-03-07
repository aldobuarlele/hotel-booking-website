"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "w-full max-w-sm rounded-lg border bg-white shadow-lg p-4 flex items-start gap-3 dark:bg-gray-900 dark:border-gray-800",
          title: "font-medium text-gray-900 dark:text-gray-100",
          description: "text-sm text-gray-500 dark:text-gray-400",
          icon: "mt-0.5",
          actionButton:
            "px-3 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90",
          cancelButton:
            "px-3 py-1 text-xs font-medium rounded-md border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300",
          closeButton:
            "absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
          success:
            "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20",
          error:
            "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20",
          warning:
            "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20",
          info: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20",
          default: "border-gray-200 dark:border-gray-800",
        },
      }}
    />
  );
}