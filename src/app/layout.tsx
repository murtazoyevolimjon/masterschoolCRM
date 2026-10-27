import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Masterschool — CRM & LMS",
  description: "Masterschool o'quv markazi uchun boshqaruv va ta'lim platformasi",
};

export const viewport: Viewport = {
  themeColor: "#0c1321",
  width: "device-width",
  initialScale: 1,
};

/** Sahifa chizilishidan oldin saqlangan mavzuni qo'llaydi (aks holda to'q sahifa bir lahza "chaqnab" ketadi). */
const themeScript = `(function(){try{var t=localStorage.getItem("toyloq-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" data-theme="dark" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
