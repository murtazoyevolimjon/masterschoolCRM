import { t } from "./i18n";

const pad = (n: number) => String(n).padStart(2, "0");

/** Server va brauzerda bir xil natija beradi (toLocaleString ishlatilmaydi — hydration xatosini oldini oladi). */
export const money = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export const millions = (n: number) => `${(n / 1_000_000).toFixed(1)}M`;

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const monthKey = (iso: string) => iso.slice(0, 7);

export function formatDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
export const monthName = (m: number) => t(monthNames[m]);

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return `${t(monthNames[m - 1])} ${y}`;
}

/** Oxirgi n oy kalitlari (eskidan yangiga), oxirgisi — `from` oyi. */
export function lastMonths(n: number, from = todayISO()) {
  const [y, m] = from.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(y, m - 1 - (n - 1 - i), 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  });
}

export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const daysBetween = (from: string, to: string) =>
  Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000);

export const weekdayNames = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

export const weekday = (iso: string) => new Date(`${iso}T00:00:00`).getDay();

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob(["﻿" + content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  downloadFile(filename, rows.map((r) => r.map(esc).join(",")).join("\r\n"), "text/csv;charset=utf-8");
}
