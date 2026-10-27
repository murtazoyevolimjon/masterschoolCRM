"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, Card, CardTitle, PageHeader, Progress } from "@/components/ui/primitives";

type Status = "present" | "late" | "excused" | "absent";

const meta: Record<Status, { label: string; cls: string }> = {
  present: { label: "Hozir bo'lgan", cls: "bg-success/20 text-success border-success/40" },
  late: { label: "Kechikkan", cls: "bg-warning/20 text-warning border-warning/40" },
  excused: { label: "Sababli", cls: "bg-danger/10 text-danger border-danger/30" },
  absent: { label: "Sababsiz", cls: "bg-danger/25 text-danger border-danger/60" },
};

const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
const weekdays = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

/** Dars kunlari: Dush-Chor-Juma. Holat sana asosida deterministik hisoblanadi (demo). */
function statusFor(y: number, m: number, d: number): Status | null {
  const dow = new Date(y, m, d).getDay();
  if (![1, 3, 5].includes(dow)) return null;
  if (new Date(y, m, d) > new Date()) return null;
  const k = (y * 372 + m * 31 + d) % 13;
  if (k === 4) return "late";
  if (k === 8) return "excused";
  if (k === 11) return "absent";
  return "present";
}

const grades = [
  { subject: "JavaScript asoslari", score: 96 },
  { subject: "Node.js & Express", score: 91 },
  { subject: "MongoDB", score: 84 },
  { subject: "Autentifikatsiya", score: 78 },
  { subject: "Git & GitHub", score: 98 },
];
const trend = [72, 78, 81, 85, 88, 91];

export function AttendanceGrades() {
  const today = new Date();
  const [cur, setCur] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [sel, setSel] = useState<number | null>(null);

  const first = (new Date(cur.y, cur.m, 1).getDay() + 6) % 7; // dushanbadan boshlanadi
  const days = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  const counts = { present: 0, late: 0, excused: 0, absent: 0 };
  for (let d = 1; d <= days; d++) { const s = statusFor(cur.y, cur.m, d); if (s) counts[s]++; }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const rate = total ? Math.round(((counts.present + counts.late) / total) * 100) : 0;

  function shift(delta: number) {
    const dt = new Date(cur.y, cur.m + delta, 1);
    setCur({ y: dt.getFullYear(), m: dt.getMonth() });
    setSel(null);
  }

  const avg = Math.round(grades.reduce((a, g) => a + g.score, 0) / grades.length);
  const W = 300, H = 100;
  const pts = trend.map((v, i) => [(i / (trend.length - 1)) * (W - 20) + 10, H - 10 - ((v - 60) / 40) * (H - 20)]);

  return (
    <>
      <PageHeader title="Davomat va baholar" subtitle="O'zlashtirish ko'rsatkichlaringiz tahlili" />
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardTitle action={
            <div className="flex items-center gap-1">
              <button onClick={() => shift(-1)} className="grid size-9 place-items-center rounded-lg border border-line hover:text-primary" aria-label="Oldingi oy"><ChevronLeft className="size-4" /></button>
              <span className="w-32 text-center text-sm font-bold">{months[cur.m]} {cur.y}</span>
              <button onClick={() => shift(1)} className="grid size-9 place-items-center rounded-lg border border-line hover:text-primary" aria-label="Keyingi oy"><ChevronRight className="size-4" /></button>
            </div>
          }>Davomat kalendari</CardTitle>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-500">
            {weekdays.map((w) => <span key={w} className="py-1">{w}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1.5">
            {cells.map((d, i) => {
              if (d === null) return <span key={i} />;
              const s = statusFor(cur.y, cur.m, d);
              return (
                <button
                  key={i}
                  disabled={!s}
                  onClick={() => setSel(d)}
                  className={clsx(
                    "grid aspect-square place-items-center rounded-lg border text-sm font-semibold transition",
                    s ? meta[s].cls : "border-transparent text-slate-600",
                    s && "hover:scale-105",
                    sel === d && "ring-2 ring-primary",
                  )}
                  aria-label={s ? `${d}-kun: ${meta[s].label}` : `${d}-kun`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300">
            {(Object.keys(meta) as Status[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5"><span className={clsx("size-3 rounded border", meta[s].cls)} /> {meta[s].label} ({counts[s]})</span>
            ))}
          </div>
          {sel && statusFor(cur.y, cur.m, sel) && (
            <p className="mt-3 rounded-lg bg-low p-3 text-sm">{sel}-{months[cur.m].toLowerCase()}: <b>{meta[statusFor(cur.y, cur.m, sel)!].label}</b></p>
          )}
        </Card>

        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardTitle>Oylik davomat</CardTitle>
            <p className="text-4xl font-extrabold text-primary">{rate}%</p>
            <Progress value={rate} className="mt-3" tone={rate >= 85 ? "success" : "warning"} />
          </Card>

          <Card>
            <CardTitle action={<Badge tone="success">O&apos;rtacha {avg}</Badge>}>Baholar reytingi</CardTitle>
            <ul className="space-y-3">
              {grades.map((g) => (
                <li key={g.subject}>
                  <div className="mb-1 flex justify-between text-sm"><span>{g.subject}</span><span className="font-bold">{g.score}</span></div>
                  <Progress value={g.score} tone={g.score >= 90 ? "success" : g.score >= 80 ? "info" : "warning"} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card>
        <CardTitle>O&apos;zlashtirish grafigi (so&apos;nggi 6 hafta)</CardTitle>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" role="img" aria-label="O'zlashtirish dinamikasi o'sishda">
          <defs>
            <linearGradient id="trend" x1="0" x2="1"><stop offset="0" stopColor="#06b6d4" /><stop offset="1" stopColor="#2563eb" /></linearGradient>
          </defs>
          <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="url(#trend)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p[0]} cy={p[1]} r="4" fill="#06b6d4" stroke="#1d2538" strokeWidth="2"><title>{trend[i]} ball</title></circle>
              <text x={p[0]} y={p[1] - 9} textAnchor="middle" className="fill-slate-400 text-[8px]">{trend[i]}</text>
            </g>
          ))}
        </svg>
      </Card>
    </>
  );
}
