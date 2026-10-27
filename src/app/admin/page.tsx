"use client";

import { t } from "@/lib/i18n";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CreditCard, DoorOpen, GraduationCap, Layers, Plus, ShieldAlert, TrendingUp, UserPlus, Users, Wallet } from "lucide-react";
import { usesDefaultAdminPassword } from "@/lib/auth";
import { Avatar, Badge, Button, Card, CardTitle, PageHeader, StatCard, TableWrap, td, th, type Tone } from "@/components/ui/primitives";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { Donut } from "@/components/charts/Donut";
import { GroupForm, PaymentForm, StudentForm } from "@/components/admin/forms";
import { dayNumbers, useDb, type StudentStatus } from "@/lib/db";
import { formatDate, lastMonths, millions, money, monthKey, todayISO, weekday } from "@/lib/format";

const monthShort = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
const statusTone: Record<StudentStatus, Tone> = { Faol: "success", "Sinov darsi": "warning", Kutilmoqda: "muted" };

export default function AdminDashboard() {
  const students = useDb((s) => s.students);
  const groups = useDb((s) => s.groups);
  const teachers = useDb((s) => s.teachers);
  const courses = useDb((s) => s.courses);
  const rooms = useDb((s) => s.rooms);
  const payments = useDb((s) => s.payments);
  const attendance = useDb((s) => s.attendance);
  const settings = useDb((s) => s.settings);
  const [modal, setModal] = useState<"student" | "group" | "payment" | null>(null);

  const today = todayISO();
  const month = monthKey(today);

  const stats = useMemo(() => {
    const months = lastMonths(6, today);
    const byMonth = months.map((m) => ({ key: m, sum: payments.filter((p) => p.date.startsWith(m)).reduce((a, p) => a + p.amount, 0) }));
    const cur = byMonth[byMonth.length - 1].sum;
    const prev = byMonth[byMonth.length - 2].sum;
    const monthPayments = payments.filter((p) => p.date.startsWith(month));

    const att = { present: 0, excused: 0, absent: 0 };
    Object.values(attendance).forEach((s) => { if (s === "present" || s === "late") att.present++; else att[s]++; });
    const total = att.present + att.excused + att.absent;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

    return {
      chart: byMonth.map((m) => ({ label: t(monthShort[Number(m.key.slice(5)) - 1]), value: Math.round(m.sum / 100_000) / 10 })),
      cur,
      deltaPct: prev ? Math.round(((cur - prev) / prev) * 100) : null,
      avgCheck: monthPayments.length ? cur / monthPayments.length : 0,
      att: { present: pct(att.present), excused: pct(att.excused), absent: pct(att.absent) },
    };
  }, [payments, attendance, month, today]);

  const newThisMonth = students.filter((s) => s.createdAt.startsWith(month)).length;
  const activeGroups = groups.filter((g) => g.active);
  const activeTeachers = teachers.filter((t) => t.active).length;
  const recent = [...students].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  const todays = activeGroups
    .filter((g) => dayNumbers[g.days].includes(weekday(today)))
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <>
      <PageHeader
        title="Bosh sahifa"
        subtitle={`${settings.centerName} markazining bugungi holati · ${formatDate(today)}`}
        actions={
          <>
            <Button variant="primary" icon={UserPlus} onClick={() => setModal("student")}>+ Talaba qo&apos;shish</Button>
            <Button icon={Plus} onClick={() => setModal("group")}>Guruh yaratish</Button>
            <Button icon={CreditCard} onClick={() => setModal("payment")}>To&apos;lov qabul qilish</Button>
          </>
        }
      />

      {usesDefaultAdminPassword({ settings }) && (
        <Link href="/admin/sozlamalar" className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning transition hover:bg-warning/15">
          <ShieldAlert className="size-5 shrink-0" />
          <span><b>{t("Xavfsizlik")}:</b> {t("admin uchun standart parol ishlatilmoqda. Sozlamalarda uni almashtiring →")}</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jami talabalar" value={`${money(students.length)} ta`} delta={`+${newThisMonth} ta shu oy`} icon={Users} />
        <StatCard label="Faol guruhlar" value={`${activeGroups.length} ta`} delta={`${courses.length} ta kursda`} icon={Layers} tone="ai" />
        <StatCard label="Ustozlar" value={`${teachers.length} nafar`} delta={`${teachers.length ? Math.round((activeTeachers / teachers.length) * 100) : 0}% faol`} icon={GraduationCap} tone="warning" />
        <StatCard
          label="Oylik daromad" value={`${millions(stats.cur)} so'm`} icon={Wallet} tone="success"
          delta={stats.deltaPct === null ? "O'tgan oy ma'lumoti yo'q" : `${stats.deltaPct >= 0 ? "+" : ""}${stats.deltaPct}% ${stats.deltaPct >= 0 ? "o'sish" : "pasayish"}`}
          deltaTone={stats.deltaPct !== null && stats.deltaPct < 0 ? "danger" : "success"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardTitle icon={TrendingUp} action={<Badge tone="info">Oylik</Badge>}>Daromadlar dinamikasi</CardTitle>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">{t("Kassa tushumi (shu oy)")}</p>
              <p className="text-xl font-extrabold">{money(stats.cur)} <span className="text-sm font-semibold text-slate-400">UZS</span></p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t("O'rtacha chek")}</p>
              <p className="text-xl font-extrabold">{money(stats.avgCheck)} <span className="text-sm font-semibold text-slate-400">UZS</span></p>
            </div>
          </div>
          <RevenueChart data={stats.chart} />
        </Card>

        <Card className="xl:col-span-2">
          <CardTitle>Davomat ko&apos;rsatkichi</CardTitle>
          <Donut
            centerValue={`${stats.att.present}%`}
            centerLabel="Ishtirok"
            slices={[
              { label: "Hozir bo'lganlar", value: stats.att.present, color: "#10b981" },
              { label: "Sababli", value: stats.att.excused, color: "#f59e0b" },
              { label: "Sababsiz", value: stats.att.absent, color: "#ef4444" },
            ]}
          />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardTitle icon={UserPlus}>Yangi talabalar</CardTitle>
          <TableWrap>
            <thead>
              <tr>{["Ismi", "Telefon", "Kurs", "Guruh", "Ro'yxatdan o'tdi", "Status"].map((h) => <th key={h} className={th}>{t(h)}</th>)}</tr>
            </thead>
            <tbody>
              {recent.map((s) => (
                <tr key={s.id} className="hover:bg-fg/[0.02]">
                  <td className={td}><div className="flex items-center gap-3"><Avatar name={s.name} size="sm" /><span className="whitespace-nowrap font-semibold">{s.name}</span></div></td>
                  <td className={`${td} whitespace-nowrap text-slate-300`}>{s.phone}</td>
                  <td className={td}>{courses.find((c) => c.id === s.courseId)?.name ?? "—"}</td>
                  <td className={`${td} text-slate-300`}>{groups.find((g) => g.id === s.groupId)?.name ?? "—"}</td>
                  <td className={`${td} whitespace-nowrap text-slate-400`}>{formatDate(s.createdAt)}</td>
                  <td className={td}><Badge tone={statusTone[s.status]}>{s.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>

        <Card className="xl:col-span-2">
          <CardTitle icon={DoorOpen}>Bugungi darslar (xonalar)</CardTitle>
          {todays.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line py-10 text-center text-sm text-slate-500">{t("Bugun dars yo'q")}</p>
          ) : (
            <ul className="space-y-3">
              {todays.map((g) => {
                const room = rooms.find((r) => r.id === g.roomId);
                return (
                  <li key={g.id} className="flex items-center gap-4 rounded-xl border border-line bg-low p-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-center text-[11px] font-extrabold leading-tight text-primary">{room?.name}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{courses.find((c) => c.id === g.courseId)?.name}</p>
                      <p className="truncate text-xs text-slate-400">{g.time} · {g.name} · {teachers.find((t) => t.id === g.teacherId)?.name}</p>
                    </div>
                    <Badge tone="info">{t("{n} o'quvchi", { n: students.filter((s) => s.groupId === g.id).length })}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <StudentForm open={modal === "student"} onClose={() => setModal(null)} />
      <GroupForm open={modal === "group"} onClose={() => setModal(null)} />
      <PaymentForm open={modal === "payment"} onClose={() => setModal(null)} />
    </>
  );
}
