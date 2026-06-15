"use client";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Avatar, Badge, Banner, Timeline } from "@/components/ui";
import {
  IconAlert,
  IconCheck,
  IconChevR,
  IconDownload,
  IconUpload,
  IconX,
  IconZoom,
} from "@/components/icons";
import { DOC_CATEGORIES } from "@/lib/mock-data";
import type { DocItem } from "@/lib/types";

type SelectedDoc = DocItem & { group: string };
type Tab = "all" | "pending" | "rejected" | "approved";

function DocRow({ item, onClick }: { item: DocItem; onClick: () => void }) {
  const cls =
    item.state === "approved" ? "has-file"
    : item.state === "pending" ? "has-pending"
    : item.state === "rejected" ? "has-rejected"
    : "";
  return (
    <div className={`upload-row ${cls}`} onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="upload-icon">
        {item.state === "approved" ? <IconCheck size={18} stroke={2.4} /> : item.state === "rejected" ? <IconAlert size={17} /> : <IconUpload size={17} />}
      </div>
      <div>
        <div className="upload-title">{item.name}</div>
        <div className={`upload-meta ${item.state === "rejected" ? "error" : ""}`}>
          {item.state === "approved" && (
            <>Aprovado em {item.date} · <span className="mono">{item.name.toLowerCase().replace(/\s/g, "_").slice(0, 18)}.pdf</span></>
          )}
          {item.state === "pending" && <>Aguardando envio</>}
          {item.state === "todo" && <>Não enviado</>}
          {item.state === "rejected" && <>Reprovado · {item.comment}</>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {item.state === "approved" && <Badge tone="success">Aprovado</Badge>}
        {item.state === "pending" && <Badge tone="warning">Em análise</Badge>}
        {item.state === "todo" && <Badge tone="neutral">A enviar</Badge>}
        {item.state === "rejected" && <Badge tone="danger">Reprovado</Badge>}
        <button className="btn btn-ghost btn-sm">
          {item.state === "approved" ? <>Visualizar</> : item.state === "rejected" ? <>Reenviar</> : <>Enviar</>}
          <IconChevR size={13} />
        </button>
      </div>
    </div>
  );
}

function DocDetail({ item, onClose }: { item: SelectedDoc; onClose: () => void }) {
  const needsUpload = item.state === "rejected" || item.state === "todo" || item.state === "pending";
  return (
    <div className="card" style={{ position: "sticky", top: 80 }}>
      <div className="card-header">
        <h3 className="h-card-title">{item.name}</h3>
        <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={onClose}><IconX size={14} /></button>
      </div>
      <div className="card-body">
        <div className="muted small" style={{ marginBottom: 6 }}>Categoria</div>
        <div style={{ fontSize: 13.5, color: "var(--ink-900)", marginBottom: 12 }}>{item.group}</div>

        <div className="muted small" style={{ marginBottom: 6 }}>Status</div>
        <div style={{ marginBottom: 14 }}>
          {item.state === "approved" && <Badge tone="success">Aprovado em {item.date}</Badge>}
          {item.state === "pending" && <Badge tone="warning">Em análise</Badge>}
          {item.state === "rejected" && <Badge tone="danger">Reprovado em {item.date}</Badge>}
          {item.state === "todo" && <Badge tone="neutral">A enviar</Badge>}
        </div>

        {item.comment && (
          <>
            <div className="muted small" style={{ marginBottom: 6 }}>Comentário do analista</div>
            <div className="comment" style={{ marginBottom: 14 }}>
              <div className="comment-head">
                <Avatar name="Ana Lima" size={22} />
                <div className="comment-author">Ana Lima · Bolsas</div>
                <div className="comment-time">26/mai · 14:08</div>
              </div>
              <div className="comment-body">{item.comment}</div>
            </div>
          </>
        )}

        {needsUpload ? (
          <>
            <div className="dropzone">
              <IconUpload size={22} style={{ marginBottom: 8, color: "var(--ink-500)" }} />
              <div style={{ color: "var(--ink-800)", fontWeight: 500, fontSize: 13 }}>Arraste o arquivo aqui</div>
              <div className="muted small">ou <a href="#" onClick={(e) => e.preventDefault()}>selecione do seu computador</a></div>
              <div className="muted small" style={{ marginTop: 8 }}>PDF, JPG, PNG · até 10 MB</div>
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 10 }}>Confirmar envio</button>
          </>
        ) : (
          <>
            <div className="muted small" style={{ marginBottom: 6 }}>Pré-visualização</div>
            <div style={{ height: 180, background: "var(--ink-100)", borderRadius: 8, position: "relative", overflow: "hidden", border: "1px solid var(--ink-200)" }}>
              <div style={{ position: "absolute", inset: 12, background: "#fff", borderRadius: 4, padding: 14, fontSize: 9, color: "var(--ink-500)", fontFamily: "var(--font-mono)" }}>
                <div style={{ height: 6, background: "var(--ink-200)", width: "40%", marginBottom: 6 }} />
                <div style={{ height: 4, background: "var(--ink-150)", marginBottom: 3 }} />
                <div style={{ height: 4, background: "var(--ink-150)", marginBottom: 3, width: "80%" }} />
                <div style={{ height: 4, background: "var(--ink-150)", marginBottom: 3 }} />
                <div style={{ height: 4, background: "var(--ink-150)", marginBottom: 8, width: "60%" }} />
                <div style={{ height: 4, background: "var(--ink-150)", marginBottom: 3 }} />
                <div style={{ height: 4, background: "var(--ink-150)", width: "70%" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}><IconDownload size={13} /> Baixar</button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}><IconZoom size={13} /> Ampliar</button>
            </div>
          </>
        )}

        <div className="divider" />
        <div className="muted small" style={{ marginBottom: 6 }}>Histórico</div>
        <Timeline
          items={[
            { state: "done", title: "Documento enviado", meta: "23/mai · 09:14" },
            ...(item.state === "rejected" ? [{ state: "warn" as const, title: "Marcado como reprovado", meta: "26/mai · 14:08" }] : []),
            ...(item.state === "approved" ? [{ state: "done" as const, title: "Aprovado pela secretaria", meta: `${item.date} · 11:02` }] : []),
          ]}
        />
      </div>
    </div>
  );
}

export default function DocumentosPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [selected, setSelected] = useState<SelectedDoc | null>(null);

  const filter = (it: DocItem) =>
    tab === "all" ||
    (tab === "pending" && (it.state === "pending" || it.state === "todo")) ||
    (tab === "rejected" && it.state === "rejected") ||
    (tab === "approved" && it.state === "approved");

  const all = DOC_CATEGORIES.flatMap((g) => g.items);
  const counts = {
    all: all.length,
    pending: all.filter((i) => i.state === "pending" || i.state === "todo").length,
    rejected: all.filter((i) => i.state === "rejected").length,
    approved: all.filter((i) => i.state === "approved").length,
  };
  const tabs: [Tab, string][] = [["all", "Todos"], ["pending", "Pendentes"], ["rejected", "Reprovados"], ["approved", "Aprovados"]];

  return (
    <AppShell role="candidate" crumbs={["PROUNI", "Inscrição", "Documentos"]}>
      <div className="content fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <h1 className="page-title">Documentos</h1>
            <p className="page-subtitle">
              Envie um arquivo por categoria. Formatos aceitos: <span className="mono">PDF, JPG, PNG</span> · até{" "}
              <span className="mono">10 MB</span>.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost"><IconDownload size={14} /> Baixar checklist</button>
            <button className="btn btn-primary"><IconUpload size={14} /> Enviar todos</button>
          </div>
        </div>

        {counts.rejected > 0 && (
          <Banner tone="danger" title={`${counts.rejected} documento(s) reprovados pela secretaria`}>
            Leia o comentário do analista em cada documento e reenvie a versão corrigida. Os reenvios são
            registrados no histórico.
          </Banner>
        )}

        <div className="tabs" style={{ marginTop: 18 }}>
          {tabs.map(([id, l]) => (
            <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              {l} <span className="count">{counts[id]}</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr", gap: 18, alignItems: "start" }}>
          <div>
            {DOC_CATEGORIES.map((group) => {
              const filtered = group.items.filter(filter);
              if (!filtered.length) return null;
              return (
                <div className="card" key={group.id} style={{ marginBottom: 14 }}>
                  <div className="card-header">
                    <h3 className="h-card-title">{group.group}</h3>
                    <span className="muted small" style={{ marginLeft: "auto" }}>
                      {group.items.filter((i) => i.state === "approved").length} de {group.items.length} aprovados
                    </span>
                  </div>
                  <div style={{ padding: 14 }}>
                    {filtered.map((it) => (
                      <DocRow key={it.id} item={it} onClick={() => setSelected({ ...it, group: group.group })} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {selected && <DocDetail item={selected} onClose={() => setSelected(null)} />}
        </div>
      </div>
    </AppShell>
  );
}
