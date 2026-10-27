"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Code2, FileQuestion, Send, Sparkles, X } from "lucide-react";
import clsx from "clsx";
import { useUi } from "@/lib/store";
import { t } from "@/lib/i18n";

type Msg = { from: "ai" | "me"; text: string };

const quick = [
  { icon: FileQuestion, label: "Test yaratish", prompt: "Mavzu bo'yicha 5 ta test savoli yarat" },
  { icon: Code2, label: "Kodni tekshirish", prompt: "Mana mening kodim, xatolarni toping" },
  { icon: Sparkles, label: "Tushuntirish", prompt: "Bu mavzuni oddiy tilda tushuntirib ber" },
];

/** Demo javob generatori — haqiqiy LLM API ulanishi uchun `reply()` ni almashtiring. */
function reply(q: string): string {
  if (/test|тест/i.test(q)) return t("Albatta! Mavzuni yozing (masalan, “React hooks”) — men 5 ta variantli test savoli tayyorlab beraman.");
  if (/kod|code|код/i.test(q)) return t("Kodingizni shu yerga joylashtiring. Xatolar, xavfsizlik muammolari va yaxshilash takliflarini ko'rsataman.");
  return t("Tushundim. Savolingizni batafsilroq yozsangiz, qadam-baqadam javob beraman.");
}

export function AiWidget() {
  const open = useUi((s) => s.aiOpen);
  const setOpen = useUi((s) => s.setAi);
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ from: "ai", text: t("Salom! Men Masterschool AI yordamchisiman. Test yaratish, kodni tekshirish yoki savolingizga javob berishda yordam beraman.") }]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  function send(q = text) {
    const v = q.trim();
    if (!v) return;
    setMsgs((m) => [...m, { from: "me", text: t(v) }]);
    setText("");
    setTimeout(() => setMsgs((m) => [...m, { from: "ai", text: reply(v) }]), 500);
  }

  return (
    <>
      <div
        className={clsx(
          "fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-ai/30 bg-lowest shadow-glow-ai transition-all duration-200",
          "bottom-36 right-4 h-[28rem] w-[calc(100vw-2rem)] max-w-sm md:bottom-24 md:right-6",
          open ? "visible translate-y-0 opacity-100" : "invisible translate-y-4 opacity-0",
        )}
        role="dialog"
        aria-label={t("AI Yordamchi")}
      >
        <div className="flex items-center gap-3 bg-gradient-to-r from-ai/30 to-ai-soft/10 px-4 py-3">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-ai to-ai-soft"><Bot className="size-5" /></div>
          <div className="flex-1">
            <p className="text-sm font-bold">{t("AI Yordamchi")}</p>
            <p className="text-xs text-slate-400">{t("Doim onlayn")}</p>
          </div>
          <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-fg/10" aria-label={t("Yopish")}><X className="size-5" /></button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.map((m, i) => (
            <div key={i} className={clsx("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed", m.from === "me" ? "ml-auto bg-primary/20 text-cyan-50" : "bg-high")}>
              {m.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
          {quick.map((q) => (
            <button key={q.label} onClick={() => send(q.prompt)} className="flex shrink-0 items-center gap-1.5 rounded-full border border-ai/30 bg-ai/10 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-ai/20">
              <q.icon className="size-3.5" /> {t(q.label)}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-line p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("Savol yozing...")} aria-label={t("Savol yozing...")}
            className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-low px-3 text-sm outline-none focus:border-ai/60"
          />
          <button className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-ai to-ai-soft" aria-label={t("Yuborish")}><Send className="size-4" /></button>
        </form>
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 z-50 grid size-14 place-items-center rounded-full bg-gradient-to-br from-ai to-ai-soft shadow-glow-ai transition hover:scale-105 md:bottom-6 md:right-6"
        aria-label={t("AI Yordamchi")}
      >
        {open ? <X className="size-6" /> : <Bot className="size-6" />}
      </button>
    </>
  );
}
