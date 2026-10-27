"use client";

import { t } from "@/lib/i18n";
import { useState } from "react";
import { BookOpen, Clock, Layers, Plus, Users } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/ui/primitives";
import { EmptyState, RowActions, useDeleter } from "@/components/ui/crud";
import { CourseForm } from "@/components/admin/forms";
import { useDb, type Course } from "@/lib/db";
import { money } from "@/lib/format";

export default function CoursesPage() {
  const courses = useDb((s) => s.courses);
  const groups = useDb((s) => s.groups);
  const students = useDb((s) => s.students);
  const [form, setForm] = useState<{ open: boolean; item?: Course }>({ open: false });
  const { ask, dialog } = useDeleter();

  return (
    <>
      <PageHeader
        title="Kurslar"
        subtitle={`${courses.length} ta kurs`}
        actions={<Button variant="primary" icon={Plus} onClick={() => setForm({ open: true })}>+ Kurs qo&apos;shish</Button>}
      />
      {courses.length === 0 && <EmptyState text="Hozircha kurs yo'q" />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => (
          <Card key={c.id} className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BookOpen className="size-5" /></span>
              <RowActions onEdit={() => setForm({ open: true, item: c })} onDelete={() => ask("courses", c.id, c.name)} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold">{c.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{c.description || t("Tavsif kiritilmagan")}</p>
            </div>
            <p className="text-2xl font-extrabold text-primary">{money(c.price)} <span className="text-sm font-semibold text-slate-400">{t("so'm / oy")}</span></p>
            <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {t("{n} oy", { n: c.months })}</span>
              <span className="flex items-center gap-1.5"><Layers className="size-3.5" /> {t("{n} guruh", { n: groups.filter((g) => g.courseId === c.id).length })}</span>
              <span className="flex items-center gap-1.5"><Users className="size-3.5" /> {t("{n} talaba", { n: students.filter((s) => s.courseId === c.id).length })}</span>
            </div>
          </Card>
        ))}
      </div>
      <CourseForm open={form.open} item={form.item} onClose={() => setForm({ open: false })} />
      {dialog}
    </>
  );
}
