"use client";

import { t } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { Avatar, Badge, Button, Card, PageHeader, TableWrap, td, th } from "@/components/ui/primitives";
import { EmptyRow, RowActions, SearchInput, useDeleter, useListSearch } from "@/components/ui/crud";
import { StaffForm } from "@/components/admin/forms";
import { useDb, type Staff } from "@/lib/db";
import { money } from "@/lib/format";

export default function StaffPage() {
  const staff = useDb((s) => s.staff);
  const [q, setQ] = useListSearch();
  const [form, setForm] = useState<{ open: boolean; item?: Staff }>({ open: false });
  const { ask, dialog } = useDeleter();

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return staff.filter((x) => !t || x.name.toLowerCase().includes(t) || x.position.toLowerCase().includes(t));
  }, [staff, q]);

  return (
    <>
      <PageHeader
        title="Xodimlar"
        subtitle={`${staff.length} nafar xodim`}
        actions={<Button variant="primary" icon={UserPlus} onClick={() => setForm({ open: true })}>+ Xodim qo&apos;shish</Button>}
      />
      <Card>
        <div className="mb-4"><SearchInput value={q} onChange={setQ} placeholder="Ism yoki lavozim..." /></div>
        <TableWrap>
          <thead><tr>{["Xodim", "Telefon", "Lavozim", "Oylik maosh", "Holati", ""].map((h, i) => <th key={i} className={th}>{t(h)}</th>)}</tr></thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id} className="hover:bg-fg/[0.02]">
                <td className={td}><div className="flex items-center gap-3"><Avatar name={w.name} size="sm" /><span className="font-semibold">{w.name}</span></div></td>
                <td className={`${td} whitespace-nowrap text-slate-300`}>{w.phone}</td>
                <td className={td}>{t(w.position)}</td>
                <td className={`${td} whitespace-nowrap font-semibold`}>{money(w.salary)} {t("so'm")}</td>
                <td className={td}><Badge tone={w.active ? "success" : "muted"}>{w.active ? "Faol" : "Nofaol"}</Badge></td>
                <td className={td}><RowActions onEdit={() => setForm({ open: true, item: w })} onDelete={() => ask("staff", w.id, w.name)} /></td>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow cols={6} />}
          </tbody>
        </TableWrap>
      </Card>
      <StaffForm open={form.open} item={form.item} onClose={() => setForm({ open: false })} />
      {dialog}
    </>
  );
}
