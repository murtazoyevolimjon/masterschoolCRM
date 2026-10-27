"use client";

import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { t } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { iconBtn } from "./styles";

/** Tungi (to'q) va kunduzgi (och) rejim o'rtasida almashtiradi; tanlov brauzerda saqlanadi. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  const label = theme === "dark" ? t("Kunduzgi rejimga o'tish") : t("Tungi rejimga o'tish");

  return (
    <button onClick={toggle} className={clsx(iconBtn, className)} aria-label={label} title={label}>
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
