"use client";

import { useMemo, useState } from "react";
import type {
  SelectionCallInput,
  SelectionCallSummaryDto,
} from "@prouni/shared";
import { Banner } from "./ui";

type EditableCallKind = SelectionCallInput["kind"];

const KIND_OPTIONS: Array<{ value: EditableCallKind; label: string }> = [
  { value: "FIRST_CALL", label: "1ª chamada" },
  { value: "SECOND_CALL", label: "2ª chamada" },
  { value: "WAITLIST", label: "Lista de espera" },
];

interface SelectionCallFormValue {
  code: string;
  name: string;
  kind: EditableCallKind;
  sequence: string;
  timeZone: string;
}

function initialValue(
  call?: SelectionCallSummaryDto | null,
  suggestedSequence = 1,
): SelectionCallFormValue {
  return {
    code: call?.code ?? "",
    name: call?.name ?? "",
    kind:
      call?.kind === "OTHER" ? "WAITLIST" : (call?.kind ?? "FIRST_CALL"),
    sequence: String(call?.sequence ?? suggestedSequence),
    timeZone: "America/Sao_Paulo",
  };
}

export function SelectionCallForm({
  cycleId,
  cycleLabel,
  call,
  suggestedSequence = 1,
  pending = false,
  error,
  onSubmit,
  onCancel,
}: {
  cycleId: string;
  cycleLabel: string;
  call?: SelectionCallSummaryDto | null;
  suggestedSequence?: number;
  pending?: boolean;
  error?: string | null;
  onSubmit: (input: SelectionCallInput) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<SelectionCallFormValue>(() =>
    initialValue(call, suggestedSequence),
  );
  const identityLocked = Boolean(call && call.status !== "DRAFT");
  const valid = useMemo(() => {
    const sequence = Number(value.sequence);
    return (
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value.code.trim()) &&
      value.name.trim().length > 0 &&
      Number.isInteger(sequence) &&
      sequence >= 1 &&
      sequence <= 999 &&
      value.timeZone === "America/Sao_Paulo"
    );
  }, [value]);

  const patch = (next: Partial<SelectionCallFormValue>) =>
    setValue((current) => ({ ...current, ...next }));

  return (
    <section className="card" aria-labelledby="selection-call-form-title">
      <div className="card-header">
        <div>
          <h2 className="h-card-title" id="selection-call-form-title">
            {call ? "Editar chamada" : "Nova chamada"}
          </h2>
          <p className="muted small" style={{ margin: "3px 0 0" }}>
            Ciclo {cycleLabel}. O ciclo é definido pelo contexto selecionado.
          </p>
        </div>
      </div>
      <div className="card-body">
        {identityLocked && (
          <div style={{ marginBottom: 12 }}>
            <Banner tone="info" title="Identidade preservada">
              Como esta chamada já foi publicada, apenas o nome de exibição pode
              ser alterado.
            </Banner>
          </div>
        )}
        <div
          className="rgrid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <label className="field">
            <span className="field-label">
              Código<span className="req">*</span>
            </span>
            <input
              className="input"
              value={value.code}
              maxLength={40}
              disabled={pending || identityLocked}
              placeholder="segunda-chamada"
              onChange={(event) => patch({ code: event.target.value })}
            />
            <span className="field-help">
              Letras, números e hífens; usado como identificador interno.
            </span>
          </label>
          <label className="field">
            <span className="field-label">
              Nome de exibição<span className="req">*</span>
            </span>
            <input
              className="input"
              value={value.name}
              maxLength={80}
              disabled={pending}
              placeholder="2ª chamada"
              onChange={(event) => patch({ name: event.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">
              Tipo<span className="req">*</span>
            </span>
            <select
              className="select"
              value={value.kind}
              disabled={pending || identityLocked}
              onChange={(event) =>
                patch({ kind: event.target.value as EditableCallKind })
              }
            >
              {KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">
              Sequência<span className="req">*</span>
            </span>
            <input
              className="input"
              type="number"
              min={1}
              max={999}
              value={value.sequence}
              disabled={pending || identityLocked}
              onChange={(event) => patch({ sequence: event.target.value })}
            />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span className="field-label">
              Fuso horário<span className="req">*</span>
            </span>
            <input
              className="input mono"
              value="America/Sao_Paulo"
              disabled
              readOnly
            />
            <span className="field-help">
              Fuso oficial fixo do processo; as telas de cronograma convertem
              data e horário de Brasília para o instante correspondente.
            </span>
          </label>
        </div>

        {error && (
          <p className="upload-meta error" style={{ marginTop: 10 }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            className="btn btn-primary"
            type="button"
            disabled={!valid || pending}
            onClick={() =>
              onSubmit({
                cycleId,
                code: value.code.trim(),
                name: value.name.trim(),
                kind: value.kind,
                sequence: Number(value.sequence),
                timeZone: "America/Sao_Paulo",
              })
            }
          >
            {pending ? "Salvando…" : call ? "Salvar chamada" : "Criar chamada"}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={pending}
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </div>
    </section>
  );
}
