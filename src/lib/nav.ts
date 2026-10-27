import {
  BookOpen, Bot, CalendarCheck, ClipboardList, CreditCard, DoorOpen, GraduationCap,
  LayoutDashboard, Layers, PlayCircle, Settings, Users, UserCog, UsersRound, Wallet,
  Trophy, UserRound, Banknote, type LucideIcon,
} from "lucide-react";

export type Role = "admin" | "teacher" | "student";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /** Badge qiymati bazadan jonli olinadi */
  liveBadge?: "students";
  ai?: boolean;
  /** Pastki mobil navigatsiyada ko'rsatiladimi */
  mobile?: boolean;
};

export type NavGroup = { title?: string; items: NavItem[] };

/** Markaz nomi bu yerda emas — Sozlamalardagi `settings.centerName` dan olinadi. */
export const roleMeta: Record<Role, { subtitle: string }> = {
  admin: { subtitle: "Boshqaruv Tizimi" },
  teacher: { subtitle: "O'qituvchi Kabineti" },
  student: { subtitle: "O'quvchi Portali" },
};

export const navByRole: Record<Role, NavGroup[]> = {
  admin: [
    {
      items: [
        { label: "Bosh sahifa", href: "/admin", icon: LayoutDashboard, mobile: true },
        { label: "Kurslar", href: "/admin/kurslar", icon: BookOpen },
        { label: "Guruhlar", href: "/admin/guruhlar", icon: Layers, mobile: true },
        { label: "Ustozlar", href: "/admin/ustozlar", icon: GraduationCap },
        { label: "Talabalar", href: "/admin/talabalar", icon: Users, liveBadge: "students", mobile: true },
        { label: "Davomat", href: "/admin/davomat", icon: CalendarCheck, mobile: true },
        { label: "Xonalar", href: "/admin/xonalar", icon: DoorOpen },
        { label: "Xodimlar", href: "/admin/xodimlar", icon: UserCog },
        { label: "AI Yordamchi", href: "/admin/ai", icon: Bot, ai: true, mobile: true },
      ],
    },
    {
      title: "Shaxsiy",
      items: [
        { label: "Kassa hisoboti", href: "/admin/moliya/kassa", icon: Wallet },
        { label: "Oylik maoshlar", href: "/admin/moliya/maosh", icon: Banknote },
        { label: "Qarzdorliklar", href: "/admin/moliya/qarzdorlik", icon: CreditCard },
        { label: "Sozlamalar", href: "/admin/sozlamalar", icon: Settings },
      ],
    },
  ],
  teacher: [
    {
      items: [
        { label: "Profil", href: "/teacher/profil", icon: UserRound },
        { label: "Guruhlar", href: "/teacher/guruhlar", icon: UsersRound, mobile: true },
        { label: "Akademik davomat", href: "/teacher/davomat", icon: CalendarCheck, mobile: true },
        { label: "Uyga vazifa", href: "/teacher", icon: ClipboardList, mobile: true },
        { label: "Video darslar", href: "/teacher/video", icon: PlayCircle, mobile: true },
        { label: "AI Yordamchi", href: "/teacher/ai", icon: Bot, ai: true },
        { label: "Mening maoshim", href: "/teacher/maosh", icon: Banknote },
      ],
    },
  ],
  student: [
    {
      items: [
        { label: "Bosh sahifa", href: "/student", icon: LayoutDashboard, mobile: true },
        { label: "Video darslar", href: "/student/video", icon: PlayCircle, mobile: true },
        { label: "Vazifalar", href: "/student/vazifalar", icon: ClipboardList, mobile: true },
        { label: "Baholar", href: "/student/baholar", icon: Trophy, mobile: true },
        { label: "To'lovlar", href: "/student/tolovlar", icon: CreditCard },
        { label: "AI Tyutor", href: "/student/ai", icon: Bot, ai: true, mobile: true },
      ],
    },
  ],
};

export const roles: Role[] = ["admin", "teacher", "student"];
