import { redirect } from "next/navigation";

export default async function ApplicationEntryPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  redirect(`/inscricoes/${encodeURIComponent(applicationId)}/ficha`);
}
