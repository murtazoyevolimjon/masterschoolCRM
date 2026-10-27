"use client";

import clsx from "clsx";
import { Check, Languages } from "lucide-react";
import { LANGS, t, useLang } from "@/lib/i18n";
import { usePopover } from "@/lib/usePopover";


/** Til tanlash: UZ / RU / EN. Tanlov brauzerda saqlanadi, butun interfeys qayta chiziladi. */
export function LangMenu({ className, placement = "down" }: { className?: string; placement?: "down" | "up" }) {
  const lang = useLang((s) => s.lang);
  const setLang = useLang((s) => s.setLang);
  const { open, setOpen, ref } = usePopover();
  const current = LANGS.find((l) => l.id === lang)!;

  return (
    <div ref={ref} className={clsx("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-line bg-low px-3 text-sm font-bold text-slate-300 transition hover:border-primary/40 hover:text-primary"
        aria-haspopup="menu" aria-expanded={open} aria-label={t("Tilni tanlash")} title={t("Tilni tanlash")}
      >
        <Languages className="size-4" /> {current.short}
      </button>
      {open && (
        <ul role="menu" className={clsx("absolute right-0 z-40 w-40 rounded-xl border border-line-accent bg-lowest p-1.5 shadow-2xl", placement === "up" ? "bottom-12" : "top-12")}>
          {LANGS.map((l) => (
            <li key={l.id} role="none">
              <button
                role="menuitemradio" aria-checked={l.id === lang}
                onClick={() => { setOpen(false); setLang(l.id); }}
                className={clsx("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-fg/5", l.id === lang && "text-primary")}
              >
                <span className="w-7 text-xs font-bold">{l.short}</span>
                <span className="flex-1">{l.name}</span>
                {l.id === lang && <Check className="size-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
