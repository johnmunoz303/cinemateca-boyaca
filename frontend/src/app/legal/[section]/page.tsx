import { notFound } from "next/navigation";
import { legalSections } from "@/features/transparencia/legal-sections";
import Cinemateca from "@/components/Cinemateca";

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const entry = legalSections.find(item => item.slug === section);
  if (!entry) notFound();
  return <Cinemateca initialSection={entry.title} />;
}
