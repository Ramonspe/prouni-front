"use client";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { IconDownload, IconUpload } from "@/components/icons";
import { useRequireStaff } from "@/lib/use-require-auth";
import { ApiError, cyclesApi, docTemplatesApi } from "@/lib/api";
import type { DocumentCategoryDto } from "@prouni/shared";

export default function ModelosDocumentosPage() {
  const { user, loading } = useRequireStaff();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const q = useQuery({
    queryKey: ["cycles", "document-types"],
    queryFn: cyclesApi.documentTypes,
    enabled: !!user,
  });

  const categories: DocumentCategoryDto[] = (q.data?.categories ?? []);
  const canUpload = user?.role === "ADMIN" || user?.role === "ANALYST";

  const handleUpload = async (typeId: string, file: File) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setMsg({ type: "err", text: "Arquivo acima de 20 MB." });
      return;
    }
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      setMsg({ type: "err", text: "Formato inválido. Envie PDF ou DOCX." });
      return;
    }
    setMsg(null);
    setBusy(typeId);
    try {
      await docTemplatesApi.uploadTemplate(typeId, file);
      await qc.invalidateQueries({ queryKey: ["cycles", "document-types"] });
      setMsg({ type: "ok", text: `Modelo "${file.name}" enviado com sucesso.` });
    } catch (e) {
      setMsg({ type: "err", text: e instanceof ApiError ? e.message : "Falha ao enviar o modelo." });
    } finally {
      setBusy(null);
      // Limpa o input para permitir reenvio do mesmo arquivo
      const ref = fileRefs.current[typeId];
      if (ref) ref.value = "";
    }
  };

  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Operação", "Modelos de documentos"]}>
      <div className="content fade-in">
        <div style={{ marginBottom: 18 }}>
          <h1 className="page-title">Modelos de documentos</h1>
          <p className="page-subtitle">
            Gerencie os arquivos de modelo (DOCX/PDF) que os candidatos baixam para preencher e assinar.
            Atualizar um modelo substituirá o link para todos os candidatos a partir do próximo acesso.
          </p>
        </div>

        {msg && (
          <div
            className={`banner ${msg.type === "ok" ? "banner-info" : "banner-danger"}`}
            style={{ marginBottom: 16, padding: "10px 14px" }}
          >
            <div className="banner-body" style={{ color: msg.type === "ok" ? "var(--green-700)" : "var(--red-700)" }}>
              {msg.text}
            </div>
          </div>
        )}

        {loading || q.isLoading ? (
          <p className="muted">Carregando tipos de documento…</p>
        ) : categories.length === 0 ? (
          <p className="muted">Nenhum tipo de documento encontrado no ciclo ativo.</p>
        ) : (
          categories.map((cat) => (
            <div className="card" key={cat.id} style={{ marginBottom: 18 }}>
              <div className="card-header" style={{ borderLeft: `4px solid ${cat.colorVar ?? "var(--blue-600)"}`, paddingLeft: 12 }}>
                <h3 className="h-card-title">{cat.title}</h3>
                <span className="muted small" style={{ marginLeft: "auto" }}>{cat.types.length} tipo(s)</span>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "45%" }}>Documento</th>
                    <th>Aplica-se a</th>
                    <th style={{ width: 80 }}>Modelo</th>
                    <th style={{ width: 140 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cat.types.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontSize: 13, color: "var(--ink-800)", lineHeight: 1.4 }}>{t.name}</div>
                        {t.requiresSignature && (
                          <span className="mono" style={{ fontSize: 11, color: "var(--amber-700)" }}>gov.br</span>
                        )}
                      </td>
                      <td>
                        <span className="muted small">
                          {t.appliesTo ?? <Badge tone="neutral">Todos</Badge>}
                        </span>
                      </td>
                      <td>
                        {t.templateUrl ? (
                          <a
                            href={t.templateUrl}
                            download
                            className="btn btn-ghost btn-sm"
                            title="Baixar modelo atual"
                          >
                            <IconDownload size={13} />
                          </a>
                        ) : (
                          <span className="muted small">—</span>
                        )}
                      </td>
                      <td>
                        {canUpload && (
                          <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
                            {busy === t.id ? (
                              "Enviando…"
                            ) : (
                              <>
                                <IconUpload size={13} />
                                {t.templateUrl ? "Substituir" : "Enviar modelo"}
                              </>
                            )}
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              style={{ display: "none" }}
                              disabled={busy === t.id}
                              ref={(el) => { fileRefs.current[t.id] = el; }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void handleUpload(t.id, file);
                              }}
                            />
                          </label>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
