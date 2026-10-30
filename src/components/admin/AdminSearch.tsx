"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Layers, Search, Users } from "lucide-react";
import { useDb } from "@/lib/db";
import { useUi } from "@/lib/store";
import { t } from "@/lib/i18n";

type Hit = { key: string; label: string; sub: string; href: string; icon: typeof Users };

/** Admin yuqori paneli uchun global qidiruv: talaba, guruh va ustozlar bo'yicha. */
export function AdminSearch() {
  const router = useRouter();
  const setQuery = useUi((s) => s.setQuery);
  const students = useDb((s) => s.students);
  const groups = useDb((s) => s.groups);
  const teachers = useDb((s) => s.teachers);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const hits = useMemo<Hit[]>(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    return [
      ...students.filter((s) => s.name.toLowerCase().includes(needle) || s.phone.replace(/\s/g, "").includes(needle.replace(/\s/g, "")))
        .map((s) => ({ key: s.id, label: s.name, sub: `${t("Talaba")} · ${s.phone}`, href: "/admin/talabalar", icon: Users })),
      ...groups.filter((g) => g.name.toLowerCase().includes(needle))
        .map((g) => ({ key: g.id, label: g.name, sub: `${t("Guruh")} · ${t(g.days)} ${g.time}`, href: "/admin/guruhlar", icon: Layers })),
      ...teachers.filter((x) => x.name.toLowerCase().includes(needle))
        .map((x) => ({ key: x.id, label: x.name, sub: x.specialty ? `${t("Ustoz")} · ${x.specialty}` : t("Ustoz"), href: "/admin/ustozlar", icon: GraduationCap })),
    ].slice(0, 8);
  }, [q, students, groups, teachers]);

  function go(h: Hit) {
    setQuery(h.label);
    setQ("");
    setOpen(false);
    router.push(h.href);
  }

  return (
    <div className="relative min-w-0 flex-1" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={t("Talaba, guruh yoki ustozni qidirish...")} aria-label={t("Talaba, guruh yoki ustozni qidirish...")}
        className="h-10 w-full rounded-xl border border-line bg-low pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-primary/60 focus:shadow-glow"
      />
      {open && q.trim().length >= 2 && (
        <ul className="absolute left-0 right-0 top-12 z-40 max-h-80 overflow-y-auto rounded-xl border border-line-accent bg-lowest p-1.5 shadow-2xl">
          {hits.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-500">{t("Hech narsa topilmadi")}</li>}
          {hits.map((h) => (
            <li key={h.key}>
              <button onClick={() => go(h)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-fg/5">
                <h.icon className="size-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{h.label}</span>
                  <span className="block truncate text-xs text-slate-500">{h.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
