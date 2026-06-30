"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Banner } from "@/components/ui";
import { IconTrash } from "@/components/icons";
import { useRequireStaff } from "@/lib/use-require-auth";
import { maintenanceApi } from "@/lib/api";
import { RESET_CONFIRMATION, type MaintenanceSummaryDto } from "@prouni/shared";

/** Rótulos pt-BR de cada contagem da base. */
const LABELS: { key: keyof MaintenanceSummaryDto; label: string }[] = [
  { key: "candidates", label: "Candidatos (contas)" },
  { key: "applications", label: "Inscrições" },
  { key: "documents", label: "Documentos (slots)" },
  { key: "documentVersions", label: "Arquivos enviados (versões)" },
  { key: "familyMembers", label: "Integrantes do grupo familiar" },
  { key: "socioForms", label: "Fichas socioeconômicas" },
  { key: "decisions", label: "Decisões/pareceres" },
  { key: "consents", label: "Consentimentos (LGPD)" },
  { key: "notifications", label: "Notificações" },
  { key: "verificationTokens", label: "Tokens de verificação" },
  { key: "preselectionEntries", label: "Pré-selecionados" },
  { key: "preselectionImports", label: "Importações de pré-seleção" },
  { key: "auditLogs", label: "Logs de auditoria" },
];

export default function ManutencaoPage() {
  const { user } = useRequireStaff();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";

  const [phrase, setPhrase] = useState("");

  const summary = useQuery({
    queryKey: ["admin", "maintenance", "summary"],
    queryFn: () => maintenanceApi.summary(),
    enabled: !!user && isAdmin,
  });

  const resetMut = useMutation({
    mutationFn: () => maintenanceApi.reset(phrase.trim()),
    onSuccess: () => {
      setPhrase("");
      // recarrega tudo que depende dos dados zerados
      qc.invalidateQueries();
    },
  });

  const matrixMut = useMutation({
    mutationFn: () => maintenanceApi.syncDocMatrix(),
  });

  const coursesMut = useMutation({
    mutationFn: () => maintenanceApi.syncCourses(),
  });

  const canReset = phrase.trim() === RESET_CONFIRMATION && !resetMut.isPending;
  const total = summary.data
    ? LABELS.reduce((acc, { key }) => acc + (summary.data?.[key] ?? 0), 0)
    : 0;

  const handleReset = () => {
    if (!canReset) return;
    if (!confirm("Esta ação é IRREVERSÍVEL e vai apagar todos os dados de candidatos, pré-selecionados e documentos. Deseja continuar?")) return;
    resetMut.mutate();
  };

  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Configurações", "Manutenção"]}>
      <div className="content fade-in">
        <div style={{ marginBottom: 14 }}>
          <h1 className="page-title">Manutenção da base</h1>
          <p className="page-subtitle">
            Limpeza dos dados de teste antes da divulgação oficial. Remove candidatos, pré-selecionados,
            documentos, fichas, decisões e logs — <strong>preservando</strong> cursos, campi, matriz documental
            e os usuários da equipe.
          </p>
        </div>

        {!isAdmin ? (
          <Banner tone="info" title="Acesso restrito">
            Apenas administradores podem executar a limpeza da base.
          </Banner>
        ) : (
          <>
            {/* Cursos e campi */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3 className="h-card-title">Cursos e campi</h3></div>
              <div className="card-body">
                <p className="muted small" style={{ marginBottom: 10 }}>
                  Sincroniza os campi (SCS e SP) e os 16 cursos do edital no banco de dados.
                  Idempotente — execute após um deploy com alterações no catálogo de cursos.
                </p>
                {coursesMut.isSuccess && (
                  <Banner tone="success" title="Cursos sincronizados">
                    {coursesMut.data.coursesUpserted} curso(s) em {coursesMut.data.campuses} campus(i).
                  </Banner>
                )}
                {coursesMut.isError && (
                  <Banner tone="danger" title="Não foi possível sincronizar">
                    {(coursesMut.error as Error).message}
                  </Banner>
                )}
                <button className="btn btn-secondary" disabled={coursesMut.isPending} onClick={() => coursesMut.mutate()}>
                  {coursesMut.isPending ? "Sincronizando…" : "Sincronizar cursos"}
                </button>
              </div>
            </div>

            {/* Matriz documental — publica modelos para download + escopo LGPD */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3 className="h-card-title">Matriz documental (modelos para download)</h3></div>
              <div className="card-body">
                <p className="muted small" style={{ marginBottom: 10 }}>
                  Publica/atualiza no ciclo ativo os tipos de documento, os <strong>modelos para download</strong> (anexos)
                  e o escopo do termo LGPD. Idempotente e seguro — não afeta candidatos nem pré-selecionados.
                  Use após um deploy para os botões “Baixar modelo” aparecerem.
                </p>
                {matrixMut.isSuccess && (
                  <Banner tone="success" title="Matriz sincronizada">
                    Ciclo {matrixMut.data.cycleLabel}: {matrixMut.data.activeTypes} tipos ativos ·{" "}
                    {matrixMut.data.withTemplate} com modelo para download.
                  </Banner>
                )}
                {matrixMut.isError && (
                  <Banner tone="danger" title="Não foi possível sincronizar">
                    {(matrixMut.error as Error).message}
                  </Banner>
                )}
                <button className="btn btn-secondary" disabled={matrixMut.isPending} onClick={() => matrixMut.mutate()}>
                  {matrixMut.isPending ? "Sincronizando…" : "Sincronizar matriz documental"}
                </button>
              </div>
            </div>

            {/* Preview das contagens */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3 className="h-card-title">O que será removido</h3></div>
              <div className="card-body">
                {summary.isLoading ? (
                  <p className="muted">Carregando contagens…</p>
                ) : summary.isError ? (
                  <p className="muted">Não foi possível carregar as contagens.</p>
                ) : (
                  <table className="table">
                    <tbody>
                      {LABELS.map(({ key, label }) => (
                        <tr key={key}>
                          <td>{label}</td>
                          <td className="mono" style={{ textAlign: "right", width: 120 }}>
                            {summary.data?.[key] ?? 0}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td style={{ fontWeight: 600 }}>Total de registros</td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{total}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Zona de perigo */}
            <div
              className="card"
              style={{ border: "1px solid var(--red-300, #fca5a5)", background: "var(--red-50, #fef2f2)" }}
            >
              <div className="card-header" style={{ borderLeft: "3px solid var(--red-600, #dc2626)" }}>
                <h3 className="h-card-title" style={{ color: "var(--red-700, #b91c1c)" }}>Zona de perigo</h3>
              </div>
              <div className="card-body">
                <Banner tone="danger" title="Ação irreversível">
                  Esta operação apaga <strong>permanentemente</strong> todos os dados de inscrição. Não há como
                  desfazer. Use apenas quando tiver certeza de que é hora de zerar a base de testes.
                </Banner>

                {resetMut.isSuccess && (
                  <Banner tone="success" title="Base limpa com sucesso">
                    Foram removidos {Object.values(resetMut.data.deleted).reduce((a, b) => a + b, 0)} registro(s).
                  </Banner>
                )}
                {resetMut.isError && (
                  <Banner tone="danger" title="Não foi possível limpar a base">
                    {(resetMut.error as Error).message}
                  </Banner>
                )}

                <div className="field" style={{ marginTop: 12, maxWidth: 360 }}>
                  <label className="field-label">
                    Para confirmar, digite <strong>{RESET_CONFIRMATION}</strong>
                  </label>
                  <input
                    className="input"
                    value={phrase}
                    maxLength={40}
                    placeholder={RESET_CONFIRMATION}
                    autoComplete="off"
                    onChange={(e) => setPhrase(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-danger"
                  style={{ marginTop: 12 }}
                  disabled={!canReset}
                  onClick={handleReset}
                >
                  <IconTrash size={14} /> {resetMut.isPending ? "Limpando a base…" : "Limpar base de dados"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
