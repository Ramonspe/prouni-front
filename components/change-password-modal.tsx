"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { changePasswordSchema } from "@prouni/shared";
import { ApiError, authApi } from "@/lib/api";
import { IconAlert, IconCheck, IconLock } from "./icons";

/** Modal de troca de senha do usuário autenticado (exige a senha atual). */
export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [loading, onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (next !== confirm) {
      setErr("A nova senha e a confirmação não coincidem.");
      return;
    }
    const parsed = changePasswordSchema.safeParse({ currentPassword: current, newPassword: next });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword(current, next);
      setDone(true);
    } catch (error) {
      setErr(error instanceof ApiError ? error.message : "Não foi possível alterar a senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div className="cpw-overlay" onClick={onClose}>
      <div
        className="cpw-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cpw-head">
          <h3 id="change-password-title" className="cpw-title">
            <IconLock size={16} /> Alterar senha
          </h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar" disabled={loading}>✕</button>
        </div>

        {done ? (
          <div style={{ padding: "8px 0 4px" }}>
            <div className="banner banner-success" style={{ padding: "10px 12px" }}>
              <IconCheck className="banner-icon" />
              <div className="banner-body">Senha alterada com sucesso.</div>
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={onClose}>
              Concluir
            </button>
          </div>
        ) : (
          <form className="cpw-form" onSubmit={submit}>
            <div className="field">
              <label className="field-label">Senha atual<span className="req">*</span></label>
              <input type="password" className="input" maxLength={72} value={current} autoComplete="current-password"
                onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Nova senha<span className="req">*</span></label>
              <input type="password" className="input" maxLength={72} value={next} autoComplete="new-password"
                onChange={(e) => setNext(e.target.value)} />
              <span className="field-help">Mínimo 8 caracteres, com 1 número e 1 caractere especial.</span>
            </div>
            <div className="field">
              <label className="field-label">Confirme a nova senha<span className="req">*</span></label>
              <input type="password" className="input" maxLength={72} value={confirm} autoComplete="new-password"
                onChange={(e) => setConfirm(e.target.value)} />
            </div>

            {err && (
              <div className="banner banner-danger" style={{ padding: "10px 12px" }}>
                <IconAlert className="banner-icon" />
                <div className="banner-body" style={{ color: "var(--red-700)" }}>{err}</div>
              </div>
            )}

            <div className="cpw-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
