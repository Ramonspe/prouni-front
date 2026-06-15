"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Badge, Banner } from "@/components/ui";
import { IconChevR, IconInfo, IconUpload, IconUser, IconX } from "@/components/icons";
import { useRequireAuth } from "@/lib/use-require-auth";
import { applicationsApi } from "@/lib/api";
import type { RequiredDocumentDto } from "@prouni/shared";

const SCOPE_LABEL: Record<string, string> = {
  APPLICATION: "Documento da inscrição",
  EACH_MEMBER: "Por integrante do grupo familiar",
  EACH_ADULT: "Por integrante maior de 18 anos",
};

type Selected = RequiredDocumentDto & { group: string };

/** Painel lateral — envio do documento (upload real entra no M3). */
function DocDetail({ item, onClose }: { item: Selected; onClose: () => void }) {
  return (
    <div className="card" style={{ position: "sticky", top: 80 }}>
      <div className="card-header">
        <h3 className="h-card-title">{item.name}</h3>
        <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={onClose}>
          <IconX size={14} />
        </button>
      </div>
      <div className="card-body">
        <div className="muted small" style={{ marginBottom: 6 }}>Categoria</div>
        <div style={{ fontSize: 13.5, color: "var(--ink-900)", marginBottom: 12 }}>{item.group}</div>

        {item.member && (
          <>
            <div className="muted small" style={{ marginBottom: 6 }}>Refere-se a</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-900)", marginBottom: 12 }}>
              {item.member.name} <span className="muted">· {item.member.relationship}</span>
            </div>
          </>
        )}

        {item.conditionLabel && (
          <>
            <div className="muted small" style={{ marginBottom: 6 }}>Exigido porque</div>
            <div style={{ marginBottom: 12 }}>
              <Badge tone="info" dot={false}>{item.conditionLabel}</Badge>
            </div>
          </>
        )}

        <div className="muted small" style={{ marginBottom: 6 }}>Status</div>
        <div style={{ marginBottom: 14 }}>
          <Badge tone={item.required ? "neutral" : "info"}>{item.required ? "A enviar" : "Opcional"}</Badge>
        </div>

        <div className="dropzone">
          <IconUpload size={22} style={{ marginBottom: 8, color: "var(--ink-500)" }} />
          <div style={{ color: "var(--ink-800)", fontWeight: 500, fontSize: 13 }}>Arraste o arquivo aqui</div>
          <div className="muted small">
            ou <a href="#" onClick={(e) => e.preventDefault()}>selecione do seu computador</a>
          </div>
          <div className="muted small" style={{ marginTop: 8 }}>PDF, JPG, PNG · até 10 MB</div>
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 10 }} disabled>
          Confirmar envio
        </button>
        <p className="muted small" style={{ marginTop: 8, textAlign: "center" }}>
          O envio de arquivos é habilitado na próxima etapa do projeto.
        </p>
      </div>
    </div>
  );
}

function DocRow({ item, onClick }: { item: RequiredDocumentDto; onClick: () => void }) {
  return (
    <div className="upload-row" onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="upload-icon">
        <IconUpload size={17} />
      </div>
      <div>
        <div className="upload-title">{item.name}</div>
        <div className="upload-meta">
          {item.member ? (
            <>
              <IconUser size={12} /> {item.member.name} · {item.member.relationship}
            </>
          ) : (
            SCOPE_LABEL[item.scope] ?? "Documento da inscrição"
          )}
          {item.conditionLabel && <> · {item.conditionLabel}</>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Badge tone={item.required ? "neutral" : "info"}>{item.required ? "A enviar" : "Opcional"}</Badge>
        <button className="btn btn-ghost btn-sm">
          Enviar <IconChevR size={13} />
        </button>
      </div>
    </div>
  );
}

export default function DocumentosPage() {
  const { user, loading } = useRequireAuth();
  const [selected, setSelected] = useState<Selected | null>(null);

  const app = useQuery({ queryKey: ["application", "me"], queryFn: applicationsApi.me, enabled: !!user });
  const docs = useQuery({
    queryKey: ["application", app.data?.id, "required-documents"],
    queryFn: () => applicationsApi.requiredDocuments(app.data!.id),
    enabled: !!app.data?.id,
  });

  const data = docs.data;

  return (
    <AppShell role="candidate" crumbs={["PROUNI", "Inscrição", "Documentos"]}>
      <div className="content fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <h1 className="page-title">Documentos</h1>
            <p className="page-subtitle">
              Esta lista é montada <strong>automaticamente</strong> a partir do seu grupo familiar, da situação
              de renda de cada integrante e da sua moradia. Formatos: <span className="mono">PDF, JPG, PNG</span> ·
              até <span className="mono">10 MB</span>.
            </p>
          </div>
        </div>

        {loading || app.isLoading || docs.isLoading ? (
          <div className="card card-pad muted">Montando sua lista de documentos…</div>
        ) : app.isError || docs.isError || !data ? (
          <Banner tone="warn" title="Não foi possível carregar os documentos">
            Não localizamos uma inscrição ativa para o seu acesso neste ciclo.
          </Banner>
        ) : (
          <>
            <div className="docs-summary">
              <div className="docs-summary-item">
                <div className="muted small">Categorias</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-900)" }}>{data.categories.length}</div>
              </div>
              <div className="docs-summary-item">
                <div className="muted small">Documentos exigidos</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-900)" }}>{data.totals.total}</div>
              </div>
              <div className="docs-summary-item">
                <div className="muted small">Obrigatórios</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--blue-700)" }}>{data.totals.required}</div>
              </div>
              <div className="docs-summary-item">
                <div className="muted small">Opcionais</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-700)" }}>{data.totals.optional}</div>
              </div>
            </div>

            {data.notes.map((note, i) => (
              <Banner key={i} tone="info" title="Complete seu cadastro para refinar a lista">
                {note}
              </Banner>
            ))}

            <div
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns: selected ? "1fr 360px" : "1fr",
                gap: 18,
                alignItems: "start",
              }}
            >
              <div>
                {data.categories.length === 0 ? (
                  <div className="card card-pad muted">
                    Nenhum documento exigido ainda. Preencha o grupo familiar e a ficha socioeconômica para
                    liberarmos a lista personalizada.
                  </div>
                ) : (
                  data.categories.map((group) => (
                    <div className="card" key={group.id} style={{ marginBottom: 14 }}>
                      <div className="card-header" style={{ borderLeft: `3px solid ${group.colorVar ?? "var(--blue-600)"}` }}>
                        <h3 className="h-card-title">{group.title}</h3>
                        <span className="muted small" style={{ marginLeft: "auto" }}>
                          {group.items.length} documento(s)
                        </span>
                      </div>
                      <div style={{ padding: 14 }}>
                        {group.items.map((it) => (
                          <DocRow key={it.key} item={it} onClick={() => setSelected({ ...it, group: group.title })} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selected && <DocDetail item={selected} onClose={() => setSelected(null)} />}
            </div>

            <div className="banner banner-info" style={{ marginTop: 18 }}>
              <IconInfo className="banner-icon" />
              <div className="banner-body">
                <div className="banner-title">Como a lista é montada</div>
                Cada integrante maior de 18 anos comprova a própria renda conforme a situação declarada
                (CLT, autônomo, MEI, aposentado…). Documentos de imóvel seguem a posse informada na ficha, e
                rendas extras (pensão, aluguel, ajuda, benefícios) aparecem só quando declaradas.
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
