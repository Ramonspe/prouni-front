"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Banner } from "@/components/ui";
import { IconTrash } from "@/components/icons";
import { useRequireStaff } from "@/lib/use-require-auth";
import { adminApi, maintenanceApi } from "@/lib/api";
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

  const pingMut = useMutation({
    mutationFn: () => adminApi.pingRm(),
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
            <Banner tone="info" title="A edição do dia a dia mudou de lugar">
              Cursos e documentos agora são gerenciados em <strong>Operação → Cursos e Documentos</strong>,
              com o banco como fonte da verdade. Os botões abaixo servem apenas para <strong>restaurar o
              padrão de fábrica</strong> definido no código — o que <strong>sobrescreve</strong> as edições
              feitas por lá. Use só para recriar a base inicial ou desfazer alterações.
            </Banner>

            {/* Integração RM — testar a rota de rede AWS→RM */}
            <div className="card" style={{ marginBottom: 16, marginTop: 16 }}>
              <div className="card-header"><h3 className="h-card-title">Integração RM — testar conexão</h3></div>
              <div className="card-body">
                <p className="muted small" style={{ marginBottom: 10 }}>
                  Verifica se este servidor <strong>alcança</strong> o TOTVS RM (um GET no WSDL, sem enviar dados
                  nem alterar nada). Use para confirmar a rota de rede antes de exportar candidatos.
                </p>
                {pingMut.isSuccess && (
                  pingMut.data.ok ? (
                    <Banner tone="success" title="RM alcançável ✓">
                      <span className="mono">{pingMut.data.target}</span> · HTTP {pingMut.data.httpStatus} · {pingMut.data.ms} ms
                    </Banner>
                  ) : (
                    <Banner tone="danger" title="RM inacessível a partir deste servidor">
                      <span className="mono">{pingMut.data.target}</span><br />
                      {pingMut.data.error ?? `HTTP ${pingMut.data.httpStatus}`}
                    </Banner>
                  )
                )}
                {pingMut.isError && (
                  <Banner tone="danger" title="Falha ao testar">{(pingMut.error as Error).message}</Banner>
                )}
                <button className="btn btn-secondary" style={{ marginTop: pingMut.isSuccess || pingMut.isError ? 10 : 0 }} disabled={pingMut.isPending} onClick={() => pingMut.mutate()}>
                  {pingMut.isPending ? "Testando…" : "Testar conexão com o RM"}
                </button>
              </div>
            </div>

            {/* Cursos e campi — restaurar padrão */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3 className="h-card-title">Cursos e campi — restaurar padrão</h3></div>
              <div className="card-body">
                <p className="muted small" style={{ marginBottom: 10 }}>
                  Recria os campi (SCS e SP) e a lista de cursos padrão do código no banco,
                  <strong> sobrescrevendo</strong> edições feitas em Operação → Cursos e Documentos.
                </p>
                {coursesMut.isSuccess && (
                  <Banner tone="success" title="Cursos restaurados">
                    {coursesMut.data.coursesUpserted} curso(s) em {coursesMut.data.campuses} campus(i).
                  </Banner>
                )}
                {coursesMut.isError && (
                  <Banner tone="danger" title="Não foi possível restaurar">
                    {(coursesMut.error as Error).message}
                  </Banner>
                )}
                <button
                  className="btn btn-secondary"
                  disabled={coursesMut.isPending}
                  onClick={() => {
                    if (confirm("Restaurar a lista de cursos padrão? Isso sobrescreve as edições feitas em Operação → Cursos e Documentos.")) coursesMut.mutate();
                  }}
                >
                  {coursesMut.isPending ? "Restaurando…" : "Restaurar cursos padrão"}
                </button>
              </div>
            </div>

            {/* Matriz documental — restaurar padrão */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3 className="h-card-title">Matriz documental — restaurar padrão</h3></div>
              <div className="card-body">
                <p className="muted small" style={{ marginBottom: 10 }}>
                  Recria a matriz padrão do código no ciclo ativo (tipos de documento, condições,
                  <strong> modelos para download</strong> e escopo do termo LGPD),
                  <strong> sobrescrevendo</strong> edições feitas em Operação → Cursos e Documentos.
                  Não afeta candidatos nem pré-selecionados.
                </p>
                {matrixMut.isSuccess && (
                  <Banner tone="success" title="Matriz restaurada">
                    Ciclo {matrixMut.data.cycleLabel}: {matrixMut.data.activeTypes} tipos ativos ·{" "}
                    {matrixMut.data.withTemplate} com modelo para download.
                  </Banner>
                )}
                {matrixMut.isError && (
                  <Banner tone="danger" title="Não foi possível restaurar">
                    {(matrixMut.error as Error).message}
                  </Banner>
                )}
                <button
                  className="btn btn-secondary"
                  disabled={matrixMut.isPending}
                  onClick={() => {
                    if (confirm("Restaurar a matriz documental padrão? Isso sobrescreve as edições feitas em Operação → Cursos e Documentos.")) matrixMut.mutate();
                  }}
                >
                  {matrixMut.isPending ? "Restaurando…" : "Restaurar matriz padrão"}
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
