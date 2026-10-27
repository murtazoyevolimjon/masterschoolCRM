"use client";

import { t } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { Banknote, CreditCard, Download, Plus, Receipt, Wallet } from "lucide-react";
import { Badge, Button, Card, PageHeader, StatCard, TableWrap, td, th, inputCls } from "@/components/ui/primitives";
import { EmptyRow, FilterSelect, RowActions, SearchInput, useDeleter } from "@/components/ui/crud";
import { PaymentForm } from "@/components/admin/forms";
import { useDb, type Payment } from "@/lib/db";
import { downloadCSV, formatDate, money, monthKey, monthLabel, todayISO } from "@/lib/format";

export default function CashPage() {
  const payments = useDb((s) => s.payments);
  const students = useDb((s) => s.students);
  const [month, setMonth] = useState(() => monthKey(todayISO()));
  const [method, setMethod] = useState("");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<{ open: boolean; item?: Payment }>({ open: false });
  const { ask, dialog } = useDeleter();

  const nameOf = (id: string) => students.find((s) => s.id === id)?.name ?? t("O'chirilgan talaba");

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return payments
      .filter((p) => (!month || p.date.startsWith(month)) && (!method || p.method === method))
      .filter((p) => !t || nameOf(p.studentId).toLowerCase().includes(t))
      .sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, students, month, method, q]);

  const total = rows.reduce((a, p) => a + p.amount, 0);
  const byMethod = (m: string) => rows.filter((p) => p.method === m).reduce((a, p) => a + p.amount, 0);

  return (
    <>
      <PageHeader
        title="Kassa hisoboti"
        subtitle={month ? monthLabel(month) : "Barcha davr"}
        actions={
          <>
            <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true })}>To&apos;lov qabul qilish</Button>
            <Button icon={Download} onClick={() => downloadCSV(`kassa-${month || "hammasi"}.csv`, [
              ["Sana", "Talaba", "Summa", "Usul", "Izoh"].map((h) => t(h)),
              ...rows.map((p) => [formatDate(p.date), nameOf(p.studentId), p.amount, p.method, p.note]),
            ])}>Eksport (CSV)</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jami tushum" value={`${money(total)}`} delta="so'm" icon={Wallet} tone="success" />
        <StatCard label="To'lovlar soni" value={`${rows.length} ta`} delta={rows.length ? `O'rtacha ${money(total / rows.length)} so'm` : "—"} icon={Receipt} />
        <StatCard label="Naqd" value={money(byMethod("Naqd"))} delta="so'm" icon={Banknote} tone="warning" />
        <StatCard label="Karta / Click / Payme" value={money(total - byMethod("Naqd"))} delta="so'm" icon={CreditCard} tone="ai" />
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <SearchInput value={q} onChange={setQ} placeholder="Talaba ismi..." />
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputCls} h-10 w-auto`} aria-label={t("Oy")} />
          <FilterSelect value={method} onChange={setMethod} all="Barcha usullar" options={(["Naqd", "Karta", "Click", "Payme"] as const).map((m) => ({ value: m, label: m }))} />
        </div>
        <TableWrap>
          <thead><tr>{["Sana", "Talaba", "Summa", "Usul", "Izoh", ""].map((h, i) => <th key={i} className={th}>{t(h)}</th>)}</tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-fg/[0.02]">
                <td className={`${td} whitespace-nowrap text-slate-400`}>{formatDate(p.date)}</td>
                <td className={`${td} font-semibold`}>{nameOf(p.studentId)}</td>
                <td className={`${td} whitespace-nowrap font-extrabold text-success`}>+{money(p.amount)}</td>
                <td className={td}><Badge tone="info">{p.method}</Badge></td>
                <td className={`${td} text-slate-400`}>{p.note ? t(p.note) : "—"}</td>
                <td className={td}><RowActions onEdit={() => setForm({ open: true, item: p })} onDelete={() => ask("payments", p.id, `${nameOf(p.studentId)} — ${money(p.amount)} ${t("so'm")}`)} /></td>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow cols={6} text="Bu davrda to'lov yo'q" />}
          </tbody>
        </TableWrap>
      </Card>

      <PaymentForm open={form.open} item={form.item} onClose={() => setForm({ open: false })} />
      {dialog}
    </>
  );
}
