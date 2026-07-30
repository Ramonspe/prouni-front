"use client";

import styles from "./process-context.module.css";

export interface ProcessContextOption {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface ProcessContextSelectorProps {
  cycles: ProcessContextOption[];
  calls: ProcessContextOption[];
  cycleId: string;
  callId: string;
  onCycleChange: (cycleId: string) => void;
  onCallChange: (callId: string) => void;
  cycleLabel?: string;
  callLabel?: string;
  legend?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

function classes(...names: Array<string | undefined>): string {
  return names.filter(Boolean).join(" ");
}

export function ProcessContextSelector({
  cycles,
  calls,
  cycleId,
  callId,
  onCycleChange,
  onCallChange,
  cycleLabel = "Processo",
  callLabel = "Chamada",
  legend = "Contexto de trabalho",
  helperText = "Os dados e as ações abaixo respeitam o processo e a chamada selecionados.",
  disabled = false,
  className,
}: ProcessContextSelectorProps) {
  const selectedCycle = cycles.find((cycle) => cycle.id === cycleId);
  const selectedCall = calls.find((call) => call.id === callId);

  return (
    <fieldset className={classes(styles.selector, className)} disabled={disabled}>
      <legend className={styles.selectorLegend}>{legend}</legend>
      <div className={styles.selectorGrid}>
        <label className={styles.selectorField}>
          <span className={styles.selectorLabel}>{cycleLabel}</span>
          <select
            className={styles.select}
            value={cycleId}
            onChange={(event) => onCycleChange(event.target.value)}
          >
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id} disabled={cycle.disabled}>
                {cycle.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.selectorField}>
          <span className={styles.selectorLabel}>{callLabel}</span>
          <select
            className={styles.select}
            value={callId}
            onChange={(event) => onCallChange(event.target.value)}
          >
            {calls.map((call) => (
              <option key={call.id} value={call.id} disabled={call.disabled}>
                {call.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className={styles.selectorSummary}>
        <span>{helperText}</span>
        {(selectedCycle || selectedCall) && <span className={styles.separator}>·</span>}
        {selectedCycle && <strong>{selectedCycle.label}</strong>}
        {selectedCycle && selectedCall && <span aria-hidden="true">/</span>}
        {selectedCall && <strong>{selectedCall.label}</strong>}
      </p>
    </fieldset>
  );
}
