"use client";

import Link from "next/link";
import { Bot, ChevronDown, Download, Flame, Menu, Plus, Search } from "lucide-react";
import { useUi } from "@/lib/store";
import type { Role } from "@/lib/nav";
import { useSessionUser } from "@/lib/auth";
import { studentStats, useDb } from "@/lib/db";
import { money } from "@/lib/format";
import { t } from "@/lib/i18n";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { LangMenu } from "./LangMenu";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { iconBtn } from "./styles";

function SearchBox({ placeholder, className = "" }: { placeholder: string; className?: string }) {
  return (
    <label className={`relative min-w-0 flex-1 ${className}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        placeholder={t(placeholder)}
        aria-label={t(placeholder)}
        className="h-10 w-full rounded-xl border border-line bg-low pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-primary/60 focus:shadow-glow"
      />
    </label>
  );
}

export function Topbar({ role }: { role: Role }) {
  const setDrawer = useUi((s) => s.setDrawer);
  const setAi = useUi((s) => s.setAi);
  const user = useSessionUser();
  const attendance = useDb((s) => s.attendance);
  const allGroups = useDb((s) => s.groups);
  const myGroups = allGroups.filter((g) => g.teacherId === user?.teacher?.id);
  const stats = user?.student ? studentStats(attendance, user.student.id) : null;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button className={`${iconBtn} lg:hidden`} onClick={() => setDrawer(true)} aria-label={t("Menyu")}>
          <Menu className="size-5" />
        </button>

        {role === "admin" && (
          <>
            <AdminSearch />
            <span className="hidden items-center gap-2 whitespace-nowrap rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success xl:flex">
              <span className="size-2 animate-pulse rounded-full bg-success" /> {t("Barqaror")} 99.98%
            </span>
            <button onClick={() => setAi(true)} className="hidden h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-ai to-ai-soft px-3 text-sm font-bold text-white shadow-glow-ai sm:flex">
              <Bot className="size-4" /> <span className="hidden md:inline">AI</span>
            </button>
            <LangMenu className="hidden sm:block" />
            <ThemeToggle className="hidden sm:grid" />
            <NotificationBell />
          </>
        )}

        {role === "teacher" && (
          <>
            <label className="relative hidden shrink-0 sm:block">
              <select aria-label={t("Guruh")} className="h-10 appearance-none rounded-xl border border-line bg-low pl-3 pr-9 text-sm font-semibold outline-none focus:border-primary/60">
                {myGroups.length === 0 && <option>{t("Guruh biriktirilmagan")}</option>}
                {myGroups.map((g) => <option key={g.id} value={g.id}>{g.name} {g.time}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </label>
            <SearchBox placeholder="O'quvchi yoki vazifa qidirish..." />
            <Link href="/teacher/video" className="btn-primary hidden h-10 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 text-sm md:flex">
              <Plus className="size-4" /> {t("Yangi dars qo'shish")}
            </Link>
            <button className="hidden h-10 items-center gap-1.5 rounded-xl border border-line bg-low px-3 text-sm font-semibold text-slate-300 hover:text-primary xl:flex">
              <Download className="size-4" /> PDF / Excel
            </button>
            <LangMenu className="hidden sm:block" />
            <ThemeToggle className="hidden sm:grid" />
            <NotificationBell />
          </>
        )}

        {role === "student" && (
          <>
            <SearchBox placeholder="Dars yoki vazifa qidirish..." />
            <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-bold text-warning sm:flex">
              <Flame className="size-4" /> {t("{n} kun", { n: stats?.streak ?? 0 })}
            </span>
            <span className="hidden whitespace-nowrap rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary md:block">
              Level {stats?.level ?? 1} · {money(stats?.xp ?? 0)} XP
            </span>
            <LangMenu className="hidden sm:block" />
            <ThemeToggle className="hidden sm:grid" />
            <NotificationBell />
          </>
        )}

        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-electric text-sm font-bold text-white lg:hidden" title={user?.name}>
          {user?.initials}
        </div>
      </div>
    </header>
  );
}
