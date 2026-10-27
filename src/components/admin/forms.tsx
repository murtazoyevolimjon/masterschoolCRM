"use client";

import { useState } from "react";
import { FormActions, Modal } from "@/components/ui/Modal";
import { Field, inputCls } from "@/components/ui/primitives";
import {
  useDb, type Course, type DayPattern, type Group, type PayMethod, type Payment, type Room, type RoomKind,
  type Staff, type Student, type StudentStatus, type Teacher,
} from "@/lib/db";
import { toast } from "@/lib/store";
import { t } from "@/lib/i18n";
import { todayISO, uid } from "@/lib/format";

type FormProps<T> = { open: boolean; onClose: () => void; item?: T };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => Number(fd.get(k) ?? 0);
const validPhone = (p: string) => p.replace(/\D/g, "").length >= 9;
const grid = "grid gap-4 sm:grid-cols-2";

/* ───────── Talaba ───────── */

function StudentBody({ item, onClose, presetGroupId }: { item?: Student; onClose: () => void; presetGroupId?: string }) {
  const { courses, groups, rooms, students, upsert } = useDb();
  const [courseId, setCourseId] = useState(item?.courseId ?? courses[0]?.id ?? "");
  const [status, setStatus] = useState<StudentStatus>(item?.status ?? "Faol");
  const available = groups.filter((g) => g.courseId === courseId && g.active);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = str(fd, "name");
    const phone = str(fd, "phone");
    const groupId = str(fd, "groupId");
    if (!validPhone(phone)) return toast("Telefon raqamini to'g'ri kiriting", "error");
    if (groupId) {
      const g = groups.find((x) => x.id === groupId)!;
      const cap = rooms.find((r) => r.id === g.roomId)?.capacity ?? Infinity;
      const taken = students.filter((s) => s.groupId === groupId && s.id !== item?.id).length;
      if (taken >= cap) return toast(`${g.name} guruhi to'lgan (${cap} ta joy)`, "error");
    }
    upsert("students", { id: item?.id ?? uid(), name, phone, courseId, groupId, status, createdAt: item?.createdAt ?? todayISO(), cred: item?.cred });
    toast(item ? "Talaba ma'lumotlari yangilandi" : `${name} qo'shildi`);
    onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Ism familiya"><input name="name" required defaultValue={item?.name} className={inputCls} placeholder={t("Ism Familiya")} /></Field>
      <Field label="Telefon"><input name="phone" type="tel" required defaultValue={item?.phone} className={inputCls} placeholder="+998 90 123 45 67" /></Field>
      <div className={grid}>
        <Field label="Kurs">
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Guruh">
          <select key={courseId} name="groupId" defaultValue={item?.courseId === courseId ? item?.groupId : (presetGroupId ?? "")} className={inputCls}>
            <option value="">{t("Guruhsiz (kutish ro'yxati)")}</option>
            {available.map((g) => <option key={g.id} value={g.id}>{g.name} · {g.time}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Status">
        <select value={status} onChange={(e) => setStatus(e.target.value as StudentStatus)} className={inputCls}>
          {(["Faol", "Sinov darsi", "Kutilmoqda"] as const).map((s) => <option key={s} value={s}>{t(s)}</option>)}
        </select>
      </Field>
      <FormActions onClose={onClose} label={item ? "Saqlash" : "Qo'shish"} />
    </form>
  );
}

export function StudentForm({ open, onClose, item }: FormProps<Student>) {
  return (
    <Modal open={open} onClose={onClose} title={item ? "Talabani tahrirlash" : "Yangi talaba qo'shish"}>
      <StudentBody item={item} onClose={onClose} />
    </Modal>
  );
}

/* ───────── Ustoz ───────── */

export function TeacherForm({ open, onClose, item }: FormProps<Teacher>) {
  const upsert = useDb((s) => s.upsert);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!validPhone(str(fd, "phone"))) return toast("Telefon raqamini to'g'ri kiriting", "error");
    upsert("teachers", {
      id: item?.id ?? uid(), name: str(fd, "name"), phone: str(fd, "phone"), specialty: str(fd, "specialty"),
      salary: num(fd, "salary"), active: str(fd, "active") === "1", joined: item?.joined ?? todayISO(), cred: item?.cred,
    });
    toast(item ? "Ustoz ma'lumotlari yangilandi" : "Ustoz qo'shildi");
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title={item ? "Ustozni tahrirlash" : "Yangi ustoz qo'shish"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Ism familiya"><input name="name" required defaultValue={item?.name} className={inputCls} /></Field>
        <div className={grid}>
          <Field label="Telefon"><input name="phone" type="tel" required defaultValue={item?.phone} className={inputCls} placeholder="+998 90 123 45 67" /></Field>
          <Field label="Yo'nalish"><input name="specialty" required defaultValue={item?.specialty} className={inputCls} placeholder="React, Node.js" /></Field>
        </div>
        <div className={grid}>
          <Field label="Oylik maosh (so'm)"><input name="salary" type="number" min={0} step={50000} required defaultValue={item?.salary ?? 5_000_000} className={inputCls} /></Field>
          <Field label="Holati">
            <select name="active" defaultValue={item?.active === false ? "0" : "1"} className={inputCls}><option value="1">{t("Faol")}</option><option value="0">{t("Nofaol")}</option></select>
          </Field>
        </div>
        <FormActions onClose={onClose} label={item ? "Saqlash" : "Qo'shish"} />
      </form>
    </Modal>
  );
}

/* ───────── Kurs ───────── */

export function CourseForm({ open, onClose, item }: FormProps<Course>) {
  const upsert = useDb((s) => s.upsert);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    upsert("courses", { id: item?.id ?? uid(), name: str(fd, "name"), price: num(fd, "price"), months: num(fd, "months"), description: str(fd, "description") });
    toast(item ? "Kurs yangilandi" : "Kurs qo'shildi");
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title={item ? "Kursni tahrirlash" : "Yangi kurs qo'shish"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Kurs nomi"><input name="name" required defaultValue={item?.name} className={inputCls} /></Field>
        <div className={grid}>
          <Field label="Oylik narx (so'm)"><input name="price" type="number" min={1} step={50000} required defaultValue={item?.price ?? 1_000_000} className={inputCls} /></Field>
          <Field label="Davomiyligi (oy)"><input name="months" type="number" min={1} max={36} required defaultValue={item?.months ?? 6} className={inputCls} /></Field>
        </div>
        <Field label="Tavsif"><textarea name="description" rows={3} defaultValue={item?.description} className={`${inputCls} h-auto resize-y py-3`} /></Field>
        <FormActions onClose={onClose} label={item ? "Saqlash" : "Qo'shish"} />
      </form>
    </Modal>
  );
}

/* ───────── Xona ───────── */

export function RoomForm({ open, onClose, item }: FormProps<Room>) {
  const upsert = useDb((s) => s.upsert);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    upsert("rooms", { id: item?.id ?? uid(), name: str(fd, "name"), capacity: num(fd, "capacity"), kind: str(fd, "kind") as RoomKind });
    toast(item ? "Xona yangilandi" : "Xona qo'shildi");
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title={item ? "Xonani tahrirlash" : "Yangi xona qo'shish"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Xona nomi"><input name="name" required defaultValue={item?.name} className={inputCls} placeholder="Lab-4" /></Field>
        <div className={grid}>
          <Field label="Sig'imi (o'rin)"><input name="capacity" type="number" min={1} max={200} required defaultValue={item?.capacity ?? 20} className={inputCls} /></Field>
          <Field label="Turi">
            <select name="kind" defaultValue={item?.kind ?? "Laboratoriya"} className={inputCls}>
              {(["Laboratoriya", "Sinf xonasi", "Coworking"] as const).map((k) => <option key={k} value={k}>{t(k)}</option>)}
            </select>
          </Field>
        </div>
        <FormActions onClose={onClose} label={item ? "Saqlash" : "Qo'shish"} />
      </form>
    </Modal>
  );
}

/* ───────── Guruh ───────── */

export function GroupForm({ open, onClose, item }: FormProps<Group>) {
  const { courses, teachers, rooms, groups, upsert } = useDb();
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const g: Group = {
      id: item?.id ?? uid(), name: str(fd, "name"), courseId: str(fd, "courseId"), teacherId: str(fd, "teacherId"),
      roomId: str(fd, "roomId"), days: str(fd, "days") as DayPattern, time: str(fd, "time"), active: str(fd, "active") === "1",
    };
    const clash = g.active && groups.find((x) => x.id !== g.id && x.active && x.days === g.days && x.time === g.time && (x.roomId === g.roomId || x.teacherId === g.teacherId));
    if (clash) return toast(`${clash.name} guruhi bilan vaqt to'qnashadi (xona yoki ustoz band)`, "error");
    upsert("groups", g);
    toast(item ? "Guruh yangilandi" : `${g.name} guruhi yaratildi`);
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title={item ? "Guruhni tahrirlash" : "Yangi guruh yaratish"}>
      {courses.length === 0 || teachers.length === 0 || rooms.length === 0 ? (
        <p className="text-sm text-slate-300">{t("Guruh yaratish uchun avval kamida bitta kurs, ustoz va xona qo'shing.")}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Guruh nomi"><input name="name" required defaultValue={item?.name} className={inputCls} placeholder="FE-14" /></Field>
          <Field label="Kurs">
            <select name="courseId" defaultValue={item?.courseId} className={inputCls}>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </Field>
          <div className={grid}>
            <Field label="Ustoz">
              <select name="teacherId" defaultValue={item?.teacherId} className={inputCls}>{teachers.filter((t) => t.active || t.id === item?.teacherId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
            </Field>
            <Field label="Xona">
              <select name="roomId" defaultValue={item?.roomId} className={inputCls}>{rooms.map((r) => <option key={r.id} value={r.id}>{t("{name} ({n} o'rin)", { name: r.name, n: r.capacity })}</option>)}</select>
            </Field>
          </div>
          <div className={grid}>
            <Field label="Dars kunlari">
              <select name="days" defaultValue={item?.days ?? "Du-Cho-Ju"} className={inputCls}><option value="Du-Cho-Ju">{t("Du-Cho-Ju")}</option><option value="Se-Pa-Sha">{t("Se-Pa-Sha")}</option></select>
            </Field>
            <Field label="Dars vaqti"><input name="time" type="time" required defaultValue={item?.time ?? "14:00"} className={`${inputCls}`} /></Field>
          </div>
          <Field label="Holati">
            <select name="active" defaultValue={item?.active === false ? "0" : "1"} className={inputCls}><option value="1">{t("Faol")}</option><option value="0">{t("Yopilgan")}</option></select>
          </Field>
          <FormActions onClose={onClose} label={item ? "Saqlash" : "Yaratish"} />
        </form>
      )}
    </Modal>
  );
}

/* ───────── Xodim ───────── */

export function StaffForm({ open, onClose, item }: FormProps<Staff>) {
  const upsert = useDb((s) => s.upsert);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!validPhone(str(fd, "phone"))) return toast("Telefon raqamini to'g'ri kiriting", "error");
    upsert("staff", { id: item?.id ?? uid(), name: str(fd, "name"), phone: str(fd, "phone"), position: str(fd, "position"), salary: num(fd, "salary"), active: str(fd, "active") === "1" });
    toast(item ? "Xodim yangilandi" : "Xodim qo'shildi");
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title={item ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Ism familiya"><input name="name" required defaultValue={item?.name} className={inputCls} /></Field>
        <div className={grid}>
          <Field label="Telefon"><input name="phone" type="tel" required defaultValue={item?.phone} className={inputCls} placeholder="+998 90 123 45 67" /></Field>
          <Field label="Lavozim"><input name="position" required defaultValue={item?.position} className={inputCls} placeholder={t("Administrator")} /></Field>
        </div>
        <div className={grid}>
          <Field label="Oylik maosh (so'm)"><input name="salary" type="number" min={0} step={50000} required defaultValue={item?.salary ?? 3_000_000} className={inputCls} /></Field>
          <Field label="Holati">
            <select name="active" defaultValue={item?.active === false ? "0" : "1"} className={inputCls}><option value="1">{t("Faol")}</option><option value="0">{t("Nofaol")}</option></select>
          </Field>
        </div>
        <FormActions onClose={onClose} label={item ? "Saqlash" : "Qo'shish"} />
      </form>
    </Modal>
  );
}

/* ───────── To'lov ───────── */

function PaymentBody({ item, onClose, studentId, amount }: { item?: Payment; onClose: () => void; studentId?: string; amount?: number }) {
  const { students, courses, upsert } = useDb();
  const [sid, setSid] = useState(item?.studentId ?? studentId ?? students[0]?.id ?? "");
  const price = courses.find((c) => c.id === students.find((s) => s.id === sid)?.courseId)?.price ?? 0;
  const [sum, setSum] = useState(String(item?.amount ?? amount ?? price));

  function pickStudent(id: string) {
    setSid(id);
    if (!item && amount === undefined) setSum(String(courses.find((c) => c.id === students.find((s) => s.id === id)?.courseId)?.price ?? 0));
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amt = Number(sum);
    if (!sid) return toast("Talabani tanlang", "error");
    if (!(amt > 0)) return toast("Summani kiriting", "error");
    upsert("payments", { id: item?.id ?? uid(), studentId: sid, amount: amt, method: str(fd, "method") as PayMethod, date: str(fd, "date"), note: str(fd, "note") });
    toast(item ? "To'lov yangilandi" : "To'lov qabul qilindi");
    onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Talaba">
        <select value={sid} onChange={(e) => pickStudent(e.target.value)} className={inputCls} required>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.phone}</option>)}
        </select>
      </Field>
      <div className={grid}>
        <Field label="Summa (so'm)"><input type="number" min={1} step={10000} required value={sum} onChange={(e) => setSum(e.target.value)} className={inputCls} /></Field>
        <Field label="To'lov usuli">
          <select name="method" defaultValue={item?.method ?? "Naqd"} className={inputCls}>{(["Naqd", "Karta", "Click", "Payme"] as const).map((m) => <option key={m} value={m}>{t(m)}</option>)}</select>
        </Field>
      </div>
      <Field label="Sana"><input name="date" type="date" required defaultValue={item?.date ?? todayISO()} className={`${inputCls}`} /></Field>
      <Field label="Izoh"><input name="note" defaultValue={item?.note ?? "Oylik to'lov"} className={inputCls} /></Field>
      <FormActions onClose={onClose} label={item ? "Saqlash" : "To'lovni qabul qilish"} />
    </form>
  );
}

export function PaymentForm({ open, onClose, item, studentId, amount }: FormProps<Payment> & { studentId?: string; amount?: number }) {
  return (
    <Modal open={open} onClose={onClose} title={item ? "To'lovni tahrirlash" : "To'lov qabul qilish"}>
      <PaymentBody item={item} onClose={onClose} studentId={studentId} amount={amount} />
    </Modal>
  );
}
