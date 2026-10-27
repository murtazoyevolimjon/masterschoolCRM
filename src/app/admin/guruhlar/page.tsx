"use client";

import { t } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Badge, Button, Card, PageHeader, Progress, TableWrap, td, th } from "@/components/ui/primitives";
import { EmptyRow, FilterSelect, RowActions, SearchInput, useDeleter, useListSearch } from "@/components/ui/crud";
import { GroupForm } from "@/components/admin/forms";
import { useDb, type Group } from "@/lib/db";

export default function GroupsPage() {
  const groups = useDb((s) => s.groups);
  const courses = useDb((s) => s.courses);
  const teachers = useDb((s) => s.teachers);
  const rooms = useDb((s) => s.rooms);
  const students = useDb((s) => s.students);
  const [q, setQ] = useListSearch();
  const [courseId, setCourseId] = useState("");
  const [form, setForm] = useState<{ open: boolean; item?: Group }>({ open: false });
  const { ask, dialog } = useDeleter();

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return groups.filter((g) => (!courseId || g.courseId === courseId) && (!t || g.name.toLowerCase().includes(t)));
  }, [groups, q, courseId]);

  return (
    <>
      <PageHeader
        title="Guruhlar"
        subtitle={`${groups.filter((g) => g.active).length} ta faol guruh`}
        actions={<Button variant="primary" icon={Plus} onClick={() => setForm({ open: true })}>+ Guruh yaratish</Button>}
      />
      <Card>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <SearchInput value={q} onChange={setQ} placeholder="Guruh nomi..." />
          <FilterSelect value={courseId} onChange={setCourseId} all="Barcha kurslar" options={courses.map((c) => ({ value: c.id, label: c.name }))} />
        </div>
        <TableWrap>
          <thead><tr>{["Guruh", "Kurs", "Ustoz", "Xona", "Jadval", "To'lish darajasi", "Holati", ""].map((h, i) => <th key={i} className={th}>{t(h)}</th>)}</tr></thead>
          <tbody>
            {rows.map((g) => {
              const room = rooms.find((r) => r.id === g.roomId);
              const count = students.filter((s) => s.groupId === g.id).length;
              const cap = room?.capacity ?? 0;
              const pct = cap ? Math.round((count / cap) * 100) : 0;
              return (
                <tr key={g.id} className="hover:bg-fg/[0.02]">
                  <td className={`${td} font-extrabold`}>{g.name}</td>
                  <td className={td}>{courses.find((c) => c.id === g.courseId)?.name ?? "—"}</td>
                  <td className={`${td} whitespace-nowrap`}>{teachers.find((t) => t.id === g.teacherId)?.name ?? "—"}</td>
                  <td className={td}>{room?.name ?? "—"}</td>
                  <td className={`${td} whitespace-nowrap text-slate-300`}>{t(g.days)} · {g.time}</td>
                  <td className={`${td} min-w-40`}>
                    <div className="mb-1 text-xs text-slate-400">{t("{count} / {cap} o'rin", { count, cap })}</div>
                    <Progress value={pct} tone={pct >= 100 ? "danger" : pct >= 80 ? "warning" : "info"} />
                  </td>
                  <td className={td}><Badge tone={g.active ? "success" : "muted"}>{g.active ? "Faol" : "Yopilgan"}</Badge></td>
                  <td className={td}><RowActions onEdit={() => setForm({ open: true, item: g })} onDelete={() => ask("groups", g.id, g.name)} /></td>
                </tr>
              );
            })}
            {rows.length === 0 && <EmptyRow cols={8} />}
          </tbody>
        </TableWrap>
      </Card>
      <GroupForm open={form.open} item={form.item} onClose={() => setForm({ open: false })} />
      {dialog}
    </>
  );
}
