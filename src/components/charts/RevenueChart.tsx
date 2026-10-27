"use client";

import { useId, useMemo, useState } from "react";
import { t } from "@/lib/i18n";

export type Point = { label: string; value: number };

const W = 640;
const H = 240;
const PAD = { t: 16, r: 16, b: 28, l: 44 };

/** Catmull-Rom → Bezier: silliq egri chiziq */
function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function RevenueChart({ data, unit = "M" }: { data: Point[]; unit?: string }) {
  const gid = useId();
  const [hover, setHover] = useState<number | null>(null);

  const { pts, ticks, max } = useMemo(() => {
    // "Chiroyli" yuqori chegara: 1, 2, 2.5, 5 yoki 10 × 10^n
    const raw = Math.max(...data.map((d) => d.value), 1);
    const mag = 10 ** Math.floor(Math.log10(raw));
    const max = ([1, 2, 2.5, 5, 10].map((s) => s * mag).find((v) => v >= raw) ?? raw);
    const iw = W - PAD.l - PAD.r;
    const ih = H - PAD.t - PAD.b;
    const pts = data.map((d, i): [number, number] => [
      PAD.l + (i / (data.length - 1)) * iw,
      PAD.t + ih - (d.value / max) * ih,
    ]);
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({ y: PAD.t + ih - t * ih, label: Math.round(t * max * 10) / 10 }));
    return { pts, ticks, max };
  }, [data]);

  const line = smoothPath(pts);
  const area = `${line} L${pts[pts.length - 1][0]},${H - PAD.b} L${pts[0][0]},${H - PAD.b} Z`;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    pts.forEach((p, i) => { if (Math.abs(p[0] - x) < Math.abs(pts[best][0] - x)) best = i; });
    setHover(best);
  }

  const hp = hover !== null ? pts[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-pan-y"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={t("Daromad dinamikasi, maksimum {max} {unit} so'm", { max, unit })}
      >
        <defs>
          <linearGradient id={`${gid}-a`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#06b6d4" stopOpacity="0.35" />
            <stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${gid}-l`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#06b6d4" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
          <filter id={`${gid}-g`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {ticks.map((t) => (
          <g key={t.y}>
            <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} className="stroke-line" />
            <text x={PAD.l - 8} y={t.y + 4} textAnchor="end" className="fill-slate-500 text-[11px]">{t.label}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={i} x={pts[i][0]} y={H - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">{d.label}</text>
        ))}

        <path d={area} fill={`url(#${gid}-a)`} />
        <path d={line} fill="none" stroke={`url(#${gid}-l)`} strokeWidth="2.5" strokeLinecap="round" filter={`url(#${gid}-g)`} />

        {hp && (
          <g>
            <line x1={hp[0]} x2={hp[0]} y1={PAD.t} y2={H - PAD.b} stroke="rgba(6,182,212,0.4)" strokeDasharray="4 4" />
            <circle cx={hp[0]} cy={hp[1]} r="5" fill="#06b6d4" className="stroke-high" strokeWidth="2" />
          </g>
        )}
      </svg>

      {hp && hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-line-accent bg-lowest px-3 py-1.5 text-xs shadow-glow"
          style={{ left: `${(hp[0] / W) * 100}%`, top: `${(hp[1] / H) * 100 - 4}%` }}
        >
          <p className="text-slate-400">{data[hover].label}</p>
          <p className="font-bold">{data[hover].value} {unit} {t("so'm")}</p>
        </div>
      )}
    </div>
  );
}
