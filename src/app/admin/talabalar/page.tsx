"use client";

import { t } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { Banknote, Download, KeyRound, UserPlus } from "lucide-react";
import { CredentialsModal } from "@/components/admin/CredentialsModal";
import { Avatar, Badge, Button, Card, PageHeader, TableWrap, td, th, type Tone } from "@/components/ui/primitives";
import { EmptyRow, FilterSelect, RowActions, SearchInput, useDeleter, useListSearch } from "@/components/ui/crud";
import { PaymentForm, StudentForm } from "@/components/admin/forms";
import { indexById, paidByStudent, useDb, type Student, type StudentStatus } from "@/lib/db";
import { downloadCSV, formatDate, money, monthKey, todayISO } from "@/lib/format";

const statusTone: Record<StudentStatus, Tone> = { Faol: "success", "Sinov darsi": "warning", Kutilmoqda: "muted" };

export default function StudentsPage() {
  const students = useDb((s) => s.students);
  const groups = useDb((s) => s.groups);
  const courses = useDb((s) => s.courses);
  const payments = useDb((s) => s.payments);

  const [q, setQ] = useListSearch();
  const [status, setStatus] = useState("");
  const [groupId, setGroupId] = useState("");
  const [form, setForm] = useState<{ open: boolean; item?: Student }>({ open: false });
  const [pay, setPay] = useState<{ open: boolean; studentId?: string }>({ open: false });
  const [cred, setCred] = useState<Student | null>(null);
  const { ask, dialog } = useDeleter();

  const month = monthKey(todayISO());
  const groupsById = useMemo(() => indexById(groups), [groups]);
  const coursesById = useMemo(() => indexById(courses), [courses]);
  const paidMap = useMemo(() => paidByStudent(payments, month), [payments, month]);
  const groupName = (id: string) => groupsById.get(id)?.name ?? "—";
  const courseOf = (id: string) => coursesById.get(id);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return students
      .filter((s) => (!status || s.status === status) && (!groupId || s.groupId === groupId))
      .filter((s) => !t || s.name.toLowerCase().includes(t) || s.phone.replace(/\s/g, "").includes(t.replace(/\s/g, "")))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [students, q, status, groupId]);

  function payState(s: Student) {
    if (s.status !== "Faol") return <span className="text-slate-500">—</span>;
    const fee = courseOf(s.courseId)?.price ?? 0;
    const paid = paidMap.get(s.id) ?? 0;
    if (paid >= fee) return <Badge tone="success">To&apos;langan</Badge>;
    if (paid > 0) return <Badge tone="warning">Qisman · {money(fee - paid)}</Badge>;
    return <Badge tone="danger">Qarz · {money(fee)}</Badge>;
  }

  function exportCsv() {
    downloadCSV("talabalar.csv", [
      ["Ism", "Telefon", "Kurs", "Guruh", "Status", "Ro'yxatdan o'tgan"].map((h) => t(h)),
      ...rows.map((s) => [s.name, s.phone, courseOf(s.courseId)?.name ?? "", groupName(s.groupId), s.status, formatDate(s.createdAt)]),
    ]);
  }

  return (
    <>
      <PageHeader
        title="Talabalar"
        subtitle={`Jami ${students.length} ta talaba`}
        actions={
          <>
            <Button variant="primary" icon={UserPlus} onClick={() => setForm({ open: true })}>+ Talaba qo&apos;shish</Button>
            <Button icon={Download} onClick={exportCsv}>Eksport (CSV)</Button>
          </>
        }
      />
      <Card>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <SearchInput value={q} onChange={setQ} placeholder="Ism yoki telefon bo'yicha..." />
          <FilterSelect value={status} onChange={setStatus} all="Barcha statuslar" options={(["Faol", "Sinov darsi", "Kutilmoqda"] as const).map((s) => ({ value: s, label: s }))} />
          <FilterSelect value={groupId} onChange={setGroupId} all="Barcha guruhlar" options={groups.map((g) => ({ value: g.id, label: g.name }))} />
        </div>
        <TableWrap>
          <thead>
            <tr>{["Ismi", "Telefon", "Kurs", "Guruh", "Ro'yxatdan o'tdi", "Status", "Bu oy to'lovi", "Kirish", ""].map((h, i) => <th key={i} className={th}>{t(h)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-fg/[0.02]">
                <td className={td}><div className="flex items-center gap-3"><Avatar name={s.name} size="sm" /><span className="font-semibold">{s.name}</span></div></td>
                <td className={`${td} whitespace-nowrap text-slate-300`}>{s.phone}</td>
                <td className={td}>{courseOf(s.courseId)?.name ?? "—"}</td>
                <td className={`${td} text-slate-300`}>{groupName(s.groupId)}</td>
                <td className={`${td} whitespace-nowrap text-slate-400`}>{formatDate(s.createdAt)}</td>
                <td className={td}><Badge tone={statusTone[s.status]}>{s.status}</Badge></td>
                <td className={td}>{payState(s)}</td>
                <td className={td}>{s.cred ? <Badge tone="info"><KeyRound className="size-3" /> {s.cred.login}</Badge> : <span className="text-xs text-slate-500">{t("Berilmagan")}</span>}</td>
                <td className={td}>
                  <RowActions
                    extra={
                      <>
                        <button onClick={() => setCred(s)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-primary/10 hover:text-primary" aria-label={t("Login va parol berish")} title={t("Login va parol")}><KeyRound className="size-4" /></button>
                        <button onClick={() => setPay({ open: true, studentId: s.id })} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-success/10 hover:text-success" aria-label={t("To'lov qabul qilish")} title={t("To'lov qabul qilish")}><Banknote className="size-4" /></button>
                      </>
                    }
                    onEdit={() => setForm({ open: true, item: s })}
                    onDelete={() => ask("students", s.id, s.name)}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow cols={9} />}
          </tbody>
        </TableWrap>
      </Card>

      <StudentForm open={form.open} item={form.item} onClose={() => setForm({ open: false })} />
      <CredentialsModal kind="students" open={!!cred} item={cred ?? undefined} onClose={() => setCred(null)} />
      <PaymentForm open={pay.open} studentId={pay.studentId} onClose={() => setPay({ open: false })} />
      {dialog}
    </>
  );
}
