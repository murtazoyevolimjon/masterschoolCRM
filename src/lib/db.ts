import { create } from "zustand";
import { persist } from "zustand/middleware";
import { weekday } from "./format";

/* ───────────── Turlar ───────────── */

/** Kirish ma'lumotlari: parol hech qachon ochiq saqlanmaydi, faqat tuz + hash. */
export type Cred = { login: string; salt: string; hash: string };

export type Course = { id: string; name: string; price: number; months: number; description: string };
export type Teacher = { id: string; name: string; phone: string; specialty: string; salary: number; active: boolean; joined: string; cred?: Cred };
export type RoomKind = "Laboratoriya" | "Sinf xonasi" | "Coworking";
export type Room = { id: string; name: string; capacity: number; kind: RoomKind };
export type DayPattern = "Du-Cho-Ju" | "Se-Pa-Sha";
export type Group = { id: string; name: string; courseId: string; teacherId: string; roomId: string; days: DayPattern; time: string; active: boolean };
export type StudentStatus = "Faol" | "Sinov darsi" | "Kutilmoqda";
export type Student = { id: string; name: string; phone: string; courseId: string; groupId: string; status: StudentStatus; createdAt: string; cred?: Cred };
export type Staff = { id: string; name: string; phone: string; position: string; salary: number; active: boolean };
export type PayMethod = "Naqd" | "Karta" | "Click" | "Payme";
export type Payment = { id: string; studentId: string; amount: number; method: PayMethod; date: string; note: string };
export type AttStatus = "present" | "late" | "excused" | "absent";
/** Admin maydonlari ixtiyoriy: eski saqlangan ma'lumotlarda bo'lmasa, standart qiymat ishlatiladi (auth.ts). */
export type Settings = { centerName: string; phone: string; address: string; adminName?: string; adminLogin?: string; adminSalt?: string; adminHash?: string };

export type Collections = {
  courses: Course; teachers: Teacher; rooms: Room; groups: Group; students: Student; staff: Staff; payments: Payment;
};

export type DbData = { [K in keyof Collections]: Collections[K][] } & {
  /** kalit: `${groupId}|${sana}|${studentId}` */
  attendance: Record<string, AttStatus>;
  /** kalit: `${id}|${yyyy-mm}` → to'langan sana */
  salaryPaid: Record<string, string>;
  settings: Settings;
};

export const dayNumbers: Record<DayPattern, number[]> = { "Du-Cho-Ju": [1, 3, 5], "Se-Pa-Sha": [2, 4, 6] };

/* ───────────── Boshlang'ich (demo) ma'lumotlar ───────────── */

function buildSeed(): DbData {
  const courses: Course[] = [
    { id: "c1", name: "Fullstack JavaScript & Node.js", price: 1_250_000, months: 8, description: "Frontend + Backend, MongoDB, deploy" },
    { id: "c2", name: "Frontend React", price: 1_100_000, months: 6, description: "HTML, CSS, JS, React, TypeScript" },
    { id: "c3", name: "Python Backend", price: 1_200_000, months: 7, description: "Python, Django, PostgreSQL, REST API" },
    { id: "c4", name: "UI/UX Dizayn", price: 900_000, months: 4, description: "Figma, prototiplash, dizayn tizimlari" },
  ];
  const teachers: Teacher[] = [
    { id: "t1", name: "Javohir Rahimov", phone: "+998 90 111 22 33", specialty: "Node.js, JavaScript", salary: 6_500_000, active: true, joined: "2024-02-01" },
    { id: "t2", name: "Malika Saidova", phone: "+998 91 222 33 44", specialty: "React, TypeScript", salary: 6_000_000, active: true, joined: "2024-06-15" },
    { id: "t3", name: "Dilshod Aliyev", phone: "+998 93 333 44 55", specialty: "Python, Django", salary: 6_200_000, active: true, joined: "2023-09-10" },
    { id: "t4", name: "Otabek Nazarov", phone: "+998 97 444 55 66", specialty: "Figma, UI/UX", salary: 5_000_000, active: true, joined: "2025-01-20" },
  ];
  const rooms: Room[] = [
    { id: "r1", name: "Lab-1", capacity: 20, kind: "Laboratoriya" },
    { id: "r2", name: "Lab-2", capacity: 24, kind: "Laboratoriya" },
    { id: "r3", name: "Lab-3", capacity: 20, kind: "Laboratoriya" },
    { id: "r4", name: "Coworking", capacity: 16, kind: "Coworking" },
  ];
  const groups: Group[] = [
    { id: "g1", name: "FS-24", courseId: "c1", teacherId: "t1", roomId: "r2", days: "Du-Cho-Ju", time: "16:30", active: true },
    { id: "g2", name: "FE-13", courseId: "c2", teacherId: "t2", roomId: "r3", days: "Du-Cho-Ju", time: "13:00", active: true },
    { id: "g3", name: "PY-08", courseId: "c3", teacherId: "t3", roomId: "r1", days: "Se-Pa-Sha", time: "10:00", active: true },
    { id: "g4", name: "UX-05", courseId: "c4", teacherId: "t4", roomId: "r4", days: "Se-Pa-Sha", time: "15:00", active: true },
  ];

  const people: [string, string, string, string, StudentStatus, string][] = [
    ["Sardorbek Karimov", "+998 90 123 45 67", "g1", "c1", "Faol", "2026-05-14"],
    ["Madina Yusupova", "+998 91 234 56 78", "g2", "c2", "Faol", "2026-06-02"],
    ["Jasur Abdullayev", "+998 93 345 67 89", "g3", "c3", "Faol", "2026-06-10"],
    ["Nilufar Rustamova", "+998 97 456 78 90", "g4", "c4", "Faol", "2026-07-01"],
    ["Bekzod Tursunov", "+998 88 567 89 01", "g1", "c1", "Faol", "2026-07-08"],
    ["Zilola Hamidova", "+998 90 678 90 12", "g2", "c2", "Faol", "2026-07-15"],
    ["Aziz Qodirov", "+998 91 789 01 23", "g3", "c3", "Faol", "2026-08-03"],
    ["Dildora Ergasheva", "+998 93 890 12 34", "g1", "c1", "Faol", "2026-08-12"],
    ["Shoxrux Mirzayev", "+998 94 901 23 45", "g2", "c2", "Faol", "2026-09-01"],
    ["Feruza Nazarova", "+998 95 012 34 56", "g4", "c4", "Faol", "2026-09-09"],
    ["Umid Sobirov", "+998 97 123 98 76", "g1", "c1", "Faol", "2026-09-20"],
    ["Gulnoza Raximova", "+998 99 234 87 65", "g3", "c3", "Faol", "2026-09-25"],
    ["Otabek Yo'ldoshev", "+998 90 345 76 54", "g2", "c2", "Sinov darsi", "2026-10-22"],
    ["Laylo Ismoilova", "+998 91 456 65 43", "g4", "c4", "Sinov darsi", "2026-10-24"],
    ["Rustam Normatov", "+998 93 567 54 32", "", "c1", "Kutilmoqda", "2026-10-25"],
    ["Kamola Aliyeva", "+998 94 678 43 21", "", "c3", "Kutilmoqda", "2026-10-26"],
  ];
  const students: Student[] = people.map(([name, phone, groupId, courseId, status, createdAt], i) => ({
    id: `s${i + 1}`, name, phone, groupId, courseId, status, createdAt,
  }));

  // Faol talabalar uchun oyma-oy to'lovlar (ba'zilari oktyabrda qarzdor)
  const methods: PayMethod[] = ["Naqd", "Karta", "Click", "Payme"];
  const owing = new Set(["s5", "s8", "s11", "s12"]);
  const payments: Payment[] = [];
  students.filter((s) => s.status === "Faol").forEach((s, i) => {
    const price = courses.find((c) => c.id === s.courseId)!.price;
    const start = Number(s.createdAt.slice(5, 7));
    for (let m = start; m <= 10; m++) {
      if (m === 10 && owing.has(s.id)) continue;
      const day = 3 + ((i * 7 + m * 3) % 22);
      payments.push({
        id: `p-${s.id}-${m}`, studentId: s.id, amount: price, method: methods[(i + m) % 4],
        date: `2026-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`, note: "Oylik to'lov",
      });
    }
  });

  // Oktyabr oyi davomati (dars kunlari bo'yicha)
  const attendance: Record<string, AttStatus> = {};
  groups.forEach((g, gi) => {
    const members = students.filter((s) => s.groupId === g.id && s.status === "Faol");
    for (let d = 1; d <= 26; d++) {
      const iso = `2026-10-${String(d).padStart(2, "0")}`;
      if (!dayNumbers[g.days].includes(weekday(iso))) continue;
      members.forEach((s, si) => {
        const h = (si * 7 + d * 13 + gi * 5) % 100;
        attendance[`${g.id}|${iso}|${s.id}`] = h < 5 ? "late" : h < 8 ? "excused" : h < 11 ? "absent" : "present";
      });
    }
  });

  const staff: Staff[] = [
    { id: "w1", name: "Azamat Shokirov", phone: "+998 90 000 11 22", position: "Direktor", salary: 8_000_000, active: true },
    { id: "w2", name: "Sevara Karimova", phone: "+998 91 000 22 33", position: "Administrator", salary: 3_500_000, active: true },
    { id: "w3", name: "Bobur Tojiyev", phone: "+998 93 000 33 44", position: "Buxgalter", salary: 4_500_000, active: true },
    { id: "w4", name: "Mohira Qosimova", phone: "+998 94 000 44 55", position: "Marketing menejeri", salary: 4_000_000, active: true },
  ];

  return {
    courses, teachers, rooms, groups, students, staff, payments, attendance, salaryPaid: {},
    settings: { centerName: "Masterschool", phone: "", address: "" },
  };
}

/* ───────────── Store ───────────── */

type Actions = {
  upsert: <K extends keyof Collections>(k: K, item: Collections[K]) => void;
  remove: <K extends keyof Collections>(k: K, id: string) => void;
  setAttendance: (groupId: string, date: string, studentId: string, status: AttStatus | null) => void;
  setAttendanceMany: (groupId: string, date: string, studentIds: string[], status: AttStatus) => void;
  toggleSalary: (id: string, month: string, paidDate: string) => void;
  updateSettings: (s: Settings) => void;
  reset: () => void;
};

const dataKeys = ["courses", "teachers", "rooms", "groups", "students", "staff", "payments", "attendance", "salaryPaid", "settings"] as const;

export const useDb = create<DbData & Actions>()(
  persist(
    (set) => ({
      ...buildSeed(),

      upsert: (k, item) =>
        set((s) => {
          const list = s[k] as { id: string }[];
          const next = list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
          return { [k]: next } as Pick<DbData, typeof k>;
        }),

      remove: (k, id) =>
        set((s) => {
          const patch = { [k]: (s[k] as { id: string }[]).filter((x) => x.id !== id) } as Partial<DbData>;
          if (k === "students") {
            patch.attendance = Object.fromEntries(Object.entries(s.attendance).filter(([key]) => !key.endsWith(`|${id}`)));
          }
          return patch;
        }),

      setAttendance: (groupId, date, studentId, status) =>
        set((s) => {
          const key = `${groupId}|${date}|${studentId}`;
          const next = { ...s.attendance };
          if (status) next[key] = status; else delete next[key];
          return { attendance: next };
        }),

      setAttendanceMany: (groupId, date, studentIds, status) =>
        set((s) => {
          const next = { ...s.attendance };
          studentIds.forEach((id) => { next[`${groupId}|${date}|${id}`] = status; });
          return { attendance: next };
        }),

      toggleSalary: (id, month, paidDate) =>
        set((s) => {
          const key = `${id}|${month}`;
          const next = { ...s.salaryPaid };
          if (next[key]) delete next[key]; else next[key] = paidDate;
          return { salaryPaid: next };
        }),

      updateSettings: (settings) => set({ settings }),
      // Admin hisobi (login/parol) demo ma'lumotlar bilan birga standartga qaytmaydi
      reset: () =>
        set((s) => {
          const { adminName, adminLogin, adminSalt, adminHash } = s.settings;
          const seed = buildSeed();
          return { ...seed, settings: { ...seed.settings, adminName, adminLogin, adminSalt, adminHash } };
        }),
    }),
    {
      // Kalit nomi o'zgartirilmagan: aks holda brauzerda saqlangan barcha ma'lumot yo'qolardi
      name: "toyloq-db-v1",
      version: 2,
      // v1 → v2: markaz eski nomi (TOYLOQ IT PARK) bilan saqlangan bo'lsa, yangi nomga o'tkaziladi
      migrate: (persisted) => {
        const state = persisted as Partial<DbData>;
        if (state.settings?.centerName === "TOYLOQ IT PARK") {
          state.settings = { ...state.settings, centerName: "Masterschool", address: state.settings.address.startsWith("Toyloq") ? "" : state.settings.address };
        }
        return state as DbData & Actions;
      },
      skipHydration: true, // SSR bilan mos kelishi uchun <StoreHydrator /> qo'lda chaqiradi
      partialize: (s) => Object.fromEntries(dataKeys.map((k) => [k, s[k]])) as unknown as DbData & Actions,
    },
  ),
);

/* ───────────── Hisob-kitob yordamchilari ───────────── */

/** O'chirishni to'sib qo'yadigan sabab (bo'lmasa null). */
export function deleteBlocker(s: DbData, k: keyof Collections, id: string): string | null {
  if (k === "courses" && (s.groups.some((g) => g.courseId === id) || s.students.some((x) => x.courseId === id)))
    return "Bu kursda guruh yoki talabalar bor — avval ularni boshqa kursga o'tkazing";
  if (k === "teachers" && s.groups.some((g) => g.teacherId === id)) return "Ustozga guruh biriktirilgan";
  if (k === "rooms" && s.groups.some((g) => g.roomId === id)) return "Bu xonada guruhlar dars o'tadi";
  if (k === "groups" && s.students.some((x) => x.groupId === id)) return "Guruhda talabalar bor — avval ularni boshqa guruhga o'tkazing";
  return null;
}

export const sumPaid = (payments: Payment[], studentId: string, month: string) =>
  payments.filter((p) => p.studentId === studentId && p.date.startsWith(month)).reduce((a, p) => a + p.amount, 0);

/** Oy uchun talaba -> to'langan summa. To'lovlar bir marta aylanadi (har talaba uchun `sumPaid` chaqirish o'rniga). */
export function paidByStudent(payments: Payment[], month: string) {
  const paid = new Map<string, number>();
  for (const p of payments) if (p.date.startsWith(month)) paid.set(p.studentId, (paid.get(p.studentId) ?? 0) + p.amount);
  return paid;
}

/** id bo'yicha tezkor qidiruv uchun jadval (ro'yxatda `find` ni takrorlamaslik uchun). */
export const indexById = <T extends { id: string }>(list: T[]) => new Map(list.map((x) => [x.id, x]));

/** Guruh bo'yicha talabalar soni. */
export function countBy<T>(list: T[], key: (x: T) => string) {
  const counts = new Map<string, number>();
  for (const x of list) counts.set(key(x), (counts.get(key(x)) ?? 0) + 1);
  return counts;
}

/** Talaba uchun o'yinlashtirish ko'rsatkichlari: davomatdan hisoblanadi. */
export function studentStats(attendance: Record<string, AttStatus>, studentId: string) {
  const mine = Object.entries(attendance)
    .filter(([k]) => k.endsWith(`|${studentId}`))
    .map(([k, v]) => ({ date: k.split("|")[1], v }))
    .sort((a, b) => b.date.localeCompare(a.date));
  const attended = mine.filter((r) => r.v === "present" || r.v === "late").length;
  let streak = 0;
  for (const r of mine) { if (r.v === "present" || r.v === "late") streak++; else break; }
  const xp = attended * 25;
  return { xp, level: Math.floor(xp / 300) + 1, streak, attended };
}

export type DebtRow = { student: Student; course?: Course; fee: number; paid: number; debt: number };

/** Berilgan oy uchun qarzdorlik: faol talabalar oylik to'lovi va tushgan summa farqi. */
export function debtsFor(db: Pick<DbData, "students" | "courses" | "payments">, month: string): DebtRow[] {
  const courses = indexById(db.courses);
  const paidMap = paidByStudent(db.payments, month);
  return db.students
    .filter((s) => s.status === "Faol" && s.createdAt.slice(0, 7) <= month)
    .map((student) => {
      const course = courses.get(student.courseId);
      const fee = course?.price ?? 0;
      const paid = paidMap.get(student.id) ?? 0;
      return { student, course, fee, paid, debt: Math.max(fee - paid, 0) };
    });
}
