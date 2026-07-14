"use client";
import { useState } from "react";
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

  return (
    <div className="cpw-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="cpw-card" onClick={(e) => e.stopPropagation()}>
        <div className="cpw-head">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 16, color: "var(--ink-900)" }}>
            <IconLock size={16} /> Alterar senha
          </h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">✕</button>
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
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
