import Link from "next/link";
import type { ApplicationDto } from "@prouni/shared";
import { ApplicationContextHeader } from "./application-context-header";
import { Banner } from "./ui";
import {
  applicationCallLabel,
  applicationStatusLabel,
} from "@/lib/application-context";

export function CandidateApplicationHeader({
  application,
  title,
}: {
  application: ApplicationDto;
  title: string;
}) {
  return (
    <ApplicationContextHeader
      cycleLabel={application.cycle.label}
      callLabel={applicationCallLabel(application)}
      courseName={application.course?.name ?? "Curso informado pelo MEC"}
      campusName={application.course?.campus.name}
      protocol={application.protocol}
      statusLabel={applicationStatusLabel(application)}
      title={title}
      action={
        <Link className="btn btn-ghost btn-sm" href="/painel">
          Trocar inscrição
        </Link>
      }
    />
  );
}

export function CandidateApplicationSelectionMessage({
  notFound = false,
}: {
  notFound?: boolean;
}) {
  return (
    <Banner
      tone="warn"
      title={notFound ? "Inscrição não encontrada" : "Escolha uma inscrição"}
    >
      {notFound
        ? "Este protocolo não está disponível para a sua conta."
        : "Você possui mais de uma inscrição. Selecione no painel qual chamada e curso deseja acessar."}{" "}
      <Link href="/painel">Ir para minhas inscrições</Link>.
    </Banner>
  );
}
