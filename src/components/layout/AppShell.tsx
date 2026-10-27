"use client";

import type { Role } from "@/lib/nav";
import { useLang } from "@/lib/i18n";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";
import { AiWidget } from "./AiWidget";
import { Toaster } from "@/components/ui/Toaster";

export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  // Til almashganda butun panel qayta chiziladi: matnlar t() orqali olinadi (obuna talab qilmaydi)
  const lang = useLang((s) => s.lang);
  return (
    <div key={lang} className="min-h-dvh">
      <Sidebar role={role} />
      <div className="lg:ml-72">
        <Topbar role={role} />
        <main className="mx-auto w-full max-w-[1800px] space-y-6 px-4 pb-28 pt-6 sm:px-6 md:pb-10 lg:px-8">{children}</main>
      </div>
      <BottomNav role={role} />
      <AiWidget />
      <Toaster />
    </div>
  );
}
