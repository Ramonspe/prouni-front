import Link from "next/link";
import type { ReactNode } from "react";
import { IconCal, IconChevR, IconClock, IconGraduate, IconHouse } from "./icons";
import styles from "./process-context.module.css";

export interface OpportunityCardProps {
  cycleLabel: string;
  callLabel: string;
  courseName: string;
  campusName?: string | null;
  availableUntilLabel?: string | null;
  description?: string;
  href?: string;
  actionLabel?: string;
  action?: ReactNode;
  statusLabel?: string;
  className?: string;
}

function classes(...names: Array<string | undefined>): string {
  return names.filter(Boolean).join(" ");
}

export function OpportunityCard({
  cycleLabel,
  callLabel,
  courseName,
  campusName,
  availableUntilLabel,
  description = "Você possui uma nova pré-seleção disponível. Confira os dados antes de iniciar uma inscrição independente.",
  href,
  actionLabel = "Iniciar inscrição",
  action,
  statusLabel = "Nova pré-seleção",
  className,
}: OpportunityCardProps) {
  return (
    <article
      className={classes(styles.opportunityCard, className)}
      aria-label={`${statusLabel} · ${cycleLabel} · ${callLabel} · ${courseName}`}
    >
      <div className={styles.cardGrid}>
        <div>
          <div className={styles.cardKicker}>
            <span className={styles.status}>{statusLabel}</span>
            <span>{cycleLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{callLabel}</span>
          </div>
          <h2 className={styles.cardTitle}>{courseName}</h2>
          <p className={styles.cardDescription}>{description}</p>
          <div className={styles.cardFacts}>
            <span className={styles.cardFact}>
              <IconGraduate size={13} aria-hidden="true" />
              Curso da pré-seleção
            </span>
            {campusName && (
              <span className={styles.cardFact}>
                <IconHouse size={13} aria-hidden="true" />
                Campus {campusName}
              </span>
            )}
            <span className={styles.cardFact}>
              <IconCal size={13} aria-hidden="true" />
              {cycleLabel}
            </span>
            {availableUntilLabel && (
              <span className={classes(styles.cardFact, styles.deadline)}>
                <IconClock size={13} aria-hidden="true" />
                {availableUntilLabel}
              </span>
            )}
          </div>
        </div>
        {(href || action) && (
          <div className={styles.cardAction}>
            {action ?? (
              <Link className={styles.actionLink} href={href!}>
                {actionLabel} <IconChevR size={13} aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
