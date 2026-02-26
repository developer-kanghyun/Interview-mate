export type ToastVariant = "info" | "success" | "warning" | "error";

export type ToastOptions = {
  id?: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
  dismissible?: boolean;
  dedupeKey?: string;
};

export type ToastItem = {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  durationMs: number | null;
  dismissible: boolean;
  dedupeKey?: string;
};
