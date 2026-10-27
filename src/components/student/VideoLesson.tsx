"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Check, CheckCircle2, Download, FileText, Lock, Maximize, Pause, Play, Settings } from "lucide-react";
import { Badge, Button, Card, CardTitle, Progress } from "@/components/ui/primitives";

type Lesson = { id: number; title: string; dur: number };

const lessons: Lesson[] = [
  { id: 1, title: "Node.js ga kirish", dur: 1480 },
  { id: 2, title: "Express asoslari", dur: 2010 },
  { id: 3, title: "Middleware va routing", dur: 1895 },
  { id: 4, title: "JWT Authentication", dur: 2420 },
  { id: 5, title: "Role-based access control", dur: 2150 },
  { id: 6, title: "MongoDB & Mongoose", dur: 2760 },
  { id: 7, title: "Deploy va CI/CD", dur: 2300 },
];

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const speeds = [1, 1.5, 2];
const qualities = ["360p", "720p", "1080p"];

/**
 * Pleer — demo uchun simulyatsiya qilingan (vaqt jadvali ishlaydi, video oqimi yo'q).
 * Haqiqiy video ulash uchun maydonni <video src={...} /> bilan almashtiring.
 */
export function VideoLesson() {
  const [current, setCurrent] = useState(4);
  const [done, setDone] = useState<number[]>([1, 2, 3]);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState("720p");
  const [menu, setMenu] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const lesson = lessons.find((l) => l.id === current)!;

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setTime((v) => (v + speed >= lesson.dur ? (setPlaying(false), lesson.dur) : v + speed)), 1000);
    return () => clearInterval(t);
  }, [playing, speed, lesson.dur]);

  const isLocked = (id: number) => id > Math.max(...done) + 1;

  function open(id: number) {
    if (isLocked(id)) return;
    setCurrent(id); setTime(0); setPlaying(false);
  }

  function finish() {
    setDone((d) => (d.includes(current) ? d : [...d, current]));
    if (current < lessons.length) open(current + 1);
  }

  const doneAll = done.length;
  const pct = Math.round((doneAll / lessons.length) * 100);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <div ref={box} className="group relative aspect-video overflow-hidden rounded-2xl border border-line bg-[#070e1c] text-[#e6eaf5]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.25),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.25),transparent_55%)]" />
          <button onClick={() => setPlaying((p) => !p)} className="absolute inset-0 grid place-items-center" aria-label={playing ? "To'xtatish" : "Ijro etish"}>
            <span className={clsx("grid size-20 place-items-center rounded-full bg-primary/20 text-primary shadow-glow backdrop-blur transition", playing && "scale-75 opacity-0 group-hover:opacity-100")}>
              {playing ? <Pause className="size-8" /> : <Play className="size-8 translate-x-0.5" />}
            </span>
          </button>
          <p className="absolute left-4 top-4 rounded-lg bg-black/50 px-3 py-1 text-sm font-semibold backdrop-blur">{lesson.title}</p>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4">
            <input
              type="range" min={0} max={lesson.dur} value={time}
              onChange={(e) => setTime(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-cyan-400"
              aria-label="Vaqt"
            />
            <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
              <button onClick={() => setPlaying((p) => !p)} aria-label="Ijro">{playing ? <Pause className="size-5" /> : <Play className="size-5" />}</button>
              <span className="tabular-nums">{fmt(time)} / {fmt(lesson.dur)}</span>
              <div className="ml-auto flex items-center gap-1.5">
                {speeds.map((s) => (
                  <button key={s} onClick={() => setSpeed(s)} className={clsx("rounded-md px-2 py-1", s === speed ? "bg-primary text-black" : "bg-white/10 hover:bg-white/20")}>{s}x</button>
                ))}
                <div className="relative">
                  <button onClick={() => setMenu((m) => !m)} className="grid size-8 place-items-center rounded-md bg-white/10 hover:bg-white/20" aria-label="Sifat"><Settings className="size-4" /></button>
                  {menu && (
                    <ul className="absolute bottom-10 right-0 w-24 overflow-hidden rounded-lg border border-line bg-[#070e1c] text-sm">
                      {qualities.map((q) => (
                        <li key={q}>
                          <button onClick={() => { setQuality(q); setMenu(false); }} className="flex w-full items-center justify-between px-3 py-2 hover:bg-white/5">
                            {q} {q === quality && <Check className="size-3.5 text-primary" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button onClick={() => (document.fullscreenElement ? document.exitFullscreen() : box.current?.requestFullscreen())} className="grid size-8 place-items-center rounded-md bg-white/10 hover:bg-white/20" aria-label="To'liq ekran"><Maximize className="size-4" /></button>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge tone="info">Dars {current} / {lessons.length}</Badge>
              <h1 className="mt-2 text-xl font-extrabold sm:text-2xl">{lesson.title}</h1>
            </div>
            <Button variant="primary" icon={CheckCircle2} onClick={finish} disabled={done.includes(current) && current === lessons.length}>
              {done.includes(current) ? "Keyingi darsga" : "Darsni tugatdim"}
            </Button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Ushbu darsda JSON Web Token asosida foydalanuvchini autentifikatsiya qilishni o&apos;rganasiz: token yaratish, himoyalangan marshrutlar,
            refresh token va xavfsiz saqlash usullari. Dars oxirida amaliy topshiriq beriladi.
          </p>
          <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">Dars fayllari</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {[{ n: "jwt-slides.pdf", s: "2.4 MB" }, { n: "starter-project.zip", s: "5.1 MB" }].map((f) => (
              <a key={f.n} href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-3 rounded-xl border border-line bg-low p-3 transition hover:border-primary/40">
                <FileText className="size-5 text-primary" />
                <span className="flex-1 truncate text-sm font-semibold">{f.n}</span>
                <span className="text-xs text-slate-500">{f.s}</span>
                <Download className="size-4 text-slate-400" />
              </a>
            ))}
          </div>
        </Card>
      </div>

      <Card className="h-fit xl:sticky xl:top-24">
        <CardTitle action={<span className="text-xs font-bold text-primary">{pct}%</span>}>Darslar ro&apos;yxati</CardTitle>
        <Progress value={pct} className="mb-4" />
        <ul className="space-y-1.5">
          {lessons.map((l) => {
            const isDone = done.includes(l.id);
            const locked = isLocked(l.id);
            const active = l.id === current;
            return (
              <li key={l.id}>
                <button
                  onClick={() => open(l.id)}
                  disabled={locked}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                    active ? "border-primary bg-primary/10 shadow-glow" : "border-transparent hover:bg-fg/5",
                    locked && "cursor-not-allowed opacity-50",
                  )}
                >
                  {isDone ? <CheckCircle2 className="size-5 shrink-0 text-success" /> : locked ? <Lock className="size-5 shrink-0 text-slate-500" /> : <Play className="size-5 shrink-0 text-primary" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{l.id}. {l.title}</span>
                  </span>
                  <span className="text-xs tabular-nums text-slate-500">{fmt(l.dur)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
