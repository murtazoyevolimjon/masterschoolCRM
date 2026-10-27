"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { navByRole, type Role } from "@/lib/nav";
import { t } from "@/lib/i18n";

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navByRole[role].flatMap((g) => g.items).filter((i) => i.mobile).slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-lowest/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = /^\/(admin|teacher|student)$/.test(item.href)
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold",
                  active ? "text-primary" : "text-slate-400",
                )}
              >
                <item.icon className={clsx("size-5", active && "drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]", item.ai && !active && "text-ai-soft")} />
                <span className="max-w-full truncate px-1">{t(item.label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
