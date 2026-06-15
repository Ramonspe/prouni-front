import Link from "next/link";
import { IconChevR, IconClock, IconHelp, IconInfo, IconShield, IconUser } from "@/components/icons";

export default function WelcomePage() {
  return (
    <div className="welcome-shell" style={{ minHeight: "100vh", overflow: "visible" }}>
      <header className="welcome-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/maua-logo.png" alt="Mauá" style={{ height: 36 }} />
          <div style={{ borderLeft: "1px solid #d8dee9", height: 28, marginLeft: 4 }} />
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6c7891" }}>
              Instituto Mauá de Tecnologia
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#003066", letterSpacing: "0.02em" }}>
              PROUNI · Bolsas 2026
            </div>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, fontSize: 13, color: "#4a5872" }}>
          <Link href="#" style={{ color: "#4a5872" }}>Edital 2026/1</Link>
          <Link href="#" style={{ color: "#4a5872" }}>Perguntas frequentes</Link>
          <Link href="#" style={{ color: "#4a5872" }}>Falar com a secretaria</Link>
        </div>
      </header>

      <div className="welcome-grid">
        <div className="welcome-hero">
          <div className="welcome-eyebrow">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#004080" }} />
            Inscrições abertas · Ciclo 2026/1 até 09/jun/2026
          </div>
          <h1 className="welcome-title">
            Sua bolsa<br />
            PROUNI no <span style={{ color: "#004080" }}>Mauá</span>
            <br />
            começa aqui.
          </h1>
          <p className="welcome-sub">
            Portal oficial de inscrição e acompanhamento da bolsa de estudo para candidatos
            pré-selecionados pelo MEC/SisProuni. Cadastre-se uma vez e acompanhe sua análise
            socioeconômica em tempo real.
          </p>

          <div className="welcome-bullets">
            <div className="welcome-bullet">
              <div className="welcome-bullet-icon"><IconShield size={16} /></div>
              <div>
                <div className="welcome-bullet-title">Ambiente seguro e em conformidade com a LGPD</div>
                <div className="welcome-bullet-sub">Verificação em duas etapas e tratamento ético dos dados.</div>
              </div>
            </div>
            <div className="welcome-bullet">
              <div className="welcome-bullet-icon"><IconClock size={16} /></div>
              <div>
                <div className="welcome-bullet-title">Acompanhamento em tempo real</div>
                <div className="welcome-bullet-sub">Histórico, pareceres e prazos sempre disponíveis.</div>
              </div>
            </div>
            <div className="welcome-bullet">
              <div className="welcome-bullet-icon"><IconHelp size={16} /></div>
              <div>
                <div className="welcome-bullet-title">Suporte direto da Secretaria de Bolsas</div>
                <div className="welcome-bullet-sub">Mensagens e canal direto com seu analista responsável.</div>
              </div>
            </div>
          </div>
        </div>

        <aside className="welcome-cta">
          <div className="welcome-cta-card primary">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div className="welcome-cta-badge">Comece por aqui</div>
            </div>
            <h2 className="welcome-cta-title">Primeira inscrição no PROUNI Mauá</h2>
            <p className="welcome-cta-sub">
              Foi pré-selecionado pelo MEC? Crie sua conta institucional para iniciar o cadastro,
              anexar documentos e acompanhar sua análise.
            </p>
            <Link href="/verificar" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 18 }}>
              <IconUser size={16} /> Quero me cadastrar
              <IconChevR size={16} />
            </Link>
            <div className="welcome-cta-foot">
              <IconInfo size={13} />
              É necessário um e-mail válido — a confirmação será feita por token enviado por e-mail.
            </div>
          </div>

          <div className="welcome-cta-card secondary">
            <h3 className="welcome-cta-title secondary">Já possui cadastro?</h3>
            <p className="welcome-cta-sub small">
              Bolsistas que estão fazendo o recadastro semestral ou candidatos com inscrição em andamento.
            </p>
            <Link href="/login" className="btn btn-ghost btn-block" style={{ marginTop: 12 }}>
              Fazer login com meu CPF
              <IconChevR size={14} />
            </Link>
            <div className="welcome-cta-foot small">
              <Link href="#">Esqueci minha senha</Link>
              <span style={{ color: "#c3cad8", margin: "0 8px" }}>·</span>
              <Link href="#">Não recebi o token</Link>
            </div>
          </div>

          <div className="welcome-cta-trust">
            <IconShield size={14} />
            Conformidade LGPD · Hospedagem AWS Brasil · v2026.1
          </div>
        </aside>
      </div>

      <footer className="welcome-footer">
        <span>© 2026 Instituto Mauá de Tecnologia · CNPJ 60.882.298/0001-09</span>
        <span style={{ marginLeft: "auto" }}>
          <Link href="#" style={{ color: "#6c7891" }}>Política de privacidade</Link>
          <span style={{ color: "#c3cad8", margin: "0 10px" }}>·</span>
          <Link href="#" style={{ color: "#6c7891" }}>Termos de uso</Link>
        </span>
      </footer>
    </div>
  );
}
