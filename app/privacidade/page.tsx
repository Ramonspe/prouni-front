import type { Metadata } from "next";
import { IconInfo } from "@/components/icons";
import { PublicShell, SECRETARIA_MAILTO } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Política de Privacidade · PROUNI Mauá",
  description:
    "Como o Instituto Mauá de Tecnologia trata os dados pessoais dos candidatos à bolsa PROUNI, em conformidade com a LGPD (Lei 13.709/2018).",
};

export default function PrivacidadePage() {
  return (
    <PublicShell
      title="Política de Privacidade"
      subtitle="Tratamento de dados pessoais no portal de bolsas PROUNI do Instituto Mauá de Tecnologia."
    >
      <div className="public-note">
        <IconInfo size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong>Documento em validação jurídica.</strong> O texto abaixo descreve as práticas de privacidade do
          portal e serve de base institucional. A versão definitiva será revisada pela área jurídica do Instituto
          Mauá de Tecnologia e do Encarregado pelo Tratamento de Dados antes da publicação oficial.
        </span>
      </div>

      <div className="public-doc-body">
        <p>
          Esta Política de Privacidade descreve como o <strong>Instituto Mauá de Tecnologia</strong> (CNPJ
          60.882.298/0001-09), doravante “Mauá”, coleta, usa, armazena e protege os dados pessoais tratados neste
          portal, em conformidade com a <strong>Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD)</strong>.
        </p>

        <h2>1. Controlador dos dados</h2>
        <p>
          O controlador dos dados é o Instituto Mauá de Tecnologia, com sede em São Caetano do Sul/SP. As dúvidas e
          solicitações relativas a dados pessoais podem ser encaminhadas pelos canais indicados no item 9.
        </p>

        <h2>2. Dados que coletamos</h2>
        <ul>
          <li><strong>Dados de identificação e contato:</strong> nome, CPF, e-mail e telefone.</li>
          <li><strong>Dados socioeconômicos:</strong> composição do grupo familiar, renda, moradia e despesas.</li>
          <li><strong>Documentos comprobatórios:</strong> arquivos enviados para análise da bolsa.</li>
          <li><strong>Dados de uso:</strong> registros de acesso, data/hora e endereço IP, para segurança e auditoria.</li>
        </ul>

        <h2>3. Finalidade do tratamento</h2>
        <p>
          Os dados são tratados exclusivamente para <strong>processar a inscrição, realizar a análise
          socioeconômica, conceder e acompanhar a bolsa PROUNI</strong> e cumprir obrigações legais e regulatórias
          junto ao MEC/SisProuni. Não utilizamos os dados para finalidades incompatíveis com essas.
        </p>

        <h2>4. Base legal</h2>
        <p>
          O tratamento fundamenta-se no <strong>cumprimento de obrigação legal/regulatória</strong>, na{" "}
          <strong>execução de políticas públicas</strong> (Programa Universidade para Todos) e, quando aplicável, no{" "}
          <strong>consentimento</strong> do titular, nos termos dos arts. 7º e 11 da LGPD.
        </p>

        <h2>5. Compartilhamento</h2>
        <p>
          Os dados podem ser compartilhados com o <strong>MEC/SisProuni</strong> e com sistemas acadêmicos e
          administrativos internos do Mauá necessários à concessão e à gestão da bolsa. Não vendemos nem cedemos
          dados pessoais a terceiros para fins comerciais.
        </p>

        <h2>6. Armazenamento e segurança</h2>
        <p>
          Os dados são hospedados em ambiente de nuvem no Brasil, com controles de acesso, criptografia em trânsito e
          registro de auditoria. Adotamos medidas técnicas e administrativas para proteger os dados contra acessos
          não autorizados e situações de perda ou alteração indevida.
        </p>

        <h2>7. Retenção</h2>
        <p>
          Os dados são mantidos pelo período necessário ao cumprimento das finalidades e das obrigações legais
          aplicáveis, sendo posteriormente eliminados ou anonimizados de forma segura.
        </p>

        <h2>8. Direitos do titular</h2>
        <p>
          Nos termos da LGPD, o titular pode solicitar confirmação da existência de tratamento, acesso, correção,
          anonimização, portabilidade, eliminação e informações sobre o compartilhamento de seus dados, bem como
          revogar o consentimento, quando este for a base legal aplicável.
        </p>

        <h2>9. Encarregado e contato</h2>
        <p>
          Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato com a Secretaria de
          Bolsas, que encaminhará ao <strong>Encarregado pelo Tratamento de Dados (DPO)</strong> do Mauá:
        </p>
        <p className="public-contact" style={{ marginTop: 8 }}>
          📧 <a href={SECRETARIA_MAILTO}>bolsas@maua.br</a>
          <br />
          📞 (11) 4239-3141
        </p>

        <h2>10. Alterações</h2>
        <p>
          Esta política pode ser atualizada a qualquer momento. A versão vigente estará sempre disponível nesta
          página, com a respectiva data de revisão.
        </p>
      </div>
    </PublicShell>
  );
}
