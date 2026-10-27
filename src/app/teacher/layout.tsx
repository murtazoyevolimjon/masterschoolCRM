import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { StoreHydrator } from "@/components/admin/StoreHydrator";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHydrator />
      <AuthGate role="teacher"><AppShell role="teacher">{children}</AppShell></AuthGate>
    </>
  );
}
