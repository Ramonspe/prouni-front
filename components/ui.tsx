// Shared presentational components (badge, stepper, timeline, banner, avatar, brand).
// No hooks/handlers — render fine on the server or inside client components.
import { Fragment, type ReactNode } from "react";
import { STATUS_MAP } from "@/lib/mock-data";
import type { BadgeTone, BannerTone, Priority, ProcessStatus, TimelineItemData } from "@/lib/types";
import { IconAlert, IconCheck, IconInfo, type IconComponent } from "./icons";

export function MauaBrand({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const color = variant === "dark" ? "#fff" : "#003066";
  const sub = variant === "dark" ? "#aab4cc" : "#6c7891";
  return (
    <div className="brand">
      {variant === "dark" ? (
        <div className="brand-pill">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/maua-logo.png" alt="Mauá" className="brand-img" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/maua-logo.png" alt="Mauá" className="brand-img" />
      )}
      <div>
        <div className="brand-sub" style={{ color: sub, marginBottom: 1 }}>
          PROUNI
        </div>
        <div className="brand-name" style={{ color }}>
          Bolsas 2026
        </div>
      </div>
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
  dot = true,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ProcessStatus }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.iniciada;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "alta") return <Badge tone="danger">Alta</Badge>;
  if (priority === "media") return <Badge tone="warning">Média</Badge>;
  if (priority === "baixa") return <Badge tone="info">Baixa</Badge>;
  return <span className="muted small">—</span>;
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <Fragment key={i}>
            <div className={`step ${done ? "done" : ""} ${active ? "active" : ""}`}>
              <div className="step-bullet">{done ? <IconCheck size={13} stroke={2.5} /> : i + 1}</div>
              <div className="step-label">{s}</div>
            </div>
            {i < steps.length - 1 && (
              <div className="step-line" style={{ background: done ? "var(--green-600)" : undefined }} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

export function Timeline({ items }: { items: TimelineItemData[] }) {
  return (
    <div className="timeline">
      {items.map((it, i) => (
        <div key={i} className="timeline-item">
          <div className={`timeline-bullet ${it.state ?? ""}`}>
            {it.state === "done" && <IconCheck size={12} stroke={2.8} />}
            {it.state === "active" && (
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
            )}
            {it.state === "warn" && <IconAlert size={11} stroke={2.5} />}
            {!it.state && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-400)" }} />
            )}
          </div>
          <div className="timeline-content">
            <div className="timeline-title">{it.title}</div>
            <div className="timeline-meta">{it.meta}</div>
            {it.body && <div className="timeline-body">{it.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Banner({
  tone = "info",
  title,
  children,
  icon,
}: {
  tone?: BannerTone;
  title?: ReactNode;
  children: ReactNode;
  icon?: IconComponent;
}) {
  const I =
    icon ||
    (tone === "warn" ? IconAlert : tone === "success" ? IconCheck : tone === "danger" ? IconAlert : IconInfo);
  return (
    <div className={`banner banner-${tone}`}>
      <I className="banner-icon" />
      <div style={{ flex: 1 }}>
        {title && <div className="banner-title">{title}</div>}
        <div className="banner-body">{children}</div>
      </div>
    </div>
  );
}

export function Avatar({ name, size = 30 }: { name?: string; size?: number }) {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </div>
  );
}
