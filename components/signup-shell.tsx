"use client";
import type { ReactNode } from "react";
import { IconCheck, IconChevL, IconChevR, IconHelp, IconLogout } from "./icons";

/** Steps shown in the signup rail. "verify" is its own page; the rest live in the wizard. */
export const SIGNUP_STEPS = [
  { id: "verify", label: "Verificação de e-mail" },
  { id: "account", label: "Criação de acesso" },
  { id: "enem", label: "ENEM e elegibilidade" },
  { id: "curso", label: "Curso e campus" },
  { id: "estudante", label: "Dados do estudante" },
  { id: "familia", label: "Composição familiar" },
  { id: "moradia", label: "Moradia e bens" },
  { id: "renda", label: "Renda e despesas" },
  { id: "docs", label: "Documentos comprobatórios" },
  { id: "revisao", label: "Revisão e envio" },
] as const;

export function SignupShell({
  stepId,
  children,
  banner,
}: {
  stepId: string;
  children: ReactNode;
  banner?: ReactNode;
}) {
  const currentIdx = SIGNUP_STEPS.findIndex((s) => s.id === stepId);
  return (
    <div className="signup-shell" style={{ height: "100vh" }}>
      <header className="signup-header">
        <div className="brand-pill" style={{ padding: "8px 12px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/maua-logo.png" alt="Mauá" className="brand-img" style={{ height: 28 }} />
        </div>
        <div className="signup-header-titles">
          <div className="brand-sub" style={{ color: "var(--ink-500)" }}>
            Instituto Mauá de Tecnologia
          </div>
          <div style={{ color: "var(--navy-900)", fontWeight: 700, fontSize: 14 }}>
            PROUNI · Inscrição 2026/1
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span className="muted small">
            Etapa {currentIdx + 1} de {SIGNUP_STEPS.length}
          </span>
          <div style={{ width: 140 }}>
            <div className="progress-bar">
              <div style={{ width: `${((currentIdx + 1) / SIGNUP_STEPS.length) * 100}%` }} />
            </div>
          </div>
          <button className="btn btn-ghost btn-sm">
            <IconHelp size={14} /> Ajuda
          </button>
          <button className="btn btn-ghost btn-sm">
            <IconLogout size={14} /> Sair
          </button>
        </div>
      </header>

      <div className="signup-body">
        <aside className="signup-side">
          {SIGNUP_STEPS.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={s.id} className={`signup-step ${active ? "active" : ""} ${done ? "done" : ""}`}>
                <div className="signup-step-bullet">
                  {done ? <IconCheck size={12} stroke={2.6} /> : i + 1}
                </div>
                <div>
                  <div className="signup-step-label">{s.label}</div>
                </div>
              </div>
            );
          })}
        </aside>

        <main className="signup-main">
          {banner}
          {children}
        </main>
      </div>
    </div>
  );
}

export function SignupFooter({
  savedAt = "agora há pouco",
  canBack = true,
  nextLabel = "Avançar",
  primary = false,
  disabled = false,
  onNext,
  onBack,
}: {
  savedAt?: string;
  canBack?: boolean;
  nextLabel?: string;
  primary?: boolean;
  disabled?: boolean;
  onNext?: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="signup-footer">
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-500)", fontSize: 12.5 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green-600)" }} />
        Salvo automaticamente {savedAt}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-ghost">Salvar e sair</button>
        {canBack && (
          <button className="btn btn-ghost" onClick={onBack}>
            <IconChevL size={13} /> Anterior
          </button>
        )}
        <button className={`btn ${primary ? "btn-primary" : "btn-secondary"}`} disabled={disabled} onClick={onNext}>
          {nextLabel} {!primary && <IconChevR size={13} />}
        </button>
      </div>
    </div>
  );
}
