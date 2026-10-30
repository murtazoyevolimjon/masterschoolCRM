"use client";

import { t } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import { CredentialsModal } from "@/components/admin/CredentialsModal";
import { Avatar, Badge, Button, Card, PageHeader, TableWrap, td, th } from "@/components/ui/primitives";
import { EmptyRow, RowActions, SearchInput, useDeleter, useListSearch } from "@/components/ui/crud";
import { TeacherForm } from "@/components/admin/forms";
import { countBy, useDb, type Teacher } from "@/lib/db";
import { money } from "@/lib/format";

export default function TeachersPage() {
  const teachers = useDb((s) => s.teachers);
  const groups = useDb((s) => s.groups);
  const students = useDb((s) => s.students);
  const [q, setQ] = useListSearch();
  const [form, setForm] = useState<{ open: boolean; item?: Teacher }>({ open: false });
  const [cred, setCred] = useState<Teacher | null>(null);
  const { ask, dialog } = useDeleter();

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return teachers.filter((x) => !t || x.name.toLowerCase().includes(t) || x.specialty.toLowerCase().includes(t));
  }, [teachers, q]);

  // Ustoz -> guruhlari va talabalari soni (har qatorda qayta filtrlamaslik uchun bir marta hisoblanadi)
  const byTeacher = useMemo(() => {
    const perGroup = countBy(students, (s) => s.groupId);
    const map = new Map<string, { names: string[]; students: number }>();
    for (const g of groups) {
      const e = map.get(g.teacherId) ?? { names: [], students: 0 };
      e.names.push(g.name);
      e.students += perGroup.get(g.id) ?? 0;
      map.set(g.teacherId, e);
    }
    return map;
  }, [groups, students]);

  return (
    <>
      <PageHeader
        title="Ustozlar"
        subtitle={`${teachers.length} nafar ustoz · ${teachers.filter((t) => t.active).length} nafari faol`}
        actions={<Button variant="primary" icon={UserPlus} onClick={() => setForm({ open: true })}>+ Ustoz qo&apos;shish</Button>}
      />
      <Card>
        <div className="mb-4"><SearchInput value={q} onChange={setQ} placeholder="Ism yoki yo'nalish bo'yicha..." /></div>
        <TableWrap>
          <thead><tr>{["Ustoz", "Telefon", "Yo'nalish", "Guruhlar", "Talabalar", "Oylik maosh", "Holati", "Kirish", ""].map((h, i) => <th key={i} className={th}>{t(h)}</th>)}</tr></thead>
          <tbody>
            {rows.map((tc) => {
              const own = byTeacher.get(tc.id) ?? { names: [], students: 0 };
              return (
                <tr key={tc.id} className="hover:bg-fg/[0.02]">
                  <td className={td}><div className="flex items-center gap-3"><Avatar name={tc.name} size="sm" /><span className="font-semibold">{tc.name}</span></div></td>
                  <td className={`${td} whitespace-nowrap text-slate-300`}>{tc.phone}</td>
                  <td className={td}>{tc.specialty || <span className="text-slate-500">—</span>}</td>
                  <td className={td}>{own.names.length > 0 ? own.names.join(", ") : <span className="text-slate-500">—</span>}</td>
                  <td className={td}>{own.students}</td>
                  <td className={`${td} whitespace-nowrap font-semibold`}>{money(tc.salary)} {t("so'm")}</td>
                  <td className={td}><Badge tone={tc.active ? "success" : "muted"}>{tc.active ? "Faol" : "Nofaol"}</Badge></td>
                  <td className={td}>{tc.cred ? <Badge tone="info"><KeyRound className="size-3" /> {tc.cred.login}</Badge> : <span className="text-xs text-slate-500">{t("Berilmagan")}</span>}</td>
                  <td className={td}>
                    <RowActions
                      extra={<button onClick={() => setCred(tc)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-primary/10 hover:text-primary" aria-label={t("Login va parol berish")} title={t("Login va parol")}><KeyRound className="size-4" /></button>}
                      onEdit={() => setForm({ open: true, item: tc })}
                      onDelete={() => ask("teachers", tc.id, tc.name)}
                    />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <EmptyRow cols={9} />}
          </tbody>
        </TableWrap>
      </Card>
      <TeacherForm open={form.open} item={form.item} onClose={() => setForm({ open: false })} />
      <CredentialsModal kind="teachers" open={!!cred} item={cred ?? undefined} onClose={() => setCred(null)} />
      {dialog}
    </>
  );
}
