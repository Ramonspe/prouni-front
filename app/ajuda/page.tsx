"use client";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { IconClock, IconFile, IconFolder, IconHelp, IconUpload } from "@/components/icons";
import { useRequireAuth } from "@/lib/use-require-auth";

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Como funciona a minha inscrição, passo a passo?",
    a: (
      <>
        1) Preencha a <strong>Ficha socioeconômica</strong> (grupo familiar, moradia, renda e despesas). 2) Envie os{" "}
        <strong>Documentos</strong> exigidos. 3) Clique em <strong>Finalizar inscrição</strong> quando tudo estiver enviado.
        4) A Secretaria de Bolsas faz a <strong>análise</strong>. 5) Você recebe o <strong>resultado</strong> aqui e por e-mail.
      </>
    ),
  },
  {
    q: "Quais documentos eu preciso enviar?",
    a: (
      <>
        A lista é montada <strong>automaticamente</strong> na página <Link href="/documentos">Documentos</Link>, conforme o
        seu grupo familiar, a situação de renda de cada integrante e a sua moradia. Onde houver um modelo oficial, use o
        botão <strong>“Baixar modelo”</strong> para preencher.
      </>
    ),
  },
  {
    q: "Quais formatos e tamanho de arquivo são aceitos?",
    a: <>Cada documento deve ser enviado em <strong>PDF, JPG ou PNG</strong>, com até <strong>10 MB</strong>. Arquivos ilegíveis, cortados ou incompletos podem ser reprovados.</>,
  },
  {
    q: "O que significa uma “pendência”?",
    a: (
      <>
        É um documento que foi <strong>reprovado</strong> na análise (por exemplo, ilegível ou incompleto). Você verá o
        motivo em <Link href="/notificacoes">Notificações</Link> e deve reenviar o arquivo corrigido em{" "}
        <Link href="/documentos">Documentos</Link>.
      </>
    ),
  },
  {
    q: "Como acompanho o andamento?",
    a: (
      <>
        Veja a linha do tempo em <Link href="/acompanhamento">Acompanhamento</Link> e os avisos em{" "}
        <Link href="/notificacoes">Notificações</Link>. Atualizações importantes também chegam no seu e-mail.
      </>
    ),
  },
  {
    q: "Esqueci minha senha. E agora?",
    a: <>Use a opção <strong>“Esqueci minha senha”</strong> na <Link href="/login">tela de login</Link> para redefinir com um código enviado por e-mail.</>,
  },
];

export default function AjudaPage() {
  useRequireAuth();
  return (
    <AppShell role="candidate" crumbs={["PROUNI", "Ajuda"]}>
      <div className="content fade-in">
        <div style={{ marginBottom: 16 }}>
          <h1 className="page-title">Ajuda</h1>
          <p className="page-subtitle">Dúvidas frequentes sobre a inscrição e o envio de documentos do PROUNI Mauá.</p>
        </div>

        {/* Atalhos rápidos */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
          {[
            { href: "/ficha", icon: IconFile, label: "Ficha socioeconômica" },
            { href: "/documentos", icon: IconUpload, label: "Enviar documentos" },
            { href: "/acompanhamento", icon: IconClock, label: "Acompanhamento" },
            { href: "/notificacoes", icon: IconFolder, label: "Notificações" },
          ].map((s) => (
            <Link key={s.href} href={s.href} className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 10, color: "var(--ink-800)" }}>
              <s.icon size={16} /> <span style={{ fontSize: 13, fontWeight: 500 }}>{s.label}</span>
            </Link>
          ))}
        </div>

        {/* FAQ */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header"><h3 className="h-card-title"><IconHelp size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />Perguntas frequentes</h3></div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {FAQ.map((f, i) => (
              <details key={i} style={{ borderBottom: "1px solid var(--ink-100)", padding: "8px 0" }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--ink-900)", fontSize: 13.5 }}>{f.q}</summary>
                <div className="muted small" style={{ marginTop: 8, lineHeight: 1.6 }}>{f.a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* Contato */}
        <div className="card">
          <div className="card-header"><h3 className="h-card-title">Falar com a Secretaria de Bolsas</h3></div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5, color: "var(--ink-700)" }}>
            <div>Não encontrou a resposta? Fale com a equipe de Bolsas do Instituto Mauá de Tecnologia:</div>
            <div>📧 E-mail: <a href="mailto:bolsas@maua.br">bolsas@maua.br</a></div>
            <div>📞 Telefone: <a href="tel:+551142393141">(11) 4239-3141</a></div>
            <div className="muted small">Atendimento conforme os horários e prazos divulgados no edital PROUNI 2026/2.</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
