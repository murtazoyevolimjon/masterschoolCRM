import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { StoreHydrator } from "@/components/admin/StoreHydrator";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHydrator />
      <AuthGate role="student"><AppShell role="student">{children}</AppShell></AuthGate>
    </>
  );
}
