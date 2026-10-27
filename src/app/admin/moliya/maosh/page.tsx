"use client";

import { t } from "@/lib/i18n";
import { useState } from "react";
import { Banknote, CheckCircle2, Clock, Users } from "lucide-react";
import { Avatar, Badge, Button, Card, PageHeader, StatCard, TableWrap, td, th, inputCls } from "@/components/ui/primitives";
import { EmptyRow } from "@/components/ui/crud";
import { useDb } from "@/lib/db";
import { formatDate, money, monthKey, monthLabel, todayISO } from "@/lib/format";
import { toast } from "@/lib/store";

export default function SalaryPage() {
  const teachers = useDb((s) => s.teachers);
  const staff = useDb((s) => s.staff);
  const salaryPaid = useDb((s) => s.salaryPaid);
  const toggle = useDb((s) => s.toggleSalary);
  const [month, setMonth] = useState(() => monthKey(todayISO()));

  const rows = [
    ...teachers.filter((t) => t.active).map((t) => ({ id: t.id, name: t.name, role: "Ustoz", salary: t.salary })),
    ...staff.filter((w) => w.active).map((w) => ({ id: w.id, name: w.name, role: w.position, salary: w.salary })),
  ];
  const paidOf = (id: string) => salaryPaid[`${id}|${month}`];
  const total = rows.reduce((a, r) => a + r.salary, 0);
  const paid = rows.filter((r) => paidOf(r.id)).reduce((a, r) => a + r.salary, 0);

  return (
    <>
      <PageHeader
        title="Oylik maoshlar"
        subtitle={`${monthLabel(month)} · faol ustoz va xodimlar`}
        actions={<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputCls} h-10 w-auto`} aria-label={t("Oy")} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jami maosh fondi" value={money(total)} delta="so'm" icon={Banknote} />
        <StatCard label="To'langan" value={money(paid)} delta={`${rows.filter((r) => paidOf(r.id)).length} / ${rows.length} kishi`} icon={CheckCircle2} tone="success" />
        <StatCard label="Qolgan" value={money(total - paid)} delta="so'm" icon={Clock} tone="warning" deltaTone="danger" />
        <StatCard label="Xodimlar soni" value={`${rows.length} ta`} delta="Ustoz + xodim" icon={Users} tone="ai" />
      </div>

      <Card>
        <TableWrap>
          <thead><tr>{["Xodim", "Lavozim", "Maosh", "Holati", ""].map((h, i) => <th key={i} className={th}>{t(h)}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => {
              const date = paidOf(r.id);
              return (
                <tr key={r.id} className="hover:bg-fg/[0.02]">
                  <td className={td}><div className="flex items-center gap-3"><Avatar name={r.name} size="sm" /><span className="font-semibold">{r.name}</span></div></td>
                  <td className={td}>{t(r.role)}</td>
                  <td className={`${td} whitespace-nowrap font-extrabold`}>{money(r.salary)} {t("so'm")}</td>
                  <td className={td}>{date ? <Badge tone="success">To&apos;landi · {formatDate(date)}</Badge> : <Badge tone="warning">Kutilmoqda</Badge>}</td>
                  <td className={td}>
                    <div className="flex justify-end">
                      <Button
                        variant={date ? "ghost" : "primary"} className="h-9 px-3"
                        onClick={() => { toggle(r.id, month, todayISO()); toast(date ? `${r.name}: to'lov bekor qilindi` : `${r.name}ga maosh to'landi`, date ? "info" : "success"); }}
                      >
                        {date ? "Bekor qilish" : "To'lash"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <EmptyRow cols={5} />}
          </tbody>
        </TableWrap>
      </Card>
    </>
  );
}
