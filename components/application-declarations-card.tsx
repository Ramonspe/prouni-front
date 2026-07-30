"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApplicationDto } from "@prouni/shared";
import { applicationsApi, socioApi } from "@/lib/api";
import { Banner } from "./ui";

export function ApplicationDeclarationsCard({
  application,
}: {
  application: ApplicationDto;
}) {
  const queryClient = useQueryClient();
  const [optsForQuota, setOptsForQuota] = useState(application.optsForQuota);
  const [isPcd, setIsPcd] = useState(application.isPcd);
  const [isImtAffiliated, setIsImtAffiliated] = useState(
    application.isImtAffiliated,
  );
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setOptsForQuota(application.optsForQuota);
    setIsPcd(application.isPcd);
    setIsImtAffiliated(application.isImtAffiliated);
    setAcceptTerms(false);
    setConfirmed(false);
  }, [application.id]);

  const mutation = useMutation({
    mutationFn: async () => {
      await applicationsApi.declarations(application.id, {
        optsForQuota,
        isPcd,
        isImtAffiliated,
        acceptTerms,
      });
      await socioApi.submit(application.id);
    },
    onSuccess: async () => {
      setConfirmed(true);
      setAcceptTerms(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["applications", "mine"] }),
        queryClient.invalidateQueries({
          queryKey: ["socio", application.id],
        }),
      ]);
    },
  });

  if (application.status !== "iniciada") return null;

  return (
    <section className="card card-pad" style={{ marginTop: 18 }}>
      <h2 className="h-card-title">Confirmações desta inscrição</h2>
      <p className="muted small" style={{ marginTop: 6 }}>
        Os valores podem vir preenchidos da inscrição anterior apenas como
        sugestão. Confirme-os novamente para esta chamada.
      </p>
      <div style={{ display: "grid", gap: 9, marginTop: 14 }}>
        <label>
          <input
            type="checkbox"
            checked={optsForQuota}
            onChange={(event) => setOptsForQuota(event.target.checked)}
          />{" "}
          Desejo concorrer pelas políticas afirmativas/cotas
        </label>
        <label>
          <input
            type="checkbox"
            checked={isPcd}
            onChange={(event) => setIsPcd(event.target.checked)}
          />{" "}
          Declaro que sou pessoa com deficiência
        </label>
        <label>
          <input
            type="checkbox"
            checked={isImtAffiliated}
            onChange={(event) => setIsImtAffiliated(event.target.checked)}
          />{" "}
          Possuo vínculo com o Instituto Mauá de Tecnologia
        </label>
        <label style={{ marginTop: 4, fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(event) => setAcceptTerms(event.target.checked)}
          />{" "}
          Confirmo a veracidade dos dados e aceito o edital e o tratamento de
          dados para esta inscrição
        </label>
      </div>
      {mutation.isError && (
        <div style={{ marginTop: 12 }}>
          <Banner tone="warn" title="Não foi possível confirmar">
            {(mutation.error as Error).message}
          </Banner>
        </div>
      )}
      {confirmed && (
        <div style={{ marginTop: 12 }}>
          <Banner tone="success" title="Ficha e declarações confirmadas">
            Você já pode seguir para os documentos e finalizar esta inscrição.
          </Banner>
        </div>
      )}
      <button
        type="button"
        className="btn btn-primary"
        style={{ marginTop: 14 }}
        disabled={!acceptTerms || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending
          ? "Confirmando…"
          : "Confirmar declarações e enviar ficha"}
      </button>
    </section>
  );
}
