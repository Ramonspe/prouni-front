"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cyclesApi } from "@/lib/api";
import { IconCheck, IconChevL, IconChevR, IconHelp, IconLogout, IconX } from "./icons";

/** Steps shown in the signup rail. "verify" is its own page; the rest live in the wizard. */
export const SIGNUP_STEPS = [
  { id: "verify", label: "Verificação de e-mail" },
  { id: "account", label: "Criação de acesso" },
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
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const currentIdx = SIGNUP_STEPS.findIndex((s) => s.id === stepId);
  const cycle = useQuery({ queryKey: ["cycle-active"], queryFn: () => cyclesApi.active() });
  const cycleLabel = cycle.data?.label ?? "2026/2";
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
            PROUNI · Inscrição {cycleLabel}
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
          <button className="btn btn-ghost btn-sm" onClick={() => setShowHelp((v) => !v)}>
            <IconHelp size={14} /> Ajuda
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push("/login")}>
            <IconLogout size={14} /> Sair
          </button>
        </div>
      </header>

      {showHelp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: "60px 16px 0" }} onClick={() => setShowHelp(false)}>
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", width: 340, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--navy-900)" }}>Precisa de ajuda?</div>
              <button className="icon-btn" onClick={() => setShowHelp(false)}><IconX size={16} /></button>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-700)", lineHeight: 1.6, margin: 0 }}>
              Entre em contato com a <strong>Secretaria de Bolsas e Programas Assistenciais</strong>:
            </p>
            <div style={{ marginTop: 12, fontSize: 13, color: "var(--ink-800)", lineHeight: 2 }}>
              <div>📧 bolsas@maua.br</div>
              <div>📞 (11) 4239-3200 ramal 3270</div>
              <div>🕐 Seg–Sex, 08h–17h</div>
            </div>
            <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--blue-50)", borderRadius: 8, fontSize: 12, color: "var(--blue-800)" }}>
              Seu progresso é salvo automaticamente a cada alteração — pode fechar e retomar pelo login a qualquer momento.
            </div>
          </div>
        </div>
      )}

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
  onSaveExit,
}: {
  savedAt?: string;
  canBack?: boolean;
  nextLabel?: string;
  primary?: boolean;
  disabled?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  onSaveExit?: () => void;
}) {
  const router = useRouter();
  const handleSaveExit = onSaveExit ?? (() => router.push("/login"));
  return (
    <div className="signup-footer">
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-500)", fontSize: 12.5 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green-600)" }} />
        Salvo automaticamente {savedAt}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-ghost" onClick={handleSaveExit}>
          <IconLogout size={13} /> Salvar e sair
        </button>
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
