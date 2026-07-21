"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconAlert, IconEye, IconEyeOff, IconLock, IconShield, IconUser } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

function formatCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [cpf, setCpf] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!cpf || !pwd) {
      setErr("Preencha CPF e senha para continuar.");
      return;
    }
    setLoading(true);
    try {
      const user = await login(cpf, pwd);
      const isStaff = user.role === "ADMIN" || user.role === "ANALYST" || user.role === "VIEWER";
      router.push(isStaff ? "/admin" : "/painel");
    } catch (error) {
      setErr(error instanceof ApiError ? error.message : "Não foi possível entrar. Tente novamente.");
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
              <div className="brand-name" style={{ color: "#fff", fontSize: 22, letterSpacing: "0.14em" }}>
                PROUNI · BOLSAS
              </div>
            </div>
          </div>

          <div style={{ marginTop: "auto" }}>
            <h2 className="login-art-heading">
              Portal de inscrição,<br />análise e acompanhamento<br />do PROUNI 2026.
            </h2>
            <p className="login-art-sub">
              Ambiente seguro para candidatos pré-selecionados pelo MEC/SisProuni concluírem a
              documentação e acompanharem a análise socioeconômica em tempo real.
            </p>

            <div className="login-art-foot">
              <span>
                <IconShield size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Conformidade LGPD
              </span>
              <span className="dot-sep">·</span>
              <span>Hospedagem AWS Brasil</span>
              <span className="dot-sep">·</span>
              <span>v2026.1</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-wrap">
        <form className="login-form" onSubmit={handleSubmit}>
          <h1 className="login-title">Bem-vindo</h1>
          <p className="login-sub">Acesse com suas credenciais institucionais.</p>

          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label className="field-label" htmlFor="cpf">
                CPF<span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <IconUser className="icon-prefix" />
                <input
                  id="cpf"
                  className="input"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  maxLength={14}
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="field">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label className="field-label" htmlFor="pwd">
                  Senha<span className="req">*</span>
                </label>
                <Link href="/recuperar-senha" style={{ fontSize: 12, color: "var(--blue-700)" }}>
                  Esqueci minha senha
                </Link>
              </div>
              <div className="input-with-icon">
                <IconLock className="icon-prefix" />
                <input
                  id="pwd"
                  type={showPwd ? "text" : "password"}
                  className="input"
                  placeholder="Digite a senha cadastrada"
                  maxLength={72}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="icon-suffix"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label="Mostrar senha"
                >
                  {showPwd ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {err && (
              <div className="banner banner-danger" style={{ padding: "10px 12px" }}>
                <IconAlert className="banner-icon" />
                <div className="banner-body" style={{ color: "var(--red-700)" }}>
                  {err}
                </div>
              </div>
            )}

            <label className="checkbox" style={{ marginTop: 2 }}>
              <input type="checkbox" defaultChecked />
              <span className="box" />
              <span>Manter sessão ativa neste dispositivo</span>
            </label>

            <button className="btn btn-primary btn-lg btn-block" disabled={loading} style={{ marginTop: 6 }}>
              {loading ? "Validando…" : "Entrar"}
            </button>
          </div>

          <div className="divider" />

          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12, color: "var(--ink-500)" }}>
            <IconShield size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              Suas credenciais são protegidas e os dados desta sessão seguem a{" "}
              <strong style={{ color: "var(--ink-700)" }}>Lei nº 13.709/18 (LGPD)</strong>. Em caso de dúvidas,
              contate o Setor de Bolsas e Programas Assistenciais.
            </div>
          </div>

          <div style={{ marginTop: 18, textAlign: "center" }}>
            <Link href="/" style={{ fontSize: 13, color: "var(--ink-500)" }}>
              ← Voltar para a página inicial
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
