import type { Metadata } from "next";
import { IconInfo } from "@/components/icons";
import { PublicShell, SECRETARIA_MAILTO } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Termos de Uso · PROUNI Mauá",
  description:
    "Condições de uso do portal de inscrição e acompanhamento da bolsa PROUNI do Instituto Mauá de Tecnologia.",
};

export default function TermosPage() {
  return (
    <PublicShell
      title="Termos de Uso"
      subtitle="Condições de uso do portal de bolsas PROUNI do Instituto Mauá de Tecnologia."
    >
      <div className="public-note">
        <IconInfo size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong>Documento em validação jurídica.</strong> O texto abaixo estabelece as condições de uso do portal
          e serve de base institucional. A versão definitiva será revisada pela área jurídica do Instituto Mauá de
          Tecnologia antes da publicação oficial.
        </span>
      </div>

      <div className="public-doc-body">
        <p>
          Estes Termos de Uso regulam o acesso e a utilização do portal de bolsas PROUNI do{" "}
          <strong>Instituto Mauá de Tecnologia</strong> (CNPJ 60.882.298/0001-09). Ao criar uma conta e utilizar o
          portal, o usuário declara que leu e concorda com estas condições.
        </p>

        <h2>1. Objeto</h2>
        <p>
          O portal destina-se ao <strong>cadastro, envio de documentos e acompanhamento da análise socioeconômica</strong>{" "}
          de candidatos pré-selecionados pelo MEC/SisProuni para bolsas de estudo no Instituto Mauá de Tecnologia.
        </p>

        <h2>2. Elegibilidade e acesso</h2>
        <p>
          O uso é restrito a candidatos <strong>pré-selecionados pelo MEC</strong> no ciclo vigente e à equipe da
          Secretaria de Bolsas. O usuário é responsável por manter a confidencialidade de suas credenciais e por
          todas as ações realizadas em sua conta.
        </p>

        <h2>3. Responsabilidades do candidato</h2>
        <ul>
          <li>Fornecer informações <strong>verdadeiras, completas e atualizadas</strong>.</li>
          <li>Enviar apenas documentos legítimos e legíveis.</li>
          <li>
            Estar ciente de que a prestação de informações falsas pode acarretar o{" "}
            <strong>indeferimento ou cancelamento da bolsa</strong>, sem prejuízo das medidas legais cabíveis.
          </li>
        </ul>

        <h2>4. Uso adequado</h2>
        <p>
          É vedado utilizar o portal para fins ilícitos, tentar obter acesso não autorizado, comprometer a segurança
          do sistema ou interferir em seu funcionamento.
        </p>

        <h2>5. Análise e decisão</h2>
        <p>
          A concessão da bolsa está sujeita à análise da Secretaria de Bolsas e às regras do{" "}
          <strong>edital PROUNI 2026/2</strong> e da legislação aplicável. O envio da inscrição não garante, por si
          só, a concessão do benefício.
        </p>

        <h2>6. Propriedade intelectual</h2>
        <p>
          As marcas, logotipos e conteúdos do portal pertencem ao Instituto Mauá de Tecnologia e não podem ser
          reproduzidos sem autorização.
        </p>

        <h2>7. Disponibilidade</h2>
        <p>
          Empregamos esforços para manter o portal disponível, mas ele pode passar por manutenções ou
          indisponibilidades temporárias. Prazos e datas oficiais são os definidos no edital.
        </p>

        <h2>8. Privacidade</h2>
        <p>
          O tratamento de dados pessoais observa a nossa Política de Privacidade e a{" "}
          <strong>Lei nº 13.709/2018 (LGPD)</strong>.
        </p>

        <h2>9. Legislação e foro</h2>
        <p>
          Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da Comarca de São Caetano do Sul/SP
          para dirimir eventuais controvérsias.
        </p>

        <h2>10. Contato</h2>
        <p className="public-contact" style={{ marginTop: 8 }}>
          📧 <a href={SECRETARIA_MAILTO}>bolsas@maua.br</a>
          <br />
          📞 (11) 4239-3141
        </p>
      </div>
    </PublicShell>
  );
}
