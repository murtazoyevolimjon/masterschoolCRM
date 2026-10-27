import { ComingSoon } from "@/components/ui/ComingSoon";

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return <ComingSoon slug={slug} />;
}
