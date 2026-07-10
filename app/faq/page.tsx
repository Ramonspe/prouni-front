import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell, SECRETARIA_MAILTO } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Perguntas frequentes · PROUNI Mauá",
  description:
    "Dúvidas frequentes sobre a inscrição, o envio de documentos e o acompanhamento da bolsa PROUNI no Instituto Mauá de Tecnologia.",
};

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Quem pode se inscrever no PROUNI Mauá?",
    a: (
      <>
        Candidatos <strong>pré-selecionados pelo MEC/SisProuni</strong> para uma das vagas do Instituto Mauá de
        Tecnologia no ciclo vigente. A pré-seleção é feita pelo MEC; este portal é o canal oficial para o cadastro,
        o envio de documentos e a análise socioeconômica no Mauá.
      </>
    ),
  },
  {
    q: "Como funciona a minha inscrição, passo a passo?",
    a: (
      <>
        1) Crie sua conta e confirme o e-mail por token. 2) Preencha a <strong>Ficha socioeconômica</strong> (grupo
        familiar, moradia, renda e despesas). 3) Envie os <strong>documentos</strong> exigidos. 4) Clique em{" "}
        <strong>Finalizar inscrição</strong> quando tudo estiver enviado. 5) A Secretaria de Bolsas faz a{" "}
        <strong>análise</strong>. 6) Você recebe o <strong>resultado</strong> no portal e por e-mail.
      </>
    ),
  },
  {
    q: "Quais documentos eu preciso enviar?",
    a: (
      <>
        A lista é montada <strong>automaticamente</strong> após o preenchimento da ficha, conforme o seu grupo
        familiar, a situação de renda de cada integrante e a sua moradia. Onde houver um modelo oficial, use o botão{" "}
        <strong>“Baixar modelo”</strong> na área logada para preencher.
      </>
    ),
  },
  {
    q: "Quais formatos e tamanho de arquivo são aceitos?",
    a: (
      <>
        Cada documento deve ser enviado em <strong>PDF, JPG ou PNG</strong>, com até <strong>10 MB</strong>. Arquivos
        ilegíveis, cortados ou incompletos podem ser reprovados.
      </>
    ),
  },
  {
    q: "O que significa uma “pendência”?",
    a: (
      <>
        É um documento que foi <strong>reprovado</strong> na análise (por exemplo, ilegível ou incompleto). Você verá
        o motivo em <strong>Notificações</strong> e deve reenviar o arquivo corrigido em <strong>Documentos</strong>,
        dentro da área logada.
      </>
    ),
  },
  {
    q: "Como acompanho o andamento?",
    a: (
      <>
        Depois de entrar no portal, veja a linha do tempo em <strong>Acompanhamento</strong> e os avisos em{" "}
        <strong>Notificações</strong>. Atualizações importantes também chegam no seu e-mail.
      </>
    ),
  },
  {
    q: "Esqueci minha senha. E agora?",
    a: (
      <>
        Use a opção <strong>“Esqueci minha senha”</strong> na <Link href="/login">tela de login</Link> para redefinir
        com um código enviado por e-mail.
      </>
    ),
  },
];

export default function FaqPublicPage() {
  return (
    <PublicShell
      title="Perguntas frequentes"
      subtitle="Dúvidas comuns sobre a inscrição e o envio de documentos do PROUNI Mauá."
    >
      <div className="public-faq">
        {FAQ.map((f, i) => (
          <details key={i}>
            <summary>{f.q}</summary>
            <div>{f.a}</div>
          </details>
        ))}
      </div>

      <div className="public-contact">
        <strong>Não encontrou a resposta?</strong> Fale com a Secretaria de Bolsas do Instituto Mauá de Tecnologia:
        <br />
        📧 E-mail: <a href={SECRETARIA_MAILTO}>bolsas@maua.br</a>
        <br />
        📞 Telefone: <a href="tel:+551142393141">(11) 4239-3141</a>
        <br />
        <span style={{ fontSize: 12, color: "var(--ink-500)" }}>
          Atendimento conforme os horários e prazos divulgados no edital PROUNI 2026/2.
        </span>
      </div>
    </PublicShell>
  );
}
