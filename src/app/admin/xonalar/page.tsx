"use client";

import { t } from "@/lib/i18n";
import { useState } from "react";
import { DoorOpen, Plus } from "lucide-react";
import { Badge, Button, Card, PageHeader } from "@/components/ui/primitives";
import { EmptyState, RowActions, useDeleter } from "@/components/ui/crud";
import { RoomForm } from "@/components/admin/forms";
import { useDb, type Room } from "@/lib/db";

export default function RoomsPage() {
  const rooms = useDb((s) => s.rooms);
  const groups = useDb((s) => s.groups);
  const teachers = useDb((s) => s.teachers);
  const [form, setForm] = useState<{ open: boolean; item?: Room }>({ open: false });
  const { ask, dialog } = useDeleter();

  return (
    <>
      <PageHeader
        title="Xonalar"
        subtitle={`${rooms.length} ta xona · jami ${rooms.reduce((a, r) => a + r.capacity, 0)} o'rin`}
        actions={<Button variant="primary" icon={Plus} onClick={() => setForm({ open: true })}>+ Xona qo&apos;shish</Button>}
      />
      {rooms.length === 0 && <EmptyState text="Hozircha xona yo'q" />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rooms.map((r) => {
          const schedule = groups.filter((g) => g.roomId === r.id && g.active).sort((a, b) => a.time.localeCompare(b.time));
          return (
            <Card key={r.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><DoorOpen className="size-5" /></span>
                <RowActions onEdit={() => setForm({ open: true, item: r })} onDelete={() => ask("rooms", r.id, r.name)} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold">{r.name}</h3>
                <p className="text-sm text-slate-400">{t("{n} o'rin", { n: r.capacity })}</p>
              </div>
              <Badge tone="info" className="w-fit">{r.kind}</Badge>
              <div className="mt-auto space-y-1.5 border-t border-line pt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("Dars jadvali")}</p>
                {schedule.length === 0 && <p className="text-xs text-slate-500">{t("Bo'sh")}</p>}
                {schedule.map((g) => (
                  <p key={g.id} className="text-xs text-slate-300">
                    <b>{g.time}</b> · {g.name} · {t(g.days)} · {teachers.find((t) => t.id === g.teacherId)?.name.split(" ")[0]}
                  </p>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      <RoomForm open={form.open} item={form.item} onClose={() => setForm({ open: false })} />
      {dialog}
    </>
  );
}
