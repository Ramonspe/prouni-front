"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Banner } from "@/components/ui";
import { IconBell, IconCheck, IconChevL, IconHelp, IconShield } from "@/components/icons";
import { SignupFooter, SignupShell } from "@/components/signup-shell";
import { ApiError, authApi } from "@/lib/api";

type Phase = "email" | "code";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const cellRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendCode = async () => {
    setErr("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    try {
      await authApi.start(email);
      setPhase("code");
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => cellRefs.current[0]?.focus(), 50);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Não foi possível enviar o código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setErr("");
    const joined = code.join("");
    if (joined.length !== 6) {
      setErr("Digite os 6 dígitos do código.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.verifyToken(email, joined);
      sessionStorage.setItem("prn_registration", JSON.stringify({ registrationToken: res.registrationToken, email }));
      router.push("/inscricao");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  const onCellChange = (i: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < 5) cellRefs.current[i + 1]?.focus();
  };

  const onCellKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) cellRefs.current[i - 1]?.focus();
  };

  return (
    <SignupShell
      stepId="verify"
      banner={
        <Banner tone="info" title="Segurança da inscrição">
          Antes de iniciar o cadastro, confirme seu e-mail. Esta verificação por código protege o
          sistema contra cadastros automatizados (bots), conforme exigência do Departamento de TI.
        </Banner>
      }
    >
      <h2 className="signup-title">Confirme seu e-mail para iniciar</h2>
      <p className="signup-sub">
        Informe seu e-mail para receber um código de 6 dígitos. A confirmação garante que o endereço
        é válido antes de seguir para o cadastro PROUNI.
      </p>

      {err && (
        <div className="banner banner-danger" style={{ marginTop: 16, padding: "10px 12px" }}>
          <div className="banner-body" style={{ color: "var(--red-700)" }}>{err}</div>
        </div>
      )}

      <div className="verify-grid" style={{ marginTop: 22 }}>
        {/* Card 1 — e-mail */}
        <div className={`verify-card ${phase === "code" ? "done" : "active"}`}>
          <div className="verify-card-head">
            <div className={`verify-card-step ${phase === "email" ? "active" : ""}`}>
              {phase === "code" ? <IconCheck size={16} stroke={2.8} /> : "1"}
            </div>
            <div>
              <div className={`verify-card-eyebrow ${phase === "email" ? "active" : ""}`}>Passo 1 de 2</div>
              <h2 className="verify-card-title">Seu e-mail</h2>
            </div>
          </div>
          <p className="verify-card-sub">
            Será o canal oficial de comunicação com a Secretaria de Bolsas durante todo o processo.
          </p>
          <div className="field" style={{ marginTop: 16 }}>
            <label className="field-label">E-mail</label>
            <div className="input-with-icon">
              <IconBell className="icon-prefix" />
              <input
                className="input"
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                readOnly={phase === "code"}
                onChange={(e) => setEmail(e.target.value)}
                style={phase === "code" ? { background: "var(--ink-100)", color: "var(--ink-700)" } : undefined}
              />
            </div>
            <span className="field-help">Verifique também a caixa de spam após o envio.</span>
          </div>

          {phase === "code" && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: "auto", alignSelf: "flex-start" }}
              onClick={() => { setPhase("email"); setErr(""); }}
            >
              <IconChevL size={13} /> Alterar e-mail
            </button>
          )}
        </div>

        {/* Card 2 — código */}
        <div className={`verify-card ${phase === "code" ? "active" : ""}`} style={phase === "email" ? { opacity: 0.55 } : undefined}>
          <div className="verify-card-head">
            <div className={`verify-card-step ${phase === "code" ? "active" : ""}`}>2</div>
            <div>
              <div className={`verify-card-eyebrow ${phase === "code" ? "active" : ""}`}>Passo 2 de 2</div>
              <h2 className="verify-card-title">Insira o código recebido</h2>
            </div>
          </div>
          <p className="verify-card-sub">
            {phase === "code"
              ? <>Enviamos um código de <strong>6 dígitos</strong> para <strong>{email}</strong>.</>
              : "Disponível após o envio do código."}
          </p>

          <div className="token-inputs">
            {code.map((v, i) => (
              <input
                key={i}
                ref={(el) => { cellRefs.current[i] = el; }}
                className={"token-cell " + (v ? "filled" : "")}
                value={v}
                maxLength={1}
                inputMode="numeric"
                disabled={phase === "email"}
                aria-label={`Dígito ${i + 1}`}
                onChange={(e) => onCellChange(i, e.target.value)}
                onKeyDown={(e) => onCellKey(i, e)}
              />
            ))}
          </div>

          {phase === "code" && (
            <div className="token-meta">
              <span className="muted small">Não recebeu?</span>
              <a href="#" className="small" onClick={(e) => { e.preventDefault(); void sendCode(); }}>
                Reenviar código
              </a>
            </div>
          )}

          <div className="verify-card-foot">
            <IconShield size={13} />
            Após validar, você criará sua senha de acesso e seguirá para as próximas etapas do cadastro.
          </div>
        </div>
      </div>

      <div className="verify-help">
        <IconHelp size={14} />
        Não está recebendo o código? Verifique a pasta de spam ou confirme o e-mail digitado.
      </div>

      {phase === "email" ? (
        <SignupFooter canBack={false} nextLabel={loading ? "Enviando…" : "Enviar código"} disabled={loading} onNext={sendCode} />
      ) : (
        <SignupFooter canBack={false} nextLabel={loading ? "Verificando…" : "Verificar e continuar"} disabled={loading} onNext={verify} />
      )}
    </SignupShell>
  );
}
