import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sha256 } from "./crypto";
import { useDb, type Cred, type DbData, type Student, type Teacher } from "./db";
import { uid } from "./format";
import type { Role } from "./nav";

/*
 * DIQQAT: bu faqat brauzerda ishlaydigan (frontend) autentifikatsiya.
 * Haqiqiy xavfsizlik uchun tekshiruv serverda bo'lishi shart — bu yerdagi hash va
 * sessiya foydalanuvchi o'z brauzerida o'zgartira oladigan ma'lumotdir.
 */

export type Session = { role: Role; id: string };

export const DEFAULT_ADMIN = {
  login: "admin",
  salt: "toyloq",
  hash: "6643d79849814ee50a5dbd8318ec7cf0f1a43804bf6cd3b14b7aad4b310e6c93", // sha256("toyloq:admin123")
};

export const hashPassword = (salt: string, password: string) => sha256(`${salt}:${password}`);

export function makeCred(login: string, password: string): Cred {
  const salt = uid();
  return { login: login.trim().toLowerCase(), salt, hash: hashPassword(salt, password) };
}

export function adminCred(db: Pick<DbData, "settings">): Cred {
  const s = db.settings;
  return { login: s.adminLogin ?? DEFAULT_ADMIN.login, salt: s.adminSalt ?? DEFAULT_ADMIN.salt, hash: s.adminHash ?? DEFAULT_ADMIN.hash };
}

export const usesDefaultAdminPassword = (db: Pick<DbData, "settings">) => adminCred(db).hash === DEFAULT_ADMIN.hash;

const matches = (c: Cred | undefined, login: string, password: string) =>
  !!c && c.login === login && c.hash === hashPassword(c.salt, password);

export type AuthResult = { ok: true; session: Session } | { ok: false; error: string };

export function authenticate(db: DbData, rawLogin: string, password: string): AuthResult {
  const login = rawLogin.trim().toLowerCase();
  const fail: AuthResult = { ok: false, error: "Login yoki parol noto'g'ri" };
  if (!login || !password) return fail;

  if (matches(adminCred(db), login, password)) return { ok: true, session: { role: "admin", id: "admin" } };

  const teacher = db.teachers.find((t) => matches(t.cred, login, password));
  if (teacher) return teacher.active ? { ok: true, session: { role: "teacher", id: teacher.id } } : { ok: false, error: "Hisobingiz faol emas. Administratorga murojaat qiling" };

  const student = db.students.find((s) => matches(s.cred, login, password));
  if (student) return { ok: true, session: { role: "student", id: student.id } };

  return fail;
}

/** Login boshqa foydalanuvchida band emasmi (admin, ustoz va talabalar orasida). */
export function loginTaken(db: DbData, login: string, exceptId?: string) {
  const l = login.trim().toLowerCase();
  return (
    adminCred(db).login === l ||
    db.teachers.some((t) => t.id !== exceptId && t.cred?.login === l) ||
    db.students.some((s) => s.id !== exceptId && s.cred?.login === l)
  );
}

export function suggestLogin(name: string) {
  const map: Record<string, string> = { "o'": "o", "g'": "g", "ʻ": "", "'": "", "’": "" };
  let s = name.toLowerCase();
  for (const [k, v] of Object.entries(map)) s = s.split(k).join(v);
  return s.replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
}

/** Chalkashtirib yuboradigan belgilarsiz (0/O, 1/l/I) tasodifiy parol. */
export function generatePassword(length = 8) {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => chars[n % chars.length]).join("");
}

/** Faqat raqamlardan iborat tasodifiy parol (masalan, 6 xonali). */
export function generatePin(length = 6) {
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => n % 10).join("");
}

/** Ism-familiyadan bo'sh (band bo'lmagan) login taklif qiladi. */
export function randomLogin(db: DbData, first: string, last: string) {
  const base = suggestLogin(`${first} ${last}`).replace(/\./g, "_") || "ustoz";
  let login = base;
  while (login.length < 3 || loginTaken(db, login)) login = `${base}${Math.floor(Math.random() * 900 + 100)}`;
  return login;
}

/* ───────── Sessiya ───────── */

type AuthState = {
  session: Session | null;
  /** localStorage'dan o'qib bo'lingach true bo'ladi */
  ready: boolean;
  signIn: (s: Session) => void;
  signOut: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      ready: false,
      signIn: (session) => set({ session }),
      signOut: () => set({ session: null }),
    }),
    { name: "toyloq-session-v1", skipHydration: true, partialize: (s) => ({ session: s.session }) as AuthState },
  ),
);

export const roleHome: Record<Role, string> = { admin: "/admin", teacher: "/teacher", student: "/student" };

export type SessionUser = {
  role: Role;
  id: string;
  name: string;
  sub: string;
  initials: string;
  teacher?: Teacher;
  student?: Student;
};

const initialsOf = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

/** Sessiyadagi foydalanuvchi; hisob o'chirilgan yoki login olib tashlangan bo'lsa null. */
export function resolveUser(db: DbData, session: Session | null): SessionUser | null {
  if (!session) return null;
  if (session.role === "admin") {
    const name = db.settings.adminName || "Administrator";
    return { role: "admin", id: "admin", name, sub: "Administrator", initials: initialsOf(name) };
  }
  if (session.role === "teacher") {
    const t = db.teachers.find((x) => x.id === session.id);
    return t?.cred && t.active ? { role: "teacher", id: t.id, name: t.name, sub: t.specialty || "Ustoz", initials: initialsOf(t.name), teacher: t } : null;
  }
  const s = db.students.find((x) => x.id === session.id);
  return s?.cred ? { role: "student", id: s.id, name: s.name, sub: s.status, initials: initialsOf(s.name), student: s } : null;
}

export function useSessionUser() {
  const session = useAuth((s) => s.session);
  const teachers = useDb((s) => s.teachers);
  const students = useDb((s) => s.students);
  const settings = useDb((s) => s.settings);
  return resolveUser({ ...useDb.getState(), teachers, students, settings }, session);
}
