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

    // Boshqa oynada (tabda) o'zgargan ma'lumotni olamiz — aks holda eski nusxa yangisini ustidan yozib yuboradi
    const onStorage = (e: StorageEvent) => {
      if (e.key === "toyloq-db-v1") void useDb.persist.rehydrate();
      else if (e.key === "toyloq-session-v1") void useAuth.persist.rehydrate();
      else if (e.key === "toyloq-notices-v1") void useNoticeRead.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => { unsub(); window.removeEventListener("storage", onStorage); };
  }, []);
  return null;
}
