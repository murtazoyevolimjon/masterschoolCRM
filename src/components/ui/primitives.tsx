import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import { t, tx } from "@/lib/i18n";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t(title)}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{t(subtitle)}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={clsx("card p-4 sm:p-5", className)}>{children}</section>;
}

export function CardTitle({ children, action, icon: Icon }: { children: React.ReactNode; action?: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-base font-bold">
        {Icon && <Icon className="size-5 text-primary" />}
        {tx(children)}
      </h2>
      {action}
    </div>
  );
}

export function Button({
  variant = "ghost",
  icon: Icon,
  className,
  children,
  ...rest
}: { variant?: "primary" | "ghost" | "danger"; icon?: LucideIcon } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50",
        variant === "primary" && "btn-primary",
        variant === "ghost" && "border border-line bg-low text-slate-200 hover:border-primary/40 hover:text-primary",
        variant === "danger" && "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20",
        className,
      )}
    >
      {Icon && <Icon className="size-4" />}
      {tx(children)}
    </button>
  );
}

const tones = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  info: "bg-primary/15 text-primary border-primary/30",
  ai: "bg-ai/15 text-violet-300 border-ai/30",
  muted: "bg-fg/5 text-slate-300 border-line",
} as const;
export type Tone = keyof typeof tones;

export function Badge({ tone = "muted", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold", tones[tone], className)}>
      {tx(children)}
    </span>
  );
}

export function Progress({ value, tone = "info", className }: { value: number; tone?: "info" | "success" | "warning" | "danger"; className?: string }) {
  const fill = {
    info: "bg-gradient-to-r from-primary to-electric",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[tone];
  return (
    <div className={clsx("h-2 overflow-hidden rounded-full bg-fg/10", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={clsx("h-full rounded-full transition-all duration-500", fill)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className={clsx(
        "grid shrink-0 place-items-center rounded-full font-bold text-white",
        size === "sm" && "size-8 text-xs",
        size === "md" && "size-10 text-sm",
        size === "lg" && "size-14 text-lg",
      )}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 50) % 360} 70% 35%))` }}
    >
      {initials}
    </span>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
        {t(label)}
        {hint}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "h-11 w-full rounded-xl border border-line bg-low px-3.5 text-sm outline-none transition placeholder:text-slate-500 focus:border-primary/60 focus:shadow-glow";

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; icon?: LucideIcon; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-line bg-low p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition",
            tab.id === value ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(6,182,212,0.3)]" : "text-slate-400 hover:text-fg",
          )}
        >
          {tab.icon && <tab.icon className="size-4" />}
          {t(tab.label)}
          {tab.count !== undefined && <span className="rounded-full bg-fg/10 px-1.5 text-[11px]">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function StatCard({
  label, value, delta, icon: Icon, tone = "info", deltaTone = "success",
}: { label: string; value: string; delta: string; icon: LucideIcon; tone?: "info" | "success" | "warning" | "ai"; deltaTone?: "success" | "danger" }) {
  const toneCls = {
    info: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    ai: "text-violet-300 bg-ai/15",
  }[tone];
  return (
    <div className="card p-4 sm:p-5 transition hover:border-primary/30 hover:shadow-glow">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-slate-400">{t(label)}</p>
        <span className={clsx("grid size-10 place-items-center rounded-xl", toneCls)}><Icon className="size-5" /></span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight">{t(value)}</p>
      <p className={clsx("mt-1 text-xs font-semibold", deltaTone === "danger" ? "text-danger" : "text-success")}>{t(delta)}</p>
    </div>
  );
}

/** Gorizontal scroll qilinadigan jadval o'rami */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}
export const th = "pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-slate-500";
export const td = "border-t border-line py-3 pr-4 align-middle";
