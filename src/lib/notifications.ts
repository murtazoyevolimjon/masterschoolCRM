import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usesDefaultAdminPassword, type SessionUser } from "./auth";
import { dayNumbers, type DbData } from "./db";
import { addDays, monthKey, monthLabel, money, weekday } from "./format";
import { t } from "./i18n";

export type NoticeTone = "danger" | "warning" | "info" | "success";
export type Notice = { id: string; tone: NoticeTone; title: string; text: string; href?: string };

type Data = Pick<DbData, "students" | "teachers" | "staff" | "groups" | "courses" | "payments" | "attendance" | "salaryPaid" | "settings">;

const listNames = (names: string[], max = 3) =>
  names.length > max ? `${names.slice(0, max).join(", ")} +${names.length - max}` : names.join(", ");

/** Joriy oy uchun talaba -> to'langan summa (har talaba uchun payments'ni qayta aylanmaslik uchun). */
function paidThisMonth(payments: Data["payments"], month: string) {
  const paid = new Map<string, number>();
  for (const p of payments) if (p.date.startsWith(month)) paid.set(p.studentId, (paid.get(p.studentId) ?? 0) + p.amount);
  return paid;
}

/** Bugungi sana uchun davomat yozuvi bor guruhlar. */
function groupsMarkedOn(attendance: Data["attendance"], date: string) {
  const marked = new Set<string>();
  const needle = `|${date}|`;
  for (const key in attendance) if (key.includes(needle)) marked.add(key.slice(0, key.indexOf("|")));
  return marked;
}

/** Bazadagi haqiqiy holatdan bildirishnomalar hosil qiladi (alohida jadval saqlanmaydi). */
export function buildNotices(db: Data, user: SessionUser, today: string, nowHM: string): Notice[] {
  const out: Notice[] = [];
  const month = monthKey(today);
  const todayLessons = (groupsList: Data["groups"]) =>
    groupsList.filter((g) => g.active && dayNumbers[g.days].includes(weekday(today))).sort((a, b) => a.time.localeCompare(b.time));

  if (user.role === "admin") {
    const fees = new Map(db.courses.map((c) => [c.id, c.price]));
    const paid = paidThisMonth(db.payments, month);
    let debtors = 0;
    let debtSum = 0;
    for (const s of db.students) {
      if (s.status !== "Faol" || s.createdAt.slice(0, 7) > month) continue;
      const debt = Math.max((fees.get(s.courseId) ?? 0) - (paid.get(s.id) ?? 0), 0);
      if (debt > 0) { debtors++; debtSum += debt; }
    }
    if (debtors > 0) {
      out.push({
        id: `debt:${month}:${debtors}`, tone: "danger", title: t("Qarzdor talabalar"), href: "/admin/moliya/qarzdorlik",
        text: t("{n} ta talaba {month} uchun to'lamagan — jami {sum} so'm", { n: debtors, month: monthLabel(month), sum: money(debtSum) }),
      });
    }

    const lessons = todayLessons(db.groups);
    const marked = groupsMarkedOn(db.attendance, today);
    const open = lessons.filter((g) => g.time <= nowHM && !marked.has(g.id) && db.students.some((s) => s.groupId === g.id && s.status !== "Kutilmoqda"));
    if (open.length > 0) {
      out.push({
        id: `att:${today}:${open.map((g) => g.id).join(",")}`, tone: "warning", title: t("Davomat belgilanmagan"), href: "/admin/davomat",
        text: t("Bugungi dars boshlangan, davomat kiritilmagan: {groups}", { groups: listNames(open.map((g) => g.name)) }),
      });
    }
    if (lessons.length > 0) {
      out.push({
        id: `lessons:${today}`, tone: "info", title: t("Bugungi darslar"), href: "/admin/davomat",
        text: t("Bugun {n} ta dars: {groups}", { n: lessons.length, groups: listNames(lessons.map((g) => `${g.name} ${g.time}`)) }),
      });
    }

    const day = Number(today.slice(8, 10));
    const unpaid = day < 25 ? 0
      : db.teachers.filter((x) => x.active && !db.salaryPaid[`${x.id}|${month}`]).length
        + db.staff.filter((x) => x.active && !db.salaryPaid[`${x.id}|${month}`]).length;
    if (unpaid > 0) {
      out.push({
        id: `salary:${month}:${unpaid}`, tone: "warning", title: t("Maoshlar to'lanmagan"), href: "/admin/moliya/maosh",
        text: t("{n} nafar xodimga {month} maoshi hali to'lanmagan", { n: unpaid, month: monthLabel(month) }),
      });
    }

    const weekAgo = addDays(today, -7);
    const fresh = db.students.filter((s) => s.createdAt >= weekAgo).length;
    if (fresh > 0) {
      out.push({ id: `new:${today}:${fresh}`, tone: "success", title: t("Yangi talabalar"), href: "/admin/talabalar", text: t("Oxirgi 7 kunda {n} ta yangi talaba qo'shildi", { n: fresh }) });
    }
    const trial = db.students.filter((s) => s.status === "Sinov darsi").length;
    if (trial > 0) {
      out.push({ id: `trial:${trial}`, tone: "info", title: t("Sinov darslari"), href: "/admin/talabalar", text: t("{n} ta talaba sinov darsida — qaror kutilmoqda", { n: trial }) });
    }
    const waiting = db.students.filter((s) => s.status === "Kutilmoqda").length;
    if (waiting > 0) {
      out.push({ id: `wait:${waiting}`, tone: "info", title: t("Kutish ro'yxati"), href: "/admin/talabalar", text: t("{n} ta talaba guruhga joylashtirilishini kutmoqda", { n: waiting }) });
    }
    if (usesDefaultAdminPassword({ settings: db.settings })) {
      out.push({ id: "default-password", tone: "danger", title: t("Xavfsizlik"), href: "/admin/sozlamalar", text: t("Admin uchun standart parol ishlatilmoqda — uni almashtiring") });
    }
  }

  if (user.role === "teacher" && user.teacher) {
    const mine = db.groups.filter((g) => g.teacherId === user.id && g.active);
    if (mine.length === 0) {
      out.push({ id: "no-groups", tone: "info", title: t("Guruh yo'q"), text: t("Sizga hali guruh biriktirilmagan") });
    }
    const lessons = todayLessons(mine);
    if (lessons.length > 0) {
      out.push({
        id: `lessons:${today}`, tone: "info", title: t("Bugungi darslar"), href: "/teacher",
        text: t("Bugun {n} ta dars: {groups}", { n: lessons.length, groups: listNames(lessons.map((g) => `${g.name} ${g.time}`)) }),
      });
    }
    const weekAgo = addDays(today, -7);
    const ids = new Set(mine.map((g) => g.id));
    const fresh = db.students.filter((s) => ids.has(s.groupId) && s.createdAt >= weekAgo).length;
    if (fresh > 0) {
      out.push({ id: `new:${today}:${fresh}`, tone: "success", title: t("Yangi o'quvchilar"), text: t("Guruhlaringizga oxirgi 7 kunda {n} ta yangi o'quvchi qo'shildi", { n: fresh }) });
    }
  }

  if (user.role === "student" && user.student) {
    const s = user.student;
    if (s.status === "Faol") {
      const fee = db.courses.find((c) => c.id === s.courseId)?.price ?? 0;
      const paid = paidThisMonth(db.payments, month).get(s.id) ?? 0;
      if (fee > paid) {
        out.push({
          id: `pay:${month}:${fee - paid}`, tone: "warning", title: t("To'lov"), href: "/student/tolovlar",
          text: t("{month} uchun {sum} so'm to'lov kutilmoqda", { month: monthLabel(month), sum: money(fee - paid) }),
        });
      }
    }
    const group = db.groups.find((g) => g.id === s.groupId);
    if (group?.active) {
      if (dayNumbers[group.days].includes(weekday(today))) {
        out.push({ id: `lesson:${today}`, tone: "info", title: t("Bugun dars bor"), text: t("{group} guruhida bugun soat {time} da dars", { group: group.name, time: group.time }) });
      } else if (dayNumbers[group.days].includes(weekday(addDays(today, 1)))) {
        out.push({ id: `lesson:${addDays(today, 1)}`, tone: "info", title: t("Ertaga dars bor"), text: t("{group} guruhida ertaga soat {time} da dars", { group: group.name, time: group.time }) });
      }
    }
    let lastDate = "";
    let lastStatus = "";
    for (const key in db.attendance) {
      if (!key.endsWith(`|${s.id}`)) continue;
      const date = key.split("|")[1];
      if (date > lastDate) { lastDate = date; lastStatus = db.attendance[key]; }
    }
    if (lastStatus === "absent") {
      out.push({ id: `absent:${lastDate}`, tone: "warning", title: t("Dars qoldirildi"), href: "/student/baholar", text: t("Oxirgi darsda ({date}) siz sababsiz qatnashmagansiz", { date: lastDate.split("-").reverse().join(".") }) });
    }
  }

  return out;
}

/** O'qilgan bildirishnomalar: kalit `${rol}:${foydalanuvchi}:${bildirishnoma id}`. */
export const useNoticeRead = create<{ read: Record<string, true>; mark: (keys: string[]) => void }>()(
  persist(
    (set) => ({
      read: {},
      mark: (keys) =>
        set((s) => {
          const merged = { ...s.read };
          for (const k of keys) merged[k] = true;
          // Cheksiz o'smasligi uchun faqat oxirgi 300 tasi saqlanadi
          const all = Object.keys(merged);
          for (const k of all.slice(0, Math.max(0, all.length - 300))) delete merged[k];
          return { read: merged };
        }),
    }),
    { name: "toyloq-notices-v1", skipHydration: true, partialize: (s) => ({ read: s.read }) as never },
  ),
);
