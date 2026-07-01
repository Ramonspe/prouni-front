"use client";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Banner } from "@/components/ui";
import { IconPlus, IconTrash, IconCheck, IconX, IconUpload, IconDownload } from "@/components/icons";
import { ApiError, catalogApi } from "@/lib/api";
import {
  DOC_CONDITIONS,
  DOC_SCOPES,
  INCOME_SITUATIONS,
  HOUSING_TENURES,
  OTHER_INCOME_SOURCES,
  conditionValueLabel,
  type CatalogCategoryDto,
  type CatalogDocTypeDto,
  type ConditionValueSet,
  type DocCondition,
  type DocScope,
  type DocTypeUpsertInput,
} from "@prouni/shared";

const COLOR_PRESETS: { value: string; label: string }[] = [
  { value: "var(--navy-700)", label: "Azul-marinho" },
  { value: "var(--blue-700)", label: "Azul" },
  { value: "var(--blue-600)", label: "Azul claro" },
  { value: "var(--green-700)", label: "Verde" },
  { value: "var(--amber-700)", label: "Âmbar" },
];

const UPLOAD_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/** Opções de valores conforme o conjunto exigido pela condição. */
function valueOptions(set: ConditionValueSet): { value: string; label: string }[] {
  if (set === "INCOME_SITUATION") return INCOME_SITUATIONS.map((o) => ({ value: o.value, label: o.label }));
  if (set === "HOUSING_TENURE") return HOUSING_TENURES;
  if (set === "OTHER_INCOME") return OTHER_INCOME_SOURCES;
  return [];
}

function conditionMeta(condition: DocCondition) {
  return DOC_CONDITIONS.find((c) => c.value === condition) ?? DOC_CONDITIONS[0];
}

/** Resumo legível de quando o documento é exigido. */
function whenLabel(t: CatalogDocTypeDto): string {
  const meta = conditionMeta(t.condition);
  if (meta.valueSet === "NONE") return meta.label;
  if (!t.conditionValues.length) return meta.label;
  const vals = t.conditionValues.map((v) => conditionValueLabel(meta.valueSet, v)).join(", ");
  return `${meta.label}: ${vals}`;
}

function scopeLabel(scope: DocScope): string {
  return DOC_SCOPES.find((s) => s.value === scope)?.label ?? scope;
}

function templateHref(t: CatalogDocTypeDto): string | null {
  if (!t.templateUrl) return null;
  return t.templateUrl.startsWith("templates/") ? `/api/v1/doc-templates/${t.id}` : t.templateUrl;
}

type DocForm = {
  id?: string;
  categoryId: string;
  name: string;
  scope: DocScope;
  condition: DocCondition;
  conditionValues: string[];
  appliesTo: string;
  required: boolean;
  requiresSignature: boolean;
  active: boolean;
};

type CatForm = { id?: string; title: string; colorVar: string };

export function CatalogDocs({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const [typeForm, setTypeForm] = useState<DocForm | null>(null);
  const [catForm, setCatForm] = useState<CatForm | null>(null);
  const [err, setErr] = useState("");
  const [uploadErr, setUploadErr] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const catalog = useQuery({ queryKey: ["catalog", "doc-catalog"], queryFn: () => catalogApi.docCatalog() });
  const categories = catalog.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["catalog", "doc-catalog"] });

  const saveTypeMut = useMutation({
    mutationFn: (p: { id?: string; body: DocTypeUpsertInput }) =>
      p.id ? catalogApi.updateDocType(p.id, p.body) : catalogApi.createDocType(p.body),
    onSuccess: () => { setTypeForm(null); setErr(""); void invalidate(); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : "Não foi possível salvar o documento."),
  });

  const deleteTypeMut = useMutation({
    mutationFn: (id: string) => catalogApi.deleteDocType(id),
    onSuccess: () => void invalidate(),
    onError: (e) => alert(e instanceof ApiError ? e.message : "Não foi possível excluir."),
  });

  const activeMut = useMutation({
    mutationFn: (p: { id: string; active: boolean }) => catalogApi.setDocTypeActive(p.id, p.active),
    onSuccess: () => void invalidate(),
  });

  const saveCatMut = useMutation({
    mutationFn: (p: { id?: string; body: { title: string; colorVar: string | null } }) =>
      p.id ? catalogApi.updateCategory(p.id, p.body) : catalogApi.createCategory(p.body),
    onSuccess: () => { setCatForm(null); void invalidate(); },
    onError: (e) => alert(e instanceof ApiError ? e.message : "Não foi possível salvar a categoria."),
  });

  const deleteCatMut = useMutation({
    mutationFn: (id: string) => catalogApi.deleteCategory(id),
    onSuccess: () => void invalidate(),
    onError: (e) => alert(e instanceof ApiError ? e.message : "Não foi possível excluir a categoria."),
  });

  const uploadMut = useMutation({
    mutationFn: (p: { id: string; file: File }) => catalogApi.uploadTemplate(p.id, p.file),
    onSuccess: (_d, p) => { setUploadErr((s) => { const n = { ...s }; delete n[p.id]; return n; }); void invalidate(); },
    onError: (e, p) => setUploadErr((s) => ({ ...s, [p.id]: e instanceof ApiError ? e.message : "Falha no envio." })),
  });

  const startNewType = (categoryId: string) => {
    setErr("");
    setTypeForm({
      categoryId,
      name: "",
      scope: "APPLICATION",
      condition: "ALWAYS",
      conditionValues: [],
      appliesTo: "",
      required: true,
      requiresSignature: false,
      active: true,
    });
  };

  const startEditType = (t: CatalogDocTypeDto) => {
    setErr("");
    setTypeForm({
      id: t.id,
      categoryId: t.categoryId,
      name: t.name,
      scope: t.scope,
      condition: t.condition,
      conditionValues: t.conditionValues,
      appliesTo: t.appliesTo ?? "",
      required: t.required,
      requiresSignature: t.requiresSignature,
      active: t.active,
    });
  };

  const submitType = () => {
    if (!typeForm) return;
    if (!typeForm.name.trim()) return setErr("Informe o nome do documento.");
    if (!typeForm.categoryId) return setErr("Selecione a categoria.");
    const meta = conditionMeta(typeForm.condition);
    const body: DocTypeUpsertInput = {
      name: typeForm.name.trim(),
      categoryId: typeForm.categoryId,
      scope: typeForm.scope,
      condition: typeForm.condition,
      conditionValues: meta.valueSet === "NONE" ? [] : typeForm.conditionValues,
      appliesTo: typeForm.appliesTo.trim() || null,
      required: typeForm.required,
      requiresSignature: typeForm.requiresSignature,
      active: typeForm.active,
    };
    saveTypeMut.mutate({ id: typeForm.id, body });
  };

  const handlePick = (id: string, file?: File) => {
    if (!file) return;
    if (!UPLOAD_TYPES.includes(file.type)) return setUploadErr((s) => ({ ...s, [id]: "Use PDF, DOC ou DOCX." }));
    if (file.size > 15 * 1024 * 1024) return setUploadErr((s) => ({ ...s, [id]: "Arquivo acima de 15 MB." }));
    uploadMut.mutate({ id, file });
  };

  const meta = typeForm ? conditionMeta(typeForm.condition) : null;
  const opts = meta ? valueOptions(meta.valueSet) : [];

  return (
    <div>
      {canEdit && !typeForm && !catForm && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button className="btn btn-primary btn-sm" onClick={() => startNewType(categories[0]?.id ?? "")} disabled={!categories.length}>
            <IconPlus size={14} /> Novo documento
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setCatForm({ title: "", colorVar: COLOR_PRESETS[0].value })}>
            <IconPlus size={14} /> Nova categoria
          </button>
        </div>
      )}

      {/* Editor de categoria */}
      {catForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h3 className="h-card-title">{catForm.id ? "Editar categoria" : "Nova categoria"}</h3></div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div className="field">
                <label className="field-label">Título</label>
                <input className="input" maxLength={120} value={catForm.title} onChange={(e) => setCatForm({ ...catForm, title: e.target.value })} placeholder="Ex.: 3. Renda e bens" />
              </div>
              <div className="field">
                <label className="field-label">Cor</label>
                <select className="input" value={catForm.colorVar} onChange={(e) => setCatForm({ ...catForm, colorVar: e.target.value })}>
                  {COLOR_PRESETS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary btn-sm" disabled={saveCatMut.isPending || !catForm.title.trim()} onClick={() => saveCatMut.mutate({ id: catForm.id, body: { title: catForm.title.trim(), colorVar: catForm.colorVar || null } })}>
                <IconCheck size={14} /> Salvar
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setCatForm(null)}><IconX size={14} /> Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Editor de tipo de documento */}
      {typeForm && meta && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h3 className="h-card-title">{typeForm.id ? "Editar documento" : "Novo documento"}</h3></div>
          <div className="card-body">
            {err && <Banner tone="danger" title="Verifique os campos">{err}</Banner>}

            <div className="field" style={{ marginTop: err ? 12 : 0 }}>
              <label className="field-label">Nome do documento</label>
              <input className="input" maxLength={400} value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} placeholder="Ex.: Certidão de propriedade de veículo (Detran)" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div className="field">
                <label className="field-label">Categoria</label>
                <select className="input" value={typeForm.categoryId} onChange={(e) => setTypeForm({ ...typeForm, categoryId: e.target.value })}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Exigido</label>
                <select className="input" value={typeForm.scope} onChange={(e) => setTypeForm({ ...typeForm, scope: e.target.value as DocScope })}>
                  {DOC_SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="field" style={{ marginTop: 12 }}>
              <label className="field-label">Quando exigir (condição)</label>
              <select
                className="input"
                value={typeForm.condition}
                onChange={(e) => {
                  const condition = e.target.value as DocCondition;
                  const m = conditionMeta(condition);
                  setTypeForm({ ...typeForm, condition, conditionValues: m.valueSet === "NONE" ? [] : typeForm.conditionValues });
                }}
              >
                {DOC_CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Valores da condição (só quando o gatilho usa valores) */}
            {meta.valueSet !== "NONE" && (
              <div className="field" style={{ marginTop: 12 }}>
                <label className="field-label">Valores que disparam o documento</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, paddingTop: 4 }}>
                  {opts.map((o) => (
                    <label key={o.value} className="checkbox" style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 240 }}>
                      <input
                        type="checkbox"
                        checked={typeForm.conditionValues.includes(o.value)}
                        onChange={() =>
                          setTypeForm({
                            ...typeForm,
                            conditionValues: typeForm.conditionValues.includes(o.value)
                              ? typeForm.conditionValues.filter((v) => v !== o.value)
                              : [...typeForm.conditionValues, o.value],
                          })
                        }
                      />
                      <span>{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="field" style={{ marginTop: 12 }}>
              <label className="field-label">Rótulo amigável (opcional)</label>
              <input className="input" maxLength={160} value={typeForm.appliesTo} onChange={(e) => setTypeForm({ ...typeForm, appliesTo: e.target.value })} placeholder="Ex.: Imóvel alugado" />
              <span className="field-help">Texto curto que o candidato vê explicando por que o documento apareceu.</span>
            </div>

            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 14 }}>
              <label className="checkbox" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={typeForm.required} onChange={(e) => setTypeForm({ ...typeForm, required: e.target.checked })} />
                <span>Obrigatório</span>
              </label>
              <label className="checkbox" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={typeForm.requiresSignature} onChange={(e) => setTypeForm({ ...typeForm, requiresSignature: e.target.checked })} />
                <span>Exige assinatura (gov.br / cartório)</span>
              </label>
              <label className="checkbox" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={typeForm.active} onChange={(e) => setTypeForm({ ...typeForm, active: e.target.checked })} />
                <span>Ativo</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary btn-sm" disabled={saveTypeMut.isPending} onClick={submitType}>
                <IconCheck size={14} /> {saveTypeMut.isPending ? "Salvando…" : "Salvar"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setTypeForm(null); setErr(""); }}><IconX size={14} /> Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {catalog.isLoading && <p className="muted">Carregando matriz documental…</p>}
      {catalog.isError && (
        <Banner tone="danger" title="Não foi possível carregar">
          Se ainda não há matriz, use “Restaurar padrão de fábrica” em Configurações → Manutenção para criar a base inicial.
        </Banner>
      )}

      {categories.map((cat: CatalogCategoryDto) => (
        <div key={cat.id} className="card" style={{ marginBottom: 16 }}>
          <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: cat.colorVar ? `3px solid ${cat.colorVar}` : undefined }}>
            <h3 className="h-card-title">{cat.title}</h3>
            {canEdit && (
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => startNewType(cat.id)}><IconPlus size={13} /> Documento</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setCatForm({ id: cat.id, title: cat.title, colorVar: cat.colorVar ?? COLOR_PRESETS[0].value })}>Editar</button>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--red-700)" }} title="Excluir categoria (precisa estar vazia)" onClick={() => { if (confirm(`Excluir a categoria "${cat.title}"?`)) deleteCatMut.mutate(cat.id); }}><IconTrash size={13} /></button>
              </div>
            )}
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {cat.types.length === 0 ? (
              <p className="muted small" style={{ padding: "12px 16px" }}>Nenhum documento nesta categoria.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Documento</th>
                    <th style={{ textAlign: "left" }}>Quando é exigido</th>
                    <th style={{ textAlign: "left" }}>Escopo</th>
                    <th style={{ textAlign: "left" }}>Modelo</th>
                    {canEdit && <th style={{ textAlign: "right" }}>Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {cat.types.map((t) => {
                    const href = templateHref(t);
                    const busy = uploadMut.isPending && uploadMut.variables?.id === t.id;
                    return (
                      <tr key={t.id} style={{ opacity: t.active ? 1 : 0.55 }}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{t.name}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                            {!t.active && <Badge tone="neutral" dot={false}>Inativo</Badge>}
                            {t.required ? <Badge tone="info" dot={false}>Obrigatório</Badge> : <Badge tone="neutral" dot={false}>Opcional</Badge>}
                            {t.requiresSignature && <Badge tone="warning" dot={false}>Assinatura</Badge>}
                          </div>
                        </td>
                        <td className="small">
                          {whenLabel(t)}
                          {t.appliesTo && <div className="muted small" style={{ marginTop: 2 }}>“{t.appliesTo}”</div>}
                        </td>
                        <td className="muted small">{scopeLabel(t.scope)}</td>
                        <td>
                          {href ? (
                            <a href={href} download className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}><IconDownload size={12} /> Baixar</a>
                          ) : (
                            <span className="muted small">—</span>
                          )}
                          {uploadErr[t.id] && <div style={{ color: "var(--red-700)", fontSize: 11, marginTop: 4 }}>{uploadErr[t.id]}</div>}
                        </td>
                        {canEdit && (
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer", opacity: busy ? 0.6 : 1 }} title="Enviar/substituir modelo">
                              <input
                                ref={(el) => { fileRefs.current[t.id] = el; }}
                                type="file"
                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                style={{ display: "none" }}
                                disabled={busy}
                                onChange={(e) => handlePick(t.id, e.target.files?.[0])}
                              />
                              <IconUpload size={13} /> {busy ? "…" : "Modelo"}
                            </label>
                            <button className="btn btn-ghost btn-sm" onClick={() => startEditType(t)}>Editar</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => activeMut.mutate({ id: t.id, active: !t.active })} title={t.active ? "Desativar" : "Ativar"}>
                              {t.active ? "Desativar" : "Ativar"}
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: "var(--red-700)" }}
                              disabled={deleteTypeMut.isPending}
                              title={t.documentsCount > 0 ? "Há documentos enviados; desative em vez de excluir" : "Excluir"}
                              onClick={() => { if (confirm(`Excluir o documento "${t.name}"?`)) deleteTypeMut.mutate(t.id); }}
                            >
                              <IconTrash size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
