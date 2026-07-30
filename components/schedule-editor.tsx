"use client";

import { useMemo } from "react";
import type {
  CallScheduleInput,
  CallScheduleWindowDto,
  CallScheduleWindowKind,
} from "@prouni/shared";
import {
  BRASILIA_TIME_ZONE,
  BRASILIA_TIME_ZONE_LABEL,
  formatBrasiliaDateTime,
  getBrasiliaCivilParts,
  validateBrasiliaCivilDateTime,
} from "@/lib/brasilia-time";
import styles from "./schedule-editor.module.css";

export interface ScheduleEditorPeriodValue {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export type ScheduleEditorValue = Record<
  CallScheduleWindowKind,
  ScheduleEditorPeriodValue
>;

export type ScheduleEditorField =
  | "startDate"
  | "startTime"
  | "endDate"
  | "endTime";

export interface ScheduleEditorValidation {
  valid: boolean;
  input: CallScheduleInput | null;
  errors: Partial<
    Record<`${CallScheduleWindowKind}.${ScheduleEditorField}`, string>
  >;
}

export interface ScheduleEditorProps {
  value: ScheduleEditorValue;
  onChange: (value: ScheduleEditorValue) => void;
  onSaveDraft?: (input: CallScheduleInput) => void;
  onPublish?: () => void;
  disabled?: boolean;
  savingDraft?: boolean;
  publishing?: boolean;
  canPublish?: boolean;
  draftVersion?: number | null;
  activeVersion?: number | null;
}

interface WindowDefinition {
  kind: CallScheduleWindowKind;
  title: string;
  description: string;
  preview: (start: string, end: string) => string;
}

export const SCHEDULE_WINDOW_KINDS: CallScheduleWindowKind[] = [
  "REGISTRATION",
  "INITIAL_SUBMISSION",
  "PENDING_CORRECTION",
];

const WINDOW_DEFINITIONS: WindowDefinition[] = [
  {
    kind: "REGISTRATION",
    title: "Novas inscrições",
    description:
      "Controla quando o candidato pré-selecionado pode criar uma conta e iniciar uma nova inscrição.",
    preview: (start, end) =>
      `O cadastro de novas inscrições ficará disponível de ${start} até ${end}.`,
  },
  {
    kind: "INITIAL_SUBMISSION",
    title: "Ficha e primeiro envio de documentos",
    description:
      "Controla o preenchimento da ficha e o primeiro envio para quem já possui conta e inscrição nesta chamada.",
    preview: (start, end) =>
      `Candidatos já cadastrados poderão completar a ficha e fazer o primeiro envio de ${start} até ${end}.`,
  },
  {
    kind: "PENDING_CORRECTION",
    title: "Correção de pendências",
    description:
      "Controla o reenvio dos itens que a equipe devolveu formalmente como pendência.",
    preview: (start, end) =>
      `Pendências abertas poderão ser corrigidas de ${start} até ${end}.`,
  },
];

function emptyPeriod(): ScheduleEditorPeriodValue {
  return {
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  };
}

export function createEmptyScheduleEditorValue(): ScheduleEditorValue {
  return {
    REGISTRATION: emptyPeriod(),
    INITIAL_SUBMISSION: emptyPeriod(),
    PENDING_CORRECTION: emptyPeriod(),
  };
}

export function scheduleWindowsToEditorValue(
  windows: CallScheduleWindowDto[] | null | undefined,
): ScheduleEditorValue {
  const value = createEmptyScheduleEditorValue();

  for (const window of windows ?? []) {
    if (!SCHEDULE_WINDOW_KINDS.includes(window.kind)) continue;
    try {
      const start = getBrasiliaCivilParts(window.startsAt);
      const end = getBrasiliaCivilParts(window.endsAt);
      value[window.kind] = {
        startDate: start.date,
        startTime: start.time,
        endDate: end.date,
        endTime: end.time,
      };
    } catch {
      // Mantém o período vazio se a API devolver um instante inválido.
    }
  }

  return value;
}

function firstValidationMessage(
  validation: ReturnType<typeof validateBrasiliaCivilDateTime>,
): string | null {
  return validation.valid ? null : (validation.issues[0]?.message ?? "Valor inválido.");
}

export function validateScheduleEditorValue(
  value: ScheduleEditorValue,
): ScheduleEditorValidation {
  const errors: ScheduleEditorValidation["errors"] = {};
  const windows: CallScheduleWindowDto[] = [];

  for (const kind of SCHEDULE_WINDOW_KINDS) {
    const period = value[kind];
    const start = validateBrasiliaCivilDateTime(
      period.startDate,
      period.startTime,
    );
    const end = validateBrasiliaCivilDateTime(period.endDate, period.endTime);
    const startMessage = firstValidationMessage(start);
    const endMessage = firstValidationMessage(end);

    if (startMessage) {
      errors[
        `${kind}.${start.issues?.[0]?.field === "time" ? "startTime" : "startDate"}`
      ] = startMessage;
    }
    if (endMessage) {
      errors[
        `${kind}.${end.issues?.[0]?.field === "time" ? "endTime" : "endDate"}`
      ] = endMessage;
    }

    if (!start.valid || !end.valid) continue;

    if (Date.parse(start.instant) >= Date.parse(end.instant)) {
      errors[`${kind}.endDate`] = "O fim deve ser posterior ao início.";
      continue;
    }

    windows.push({
      kind,
      startsAt: start.instant,
      endsAt: end.instant,
    });
  }

  const valid =
    Object.keys(errors).length === 0 &&
    windows.length === SCHEDULE_WINDOW_KINDS.length;

  return {
    valid,
    input: valid ? { windows } : null,
    errors,
  };
}

function fieldError(
  validation: ScheduleEditorValidation,
  kind: CallScheduleWindowKind,
  dateField: "startDate" | "endDate",
  timeField: "startTime" | "endTime",
): string | undefined {
  return (
    validation.errors[`${kind}.${dateField}`] ??
    validation.errors[`${kind}.${timeField}`]
  );
}

function classes(...names: Array<string | undefined | false>): string {
  return names.filter(Boolean).join(" ");
}

export function ScheduleEditor({
  value,
  onChange,
  onSaveDraft,
  onPublish,
  disabled = false,
  savingDraft = false,
  publishing = false,
  canPublish = false,
  draftVersion,
  activeVersion,
}: ScheduleEditorProps) {
  const validation = useMemo(
    () => validateScheduleEditorValue(value),
    [value],
  );

  const updateField = (
    kind: CallScheduleWindowKind,
    field: ScheduleEditorField,
    fieldValue: string,
  ) => {
    onChange({
      ...value,
      [kind]: {
        ...value[kind],
        [field]: fieldValue,
      },
    });
  };

  return (
    <div className={styles.editor}>
      <div className={styles.editorIntro}>
        <div>
          <h2 className={styles.editorTitle}>Janelas desta chamada</h2>
          <p className={styles.editorDescription}>
            Cada janela controla uma ação diferente. Alterar o rascunho não muda
            o acesso dos candidatos até que ele seja publicado.
          </p>
        </div>
        <div className={styles.timeZone} aria-label="Fuso horário do cronograma">
          <strong>{BRASILIA_TIME_ZONE_LABEL}</strong>
          <span>{BRASILIA_TIME_ZONE}</span>
        </div>
      </div>

      <div className={styles.windowList}>
        {WINDOW_DEFINITIONS.map((definition, index) => {
          const period = value[definition.kind];
          const startError = fieldError(
            validation,
            definition.kind,
            "startDate",
            "startTime",
          );
          const endError = fieldError(
            validation,
            definition.kind,
            "endDate",
            "endTime",
          );
          const windowInput = validation.input?.windows.find(
            (window) => window.kind === definition.kind,
          );

          return (
            <section
              className={styles.window}
              key={definition.kind}
              aria-labelledby={`schedule-${definition.kind}`}
            >
              <div className={styles.windowHeading}>
                <span className={styles.windowNumber}>{index + 1}</span>
                <div>
                  <h3
                    className={styles.windowTitle}
                    id={`schedule-${definition.kind}`}
                  >
                    {definition.title}
                  </h3>
                  <p className={styles.windowDescription}>
                    {definition.description}
                  </p>
                </div>
              </div>

              <div className={styles.endpoints}>
                <div className={styles.endpoint}>
                  <span className={styles.endpointTitle}>Início</span>
                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span>Data</span>
                      <input
                        className={classes(
                          "input",
                          startError && styles.invalid,
                        )}
                        type="date"
                        value={period.startDate}
                        disabled={disabled}
                        aria-label={`Data de início — ${definition.title}`}
                        aria-invalid={Boolean(startError)}
                        onChange={(event) =>
                          updateField(
                            definition.kind,
                            "startDate",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Horário</span>
                      <input
                        className={classes(
                          "input",
                          startError && styles.invalid,
                        )}
                        type="time"
                        step={60}
                        value={period.startTime}
                        disabled={disabled}
                        aria-label={`Horário de início — ${definition.title}`}
                        aria-invalid={Boolean(startError)}
                        onChange={(event) =>
                          updateField(
                            definition.kind,
                            "startTime",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </div>
                  {startError && (
                    <p className={styles.error} role="alert">
                      {startError}
                    </p>
                  )}
                </div>

                <div className={styles.endpoint}>
                  <span className={styles.endpointTitle}>Fim</span>
                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span>Data</span>
                      <input
                        className={classes(
                          "input",
                          endError && styles.invalid,
                        )}
                        type="date"
                        value={period.endDate}
                        disabled={disabled}
                        aria-label={`Data de fim — ${definition.title}`}
                        aria-invalid={Boolean(endError)}
                        onChange={(event) =>
                          updateField(
                            definition.kind,
                            "endDate",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Horário</span>
                      <input
                        className={classes(
                          "input",
                          endError && styles.invalid,
                        )}
                        type="time"
                        step={60}
                        value={period.endTime}
                        disabled={disabled}
                        aria-label={`Horário de fim — ${definition.title}`}
                        aria-invalid={Boolean(endError)}
                        onChange={(event) =>
                          updateField(
                            definition.kind,
                            "endTime",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </div>
                  {endError && (
                    <p className={styles.error} role="alert">
                      {endError}
                    </p>
                  )}
                </div>
              </div>

              {windowInput && (
                <p className={styles.preview}>
                  <span>Prévia para a equipe</span>
                  {definition.preview(
                    formatBrasiliaDateTime(windowInput.startsAt),
                    formatBrasiliaDateTime(windowInput.endsAt),
                  )}
                </p>
              )}
            </section>
          );
        })}
      </div>

      <div className={styles.publishArea}>
        <div className={styles.revisions}>
          <span>
            Em produção:{" "}
            <strong>
              {activeVersion ? `versão ${activeVersion}` : "nenhum cronograma"}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Rascunho:{" "}
            <strong>{draftVersion ? `versão ${draftVersion}` : "não salvo"}</strong>
          </span>
        </div>
        <div className={styles.actions}>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={
              disabled ||
              savingDraft ||
              publishing ||
              !validation.valid ||
              !onSaveDraft
            }
            onClick={() => {
              if (validation.input) onSaveDraft?.(validation.input);
            }}
          >
            {savingDraft ? "Salvando rascunho…" : "Salvar rascunho"}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={
              disabled ||
              savingDraft ||
              publishing ||
              !validation.valid ||
              !canPublish ||
              !onPublish
            }
            onClick={onPublish}
          >
            {publishing ? "Publicando…" : "Publicar cronograma"}
          </button>
        </div>
      </div>
      {!validation.valid && (
        <p className={styles.validationHint} role="status">
          Preencha as três janelas com início e fim válidos para salvar o
          cronograma.
        </p>
      )}
      {validation.valid && !canPublish && draftVersion && (
        <p className={styles.validationHint} role="status">
          Salve novamente o rascunho depois de qualquer alteração para habilitar
          a publicação.
        </p>
      )}
    </div>
  );
}
