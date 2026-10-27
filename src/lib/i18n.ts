import type { ReactNode } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { en } from "./i18n/en";
import { ru } from "./i18n/ru";

export type Lang = "uz" | "ru" | "en";

export const LANGS: { id: Lang; short: string; name: string }[] = [
  { id: "uz", short: "UZ", name: "O'zbekcha" },
  { id: "ru", short: "RU", name: "Русский" },
  { id: "en", short: "EN", name: "English" },
];

export const useLang = create<{ lang: Lang; setLang: (l: Lang) => void }>()(
  persist(
    (set) => ({ lang: "uz", setLang: (lang) => set({ lang }) }),
    { name: "toyloq-lang-v1", skipHydration: true, partialize: (s) => ({ lang: s.lang }) as never },
  ),
);

/*
 * Matnlar o'zbekcha yoziladi va shu matnning o'zi kalit bo'lib xizmat qiladi:
 * o'zbek tilida t() matnni o'zgartirmaydi, boshqa tillarda lug'atdan oladi.
 * Lug'atda topilmasa o'zbekcha matn qoladi (hech qachon bo'sh ko'rinmaydi).
 * Kalitda {nom} bo'lsa, u o'zgaruvchi sifatida ishlaydi: t("{n} ta kurs", { n: 3 }),
 * shuningdek tayyor `${n} ta kurs` matni ham shu andoza bo'yicha topiladi.
 */
const dicts: Record<Exclude<Lang, "uz">, Record<string, string>> = { ru, en };

type Pattern = { re: RegExp; names: string[]; value: string };
const patterns: Partial<Record<Lang, Pattern[]>> = {};
const memo = new Map<string, string>();

function patternsFor(lang: Exclude<Lang, "uz">): Pattern[] {
  return (patterns[lang] ??= Object.entries(dicts[lang])
    .filter(([key]) => key.includes("{"))
    .sort((a, b) => b[0].length - a[0].length)
    .map(([key, value]) => {
      const names: string[] = [];
      const src = key
        .replace(/[.*+?^$()|[\]\\]/g, "\\$&")
        .replace(/\{(\w+)\}/g, (_, n: string) => { names.push(n); return "(.+?)"; });
      return { re: new RegExp(`^${src}$`), names, value };
    }));
}

const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, n: string) => (n in vars ? String(vars[n]) : m));

export function t(key: string, vars?: Record<string, string | number>): string {
  const lang = useLang.getState().lang;
  if (lang === "uz") return vars ? fill(key, vars) : key;

  const direct = dicts[lang][key];
  if (direct !== undefined) return vars ? fill(direct, vars) : direct;

  const cacheKey = `${lang}\u0000${key}`;
  let out = memo.get(cacheKey);
  if (out === undefined) {
    out = key;
    for (const p of patternsFor(lang)) {
      const m = p.re.exec(key);
      if (m) { out = fill(p.value, Object.fromEntries(p.names.map((n, i) => [n, m[i + 1]]))); break; }
    }
    memo.set(cacheKey, out);
  }
  return vars ? fill(out, vars) : out;
}

/** Matn (yoki `Qisman · {summa}` kabi matn+raqam massivi) bo'lsa tarjima qiladi; boshqa JSX o'zgarishsiz qaytariladi. */
export const tx = (node: ReactNode): ReactNode => {
  if (typeof node === "string") return t(node);
  if (Array.isArray(node) && node.every((x) => typeof x === "string" || typeof x === "number")) return t(node.join(""));
  return node;
};
