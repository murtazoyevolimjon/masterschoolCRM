"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { ChevronDown, LogOut, X, Zap } from "lucide-react";
import { navByRole, roleMeta, type Role } from "@/lib/nav";
import { useUi } from "@/lib/store";
import { useDb } from "@/lib/db";
import { useAuth, useSessionUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { t } from "@/lib/i18n";
import { LangMenu } from "./LangMenu";
import { ThemeToggle } from "./ThemeToggle";

function isActive(pathname: string, href: string) {
  // Ildiz sahifalar (/admin, /teacher, /student) faqat aniq mos kelganda faol bo'ladi
  if (/^\/(admin|teacher|student)$/.test(href)) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function SidebarBody({ role }: { role: Role }) {
  const pathname = usePathname();
  const setDrawer = useUi((s) => s.setDrawer);
  const meta = roleMeta[role];
  const studentCount = useDb((s) => s.students.length);
  const user = useSessionUser();
  const centerName = useDb((s) => s.settings.centerName);
  const [open, setOpen] = useState<Record<string, boolean>>({ Shaxsiy: true });

  return (
    <div className="flex h-full flex-col bg-lowest">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl btn-primary">
          <Zap className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold tracking-wide">{centerName}</p>
          <p className="truncate text-xs text-slate-400">{t(meta.subtitle)}</p>
        </div>
        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-fg/5 lg:hidden" onClick={() => setDrawer(false)} aria-label={t("Yopish")}>
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {navByRole[role].map((group, gi) => {
          const collapsible = !!group.title;
          const expanded = !collapsible || open[group.title!];
          return (
            <div key={gi} className="space-y-1">
              {collapsible && (
                <button
                  onClick={() => setOpen((o) => ({ ...o, [group.title!]: !o[group.title!] }))}
                  className="flex w-full items-center justify-between px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300"
                >
                  {t(group.title!)}
                  <ChevronDown className={clsx("size-4 transition", expanded && "rotate-180")} />
                </button>
              )}
              {expanded &&
                group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawer(false)}
                      className={clsx(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                        active
                          ? "bg-primary/10 text-primary shadow-[inset_3px_0_0_var(--color-primary)]"
                          : "text-slate-300 hover:bg-fg/5 hover:text-fg",
                      )}
                    >
                      <item.icon className={clsx("size-5 shrink-0", item.ai && !active && "text-ai-soft")} />
                      <span className="flex-1 truncate">{t(item.label)}</span>
                      {(item.liveBadge || item.badge) && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                          {item.liveBadge === "students" ? money(studentCount) : item.badge}
                        </span>
                      )}
                      {item.ai && (
                        <span className="rounded-md bg-gradient-to-r from-ai to-ai-soft px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-glow-ai">
                          AI PRO
                        </span>
                      )}
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line p-4">
        <div className="mb-3 flex gap-2 lg:hidden">
          <ThemeToggle />
          <LangMenu placement="up" />
        </div>
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-electric text-sm font-bold text-white">
            {user?.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{t(user?.name ?? "")}</p>
            <p className="flex items-center gap-1.5 truncate text-xs text-slate-400">
              <span className="size-1.5 rounded-full bg-success" /> {t("Onlayn")} · {t(user?.sub ?? "")}
            </p>
          </div>
          <button onClick={() => useAuth.getState().signOut()} className="rounded-lg p-2 text-slate-400 transition hover:bg-danger/10 hover:text-danger" aria-label={t("Chiqish")} title={t("Chiqish")}>
            <LogOut className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ role }: { role: Role }) {
  const drawerOpen = useUi((s) => s.drawerOpen);
  const setDrawer = useUi((s) => s.setDrawer);

  return (
    <>
      {/* Desktop: doimiy 288px */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-line lg:block">
        <SidebarBody role={role} />
      </aside>

      {/* Mobil / planshet: drawer */}
      <div className={clsx("fixed inset-0 z-50 lg:hidden", drawerOpen ? "visible" : "invisible")}>
        <div
          className={clsx("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity", drawerOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setDrawer(false)}
        />
        <aside
          className={clsx(
            "absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line transition-transform duration-300",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarBody role={role} />
        </aside>
      </div>
    </>
  );
}
