"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";

export type Slice = { label: string; value: number; color: string };

export function Donut({ slices, centerValue, centerLabel }: { slices: Slice[]; centerValue: string; centerLabel: string }) {
  const [active, setActive] = useState<number | null>(null);
  const r = 70;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((a, s) => a + s.value, 0);
  const GAP = 3; // bo'laklar orasidagi bo'shliq (px)

  let offset = 0;
  const arcs = slices.map((s) => {
    const len = (s.value / total) * c;
    const arc = { ...s, dash: `${Math.max(len - GAP, 0)} ${c}`, offset: -offset };
    offset += len;
    return arc;
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
      <div className="relative size-44 shrink-0">
        <svg viewBox="0 0 180 180" className="size-full -rotate-90" role="img" aria-label={`${t(centerLabel)} ${centerValue}`}>
          <circle cx="90" cy="90" r={r} fill="none" className="stroke-line" strokeWidth="16" />
          {arcs.map((a, i) => (
            <circle
              key={a.label}
              cx="90" cy="90" r={r} fill="none"
              stroke={a.color}
              strokeWidth={active === i ? 20 : 16}
              strokeDasharray={a.dash}
              strokeDashoffset={a.offset}
              strokeLinecap="butt"
              className="cursor-pointer transition-all"
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-3xl font-extrabold">{active !== null ? `${slices[active].value}%` : centerValue}</p>
            <p className="text-xs text-slate-400">{t(active !== null ? slices[active].label : centerLabel)}</p>
          </div>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {slices.map((s, i) => (
          <li
            key={s.label}
            className="flex items-center gap-3 rounded-lg px-2 py-1 text-sm hover:bg-fg/5"
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
          >
            <span className="size-3 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 text-slate-300">{t(s.label)}</span>
            <span className="font-bold">{s.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
