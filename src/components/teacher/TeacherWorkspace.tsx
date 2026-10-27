"use client";

import { useMemo, useState } from "react";
import {
  Bold, ClipboardList, Clock, Code2, Eye, Italic, Link2, List, Link as LinkIcon, Pencil, PlayCircle, Save, Send, Sparkles, Trash2, Video,
} from "lucide-react";
import {
  Avatar, Badge, Button, Card, CardTitle, Field, PageHeader, Progress, Tabs, inputCls, type Tone,
} from "@/components/ui/primitives";
import { FileDrop } from "@/components/ui/FileDrop";
import { useSessionUser } from "@/lib/auth";
import { useDb, type Group } from "@/lib/db";

type TabId = "homework" | "video";

/** Uyga vazifa va video ma'lumotlari hali bazada yo'q — namunaviy; guruh va o'quvchilar esa haqiqiy. */
const homeworkTitles = ["React Hooks: useReducer bilan Todo ilova", "REST API: JWT autentifikatsiya", "Asinxron JavaScript mashqlari"];
const videoTitles = [
  { title: "Hooks chuqur tahlil", dur: "48:20", views: 312, hue: 190 },
  { title: "Event Loop va asinxronlik", dur: "52:05", views: 204, hue: 260 },
  { title: "OOP asoslari", dur: "39:48", views: 158, hue: 150 },
  { title: "TypeScript Generics", dur: "44:12", views: 276, hue: 220 },
];

const toolbar = [Bold, Italic, Link2, Code2, List];

function NoGroups() {
  return <Card className="py-12 text-center text-sm text-slate-400">Sizga hali guruh biriktirilmagan. Administrator guruh biriktirgach, bu yerda ko&apos;rinadi.</Card>;
}

function useGroupLabel() {
  const courses = useDb((s) => s.courses);
  return (g: Group) => `${g.name} — ${courses.find((c) => c.id === g.courseId)?.name ?? ""} (${g.days} ${g.time})`;
}

function HomeworkTab({ groups }: { groups: Group[] }) {
  const students = useDb((s) => s.students);
  const label = useGroupLabel();
  const [gradeGroup, setGradeGroup] = useState(groups[0]?.id ?? "");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const homeworks = groups.slice(0, 3).map((g, i) => {
    const total = students.filter((s) => s.groupId === g.id).length;
    return { title: homeworkTitles[i % homeworkTitles.length], group: g, due: `${i + 2} kun qoldi`, done: Math.round(total * 0.75), total };
  });

  const members = students.filter((s) => s.groupId === gradeGroup);
  // Topshirish holatlari namunaviy (index bo'yicha)
  const status = (i: number): { text: string; tone: Tone; missing: boolean } =>
    i % 4 === 2 ? { text: "Topshirmadi", tone: "danger", missing: true } : i % 4 === 1 ? { text: "Kechikdi", tone: "warning", missing: false } : { text: "Topshirdi", tone: "success", missing: false };

  function grade(id: string) {
    const n = Number(scores[id]);
    if (!Number.isFinite(n) || scores[id] === "" || scores[id] === undefined || n < 0 || n > 100) return;
    setSaved((s) => ({ ...s, [id]: true }));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <Card className="xl:col-span-2">
        <CardTitle icon={ClipboardList}>Yangi uyga vazifa yaratish</CardTitle>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Field label="Guruh">
            <select className={inputCls}>{groups.map((g) => <option key={g.id} value={g.id}>{label(g)}</option>)}</select>
          </Field>
          <Field label="Vazifa mavzusi">
            <input className={inputCls} placeholder="Masalan: React Context API bilan mavzu almashtirish" />
          </Field>
          <Field label="Tavsif">
            <div className="overflow-hidden rounded-xl border border-line bg-low focus-within:border-primary/60">
              <div className="flex flex-wrap items-center gap-1 border-b border-line p-1.5">
                {toolbar.map((Icon, i) => (
                  <button key={i} type="button" className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-fg/5 hover:text-primary"><Icon className="size-4" /></button>
                ))}
                <button type="button" className="ml-auto flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-ai to-ai-soft px-2.5 text-xs font-bold shadow-glow-ai">
                  <Sparkles className="size-3.5" /> AI yordamida to&apos;ldirish
                </button>
              </div>
              <textarea rows={5} className="w-full resize-y bg-transparent p-3.5 text-sm outline-none placeholder:text-slate-500" placeholder="Vazifa shartlarini yozing..." />
            </div>
          </Field>
          <Field label="Topshirish muddati" hint={<Badge tone="warning"><Clock className="size-3" /> 2 kun qoldi</Badge>}>
            <input type="datetime-local" className={`${inputCls}`} />
          </Field>
          <Field label="Fayl biriktirish">
            <FileDrop hint="PDF, DOCX, ZIP, XLSX, JPG, PNG" accept=".pdf,.docx,.zip,.xlsx,.jpg,.jpeg,.png" />
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="primary" icon={Send} className="flex-1">Vazifani yuborish</Button>
            <Button icon={Save} className="flex-1">Qoralama sifatida saqlash</Button>
          </div>
        </form>
      </Card>

      <Card className="xl:col-span-3">
        <CardTitle icon={ClipboardList}>Mavjud uyga vazifalar &amp; baholash</CardTitle>
        <div className="space-y-3">
          {homeworks.map((h) => {
            const pct = h.total ? Math.round((h.done / h.total) * 100) : 0;
            return (
              <div key={h.group.id} className="rounded-xl border border-line bg-low p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge tone="info">{h.group.name} · {h.group.time}</Badge>
                  <Badge tone="warning"><Clock className="size-3" /> {h.due}</Badge>
                </div>
                <p className="font-bold">{h.title}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{h.done} ta topshirdi ({h.total} talabadan)</span>
                  <span className="font-bold text-primary">{pct}%</span>
                </div>
                <Progress value={pct} className="mt-1.5" />
              </div>
            );
          })}
        </div>

        <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-300">Baholash</h3>
          <select value={gradeGroup} onChange={(e) => setGradeGroup(e.target.value)} className={`${inputCls} h-9 w-auto`}>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <ul className="space-y-2">
          {members.length === 0 && <li className="rounded-xl border border-dashed border-line py-8 text-center text-sm text-slate-500">Bu guruhda o&apos;quvchi yo&apos;q</li>}
          {members.map((s, i) => {
            const st = status(i);
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-low p-3">
                <Avatar name={s.name} size="sm" />
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <p className="truncate text-xs text-slate-500">{st.missing ? "—" : i % 2 ? "homework.pdf" : "solution.zip"}</p>
                </div>
                <Badge tone={st.tone}>{st.text}</Badge>
                <input
                  type="number" min={0} max={100} disabled={st.missing} placeholder="0-100"
                  value={scores[s.id] ?? ""}
                  onChange={(e) => { setScores((p) => ({ ...p, [s.id]: e.target.value })); setSaved((p) => ({ ...p, [s.id]: false })); }}
                  className="h-9 w-20 rounded-lg border border-line bg-canvas px-2 text-center text-sm outline-none focus:border-primary/60 disabled:opacity-40"
                  aria-label={`${s.name} bali`}
                />
                <Button variant={saved[s.id] ? "ghost" : "primary"} className="h-9 px-3" disabled={st.missing} onClick={() => grade(s.id)}>
                  {saved[s.id] ? "Saqlandi ✓" : "Baholash"}
                </Button>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function VideoTab({ groups }: { groups: Group[] }) {
  const label = useGroupLabel();
  const videos = videoTitles.map((v, i) => ({ ...v, group: groups[i % groups.length] }));
  return (
    <div className="space-y-4">
      <Card>
        <CardTitle icon={Video}>Yangi video yuklash</CardTitle>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Field label="Guruh">
              <select className={inputCls}>{groups.map((g) => <option key={g.id} value={g.id}>{label(g)}</option>)}</select>
            </Field>
            <Field label="Mavzu"><input className={inputCls} placeholder="Dars mavzusi" /></Field>
            <Field label="Qisqacha tavsif">
              <textarea rows={3} className={`${inputCls} h-auto resize-y py-3`} placeholder="Darsda nimalar o'rganiladi..." />
            </Field>
            <Field label="YouTube / Vimeo havolasi">
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input className={`${inputCls} pl-10`} placeholder="https://youtu.be/..." />
              </div>
            </Field>
          </div>
          <div className="space-y-4">
            <Field label="Video fayl">
              <FileDrop hint="MP4, MOV, WEBM" accept="video/mp4,video/quicktime,video/webm" maxMB={2048} multiple={false} showSpeed />
            </Field>
            <Button variant="primary" icon={Send} className="w-full">Videoni e&apos;lon qilish</Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle icon={PlayCircle}>Video kutubxona</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {videos.map((v) => (
            <article key={v.title} className="group overflow-hidden rounded-xl border border-line bg-low transition hover:border-primary/40 hover:shadow-glow">
              <div className="relative grid aspect-video place-items-center" style={{ background: `linear-gradient(135deg, hsl(${v.hue} 70% 22%), hsl(${v.hue + 40} 70% 12%))` }}>
                <PlayCircle className="size-12 text-white/80 transition group-hover:scale-110 group-hover:text-primary" />
                <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-bold text-white">{v.dur}</span>
              </div>
              <div className="space-y-2 p-3">
                <h3 className="line-clamp-2 min-h-10 text-sm font-bold">{v.title}</h3>
                <p className="truncate text-xs text-slate-400">{v.group.name} · {v.group.time}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-slate-400"><Eye className="size-3.5" /> {v.views}</span>
                  <div className="flex gap-1">
                    <button className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-fg/5 hover:text-primary" aria-label="Tahrirlash"><Pencil className="size-4" /></button>
                    <button className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-danger/10 hover:text-danger" aria-label="O'chirish"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function TeacherWorkspace({ initial = "homework" }: { initial?: TabId }) {
  const [tab, setTab] = useState<TabId>(initial);
  const user = useSessionUser();
  const allGroups = useDb((s) => s.groups);
  const groups = useMemo(() => allGroups.filter((g) => g.teacherId === user?.teacher?.id && g.active), [allGroups, user?.teacher?.id]);

  return (
    <>
      <PageHeader title="O'qituvchi kabineti" subtitle={`${user?.name ?? ""} · uyga vazifalar va video darslarni boshqaring`} />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "homework", label: "Uyga vazifalar", icon: ClipboardList },
          { id: "video", label: "Video darslar", icon: Video },
        ]}
      />
      {groups.length === 0 ? <NoGroups /> : tab === "homework" ? <HomeworkTab groups={groups} /> : <VideoTab groups={groups} />}
    </>
  );
}
