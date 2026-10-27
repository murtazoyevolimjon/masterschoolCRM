import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: ToastTone };

type UiState = {
  drawerOpen: boolean;
  aiOpen: boolean;
  /** Yuqori paneldagi qidiruvdan ro'yxat sahifasiga uzatiladigan qidiruv matni */
  query: string;
  toasts: Toast[];
  setDrawer: (v: boolean) => void;
  setAi: (v: boolean) => void;
  setQuery: (q: string) => void;
  pushToast: (message: string, tone?: ToastTone) => void;
};

let toastId = 0;

export const useUi = create<UiState>((set) => ({
  drawerOpen: false,
  aiOpen: false,
  query: "",
  toasts: [],
  setDrawer: (drawerOpen) => set({ drawerOpen }),
  setAi: (aiOpen) => set({ aiOpen }),
  setQuery: (query) => set({ query }),
  pushToast: (message, tone = "success") => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3500);
  },
}));

export const toast = (message: string, tone: ToastTone = "success") => useUi.getState().pushToast(message, tone);
