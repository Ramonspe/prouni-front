import type { ReactNode } from "react";
import { IconCal, IconFile, IconGraduate, IconHouse } from "./icons";
import styles from "./process-context.module.css";

export interface ApplicationContextHeaderProps {
  cycleLabel: string;
  callLabel: string;
  courseName: string;
  campusName?: string | null;
  protocol?: string | null;
  statusLabel?: string | null;
  eyebrow?: string;
  title?: string;
  action?: ReactNode;
  className?: string;
}

function classes(...names: Array<string | undefined>): string {
  return names.filter(Boolean).join(" ");
}

export function ApplicationContextHeader({
  cycleLabel,
  callLabel,
  courseName,
  campusName,
  protocol,
  statusLabel,
  eyebrow = "Contexto da inscrição",
  title,
  action,
  className,
}: ApplicationContextHeaderProps) {
  return (
    <header
      className={classes(styles.contextHeader, className)}
      aria-label="Contexto da inscrição"
    >
      <div className={styles.contextMain}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.contextTitle}>{title ?? courseName}</h1>
        <ul className={styles.metadata} aria-label="Identificação da inscrição">
          <li className={styles.metadataItem}>
            <IconCal size={14} aria-hidden="true" />
            <strong>{cycleLabel}</strong>
          </li>
          <li className={styles.metadataItem}>
            <IconFile size={14} aria-hidden="true" />
            <strong>{callLabel}</strong>
          </li>
          {title && (
            <li className={styles.metadataItem}>
              <IconGraduate size={14} aria-hidden="true" />
              <strong>{courseName}</strong>
            </li>
          )}
          {campusName && (
            <li className={styles.metadataItem}>
              <IconHouse size={14} aria-hidden="true" />
              <span>Campus {campusName}</span>
            </li>
          )}
          {protocol && (
            <li className={styles.metadataItem}>
              Protocolo <strong className="mono">{protocol}</strong>
            </li>
          )}
        </ul>
      </div>
      {(statusLabel || action) && (
        <div className={styles.contextAside}>
          {statusLabel && <span className={styles.status}>{statusLabel}</span>}
          {action}
        </div>
      )}
    </header>
  );
}
