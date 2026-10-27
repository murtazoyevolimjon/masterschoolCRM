"use client";

import { useState } from "react";
import { Check, Copy, Dices, Eye, EyeOff, KeyRound, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button, Field, inputCls } from "@/components/ui/primitives";
import { generatePassword, loginTaken, makeCred, suggestLogin } from "@/lib/auth";
import { useDb, type Student, type Teacher } from "@/lib/db";
import { toast } from "@/lib/store";
import { t } from "@/lib/i18n";

type Props =
  | { open: boolean; onClose: () => void; kind: "teachers"; item?: Teacher }
  | { open: boolean; onClose: () => void; kind: "students"; item?: Student };

type Issued = { login: string; password: string };

function Body({ kind, item, onClose }: { kind: Props["kind"]; item: Teacher | Student; onClose: () => void }) {
  const upsert = useDb((s) => s.upsert);
  const [login, setLogin] = useState(item.cred?.login ?? suggestLogin(item.name));
  // Yangi hisob uchun parol oldindan yaratiladi; mavjud hisobda bo'sh qoldirilsa parol o'zgarmaydi
  const [password, setPassword] = useState(item.cred ? "" : generatePassword());
  const [show, setShow] = useState(true);
  const [issued, setIssued] = useState<Issued | null>(null);
  const [copied, setCopied] = useState(false);
  const hasCred = !!item.cred;

  function save(e: React.FormEvent) {
    e.preventDefault();
    const l = login.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(l)) return toast("Login 3–30 ta belgi: lotin harflari, raqam, nuqta, chiziq", "error");
    if (loginTaken(useDb.getState(), l, item.id)) return toast("Bu login band. Boshqasini tanlang", "error");
    if (!hasCred && password.length < 6) return toast("Parol kamida 6 ta belgi bo'lsin", "error");
    if (password && password.length < 6) return toast("Parol kamida 6 ta belgi bo'lsin", "error");

    const cred = password ? makeCred(l, password) : { ...item.cred!, login: l };
    if (kind === "teachers") upsert("teachers", { ...(item as Teacher), cred });
    else upsert("students", { ...(item as Student), cred });

    if (password) setIssued({ login: l, password });
    else { toast("Login yangilandi"); onClose(); }
  }

  function revoke() {
    if (kind === "teachers") upsert("teachers", { ...(item as Teacher), cred: undefined });
    else upsert("students", { ...(item as Student), cred: undefined });
    toast(t("{name}ning kirish huquqi olib tashlandi", { name: item.name }), "info");
    onClose();
  }

  async function copy() {
    if (!issued) return;
    const text = `${item.name}\nLogin: ${issued.login}\nParol: ${issued.password}\nKirish: ${location.origin}/`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { toast("Nusxalab bo'lmadi — qo'lda ko'chirib oling", "error"); }
  }

  if (issued) {
    return (
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          {t("Parol faqat hozir ko'rinadi — keyin tiklab bo'lmaydi (faqat yangisini berish mumkin). Uni {who} hoziroq yetkazing.", { who: t(kind === "teachers" ? "ustozga" : "o'quvchiga") })}
        </p>
        <dl className="space-y-3 rounded-xl border border-line-accent bg-low p-4 font-mono text-sm">
          <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("Login")}</dt><dd className="font-bold text-primary">{issued.login}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("Parol")}</dt><dd className="font-bold text-primary">{issued.password}</dd></div>
        </dl>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={onClose}>Yopish</Button>
          <Button variant="primary" icon={copied ? Check : Copy} onClick={copy}>{copied ? "Nusxalandi" : "Nusxalash"}</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-sm text-slate-400">
        {hasCred
          ? t("{name} uchun kirish ma'lumotlari berilgan. Loginni o'zgartirish yoki yangi parol berish mumkin.", { name: item.name })
          : t("{name} tizimga kirishi uchun login va parol bering.", { name: item.name })}
      </p>
      <Field label="Login">
        <input value={login} onChange={(e) => setLogin(e.target.value)} className={inputCls} autoCapitalize="none" autoComplete="off" required />
      </Field>
      <Field label={hasCred ? "Yangi parol (o'zgartirmaslik uchun bo'sh qoldiring)" : "Parol"}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pr-11 font-mono`} autoComplete="new-password" placeholder={hasCred ? "••••••" : ""}
            />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary" aria-label={t("Ko'rsatish/yashirish")}>
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          <Button type="button" icon={Dices} onClick={() => { setPassword(generatePassword()); setShow(true); }} className="h-11 px-3" title={t("Tasodifiy parol yaratish")}>Yaratish</Button>
        </div>
      </Field>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        {hasCred ? <Button type="button" variant="danger" onClick={revoke}>Kirishni o&apos;chirish</Button> : <span />}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" onClick={onClose}>Bekor qilish</Button>
          <Button type="submit" variant="primary" icon={KeyRound}>{hasCred ? "Saqlash" : "Hisob yaratish"}</Button>
        </div>
      </div>
    </form>
  );
}

export function CredentialsModal(props: Props) {
  const { open, onClose, item } = props;
  return (
    <Modal open={open && !!item} onClose={onClose} title="Login va parol berish">
      {item && <Body kind={props.kind} item={item} onClose={onClose} />}
    </Modal>
  );
}
