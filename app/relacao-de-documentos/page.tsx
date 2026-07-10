import type { Metadata } from "next";
import { IconInfo } from "@/components/icons";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Relação de documentos · PROUNI Mauá",
  description:
    "Relação completa dos documentos exigidos dos candidatos pré-selecionados ao PROUNI no Instituto Mauá de Tecnologia — identificação, moradia, despesas e comprovação de renda.",
};

type DocItem = { title: React.ReactNode; sub?: React.ReactNode[] };

/** Modelo disponível no próprio portal (repetido várias vezes no documento). */
const MOD = "(modelo disponível no Portal PROUNI Mauá)";

const GERAL: DocItem[] = [
  {
    title: (
      <>
        <strong>Termo de Consentimento para Tratamento de Dados Pessoais/Sensíveis</strong> — preenchido e assinado por
        todas as pessoas do grupo familiar maiores de 18 anos {MOD}.
      </>
    ),
  },
  {
    title: <><strong>Histórico escolar completo do ensino médio</strong> do candidato(a).</>,
    sub: [
      "Nos casos em que o candidato tenha cursado o ensino médio em instituição privada na condição de bolsista, deverá ser encaminhada também declaração da escola contendo a informação sobre a concessão da bolsa de estudos, especificando o percentual e o período de utilização do benefício.",
    ],
  },
  {
    title: <><strong>Participação por Políticas Afirmativas</strong> / Participação de Funcionários, Professores e Dependentes.</>,
    sub: [
      "3.1 Autodeclaração de Participação por Políticas Afirmativas (Negros, Pardos, Indígena e Pessoa com Deficiência) — documento obrigatório a ser preenchido e assinado pelo candidato que concorrer às vagas reservadas pelo Prouni, conforme a Lei nº 11.096/2005 e a Lei nº 12.711/2012 " + MOD + ".",
      "3.1.1 Pessoa com Deficiência: apresentar laudo médico com o CID e declaração, conforme anexo " + MOD + ".",
      "3.2 Nos termos da Convenção Coletiva e da legislação aplicável ao ProUni (Lei nº 11.096/2005 e Decreto nº 5.493/2005), os funcionários e professores da instituição, bem como seus dependentes, poderão concorrer às bolsas de estudo reservadas, desde que cumpram os critérios socioeconômicos exigidos e participem do processo seletivo via ENEM.",
    ],
  },
  { title: <><strong>Inscrição — Ficha Socioeconômica.</strong></> },
  {
    title: <><strong>Documento de identificação</strong> do candidato e dos membros de seu grupo familiar:</>,
    sub: [
      "RG e CPF ou CNH de todos os membros do grupo familiar.",
      "Comprovante do estado civil: certidão de nascimento (solteiro); certidão de casamento; certidão de casamento com averbação ou declaração de separação de corpos (divórcio, separação); certidão de óbito (viúvo); declaração de união estável com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório " + MOD + ".",
    ],
  },
  {
    title: <><strong>Documentos no caso de guarda sem decisão judicial:</strong></>,
    sub: [
      "Documento de guarda do estudante, quando os pais não compõem o grupo familiar.",
      "Na inexistência de guarda judicial, apresentar declaração conforme modelo disponibilizado pela Instituição, contendo a qualificação completa do responsável pelo estudante, a indicação de que este detém a responsabilidade de fato pelo candidato e a assinatura de ambos os pais ou responsáveis legais — com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório " + MOD + ".",
    ],
  },
  {
    title: <><strong>Documentos referentes à pensão alimentícia:</strong></>,
    sub: [
      "7.1 Havendo RECEBIMENTO de pensão alimentícia, apresentar, alternativamente, um dos seguintes documentos: sentença judicial; termo de acordo judicial homologado; ou acordo extrajudicial firmado por ambas as partes, com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório " + MOD + ".",
      "7.2 Cópia dos últimos três comprovantes de recebimento de pensão alimentícia.",
      "7.3 Em caso de não recebimento de pensão alimentícia, apresentar declaração com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório " + MOD + ".",
      "7.4 Havendo PAGAMENTO de pensão alimentícia, apresentar, alternativamente: sentença judicial; termo de acordo judicial homologado; ou acordo extrajudicial firmado por ambas as partes, com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório " + MOD + ".",
      "7.5 Cópia dos últimos três comprovantes de pagamento de pensão alimentícia.",
    ],
  },
  {
    title: <><strong>Comprovante de despesas e de moradia:</strong></>,
    sub: [
      "8.1 Comprovantes de todas as despesas fixas mensais do último mês: água, energia, telefone (fixo e celular), aluguel, internet, TV a cabo, plano médico, declaração de gastos com alimentação, financiamento de veículo, financiamento de imóvel, condomínio, gás, cartão de crédito etc. (todos os comprovantes em um único arquivo, em PDF).",
      "8.2 Comprovante de residência atualizado e legível de todos os membros do grupo familiar, preferencialmente contas de água, energia elétrica ou telefone fixo, com o nome completo do titular e o endereço residencial. Caso algum membro não possua comprovante em seu nome, apresentar declaração de residência " + MOD + ".",
      "8.3 Imóvel próprio: cópia do IPTU de 2026 (parte onde consta o valor venal e a metragem do imóvel).",
      "8.4 Imóvel financiado: comprovante de pagamento da última prestação.",
      "8.5 Imóvel cedido: declaração do(a) proprietário(a) confirmando a concessão do imóvel, com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório " + MOD + ".",
      "8.6 Imóvel irregular: declaração do(a) morador(a) informando a situação de irregularidade do imóvel, a existência ou não de pagamento de IPTU e o valor aproximado do imóvel, com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório " + MOD + ".",
      "8.7 Imóvel alugado: contrato de locação e comprovante de pagamento do último mês. Caso não possua contrato, apresentar IPTU (folha de rosto com dados do proprietário) e declaração com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório " + MOD + ".",
    ],
  },
];

const RENDA: DocItem[] = [
  {
    title: <><strong>Carteira de Trabalho e Previdência Social — CTPS:</strong></>,
    sub: [
      "Carteira de trabalho digital: apresentar cópia integral, constando todos os contratos de trabalho ativos.",
      "Quem nunca teve a carteira de trabalho assinada deve apresentar a página da carteira digital onde constam os dados pessoais e a página seguinte em branco.",
      "A carteira de trabalho digital deve ser gerada com data atualizada no último mês do ano corrente.",
    ],
  },
  {
    title: <><strong>Imposto de Renda de Pessoa Física e extratos bancários:</strong></>,
    sub: [
      "Cópia completa da declaração do Imposto de Renda, exercício 2026, e do recibo de entrega, de todos os integrantes do grupo familiar.",
      <>
        Para membros isentos da entrega do Imposto de Renda, apresentar comprovante da situação da declaração de IRPF
        2026, emitido em{" "}
        <a href="https://www.restituicao.receita.fazenda.gov.br/#/" target="_blank" rel="noopener noreferrer">restituicao.receita.fazenda.gov.br</a>{" "}
        (pode ser o print da página).
      </>,
      "10.3 Extratos bancários dos 3 últimos meses de todas as contas bancárias (corrente e poupança) que possuir; caso não possua conta bancária, apresentar declaração com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório " + MOD + ".",
    ],
  },
  {
    title: <><strong>Declaração de bens:</strong></>,
    sub: [
      <>
        11.1 Certidão positiva ou negativa de propriedade de veículo, emitida no site do{" "}
        <a href="https://www.detran.sp.gov.br/" target="_blank" rel="noopener noreferrer">Detran</a>; caso possua
        veículo, enviar o documento do veículo junto com a certidão positiva.
      </>,
      "11.2 Declaração de bens e imóveis — documento assinado pelo responsável, informando a posse de bens e/ou imóveis não declarados na Declaração de Imposto de Renda, conforme exigências do Prouni. Deve conter a descrição detalhada dos bens e imóveis, endereço, matrícula (quando houver) e valor aproximado. Apresentar com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório " + MOD + ".",
    ],
  },
  {
    title: <><strong>Funcionário de empresa privada ou funcionário público:</strong></>,
    sub: [
      "12.1 Cópia dos contracheques dos últimos três meses.",
      "12.2 Seis últimos contracheques, quando houver pagamento de comissão ou hora extra.",
    ],
  },
  {
    title: <><strong>Trabalhador(a) informal ou quem não exerce nenhuma atividade remunerada:</strong></>,
    sub: [
      "13.1 Trabalhador informal: declaração informando a atividade profissional exercida, o local de realização e os rendimentos brutos recebidos nos últimos 3 meses, com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório " + MOD + ".",
      "13.2 Desempregados(as): apresentar cópia da rescisão do contrato de trabalho e, se estiver recebendo seguro-desemprego, o último comprovante. Ficam dispensados da cópia da rescisão os que possuírem, de forma regular, a data de saída anotada e assinada na Carteira de Trabalho digital. Membro desempregado e sem atividade remunerada também deverá apresentar a declaração do item 13.3.",
      "13.3 Membro do grupo familiar que não exerce atividade remunerada: declaração de que não exerce nenhuma atividade laboral " + MOD + ".",
    ],
  },
  {
    title: <><strong>Ajuda financeira de terceiros:</strong></>,
    sub: [
      "14.1 Quem recebe ajuda de custo, em espécie ou por meio de benefícios, deverá apresentar declaração com a discriminação dos valores, assinada por ambas as partes, com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório " + MOD + ".",
      "14.2 Entende-se por ajuda financeira toda contribuição de pessoa que não faz parte do grupo familiar, mesmo que de valores variados por mês — como “mesadas” de familiares, auxílio com alimentação, moradia, pagamento de despesas (plano de saúde, cursos livres etc.) ou quaisquer outras contribuições semelhantes recebidas regularmente por qualquer membro do grupo familiar.",
    ],
  },
  {
    title: <><strong>Microempreendedor(a) Individual (MEI):</strong></>,
    sub: [
      "15.1 Declaração contendo a atividade desenvolvida e todas as receitas auferidas em cada um dos últimos 3 meses, com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório " + MOD + ".",
      "15.2 A renda atual declarada será analisada junto ao faturamento da declaração anual do SIMEI do ano anterior; caso o faturamento seja maior que a renda atual, será considerado o maior valor (valor bruto).",
      "15.3 Cartão de CNPJ (apenas para empresas abertas no ano corrente).",
      "15.4 Declaração anual do SIMEI (DASN–SIMEI).",
    ],
  },
  {
    title: <><strong>Proprietário(a) ou sócio(a) proprietário(a) de empresa:</strong></>,
    sub: [
      "16.1 DECORE ou declaração emitida por contador(a), informando a retirada mensal dos últimos três meses.",
      "16.2 Extratos bancários DETALHADOS dos últimos três meses da pessoa jurídica, contendo identificação do banco, titularidade e número da conta.",
      "16.3 Declaração COMPLETA do Imposto de Renda Pessoa Jurídica e recibo de entrega do último exercício.",
      "16.4 Empresas inativas: apresentar recibo de entrega da DCTF Web ou da DEFIS (ambas sem movimento), enviadas à Receita Federal, juntamente com declaração do contador informando a inatividade da empresa.",
    ],
  },
  {
    title: <><strong>Autônomos(as) ou profissionais liberais (profissão regulamentada):</strong></>,
    sub: [
      "17.1 Profissional liberal (com formação técnica ou superior regulamentada por conselho profissional): DECORE numerada e assinada por contador inscrito no CRC, dos três últimos meses.",
      "17.2 Trabalho autônomo (quem trabalha por conta própria, prestando serviços de forma habitual): declaração de trabalho autônomo com a descrição da atividade e os rendimentos brutos dos últimos 3 meses, acompanhada, quando houver, de documentos comprobatórios (recibos, RPA, extratos bancários, comprovantes de recolhimento ao INSS ou equivalentes), com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório " + MOD + ".",
    ],
  },
  {
    title: <><strong>Produtor(a) rural e/ou agricultor(a) / arrendamento de terra:</strong></>,
    sub: [
      "18.1 Original e cópia do Bloco de Produtor Rural, contendo o faturamento do exercício de 2024, e Declaração do ITR com recibo de entrega.",
      "Declaração de renda emitida por sindicato rural, informando a identificação do proprietário e os rendimentos mensais dos últimos doze meses.",
      "No caso de arrendamento de terras, apresentar contrato e recibo.",
    ],
  },
  {
    title: <><strong>Aposentados(as) ou pensionistas:</strong></>,
    sub: [
      "19.1 Apresentar cópia do último demonstrativo do benefício, onde conste o valor bruto. O documento pode ser emitido no portal gov.br — “Emitir extrato de pagamento de benefício”.",
    ],
  },
  {
    title: <><strong>Estagiário(a), monitor(a) e/ou jovem aprendiz (acima de 14 anos):</strong></>,
    sub: ["Cópia do contrato de estágio e comprovante atualizado do recebimento de bolsa-auxílio."],
  },
  {
    title: <><strong>Benefícios sociais do Governo:</strong></>,
    sub: [
      <>
        21.1 Quem recebe benefícios sociais, incluindo o BPC (Benefício de Prestação Continuada), apresentar cópia do
        cartão e o último extrato do benefício, disponível em{" "}
        <a href="https://meu.inss.gov.br/" target="_blank" rel="noopener noreferrer">meu.inss.gov.br</a>.
      </>,
      "21.2 Também se enquadram os beneficiários de auxílios previdenciários, como auxílio-maternidade, auxílio-doença, auxílio-reclusão, entre outros.",
    ],
  },
  {
    title: <><strong>Rendimentos de aluguel:</strong></>,
    sub: [
      "22.1 Em caso de recebimento de aluguel, apresentar cópia do contrato de locação e recibo do último mês.",
      "22.2 Entende-se por locação o imóvel próprio de um membro do grupo familiar que é alugado a terceiros, mesmo sem formalização legal; caso não possua contrato, apresentar declaração com assinatura eletrônica pelo GOV.BR ou firma reconhecida em cartório, acompanhada dos 3 últimos comprovantes de recebimento " + MOD + ".",
    ],
  },
];

function DocList({ items, start }: { items: DocItem[]; start?: number }) {
  return (
    <ol start={start}>
      {items.map((it, i) => (
        <li key={i}>
          {it.title}
          {it.sub && (
            <ul>
              {it.sub.map((s, j) => (
                <li key={j}>{s}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function RelacaoDocumentosPage() {
  return (
    <PublicShell
      title="Relação de documentos"
      subtitle="Documentos de identificação do estudante e dos membros de seu grupo familiar."
    >
      <div className="public-note">
        <IconInfo size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Os candidatos pré-selecionados pelo MEC para os cursos ofertados pelo Instituto Mauá de Tecnologia deverão
          encaminhar a documentação comprobatória das informações prestadas no ato da inscrição{" "}
          <strong>exclusivamente pelo Portal PROUNI Mauá</strong>. A documentação deverá ser organizada e enviada
          conforme a ordem descrita abaixo. Onde houver modelo oficial, ele fica disponível na área logada, na página
          de <strong>Documentos</strong>.
        </span>
      </div>

      <div className="public-doc-body">
        <DocList items={GERAL} />

        <div className="reldoc-section">Documentação de renda</div>
        <p>
          Em atendimento aos itens a seguir, é <strong>obrigatório</strong> apresentar os documentos de todos os
          membros do grupo familiar maiores de 18 anos, sendo necessário apresentar todas as fontes de renda de cada
          integrante, mesmo que tenha mais de uma. A omissão ou a falta de algum destes documentos, conforme a real
          situação familiar, implicará o <strong>indeferimento do processo</strong>.
        </p>
        <DocList items={RENDA} start={9} />

        <div className="reldoc-sign">São Caetano do Sul, 07 de julho de 2026.</div>
      </div>
    </PublicShell>
  );
}
