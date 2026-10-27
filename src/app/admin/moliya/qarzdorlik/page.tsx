"use client";

import { t } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { AlertTriangle, Banknote, Users, Wallet } from "lucide-react";
import { Avatar, Badge, Button, Card, PageHeader, StatCard, TableWrap, td, th, inputCls } from "@/components/ui/primitives";
import { EmptyRow, SearchInput } from "@/components/ui/crud";
import { PaymentForm } from "@/components/admin/forms";
import { debtsFor, useDb } from "@/lib/db";
import { money, monthKey, monthLabel, todayISO } from "@/lib/format";

export default function DebtsPage() {
  const students = useDb((s) => s.students);
  const courses = useDb((s) => s.courses);
  const payments = useDb((s) => s.payments);
  const groups = useDb((s) => s.groups);
  const [month, setMonth] = useState(() => monthKey(todayISO()));
  const [q, setQ] = useState("");
  const [pay, setPay] = useState<{ open: boolean; studentId?: string; amount?: number }>({ open: false });

  const all = useMemo(() => debtsFor({ students, courses, payments }, month), [students, courses, payments, month]);
  const debtors = all.filter((r) => r.debt > 0).sort((a, b) => b.debt - a.debt);
  const rows = debtors.filter((r) => !q.trim() || r.student.name.toLowerCase().includes(q.trim().toLowerCase()));
  const totalDebt = debtors.reduce((a, r) => a + r.debt, 0);
  const expected = all.reduce((a, r) => a + r.fee, 0);
  const collected = all.reduce((a, r) => a + Math.min(r.paid, r.fee), 0);

  return (
    <>
      <PageHeader title="Qarzdorliklar" subtitle={`${monthLabel(month)} oyi uchun faol talabalar to'lovlari`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jami qarz" value={money(totalDebt)} delta="so'm" icon={AlertTriangle} deltaTone="danger" />
        <StatCard label="Qarzdorlar" value={`${debtors.length} ta`} delta={`${all.length} ta faol talabadan`} icon={Users} tone="warning" deltaTone="danger" />
        <StatCard label="Kutilgan tushum" value={money(expected)} delta="so'm" icon={Wallet} />
        <StatCard label="Yig'ilgan" value={`${expected ? Math.round((collected / expected) * 100) : 0}%`} delta={`${money(collected)} so'm`} icon={Banknote} tone="success" />
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <SearchInput value={q} onChange={setQ} placeholder="Talaba ismi..." />
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputCls} h-10 w-auto`} aria-label={t("Oy")} />
        </div>
        <TableWrap>
          <thead><tr>{["Talaba", "Telefon", "Kurs / guruh", "Oylik to'lov", "To'langan", "Qarz", ""].map((h, i) => <th key={i} className={th}>{t(h)}</th>)}</tr></thead>
          <tbody>
            {rows.map(({ student: s, course, fee, paid, debt }) => (
              <tr key={s.id} className="hover:bg-fg/[0.02]">
                <td className={td}><div className="flex items-center gap-3"><Avatar name={s.name} size="sm" /><span className="font-semibold">{s.name}</span></div></td>
                <td className={`${td} whitespace-nowrap text-slate-300`}>{s.phone}</td>
                <td className={td}>{course?.name}<span className="block text-xs text-slate-500">{groups.find((g) => g.id === s.groupId)?.name ?? t("Guruhsiz")}</span></td>
                <td className={`${td} whitespace-nowrap`}>{money(fee)}</td>
                <td className={`${td} whitespace-nowrap`}>{paid > 0 ? <Badge tone="warning">{money(paid)}</Badge> : <span className="text-slate-500">0</span>}</td>
                <td className={`${td} whitespace-nowrap font-extrabold text-danger`}>{money(debt)}</td>
                <td className={td}><div className="flex justify-end"><Button className="h-9 px-3" onClick={() => setPay({ open: true, studentId: s.id, amount: debt })}>To&apos;lov qabul qilish</Button></div></td>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow cols={7} text={debtors.length === 0 ? "Qarzdor talaba yo'q 🎉" : "Hech narsa topilmadi"} />}
          </tbody>
        </TableWrap>
      </Card>

      <PaymentForm open={pay.open} studentId={pay.studentId} amount={pay.amount} onClose={() => setPay({ open: false })} />
    </>
  );
}
