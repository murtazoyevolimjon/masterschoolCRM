"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { useAuth, useSessionUser } from "@/lib/auth";
import type { Role } from "@/lib/nav";

/** Panelni faqat tegishli rolga ochadi; aks holda kirish sahifasiga qaytaradi. */
export function AuthGate({ role, children }: { role: Role; children: React.ReactNode }) {
  const router = useRouter();
  const ready = useAuth((s) => s.ready);
  const session = useAuth((s) => s.session);
  const user = useSessionUser();
  const allowed = !!user && user.role === role;

  useEffect(() => {
    if (!ready || allowed) return;
    // Hisob o'chirilgan/bloklangan bo'lsa sessiyani ham tozalaymiz
    if (session) useAuth.getState().signOut();
    router.replace("/");
  }, [ready, allowed, session, router]);

  if (!ready || !allowed) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="grid size-12 animate-pulse place-items-center rounded-xl btn-primary"><Zap className="size-6" /></div>
      </div>
    );
  }
  return <>{children}</>;
}
