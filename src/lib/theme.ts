import { create } from "zustand";

export type Theme = "dark" | "light";

const KEY = "toyloq-theme";
const themeColor: Record<Theme, string> = { dark: "#0c1321", light: "#f4f7fb" };

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor[theme]);
}

export const useTheme = create<{ theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }>()((set, get) => ({
  theme: "dark",
  setTheme: (theme) => {
    apply(theme);
    try { localStorage.setItem(KEY, theme); } catch { /* maxfiy rejim: saqlanmaydi, lekin ishlaydi */ }
    set({ theme });
  },
  toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}));

/** Saqlangan mavzuni o'qib qo'llaydi (layout.tsx dagi skript sahifa chizilishidan oldin shuni qiladi). */
export function initTheme() {
  let saved: string | null = null;
  try { saved = localStorage.getItem(KEY); } catch { /* ruxsat yo'q */ }
  const theme: Theme = saved === "light" ? "light" : "dark";
  apply(theme);
  useTheme.setState({ theme });
}
