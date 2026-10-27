"use client";

import { useEffect, useState } from "react";

/** Berilgan soatdan boshlab sanaydigan oddiy taymer (mijozda ishga tushadi). */
export function Countdown({ hours }: { hours: number }) {
  const [left, setLeft] = useState(hours * 3600);

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (d > 0) return <span className="tabular-nums">{d} kun {h} soat qoldi</span>;
  return <span className="tabular-nums">{pad(h)}:{pad(m)}:{pad(s)} qoldi</span>;
}
