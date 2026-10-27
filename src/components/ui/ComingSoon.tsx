"use client";

import { Hammer } from "lucide-react";
import { t } from "@/lib/i18n";
import { Card, PageHeader } from "./primitives";

export function ComingSoon({ slug }: { slug: string[] }) {
  const name = decodeURIComponent(slug.join(" / "));
  return (
    <>
      <PageHeader title={name.charAt(0).toUpperCase() + name.slice(1)} subtitle="Bu bo'lim keyingi bosqichda ishlab chiqiladi" />
      <Card className="grid place-items-center gap-3 py-16 text-center">
        <Hammer className="size-10 text-primary" />
        <p className="font-bold">{t("Tez orada")}</p>
        <p className="max-w-sm text-sm text-slate-400">{t("Bo'lim tuzilmasi tayyor — ma'lumotlar bazasi (API) ulangach to'ldiriladi.")}</p>
      </Card>
    </>
  );
}
