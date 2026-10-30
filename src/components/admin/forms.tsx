"use client";

import { useState } from "react";
import { Check, Copy, Dices, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { FormActions, Modal } from "@/components/ui/Modal";
import { Button, Field, inputCls } from "@/components/ui/primitives";
import { generatePin, loginTaken, makeCred, randomLogin } from "@/lib/auth";
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
const digits = (p: string) => p.replace(/\D/g, "");
/** Ustozlar orasida telefon takrorlanmasin (o'quvchilarda aka-uka bir raqam ishlatishi mumkin, shuning uchun u yerda tekshirilmaydi). */
const teacherPhoneTaken = (phone: string, exceptId?: string) =>
  useDb.getState().teachers.some((x) => x.id !== exceptId && digits(x.phone) === digits(phone));
const grid = "grid gap-4 sm:grid-cols-2";

/* ───────── Talaba ───────── */

function StudentBody({ item, onClose, presetGroupId }: { item?: Student; onClose: () => void; presetGroupId?: string }) {
  const courses = useDb((s) => s.courses);
  const groups = useDb((s) => s.groups);
  const rooms = useDb((s) => s.rooms);
  const students = useDb((s) => s.students);
  const upsert = useDb((s) => s.upsert);
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

/** Yangi ustoz: ism, familiya, telefon va kirish ma'lumotlari. Yo'nalish/maosh keyin tahrirlashda kiritiladi. */
function NewTeacherBody({ onClose }: { onClose: () => void }) {
  const upsert = useDb((s) => s.upsert);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState(() => generatePin());
  const [show, setShow] = useState(false);
  const [issued, setIssued] = useState<{ name: string; login: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const l = login.trim().toLowerCase();
    if (!validPhone(phone)) return toast("Telefon raqamini to'g'ri kiriting", "error");
    if (teacherPhoneTaken(phone)) return toast("Bu telefon raqamli ustoz allaqachon bor", "error");
    if (!/^[a-z0-9._-]{3,30}$/.test(l)) return toast("Login 3–30 ta belgi: lotin harflari, raqam, nuqta, chiziq", "error");
    if (loginTaken(useDb.getState(), l)) return toast("Bu login band. Boshqasini tanlang", "error");
    if (password.length < 6) return toast("Parol kamida 6 ta belgi bo'lsin", "error");

    const name = `${first.trim()} ${last.trim()}`;
    upsert("teachers", {
      id: uid(), name, phone: phone.trim(), specialty: "", salary: 0, active: true, joined: todayISO(), cred: makeCred(l, password),
    });
    toast("Ustoz qo'shildi");
    setIssued({ name, login: l, password });
  }

  async function copy() {
    if (!issued) return;
    const text = `${issued.name}\nLogin: ${issued.login}\nParol: ${issued.password}\nKirish: ${location.origin}/`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { toast("Nusxalab bo'lmadi — qo'lda ko'chirib oling", "error"); }
  }

  if (issued) {
    return (
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          {t("Parol faqat hozir ko'rinadi — keyin tiklab bo'lmaydi (faqat yangisini berish mumkin). Uni {who} hoziroq yetkazing.", { who: t("ustozga") })}
        </p>
        <dl className="space-y-3 rounded-xl border border-line-accent bg-low p-4 font-mono text-sm">
          <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("Login")}</dt><dd className="font-bold text-primary">{issued.login}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("Parol")}</dt><dd className="font-bold text-primary">{issued.password}</dd></div>
        </dl>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={onClose}>Yopish</Button>
          <Button variant="primary" icon={copied ? Check : Copy} onClick={copy}>{copied ? "Nusxalandi" : "Nusxalash"}</Button>
        </div>
      </div>
    );
  }

  const link = "mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-2 hover:underline";
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Ism"><input value={first} onChange={(e) => setFirst(e.target.value)} required className={inputCls} autoComplete="off" /></Field>
      <Field label="Familiya"><input value={last} onChange={(e) => setLast(e.target.value)} required className={inputCls} autoComplete="off" /></Field>
      <Field label="Telefon"><input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" required className={inputCls} placeholder="+998 90 123 45 67" /></Field>
      <div className={grid}>
        <div>
          <Field label="Login (tizimga kirish uchun - yagona)">
            <input value={login} onChange={(e) => setLogin(e.target.value)} required className={inputCls} placeholder="anvar_rustamov" autoCapitalize="none" autoComplete="off" />
          </Field>
          <button type="button" className={link} onClick={() => setLogin(randomLogin(useDb.getState(), first, last))}><Dices className="size-3.5" /> {t("Tasodifiy login")}</button>
        </div>
        <div>
          <Field label="Boshlang'ich parol">
            <div className="relative">
              <input
                type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                className={`${inputCls} pr-11 font-mono`} autoComplete="new-password"
              />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary" aria-label={t("Ko'rsatish/yashirish")}>
                {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </Field>
          <button type="button" className={link} onClick={() => { setPassword(generatePin()); setShow(true); }}><Dices className="size-3.5" /> {t("6 xonali tasodifiy parol")}</button>
        </div>
      </div>
      <FormActions onClose={onClose} label="Saqlash" />
    </form>
  );
}

export function TeacherForm({ open, onClose, item }: FormProps<Teacher>) {
  const upsert = useDb((s) => s.upsert);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!validPhone(str(fd, "phone"))) return toast("Telefon raqamini to'g'ri kiriting", "error");
    if (teacherPhoneTaken(str(fd, "phone"), item?.id)) return toast("Bu telefon raqamli ustoz allaqachon bor", "error");
    upsert("teachers", {
      id: item?.id ?? uid(), name: str(fd, "name"), phone: str(fd, "phone"), specialty: str(fd, "specialty"),
      salary: num(fd, "salary"), active: str(fd, "active") === "1", joined: item?.joined ?? todayISO(), cred: item?.cred,
    });
    toast(item ? "Ustoz ma'lumotlari yangilandi" : "Ustoz qo'shildi");
    onClose();
  }
  if (!item) {
    return (
      <Modal open={open} onClose={onClose} title="Yangi ustoz qo'shish">
        <NewTeacherBody onClose={onClose} />
      </Modal>
    );
  }
  return (
    <Modal open={open} onClose={onClose} title="Ustozni tahrirlash">
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
  const courses = useDb((s) => s.courses);
  const teachers = useDb((s) => s.teachers);
  const rooms = useDb((s) => s.rooms);
  const groups = useDb((s) => s.groups);
  const upsert = useDb((s) => s.upsert);
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
  const students = useDb((s) => s.students);
  const courses = useDb((s) => s.courses);
  const upsert = useDb((s) => s.upsert);
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
