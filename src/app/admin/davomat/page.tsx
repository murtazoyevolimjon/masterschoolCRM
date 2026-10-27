"use client";

import { t } from "@/lib/i18n";
import { useState } from "react";
import clsx from "clsx";
import { CheckCheck } from "lucide-react";
import { Avatar, Button, Card, PageHeader, StatCard, inputCls } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/crud";
import { dayNumbers, useDb, type AttStatus } from "@/lib/db";
import { formatDate, todayISO, weekday } from "@/lib/format";
import { toast } from "@/lib/store";
import { CalendarCheck, Clock, UserCheck, UserX } from "lucide-react";

const options: { id: AttStatus; label: string; cls: string }[] = [
  { id: "present", label: "Keldi", cls: "border-success/50 bg-success/20 text-success" },
  { id: "late", label: "Kechikdi", cls: "border-warning/50 bg-warning/20 text-warning" },
  { id: "excused", label: "Sababli", cls: "border-sky-400/50 bg-sky-400/15 text-sky-300" },
  { id: "absent", label: "Sababsiz", cls: "border-danger/50 bg-danger/20 text-danger" },
];

export default function AttendancePage() {
  const groups = useDb((s) => s.groups).filter((g) => g.active);
  const students = useDb((s) => s.students);
  const attendance = useDb((s) => s.attendance);
  const setAttendance = useDb((s) => s.setAttendance);
  const setMany = useDb((s) => s.setAttendanceMany);

  const [groupId, setGroupId] = useState("");
  const [date, setDate] = useState(todayISO);
  const gid = groupId || groups[0]?.id || "";
  const group = groups.find((g) => g.id === gid);
  const members = students.filter((s) => s.groupId === gid && s.status !== "Kutilmoqda");
  const isLessonDay = group ? dayNumbers[group.days].includes(weekday(date)) : true;

  const statusOf = (sid: string) => attendance[`${gid}|${date}|${sid}`];
  const count = (st: AttStatus) => members.filter((m) => statusOf(m.id) === st).length;
  const marked = members.filter((m) => statusOf(m.id)).length;

  return (
    <>
      <PageHeader title="Davomat" subtitle="Guruh va sanani tanlab, o'quvchilar davomatini belgilang" />

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("Guruh")}</span>
            <select value={gid} onChange={(e) => setGroupId(e.target.value)} className={inputCls}>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name} · {t(g.days)} {g.time}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("Sana")}</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls}`} />
          </label>
        </div>
        {!isLessonDay && (
          <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            {t("{date} — bu guruhning dars kuni emas ({days}). Baribir belgilash mumkin.", { date: formatDate(date), days: t(group?.days ?? "") })}
          </p>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Keldi" value={String(count("present"))} delta={`${marked} / ${members.length} belgilangan`} icon={UserCheck} tone="success" />
        <StatCard label="Kechikdi" value={String(count("late"))} delta="Dars boshlanganidan keyin" icon={Clock} tone="warning" />
        <StatCard label="Sababli" value={String(count("excused"))} delta="Ruxsat bilan" icon={CalendarCheck} />
        <StatCard label="Sababsiz" value={String(count("absent"))} delta="Ogohlantirish kerak" icon={UserX} deltaTone="danger" />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold">{group ? t("{name} — o'quvchilar ({n})", { name: group.name, n: members.length }) : t("Guruh tanlanmagan")}</h2>
          <Button
            icon={CheckCheck}
            disabled={members.length === 0}
            onClick={() => { setMany(gid, date, members.map((m) => m.id), "present"); toast("Hamma o'quvchi “Keldi” deb belgilandi"); }}
          >
            Hammasini “Keldi”
          </Button>
        </div>

        {members.length === 0 ? (
          <EmptyState text="Bu guruhda o'quvchi yo'q" />
        ) : (
          <ul className="space-y-2">
            {members.map((m) => {
              const cur = statusOf(m.id);
              return (
                <li key={m.id} className="flex flex-col gap-3 rounded-xl border border-line bg-low p-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={m.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.phone}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {options.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => setAttendance(gid, date, m.id, cur === o.id ? null : o.id)}
                        className={clsx(
                          "rounded-lg border px-2 py-1.5 text-xs font-bold transition",
                          cur === o.id ? o.cls : "border-line text-slate-400 hover:border-fg/20 hover:text-fg",
                        )}
                        aria-pressed={cur === o.id}
                      >
                        {t(o.label)}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
