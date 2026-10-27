"use client";

import { t } from "@/lib/i18n";
import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Bot, CalendarX, Sparkles, Users } from "lucide-react";
import { Badge, Button, Card, CardTitle, PageHeader } from "@/components/ui/primitives";
import { debtsFor, useDb } from "@/lib/db";
import { money, monthKey, todayISO } from "@/lib/format";
import { useUi } from "@/lib/store";

export default function AiPage() {
  const db = useDb();
  const setAi = useUi((s) => s.setAi);

  const insights = useMemo(() => {
    const debt = debtsFor(db, monthKey(todayISO())).filter((r) => r.debt > 0);
    const totalDebt = debt.reduce((a, r) => a + r.debt, 0);

    // Guruhlar bo'yicha davomat foizi
    const lowAtt = db.groups.map((g) => {
      const recs = Object.entries(db.attendance).filter(([k]) => k.startsWith(`${g.id}|`)).map(([, v]) => v);
      const ok = recs.filter((v) => v === "present" || v === "late").length;
      return { g, rate: recs.length ? Math.round((ok / recs.length) * 100) : null };
    }).filter((x) => x.rate !== null && x.rate < 90).sort((a, b) => a.rate! - b.rate!);

    const waiting = db.students.filter((s) => s.status === "Kutilmoqda");
    const free = db.groups.filter((g) => g.active).map((g) => {
      const cap = db.rooms.find((r) => r.id === g.roomId)?.capacity ?? 0;
      return { g, left: cap - db.students.filter((s) => s.groupId === g.id).length };
    }).filter((x) => x.left > 0).sort((a, b) => b.left - a.left);

    return { debt, totalDebt, lowAtt, waiting, free };
  }, [db]);

  return (
    <>
      <PageHeader
        title="AI Yordamchi"
        subtitle="Markaz ma'lumotlari asosida avtomatik tavsiyalar"
        actions={<Button variant="primary" icon={Bot} onClick={() => setAi(true)}>AI bilan suhbatlashish</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle icon={AlertTriangle} action={<Badge tone="ai"><Sparkles className="size-3" /> AI PRO</Badge>}>To&apos;lov xavfi</CardTitle>
          {insights.debt.length === 0 ? (
            <p className="text-sm text-slate-400">{t("Bu oy qarzdor talaba yo'q.")}</p>
          ) : (
            <>
              <p className="text-sm text-slate-300">
                <b className="text-danger">{t("{n} ta talaba", { n: insights.debt.length })}</b> {t("bu oy to'lamagan — jami")} <b>{money(insights.totalDebt)} {t("so'm")}</b>.{" "}
                {t("Eslatma yuborish tavsiya etiladi.")}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-slate-400">
                {insights.debt.slice(0, 4).map((r) => <li key={r.student.id}>• {r.student.name} — {money(r.debt)} {t("so'm")}</li>)}
              </ul>
              <Link href="/admin/moliya/qarzdorlik" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">{t("Qarzdorliklarni ko'rish →")}</Link>
            </>
          )}
        </Card>

        <Card>
          <CardTitle icon={CalendarX}>Davomati past guruhlar</CardTitle>
          {insights.lowAtt.length === 0 ? (
            <p className="text-sm text-slate-400">{t("Barcha guruhlarda davomat 90% dan yuqori.")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {insights.lowAtt.map(({ g, rate }) => (
                <li key={g.id} className="flex items-center justify-between rounded-lg bg-low px-3 py-2">
                  <span className="font-semibold">{g.name}</span><Badge tone="warning">{t("{n}% davomat", { n: rate ?? 0 })}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle icon={Users}>O&apos;sish imkoniyatlari</CardTitle>
          <p className="text-sm text-slate-300">
            <b>{t("{n} ta talaba", { n: insights.waiting.length })}</b> {t("kutish ro'yxatida.")}{" "}
            {insights.free[0]
              ? <>{t("Eng ko'p bo'sh joy:")} <b>{insights.free[0].g.name}</b> {t("guruhida ({n} ta). Ularni shu guruhga joylashtiring.", { n: insights.free[0].left })}</>
              : t("Barcha guruhlar to'lgan — yangi guruh ochishni o'ylab ko'ring.")}
          </p>
        </Card>
      </div>
    </>
  );
}
