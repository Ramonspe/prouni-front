"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Banner } from "@/components/ui";
import { IconPlus, IconTrash, IconCheck, IconX } from "@/components/icons";
import { ApiError, catalogApi } from "@/lib/api";
import type { CatalogCourseDto, CourseUpsertInput } from "@prouni/shared";

const SHIFT_OPTIONS = ["Integral", "Matutino", "Vespertino", "Noturno"];

type FormState = {
  id?: string;
  name: string;
  campusId: string;
  shifts: string[];
  durationYears: string;
};

const emptyForm = (campusId: string): FormState => ({
  name: "",
  campusId,
  shifts: [],
  durationYears: "",
});

export function CatalogCourses({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);
  const [err, setErr] = useState("");

  const campuses = useQuery({ queryKey: ["catalog", "campuses"], queryFn: () => catalogApi.campuses() });
  const courses = useQuery({ queryKey: ["catalog", "courses"], queryFn: () => catalogApi.courses() });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["catalog", "courses"] });
    void qc.invalidateQueries({ queryKey: ["catalog", "campuses"] });
  };

  const saveMut = useMutation({
    mutationFn: (payload: { id?: string; body: CourseUpsertInput }) =>
      payload.id ? catalogApi.updateCourse(payload.id, payload.body) : catalogApi.createCourse(payload.body),
    onSuccess: () => {
      setForm(null);
      setErr("");
      invalidate();
    },
    onError: (e) => setErr(e instanceof ApiError ? e.message : "Não foi possível salvar o curso."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => catalogApi.deleteCourse(id),
    onSuccess: invalidate,
    onError: (e) => alert(e instanceof ApiError ? e.message : "Não foi possível excluir o curso."),
  });

  // Agrupa cursos por campus para exibição.
  const byCampus = useMemo(() => {
    const map = new Map<string, { code: string; name: string; items: CatalogCourseDto[] }>();
    for (const c of courses.data ?? []) {
      const k = c.campus.id;
      if (!map.has(k)) map.set(k, { code: c.campus.code, name: c.campus.name, items: [] });
      map.get(k)!.items.push(c);
    }
    return [...map.values()];
  }, [courses.data]);

  const startNew = () => {
    const firstCampus = campuses.data?.[0]?.id ?? "";
    setErr("");
    setForm(emptyForm(firstCampus));
  };

  const startEdit = (c: CatalogCourseDto) => {
    setErr("");
    setForm({
      id: c.id,
      name: c.name,
      campusId: c.campus.id,
      shifts: c.shifts,
      durationYears: c.durationYears != null ? String(c.durationYears) : "",
    });
  };

  const submit = () => {
    if (!form) return;
    if (!form.name.trim()) return setErr("Informe o nome do curso.");
    if (!form.campusId) return setErr("Selecione o campus.");
    const body: CourseUpsertInput = {
      name: form.name.trim(),
      campusId: form.campusId,
      shifts: form.shifts,
      durationYears: form.durationYears ? Number(form.durationYears) : null,
    };
    saveMut.mutate({ id: form.id, body });
  };

  const toggleShift = (s: string) =>
    setForm((f) => (f ? { ...f, shifts: f.shifts.includes(s) ? f.shifts.filter((x) => x !== s) : [...f.shifts, s] } : f));

  return (
    <div>
      {canEdit && !form && (
        <button className="btn btn-primary btn-sm" style={{ marginBottom: 14 }} onClick={startNew}>
          <IconPlus size={14} /> Novo curso
        </button>
      )}

      {/* Formulário de criação/edição */}
      {form && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <h3 className="h-card-title">{form.id ? "Editar curso" : "Novo curso"}</h3>
          </div>
          <div className="card-body">
            {err && <Banner tone="danger" title="Verifique os campos">{err}</Banner>}
            <div className="rgrid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginTop: err ? 12 : 0 }}>
              <div className="field">
                <label className="field-label">Nome do curso</label>
                <input
                  className="input"
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex.: Engenharia de Computação"
                />
              </div>
              <div className="field">
                <label className="field-label">Campus</label>
                <select className="input" value={form.campusId} onChange={(e) => setForm({ ...form, campusId: e.target.value })}>
                  {(campuses.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rgrid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginTop: 12 }}>
              <div className="field">
                <label className="field-label">Turnos</label>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", paddingTop: 4 }}>
                  {SHIFT_OPTIONS.map((s) => (
                    <label key={s} className="checkbox" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="checkbox" checked={form.shifts.includes(s)} onChange={() => toggleShift(s)} />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="field">
                <label className="field-label">Duração (anos)</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={10}
                  value={form.durationYears}
                  onChange={(e) => setForm({ ...form, durationYears: e.target.value })}
                  placeholder="Ex.: 5"
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary btn-sm" disabled={saveMut.isPending} onClick={submit}>
                <IconCheck size={14} /> {saveMut.isPending ? "Salvando…" : "Salvar"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setForm(null); setErr(""); }}>
                <IconX size={14} /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {courses.isLoading && <p className="muted">Carregando cursos…</p>}
      {courses.isError && (
        <Banner tone="danger" title="Não foi possível carregar">
          Tente recarregar a página.
        </Banner>
      )}

      {byCampus.map((campus) => (
        <div key={campus.code} className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <h3 className="h-card-title">{campus.name} · {campus.items.length} curso(s)</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Curso</th>
                  <th style={{ textAlign: "left" }}>Turnos</th>
                  <th style={{ textAlign: "left" }}>Duração</th>
                  <th style={{ textAlign: "left" }}>Inscrições</th>
                  {canEdit && <th style={{ textAlign: "right" }}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {campus.items.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td className="muted small">{c.shifts.length ? c.shifts.join(" · ") : "—"}</td>
                    <td className="muted small">{c.durationYears ? `${c.durationYears} anos` : "—"}</td>
                    <td>
                      {c.applicationsCount > 0 ? (
                        <Badge tone="info" dot={false}>{c.applicationsCount}</Badge>
                      ) : (
                        <span className="muted small">0</span>
                      )}
                    </td>
                    {canEdit && (
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(c)}>Editar</button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--red-700)" }}
                          disabled={deleteMut.isPending}
                          title={c.applicationsCount > 0 ? "Há inscrições neste curso" : "Excluir"}
                          onClick={() => {
                            if (confirm(`Excluir o curso "${c.name}"?`)) deleteMut.mutate(c.id);
                          }}
                        >
                          <IconTrash size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
