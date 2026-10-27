"use client";

import clsx from "clsx";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useUi } from "@/lib/store";
import { t } from "@/lib/i18n";

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const tones = {
  success: "border-success/40 text-success",
  error: "border-danger/40 text-danger",
  info: "border-primary/40 text-primary",
};

export function Toaster() {
  const toasts = useUi((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6">
      {toasts.map((toast) => {
        const Icon = icons[toast.tone];
        return (
          <div key={toast.id} role="status" className={clsx("animate-fade-up flex max-w-md items-center gap-2.5 rounded-xl border bg-lowest px-4 py-3 text-sm font-semibold shadow-2xl", tones[toast.tone])}>
            <Icon className="size-5 shrink-0" />
            <span className="text-slate-100">{t(toast.message)}</span>
          </div>
        );
      })}
    </div>
  );
}
