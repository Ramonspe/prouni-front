import Link from "next/link";
import { IconCal, IconChevR, IconClock, IconFile, IconHouse } from "./icons";
import styles from "./process-context.module.css";

export type ApplicationCardTone = "neutral" | "attention" | "active" | "success";

export interface ApplicationCardProps {
  cycleLabel: string;
  callLabel: string;
  courseName: string;
  campusName?: string | null;
  protocol: string;
  statusLabel: string;
  description?: string;
  deadlineLabel?: string | null;
  href?: string;
  actionLabel?: string;
  tone?: ApplicationCardTone;
  className?: string;
}

const TONE_CLASS: Record<ApplicationCardTone, string | undefined> = {
  neutral: undefined,
  attention: styles.toneAttention,
  active: styles.toneActive,
  success: styles.toneSuccess,
};

function classes(...names: Array<string | undefined>): string {
  return names.filter(Boolean).join(" ");
}

export function ApplicationCard({
  cycleLabel,
  callLabel,
  courseName,
  campusName,
  protocol,
  statusLabel,
  description,
  deadlineLabel,
  href,
  actionLabel = "Ver inscrição",
  tone = "neutral",
  className,
}: ApplicationCardProps) {
  return (
    <article
      className={classes(styles.applicationCard, TONE_CLASS[tone], className)}
      aria-label={`${cycleLabel} · ${callLabel} · ${courseName}`}
    >
      <div className={styles.cardGrid}>
        <div>
          <div className={styles.cardKicker}>
            <span>{cycleLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{callLabel}</span>
            <span className={styles.status}>{statusLabel}</span>
          </div>
          <h2 className={styles.cardTitle}>{courseName}</h2>
          {description && <p className={styles.cardDescription}>{description}</p>}
          <div className={styles.cardFacts}>
            {campusName && (
              <span className={styles.cardFact}>
                <IconHouse size={13} aria-hidden="true" />
                Campus {campusName}
              </span>
            )}
            <span className={styles.cardFact}>
              <IconFile size={13} aria-hidden="true" />
              Protocolo <span className="mono">{protocol}</span>
            </span>
            {deadlineLabel && (
              <span className={classes(styles.cardFact, styles.deadline)}>
                <IconClock size={13} aria-hidden="true" />
                {deadlineLabel}
              </span>
            )}
            <span className={styles.cardFact}>
              <IconCal size={13} aria-hidden="true" />
              {cycleLabel}
            </span>
          </div>
        </div>
        {href && (
          <div className={styles.cardAction}>
            <Link className={styles.actionLink} href={href}>
              {actionLabel} <IconChevR size={13} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
