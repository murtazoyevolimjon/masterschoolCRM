"use client";

import { useEffect, useLayoutEffect } from "react";
import { useDb } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { useNoticeRead } from "@/lib/notifications";
import { initTheme } from "@/lib/theme";

/** localStorage'dagi ma'lumot, sessiya, til va mavzuni mount bo'lgandan keyin yuklaydi (SSR bilan mos kelishi uchun). */
export function StoreHydrator() {
  // Mavzu sahifa chizilishidan oldin qo'llanadi; dev rejimidagi qayta mount atributni o'chirib yuborishi mumkin
  useLayoutEffect(() => { initTheme(); }, []);

  useEffect(() => {
    const syncLang = (lang: string) => { document.documentElement.lang = lang; };
    const unsub = useLang.subscribe((s) => syncLang(s.lang));
    Promise.resolve(useDb.persist.rehydrate())
      .then(() => useNoticeRead.persist.rehydrate())
      .then(() => useLang.persist.rehydrate())
      .then(() => useAuth.persist.rehydrate())
      .finally(() => useAuth.setState({ ready: true }));
    return unsub;
  }, []);
  return null;
}
