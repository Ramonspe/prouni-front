"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconAlert, IconCheck, IconChevL, IconLock, IconShield, IconUser } from "@/components/icons";
import { authApi, ApiError } from "@/lib/api";

function formatCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export default function RecuperarSenhaPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"request" | "reset" | "done">("request");
  const [cpf, setCpf] = useState("");
  const [code, setCode] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (cpf.replace(/\D/g, "").length !== 11) {
      setErr("Informe um CPF válido.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(cpf);
      setMsg(res.message);
      setPhase("reset");
    } catch {
      setErr("Não foi possível processar a solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!/^\d{6}$/.test(code)) {
      setErr("O código tem 6 dígitos.");
      return;
    }
    if (pwd.length < 8) {
      setErr("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (pwd !== confirm) {
      setErr("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(cpf, code, pwd);
      setPhase("done");
    } catch (error) {
      setErr(error instanceof ApiError ? error.message : "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-art">
        <div className="login-art-content">
          <div className="login-brand">
            <div className="brand-pill" style={{ padding: "10px 14px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/maua-logo.png" alt="Mauá" className="brand-img" style={{ height: 44 }} />
            </div>
            <div>
              <div className="brand-sub" style={{ color: "#aab4cc" }}>Instituto Mauá de Tecnologia</div>
              <div className="brand-name" style={{ color: "#fff", fontSize: 22, letterSpacing: "0.14em" }}>PROUNI · BOLSAS</div>
            </div>
          </div>
          <div style={{ marginTop: "auto" }}>
            <h2 className="login-art-heading">Recuperação de acesso</h2>
            <p className="login-art-sub">
              Enviaremos um código de redefinição para o e-mail cadastrado na sua conta. O código
              expira em 15 minutos.
            </p>
            <div className="login-art-foot">
              <span><IconShield size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Conformidade LGPD</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-wrap">
        {phase === "done" ? (
          <div className="login-form">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--green-100)", color: "var(--green-700)", display: "grid", placeItems: "center", marginBottom: 14 }}>
              <IconCheck size={24} stroke={2.6} />
            </div>
            <h1 className="login-title">Senha redefinida</h1>
            <p className="login-sub">Sua senha foi alterada e as sessões anteriores foram encerradas. Entre com a nova senha.</p>
            <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 22 }} onClick={() => router.push("/login")}>
              Ir para o login
            </button>
          </div>
        ) : phase === "request" ? (
          <form className="login-form" onSubmit={requestCode}>
            <Link href="/login" style={{ fontSize: 12.5, color: "var(--blue-700)", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
              <IconChevL size={13} /> Voltar ao login
            </Link>
            <h1 className="login-title">Esqueci minha senha</h1>
            <p className="login-sub">Informe seu CPF. Se houver uma conta, enviaremos um código ao e-mail cadastrado.</p>

            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="field">
                <label className="field-label" htmlFor="cpf">CPF<span className="req">*</span></label>
                <div className="input-with-icon">
                  <IconUser className="icon-prefix" />
                  <input id="cpf" className="input" placeholder="000.000.000-00" inputMode="numeric" maxLength={14} value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} autoComplete="username" />
                </div>
              </div>
              {err && (
                <div className="banner banner-danger" style={{ padding: "10px 12px" }}>
                  <IconAlert className="banner-icon" />
                  <div className="banner-body" style={{ color: "var(--red-700)" }}>{err}</div>
                </div>
              )}
              <button className="btn btn-primary btn-lg btn-block" disabled={loading} style={{ marginTop: 6 }}>
                {loading ? "Enviando…" : "Enviar código"}
              </button>
            </div>
          </form>
        ) : (
          <form className="login-form" onSubmit={doReset}>
            <button type="button" onClick={() => { setPhase("request"); setErr(""); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12.5, color: "var(--blue-700)", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
              <IconChevL size={13} /> Usar outro CPF
            </button>
            <h1 className="login-title">Redefinir senha</h1>
            <p className="login-sub">{msg || "Digite o código enviado ao seu e-mail e defina uma nova senha."}</p>

            <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="field">
                <label className="field-label" htmlFor="code">Código de verificação<span className="req">*</span></label>
                <input id="code" className="input mono" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} style={{ letterSpacing: "0.3em", textAlign: "center", fontSize: 18 }} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="pwd">Nova senha<span className="req">*</span></label>
                <div className="input-with-icon">
                  <IconLock className="icon-prefix" />
                  <input id="pwd" type="password" className="input" placeholder="Mín. 8 caracteres, 1 número e 1 especial" maxLength={72} value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="confirm">Confirmar nova senha<span className="req">*</span></label>
                <div className="input-with-icon">
                  <IconLock className="icon-prefix" />
                  <input id="confirm" type="password" className="input" maxLength={72} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
                </div>
              </div>
              {err && (
                <div className="banner banner-danger" style={{ padding: "10px 12px" }}>
                  <IconAlert className="banner-icon" />
                  <div className="banner-body" style={{ color: "var(--red-700)" }}>{err}</div>
                </div>
              )}
              <button className="btn btn-primary btn-lg btn-block" disabled={loading} style={{ marginTop: 6 }}>
                {loading ? "Redefinindo…" : "Redefinir senha"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
