"use client";

import { useState } from "react";
import { Clock, Download, FileText, MessageSquare, RotateCcw, Send, Star } from "lucide-react";
import { Badge, Button, Card, PageHeader, Tabs, inputCls, type Tone } from "@/components/ui/primitives";
import { FileDrop } from "@/components/ui/FileDrop";

type State = "assigned" | "submitted" | "graded" | "late";

type Task = {
  id: number; title: string; course: string; due: string; state: State;
  materials: string[]; score?: number; feedback?: string;
};

const tasks: Task[] = [
  { id: 1, title: "JWT Authentication", course: "Fullstack JS", due: "Bugun, 21:00", state: "assigned", materials: ["task-jwt.pdf", "starter.zip"] },
  { id: 2, title: "Express Middleware", course: "Fullstack JS", due: "Ertaga, 23:59", state: "assigned", materials: ["middleware.pdf"] },
  { id: 3, title: "REST API loyihasi", course: "Fullstack JS", due: "Kecha, 23:59", state: "submitted", materials: ["rest-api.pdf"] },
  { id: 4, title: "Async/Await mashqlari", course: "JavaScript", due: "20-oktyabr", state: "graded", materials: ["async.pdf"], score: 94, feedback: "Ajoyib ish! Error handling qismini try/catch bilan kuchaytirsangiz, to'liq 100 bo'ladi." },
  { id: 5, title: "Git va GitHub", course: "Asoslar", due: "12-oktyabr", state: "late", materials: ["git.pdf"] },
];

const stateMeta: Record<State, { label: string; tone: Tone }> = {
  assigned: { label: "Berilgan", tone: "info" },
  submitted: { label: "Topshirilgan", tone: "warning" },
  graded: { label: "Baholangan", tone: "success" },
  late: { label: "Kechikkan", tone: "danger" },
};

function TaskCard({ t }: { t: Task }) {
  const [resubmit, setResubmit] = useState(false);
  const [sent, setSent] = useState(false);
  const canUpload = t.state === "assigned" || t.state === "late" || resubmit;
  const meta = stateMeta[t.state];

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold">{t.title}</h3>
          <p className="text-sm text-slate-400">{t.course}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="muted"><Clock className="size-3" /> {t.due}</Badge>
          <Badge tone={meta.tone}>{sent ? "Topshirildi" : meta.label}</Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {t.materials.map((m) => (
          <a key={m} href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 rounded-lg border border-line bg-low px-3 py-2 text-xs font-semibold hover:border-primary/40">
            <FileText className="size-4 text-primary" /> {m} <Download className="size-3.5 text-slate-500" />
          </a>
        ))}
      </div>

      {t.state === "graded" && (
        <div className="flex gap-4 rounded-xl border border-success/30 bg-success/10 p-4">
          <div className="text-center">
            <p className="flex items-center gap-1 text-3xl font-extrabold text-success"><Star className="size-6" /> {t.score}</p>
            <p className="text-xs text-slate-400">/ 100 ball</p>
          </div>
          <p className="flex-1 text-sm text-slate-200"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Ustoz izohi</span>{t.feedback}</p>
        </div>
      )}

      {canUpload && !sent && (
        <>
          <FileDrop hint="Yechim fayli (ZIP, PDF, DOCX)" multiple={false} />
          <label className="block space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400"><MessageSquare className="size-3.5" /> Ustozga savol / izoh</span>
            <textarea rows={2} className={`${inputCls} h-auto resize-y py-3`} placeholder="Savolingiz bo'lsa yozing..." />
          </label>
          <Button variant="primary" icon={Send} onClick={() => setSent(true)}>Topshirish</Button>
        </>
      )}

      {(t.state === "submitted" || sent) && !resubmit && (
        <Button icon={RotateCcw} onClick={() => { setResubmit(true); setSent(false); }}>Qayta yuklash</Button>
      )}
    </Card>
  );
}

export function HomeworkCenter() {
  const [tab, setTab] = useState<State>("assigned");
  const count = (s: State) => tasks.filter((t) => t.state === s).length;

  return (
    <>
      <PageHeader title="Uyga vazifalar" subtitle="Vazifalarni o'z vaqtida topshiring va ball to'plang" />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={(Object.keys(stateMeta) as State[]).map((s) => ({ id: s, label: stateMeta[s].label, count: count(s) }))}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {tasks.filter((t) => t.state === tab).map((t) => <TaskCard key={t.id} t={t} />)}
        {count(tab) === 0 && <Card className="py-12 text-center text-slate-400 xl:col-span-2">Bu bo&apos;limda vazifa yo&apos;q</Card>}
      </div>
    </>
  );
}
