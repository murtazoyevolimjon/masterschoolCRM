"use client";

import { useEffect, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import { deleteBlocker, useDb, type Collections } from "@/lib/db";
import { toast, useUi } from "@/lib/store";
import { t } from "@/lib/i18n";
import { ConfirmModal } from "./Modal";
import { inputCls } from "./primitives";

export function SearchInput({ value, onChange, placeholder = "Qidirish..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="relative block min-w-0 flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={t(placeholder)} aria-label={t(placeholder)} className={`${inputCls} h-10 pl-10`} />
    </label>
  );
}

export function FilterSelect({
  value, onChange, options, all,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; all: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={t(all)} className={`${inputCls} h-10 w-auto min-w-36`}>
      <option value="">{t(all)}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
    </select>
  );
}

export function RowActions({ onEdit, onDelete, extra }: { onEdit?: () => void; onDelete?: () => void; extra?: React.ReactNode }) {
  return (
    <div className="flex justify-end gap-1">
      {extra}
      {onEdit && (
        <button onClick={onEdit} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-fg/5 hover:text-primary" aria-label={t("Tahrirlash")}><Pencil className="size-4" /></button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-danger/10 hover:text-danger" aria-label={t("O'chirish")}><Trash2 className="size-4" /></button>
      )}
    </div>
  );
}

export function EmptyRow({ cols, text = "Ma'lumot topilmadi" }: { cols: number; text?: string }) {
  return (
    <tr><td colSpan={cols} className="py-12 text-center text-sm text-slate-500">{t(text)}</td></tr>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-line py-12 text-center text-sm text-slate-500">{t(text)}</p>;
}

/** Yuqori paneldagi qidiruvdan kelgan matnni bir marta o'qib, mahalliy qidiruvga o'tkazadi. */
export function useListSearch() {
  const [q, setQ] = useState("");
  useEffect(() => {
    const pending = useUi.getState().query;
    if (pending) { setQ(pending); useUi.getState().setQuery(""); }
  }, []);
  return [q, setQ] as const;
}

/** O'chirishni tasdiqlash: `ask()` chaqiriladi, `dialog` sahifaga joylanadi. */
export function useDeleter() {
  const remove = useDb((s) => s.remove);
  const [target, setTarget] = useState<{ k: keyof Collections; id: string; label: string } | null>(null);

  function ask(k: keyof Collections, id: string, label: string) {
    const blocked = deleteBlocker(useDb.getState(), k, id);
    if (blocked) { toast(blocked, "error"); return; }
    setTarget({ k, id, label });
  }

  const dialog = (
    <ConfirmModal
      open={!!target}
      title="O'chirishni tasdiqlang"
      text={target ? t("“{label}” o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.", { label: target.label }) : ""}
      onClose={() => setTarget(null)}
      onConfirm={() => { if (target) { remove(target.k, target.id); toast(t("“{label}” o'chirildi", { label: target.label })); } setTarget(null); }}
    />
  );
  return { ask, dialog };
}
