"use client";

import { t } from "@/lib/i18n";
import { useState } from "react";
import { Database, Download, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { adminCred, hashPassword, loginTaken, usesDefaultAdminPassword } from "@/lib/auth";
import { uid } from "@/lib/format";
import { Button, Card, CardTitle, Field, PageHeader, inputCls } from "@/components/ui/primitives";
import { ConfirmModal } from "@/components/ui/Modal";
import { useDb } from "@/lib/db";
import { downloadFile, todayISO } from "@/lib/format";
import { toast } from "@/lib/store";

function AdminAccount() {
  const settings = useDb((s) => s.settings);
  const update = useDb((s) => s.updateSettings);
  const cred = adminCred({ settings });
  const [show, setShow] = useState(false);
  const isDefault = usesDefaultAdminPassword({ settings });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const str = (k: string) => String(fd.get(k) ?? "");
    const login = str("login").trim().toLowerCase();
    const next = str("newPassword");

    if (hashPassword(cred.salt, str("current")) !== cred.hash) return toast("Joriy parol noto'g'ri", "error");
    if (!/^[a-z0-9._-]{3,30}$/.test(login)) return toast("Login 3–30 ta belgi: lotin harflari, raqam, nuqta, chiziq", "error");
    if (login !== cred.login && loginTaken(useDb.getState(), login)) return toast("Bu login band", "error");
    if (next && next.length < 8) return toast("Yangi parol kamida 8 ta belgi bo'lsin", "error");
    if (next && next !== str("confirm")) return toast("Yangi parol va tasdiqlash mos kelmadi", "error");

    const salt = next ? uid() : cred.salt;
    update({
      ...settings,
      adminName: str("name").trim() || "Administrator",
      adminLogin: login,
      adminSalt: salt,
      adminHash: next ? hashPassword(salt, next) : cred.hash,
    });
    form.reset();
    toast(next ? "Admin ma'lumotlari va parol yangilandi" : "Admin ma'lumotlari yangilandi");
  }

  return (
    <Card>
      <CardTitle icon={ShieldCheck}>Admin hisobi</CardTitle>
      {isDefault && (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{t("Hozir standart parol (admin123) ishlatilmoqda — uni almashtiring.")}</p>
      )}
      <form onSubmit={submit} className="space-y-4" autoComplete="off">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ism"><input name="name" defaultValue={settings.adminName ?? "Administrator"} className={inputCls} /></Field>
          <Field label="Login"><input name="login" required defaultValue={cred.login} className={inputCls} autoCapitalize="none" /></Field>
        </div>
        <Field label="Yangi parol (o'zgartirmaslik uchun bo'sh qoldiring)">
          <input name="newPassword" type={show ? "text" : "password"} className={inputCls} autoComplete="new-password" />
        </Field>
        <Field label="Yangi parolni tasdiqlang">
          <input name="confirm" type={show ? "text" : "password"} className={inputCls} autoComplete="new-password" />
        </Field>
        <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-cyan-400" /> {t("Parollarni ko'rsatish")}</label>
        <Field label="Joriy parol (tasdiqlash uchun)">
          <input name="current" type="password" required className={inputCls} autoComplete="current-password" />
        </Field>
        <Button variant="primary" type="submit" icon={Save}>Saqlash</Button>
      </form>
    </Card>
  );
}

export default function SettingsPage() {
  const settings = useDb((s) => s.settings);
  const update = useDb((s) => s.updateSettings);
  const reset = useDb((s) => s.reset);
  const [confirm, setConfirm] = useState(false);

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Admin hisob maydonlari (adminHash va h.k.) saqlanib qolishi uchun ...settings
    update({ ...settings, centerName: String(fd.get("centerName")).trim(), phone: String(fd.get("phone")).trim(), address: String(fd.get("address")).trim() });
    toast("Sozlamalar saqlandi");
  }

  function backup() {
    const s = useDb.getState();
    const { courses, teachers, rooms, groups, students, staff, payments, attendance, salaryPaid, settings } = s;
    downloadFile(`masterschool-zaxira-${todayISO()}.json`, JSON.stringify({ courses, teachers, rooms, groups, students, staff, payments, attendance, salaryPaid, settings }, null, 2), "application/json");
    toast("Zaxira nusxasi yuklab olindi");
  }

  return (
    <>
      <PageHeader title="Sozlamalar" subtitle="Markaz ma'lumotlari va ma'lumotlar boshqaruvi" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle>Markaz ma&apos;lumotlari</CardTitle>
          <form key={settings.centerName + settings.phone + settings.address} onSubmit={save} className="space-y-4">
            <Field label="Markaz nomi"><input name="centerName" required defaultValue={settings.centerName} className={inputCls} /></Field>
            <Field label="Telefon"><input name="phone" type="tel" defaultValue={settings.phone} className={inputCls} /></Field>
            <Field label="Manzil"><input name="address" defaultValue={settings.address} className={inputCls} /></Field>
            <Button variant="primary" type="submit" icon={Save}>Saqlash</Button>
          </form>
        </Card>

        <AdminAccount />

        <Card className="xl:col-span-2">
          <CardTitle icon={Database}>Ma&apos;lumotlar</CardTitle>
          <p className="mb-4 text-sm text-slate-400">
            {t("Hozircha barcha ma'lumotlar shu brauzerning xotirasida (localStorage) saqlanadi. Zaxira nusxasini yuklab oling yoki demo ma'lumotlarga qayting.")}{" "}
            {t("Diqqat: tiklash ustoz va talabalarning login-parollarini ham, admin parolini ham standart holatga qaytaradi.")}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button icon={Download} onClick={backup}>Zaxira nusxasi (JSON)</Button>
            <Button variant="danger" icon={RotateCcw} onClick={() => setConfirm(true)}>Demo ma&apos;lumotlarni tiklash</Button>
          </div>
        </Card>
      </div>

      <ConfirmModal
        open={confirm}
        title="Ma'lumotlarni tiklash"
        text="Barcha kiritilgan ma'lumotlar o'chirilib, demo ma'lumotlar qaytariladi. Davom etasizmi?"
        onClose={() => setConfirm(false)}
        onConfirm={() => { reset(); setConfirm(false); toast("Demo ma'lumotlar tiklandi", "info"); }}
      />
    </>
  );
}
