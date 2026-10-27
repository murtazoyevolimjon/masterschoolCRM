"use client";

import { useMemo } from "react";
import Link from "next/link";
import clsx from "clsx";
import { AlertTriangle, Bell, BellOff, CheckCheck, CircleCheck, Info, type LucideIcon } from "lucide-react";
import { useSessionUser } from "@/lib/auth";
import { useDb } from "@/lib/db";
import { todayISO } from "@/lib/format";
import { t } from "@/lib/i18n";
import { buildNotices, useNoticeRead, type Notice, type NoticeTone } from "@/lib/notifications";
import { usePopover } from "@/lib/usePopover";
import { iconBtn } from "./styles";

const toneStyle: Record<NoticeTone, { icon: LucideIcon; cls: string }> = {
  danger: { icon: AlertTriangle, cls: "bg-danger/15 text-danger" },
  warning: { icon: AlertTriangle, cls: "bg-warning/15 text-warning" },
  info: { icon: Info, cls: "bg-primary/15 text-primary" },
  success: { icon: CircleCheck, cls: "bg-success/15 text-success" },
};

const nowHM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** Qo'ng'iroq: bazadagi haqiqiy holatdan (qarz, davomat, dars, maosh...) hosil bo'lgan bildirishnomalar. */
export function NotificationBell() {
  const user = useSessionUser();
  const students = useDb((s) => s.students);
  const teachers = useDb((s) => s.teachers);
  const staff = useDb((s) => s.staff);
  const groups = useDb((s) => s.groups);
  const courses = useDb((s) => s.courses);
  const payments = useDb((s) => s.payments);
  const attendance = useDb((s) => s.attendance);
  const salaryPaid = useDb((s) => s.salaryPaid);
  const settings = useDb((s) => s.settings);
  const read = useNoticeRead((s) => s.read);
  const mark = useNoticeRead((s) => s.mark);
  const { open, setOpen, ref } = usePopover();

  const role = user?.role;
  const id = user?.id;
  const prefix = `${role}:${id}:`;

  const notices = useMemo<Notice[]>(() => {
    if (!user) return [];
    return buildNotices({ students, teachers, staff, groups, courses, payments, attendance, salaryPaid, settings }, user, todayISO(), nowHM());
    // `user` har renderda yangi obyekt: rol va id o'zgargandagina qayta hisoblash kerak
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, id, students, teachers, staff, groups, courses, payments, attendance, salaryPaid, settings]);

  const unread = notices.filter((n) => !read[prefix + n.id]);
  const badge = unread.length > 9 ? "9+" : String(unread.length);
  const label = unread.length ? t("Bildirishnomalar: {n} ta yangi", { n: unread.length }) : t("Bildirishnomalar");

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={iconBtn} aria-label={label} title={label} aria-haspopup="true" aria-expanded={open}>
        <Bell className="size-5" />
        {unread.length > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-4.5 place-items-center rounded-full bg-danger px-1 text-[10px] font-extrabold leading-4.5 text-white ring-2 ring-canvas">{badge}</span>
        )}
      </button>

      {open && (
        <div className="animate-fade-up fixed inset-x-4 top-[4.25rem] z-40 overflow-hidden rounded-2xl border border-line-accent bg-lowest shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-sm font-extrabold">{t("Bildirishnomalar")}</h2>
            <button
              onClick={() => mark(unread.map((n) => prefix + n.id))} disabled={unread.length === 0}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:underline disabled:cursor-default disabled:text-slate-500 disabled:no-underline"
            >
              <CheckCheck className="size-4" /> {t("Hammasini o'qilgan deb belgilash")}
            </button>
          </div>

          {notices.length === 0 ? (
            <div className="grid place-items-center gap-2 px-4 py-10 text-center text-sm text-slate-500">
              <BellOff className="size-8" /> {t("Hozircha bildirishnoma yo'q")}
            </div>
          ) : (
            <ul className="max-h-[min(24rem,70dvh)] divide-y divide-line overflow-y-auto">
              {notices.map((n) => {
                const isUnread = !read[prefix + n.id];
                const { icon: Icon, cls } = toneStyle[n.tone];
                const body = (
                  <>
                    <span className={clsx("grid size-9 shrink-0 place-items-center rounded-xl", cls)}><Icon className="size-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={clsx("truncate text-sm", isUnread ? "font-extrabold" : "font-semibold text-slate-300")}>{n.title}</span>
                        {isUnread && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label={t("O'qilmagan")} />}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">{n.text}</span>
                    </span>
                  </>
                );
                const cn = "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-fg/5";
                return (
                  <li key={n.id}>
                    {n.href ? (
                      <Link href={n.href} className={cn} onClick={() => { mark([prefix + n.id]); setOpen(false); }}>{body}</Link>
                    ) : (
                      <button className={cn} onClick={() => mark([prefix + n.id])}>{body}</button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
