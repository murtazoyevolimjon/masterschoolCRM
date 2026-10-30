"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, LogIn, Zap } from "lucide-react";
import { StoreHydrator } from "@/components/admin/StoreHydrator";
import { Toaster } from "@/components/ui/Toaster";
import { Button, Field, inputCls } from "@/components/ui/primitives";
import { authenticate, resolveUser, roleHome, useAuth, usesDefaultAdminPassword } from "@/lib/auth";
import { useDb } from "@/lib/db";
import { t, useLang } from "@/lib/i18n";
import { LangMenu } from "@/components/layout/LangMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const MAX_TRIES = 5;
const LOCK_SECONDS = 30;
const LOCK_KEY = "toyloq-login-lock";

export default function LoginPage() {
  const router = useRouter();
  const ready = useAuth((s) => s.ready);
  const session = useAuth((s) => s.session);
  const settings = useDb((s) => s.settings);
  useLang((s) => s.lang); // til almashganda sahifa qayta chiziladi
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [tries, setTries] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(0);

  // Allaqachon kirgan bo'lsa — o'z paneliga
  useEffect(() => {
    if (!ready || !session) return;
    const user = resolveUser(useDb.getState(), session);
    if (user) router.replace(roleHome[user.role]);
  }, [ready, session, router]);

  // Blokirovka sahifa yangilanganda ham saqlanib qolishi uchun localStorage'da turadi
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(LOCK_KEY) ?? 0);
      if (saved > Date.now()) { setNow(Date.now()); setLockedUntil(saved); }
    } catch { /* localStorage yopiq bo'lsa — faqat xotiradagi blokirovka ishlaydi */ }
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [lockedUntil]);

  const secondsLeft = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  const locked = lockedUntil > 0 && secondsLeft > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    const res = authenticate(useDb.getState(), login, password);
    if (res.ok) {
      useAuth.getState().signIn(res.session);
      router.replace(roleHome[res.session.role]);
      return;
    }
    const n = tries + 1;
    setPassword("");
    if (n >= MAX_TRIES) {
      setTries(0);
      const until = Date.now() + LOCK_SECONDS * 1000;
      setNow(Date.now());
      setLockedUntil(until);
      try { localStorage.setItem(LOCK_KEY, String(until)); } catch { /* e'tiborsiz */ }
      setError(t("Juda ko'p urinish. {n} soniyadan keyin qayta urinib ko'ring", { n: LOCK_SECONDS }));
    } else {
      setTries(n);
      setError(res.error);
    }
  }

  const showHint = ready && usesDefaultAdminPassword({ settings });

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <StoreHydrator />
      <div className="absolute right-4 top-4 flex gap-2">
        <LangMenu />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl btn-primary"><Zap className="size-7" /></div>
          <h1 className="text-3xl font-extrabold tracking-tight">{settings.centerName}</h1>
          <p className="mt-2 text-sm text-slate-400">{t("CRM & LMS platformasiga kirish")}</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6 shadow-glow" noValidate>
          <Field label="Login">
            <input
              value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" autoCapitalize="none" autoFocus
              className={inputCls} placeholder={t("login")}
            />
          </Field>
          <Field label="Parol">
            <div className="relative">
              <input
                type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" className={`${inputCls} pr-11`} placeholder="••••••••"
              />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary" aria-label={show ? t("Parolni yashirish") : t("Parolni ko'rsatish")}>
                {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </Field>

          {(error || locked) && (
            <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
              {locked ? t("Juda ko'p urinish. {n} soniyadan keyin urinib ko'ring", { n: secondsLeft }) : t(error)}
            </p>
          )}

          <Button type="submit" variant="primary" icon={LogIn} className="w-full" disabled={!ready || locked || !login || !password}>Kirish</Button>
        </form>

        {showHint && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <KeyRound className="mt-0.5 size-4 shrink-0" />
            <span>{t("Birinchi kirish uchun administrator:")} <b>admin</b> / <b>admin123</b>. {t("Kirgach, Sozlamalarda parolni darhol almashtiring.")}</span>
          </p>
        )}
        <p className="mt-6 text-center text-xs text-slate-500">{t("Login va parolni markaz administratori beradi.")}</p>
      </div>
      <Toaster />
    </main>
  );
}
