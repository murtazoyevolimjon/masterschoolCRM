"use client";

import Link from "next/link";
import { BookOpen, Calendar, CheckCircle2, Download, Flame, MapPin, Play, Star, UserRound, AlertCircle } from "lucide-react";
import { Badge, Button, Card, CardTitle, Progress } from "@/components/ui/primitives";
import { Countdown } from "@/components/student/Countdown";
import { useSessionUser } from "@/lib/auth";
import { dayNumbers, debtsFor, studentStats, useDb } from "@/lib/db";
import { addDays, daysBetween, downloadFile, formatDate, money, monthKey, monthLabel, todayISO, weekday, weekdayNames } from "@/lib/format";

export default function StudentDashboard() {
  const user = useSessionUser();
  const db = useDb();
  const student = user?.student;
  if (!student) return null;

  const today = todayISO();
  const month = monthKey(today);
  const course = db.courses.find((c) => c.id === student.courseId);
  const group = db.groups.find((g) => g.id === student.groupId);
  const teacher = db.teachers.find((t) => t.id === group?.teacherId);
  const room = db.rooms.find((r) => r.id === group?.roomId);
  const stats = studentStats(db.attendance, student.id);

  // Kurs davomiyligiga nisbatan o'tgan vaqt (taxminiy progress)
  const progress = course ? Math.min(100, Math.round((daysBetween(student.createdAt, today) / (course.months * 30)) * 100)) : 0;

  let next: { label: string; time: string } | null = null;
  if (group) {
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, i);
      if (dayNumbers[group.days].includes(weekday(d))) {
        next = { label: i === 0 ? "Bugun" : i === 1 ? "Ertaga" : weekdayNames[weekday(d)], time: group.time };
        break;
      }
    }
  }

  const debt = debtsFor(db, month).find((r) => r.student.id === student.id);
  const paid = !!debt && debt.paid >= debt.fee;
  const lastPayment = db.payments.filter((p) => p.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date))[0];

  function downloadReceipt() {
    if (!lastPayment) return;
    downloadFile(
      `chek-${lastPayment.date}.txt`,
      [db.settings.centerName, "TO'LOV CHEKI", "", `Talaba: ${student!.name}`, `Sana: ${formatDate(lastPayment.date)}`, `Summa: ${money(lastPayment.amount)} so'm`, `Usul: ${lastPayment.method}`, `Izoh: ${lastPayment.note}`].join("\r\n"),
      "text/plain;charset=utf-8",
    );
  }

  const [y, m] = month.split("-").map(Number);
  const nextMonth = monthLabel(m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`);

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-line-accent bg-gradient-to-br from-high via-high to-electric/20 p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">Salom, {student.name.split(" ")[0]}! 👋</h1>
            <p className="mt-1 text-sm text-slate-400">Bugun ham o&apos;qishda davom etamiz — seriyani uzmang.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5">
              <p className="flex items-center gap-1.5 text-xs text-slate-400"><Star className="size-3.5" /> Daraja</p>
              <p className="font-extrabold text-primary">Level {stats.level} · {money(stats.xp)} XP</p>
            </div>
            <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5">
              <p className="flex items-center gap-1.5 text-xs text-slate-400"><Flame className="size-3.5" /> Streak</p>
              <p className="font-extrabold text-warning">{stats.streak} kun uzluksiz</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle icon={BookOpen} action={<Badge tone={student.status === "Faol" ? "success" : "warning"}>{student.status}</Badge>}>Mening kursim</CardTitle>
          <h3 className="text-xl font-extrabold">{course?.name ?? "Kurs biriktirilmagan"}</h3>
          <p className="mt-1 text-sm text-slate-400">{group ? `Guruh: ${group.name} · ${group.days} ${group.time}` : "Guruhga biriktirilmagan — administrator siz bilan bog'lanadi"}</p>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-slate-400">Kurs davomidagi progress</span>
            <span className="font-extrabold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="mt-2 h-3" />
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/student/video" className="btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm"><Play className="size-4" /> Davom ettirish</Link>
            <Link href="/student/vazifalar"><Button>Vazifalar</Button></Link>
          </div>
        </Card>

        <Card>
          <CardTitle icon={Calendar}>Keyingi dars</CardTitle>
          {next ? (
            <>
              <p className="text-3xl font-extrabold text-primary">{next.label} {next.time}</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2"><MapPin className="size-4 text-slate-500" /> Xona: {room?.name ?? "—"}</li>
                <li className="flex items-center gap-2"><UserRound className="size-4 text-slate-500" /> Mentor: {teacher?.name ?? "—"}</li>
              </ul>
              <Button className="mt-4 w-full" icon={Download}>Dars materiallari</Button>
            </>
          ) : (
            <p className="text-sm text-slate-400">Dars jadvali guruhga biriktirilgandan keyin ko&apos;rinadi.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Yaqin deadline vazifalar</CardTitle>
          <ul className="space-y-3">
            {[
              { t: "JWT Authentication", h: 5, tone: "danger" as const },
              { t: "Express Middleware", h: 30, tone: "warning" as const },
              { t: "MongoDB Aggregation", h: 76, tone: "info" as const },
            ].map((x) => (
              <li key={x.t} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-low p-3">
                <div>
                  <p className="font-bold">{x.t}</p>
                  <p className="text-xs text-slate-500">{course?.name ?? "Kurs"}</p>
                </div>
                <Badge tone={x.tone}><Countdown hours={x.h} /></Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>To&apos;lov holati</CardTitle>
          {student.status !== "Faol" ? (
            <p className="text-sm text-slate-400">To&apos;lov hisobi talaba “Faol” statusga o&apos;tgandan keyin yuritiladi.</p>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <span className={`grid size-14 place-items-center rounded-2xl ${paid ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                  {paid ? <CheckCircle2 className="size-7" /> : <AlertCircle className="size-7" />}
                </span>
                <div>
                  <p className={`text-xl font-extrabold ${paid ? "text-success" : "text-danger"}`}>{paid ? "To'langan" : `Qarz: ${money(debt?.debt ?? 0)} so'm`}</p>
                  <p className="text-sm text-slate-400">{monthLabel(month)} · keyingi to&apos;lov: <span className="font-semibold text-slate-200">{nextMonth}</span></p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-low p-3 text-sm">
                <span className="text-slate-400">Oylik to&apos;lov</span>
                <span className="font-extrabold">{money(course?.price ?? 0)} so&apos;m</span>
              </div>
              <Button className="mt-4 w-full" icon={Download} onClick={downloadReceipt} disabled={!lastPayment}>Chekni yuklab olish</Button>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
