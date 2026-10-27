"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { t } from "@/lib/i18n";
import { Button } from "./primitives";

export function Modal({
  open, title, onClose, children, wide,
}: { open: boolean; title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog" aria-modal="true" aria-label={t(title)}
        className={clsx(
          "animate-fade-up max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-line-accent bg-high p-5 shadow-2xl sm:rounded-2xl sm:p-6",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">{t(title)}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-fg/10" aria-label={t("Yopish")}><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormActions({ onClose, label = "Saqlash" }: { onClose: () => void; label?: string }) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="button" onClick={onClose}>Bekor qilish</Button>
      <Button type="submit" variant="primary">{label}</Button>
    </div>
  );
}

export function ConfirmModal({
  open, title, text, onConfirm, onClose,
}: { open: boolean; title: string; text: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-slate-300">{t(text)}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onClose}>Yo&apos;q</Button>
        <Button variant="danger" onClick={onConfirm}>Ha, o&apos;chirish</Button>
      </div>
    </Modal>
  );
}
