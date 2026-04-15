import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const content = `CONTRATO SIMPLES DE PRESTAÇÃO DE SERVIÇOS RECORRENTES

Modelo Contratual — Nível de Rigidez: 1/5
Tipo: Prestação de Serviços Recorrentes

---

CONTRATO DE PRESTAÇÃO DE SERVIÇOS RECORRENTES N.º [NÚMERO]/[ANO]

Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Prestação de Serviços Recorrentes ("Contrato"), que se regerá pelas cláusulas e condições seguintes:

CONTRATANTE: [RAZÃO SOCIAL DA CONTRATANTE], pessoa jurídica de direito privado, inscrita no CNPJ sob o n.º [CNPJ], com sede em [ENDEREÇO COMPLETO], neste ato representada por [NOME DO REPRESENTANTE], [CARGO], portador do CPF n.º [CPF] ("Contratante").

CONTRATADA: [RAZÃO SOCIAL DA CONTRATADA], pessoa jurídica de direito privado, inscrita no CNPJ sob o n.º [CNPJ], com sede em [ENDEREÇO COMPLETO], neste ato representada por [NOME DO REPRESENTANTE], [CARGO], portador do CPF n.º [CPF] ("Contratada").

---

CLÁUSULA PRIMEIRA — DO OBJETO

1.1. O presente Contrato tem por objeto a prestação, pela Contratada à Contratante, dos serviços recorrentes descritos no Anexo I deste instrumento ("Serviços"), a serem executados de forma contínua durante toda a vigência contratual.

1.2. Os Serviços objeto deste Contrato são de natureza recorrente e de baixa complexidade operacional, sendo prestados em regime de continuidade, conforme periodicidade e condições estabelecidas neste instrumento.

1.3. A Contratada declara possuir toda a capacidade técnica, operacional e legal necessária para a execução dos Serviços contratados, comprometendo-se a mantê-la durante toda a vigência deste Contrato.

---

CLÁUSULA SEGUNDA — DO ESCOPO E DOS ENTREGÁVEIS

2.1. O escopo dos Serviços compreende todas as atividades, tarefas e entregas descritas no Anexo I, que integra o presente Contrato para todos os fins de direito.

2.2. A Contratada deverá executar os Serviços com diligência, profissionalismo e qualidade técnica adequada, observando as melhores práticas do mercado aplicáveis à natureza das atividades contratadas.

2.3. Os entregáveis periódicos, quando aplicáveis, serão definidos de comum acordo entre as Partes e formalizados em cronograma específico, que poderá ser ajustado mediante comunicação escrita entre as Partes, sem necessidade de aditamento contratual, desde que não implique alteração de valor ou prazo global.

2.4. A Contratante poderá solicitar ajustes razoáveis no escopo dos Serviços, desde que tais ajustes não impliquem acréscimo de custo ou complexidade relevante. Ajustes que impliquem variação de valor deverão ser formalizados por aditamento.

---

CLÁUSULA TERCEIRA — DO PRAZO E DA VIGÊNCIA

3.1. O presente Contrato vigorará pelo prazo de [PRAZO], contado a partir da data de sua assinatura, podendo ser renovado por iguais e sucessivos períodos mediante acordo escrito entre as Partes.

3.2. A renovação do Contrato poderá ser formalizada por meio de simples notificação escrita, com antecedência mínima de [PRAZO DE ANTECEDÊNCIA] dias antes do término do período vigente, sem necessidade de celebração de novo instrumento.

3.3. O início efetivo da prestação dos Serviços dar-se-á na data de [DATA DE INÍCIO] ou na data de assinatura deste instrumento, o que ocorrer primeiro, salvo disposição diversa constante do Anexo I.

3.4. Qualquer das Partes poderá não renovar o Contrato ao término do período vigente, mediante comunicação escrita à outra Parte com antecedência mínima de [PRAZO] dias, sem que tal decisão configure rescisão antecipada ou gere qualquer ônus.

---

CLÁUSULA QUARTA — DO VALOR DO CONTRATO

4.1. Pela prestação dos Serviços objeto deste Contrato, a Contratante pagará à Contratada o valor mensal de R$ [VALOR] ([VALOR POR EXTENSO]), perfazendo o valor total estimado para o período inicial de vigência de R$ [VALOR TOTAL] ([VALOR TOTAL POR EXTENSO]).

4.2. O valor contratual é fixo para o período inicial de vigência, ressalvadas as hipóteses de reajuste previstas na Cláusula Sexta deste instrumento.

4.3. O valor estabelecido nesta cláusula é global e inclui todos os custos diretos e indiretos necessários à execução dos Serviços, incluindo, sem limitação, mão de obra, encargos trabalhistas e previdenciários, tributos, deslocamentos e demais despesas operacionais da Contratada, salvo disposição expressa em contrário no Anexo I.

4.4. Eventuais serviços adicionais não previstos no escopo original somente serão executados após prévia aprovação escrita da Contratante e formalização de aditamento contratual ou ordem de serviço específica.

---

CLÁUSULA QUINTA — DA FORMA E DAS CONDIÇÕES DE PAGAMENTO

5.1. O pagamento será realizado mensalmente, até o [DIA] dia útil do mês subsequente à prestação dos Serviços, mediante apresentação de nota fiscal ou fatura pela Contratada, devidamente acompanhada dos documentos exigidos pela legislação fiscal aplicável.

5.2. O pagamento será efetuado por meio de transferência bancária para a conta indicada pela Contratada, cujos dados constam do Anexo II deste instrumento.

5.3. Em caso de atraso no pagamento por parte da Contratante, incidirão sobre o valor devido juros moratórios de 1% (um por cento) ao mês, calculados pro rata die, acrescidos de multa de 2% (dois por cento) sobre o valor em atraso.

5.4. A Contratada deverá emitir as notas fiscais em conformidade com a legislação tributária vigente, indicando corretamente os serviços prestados, os tributos incidentes e os dados das Partes.

5.5. Eventuais glosas ou contestações de valores deverão ser comunicadas pela Contratante à Contratada no prazo de [PRAZO] dias úteis contados do recebimento da nota fiscal, sob pena de aceitação tácita do valor faturado.

---

CLÁUSULA SEXTA — DO REAJUSTE

6.1. Os valores contratados poderão ser reajustados anualmente, a contar da data de assinatura deste Contrato, com base na variação acumulada do Índice Nacional de Preços ao Consumidor Amplo (IPCA), apurado pelo Instituto Brasileiro de Geografia e Estatística (IBGE), ou por outro índice que venha a substituí-lo.

6.2. O reajuste deverá ser solicitado pela Contratada mediante comunicação escrita à Contratante com antecedência mínima de 30 (trinta) dias da data de sua aplicação, sendo aplicado automaticamente caso a Contratante não se manifeste contrariamente no prazo de 15 (quinze) dias.

6.3. As Partes poderão, de comum acordo, adotar índice diverso do previsto nesta cláusula, desde que tal acordo seja formalizado por escrito.

---

CLÁUSULA SÉTIMA — DAS OBRIGAÇÕES DA CONTRATADA

7.1. São obrigações da Contratada, sem prejuízo das demais previstas neste instrumento:

a) Executar os Serviços com qualidade, diligência e profissionalismo, observando as normas técnicas e legais aplicáveis;

b) Manter, durante toda a vigência do Contrato, as condições de habilitação e qualificação exigidas para a execução dos Serviços;

c) Designar profissional qualificado como ponto focal para comunicação com a Contratante, responsável pelo acompanhamento e coordenação dos Serviços;

d) Comunicar à Contratante, com a maior brevidade possível, qualquer ocorrência que possa comprometer a execução regular dos Serviços;

e) Cumprir a legislação trabalhista, previdenciária, fiscal e ambiental aplicável às suas atividades, respondendo integralmente por eventuais descumprimentos;

f) Guardar sigilo sobre todas as informações confidenciais da Contratante a que tiver acesso em razão da execução deste Contrato;

g) Reparar, no prazo acordado entre as Partes, eventuais falhas ou inadequações nos Serviços prestados, sem ônus adicional para a Contratante.

---

CLÁUSULA OITAVA — DAS OBRIGAÇÕES DA CONTRATANTE

8.1. São obrigações da Contratante, sem prejuízo das demais previstas neste instrumento:

a) Efetuar os pagamentos devidos à Contratada nos prazos e condições estabelecidos neste Contrato;

b) Fornecer à Contratada, em tempo hábil, todas as informações, documentos e acessos necessários à execução dos Serviços;

c) Designar interlocutor responsável pelo acompanhamento dos Serviços e pela comunicação com a Contratada;

d) Comunicar à Contratada, com antecedência razoável, eventuais alterações em seus processos internos que possam impactar a execução dos Serviços;

e) Colaborar com a Contratada para a resolução de eventuais dificuldades operacionais que estejam dentro de sua esfera de responsabilidade;

f) Avaliar e aprovar os entregáveis no prazo acordado, evitando atrasos que possam impactar o cronograma de execução.

---

CLÁUSULA NONA — DA CONFIDENCIALIDADE

9.1. As Partes comprometem-se a manter em estrito sigilo todas as informações confidenciais a que tiverem acesso em razão da execução deste Contrato, incluindo, sem limitação, dados técnicos, comerciais, financeiros, operacionais e estratégicos da outra Parte ("Informações Confidenciais").

9.2. As Informações Confidenciais somente poderão ser divulgadas a colaboradores, prestadores de serviços ou assessores que necessitem conhecê-las para os fins deste Contrato, desde que previamente informados da natureza confidencial das informações e vinculados a obrigações de sigilo equivalentes às previstas neste instrumento.

9.3. A obrigação de confidencialidade prevista nesta cláusula não se aplica às informações que:

a) Sejam ou se tornem de domínio público por meios lícitos, sem violação deste Contrato;
b) Já fossem de conhecimento da Parte receptora antes da celebração deste instrumento;
c) Sejam desenvolvidas de forma independente pela Parte receptora, sem utilização das Informações Confidenciais;
d) Devam ser divulgadas por força de lei, regulamento ou ordem judicial, hipótese em que a Parte obrigada deverá notificar a outra com a maior brevidade possível.

9.4. As obrigações de confidencialidade previstas nesta cláusula subsistirão pelo prazo de 2 (dois) anos após o término ou rescisão deste Contrato.

---

CLÁUSULA DÉCIMA — DA PROTEÇÃO DE DADOS

10.1. As Partes comprometem-se a cumprir integralmente a Lei n.º 13.709/2018 (Lei Geral de Proteção de Dados — LGPD) e demais normas aplicáveis à proteção de dados pessoais no âmbito da execução deste Contrato.

10.2. Caso a Contratada, no exercício de suas atividades, tenha acesso a dados pessoais de titulares relacionados à Contratante, atuará na qualidade de operadora de dados, processando-os exclusivamente para as finalidades previstas neste Contrato e de acordo com as instruções da Contratante.

10.3. A Contratada adotará medidas técnicas e organizacionais adequadas para proteger os dados pessoais a que tiver acesso contra acessos não autorizados, perdas, destruição ou qualquer forma de tratamento inadequado.

10.4. Em caso de incidente de segurança envolvendo dados pessoais, a Contratada notificará a Contratante no prazo máximo de 72 (setenta e duas) horas após tomar ciência do ocorrido, fornecendo as informações disponíveis sobre a natureza e extensão do incidente.

10.5. Ao término deste Contrato, a Contratada deverá, conforme instrução da Contratante, devolver ou eliminar os dados pessoais tratados em razão deste instrumento, salvo obrigação legal de retenção.

---

CLÁUSULA DÉCIMA PRIMEIRA — DA PROPRIEDADE INTELECTUAL

11.1. Todos os produtos, obras, criações, desenvolvimentos e materiais produzidos pela Contratada no âmbito da execução deste Contrato serão de propriedade exclusiva da Contratante, que poderá utilizá-los livremente, sem qualquer restrição ou ônus adicional.

11.2. A Contratada cede à Contratante, de forma irrevogável e irretratável, todos os direitos patrimoniais sobre as criações intelectuais desenvolvidas no âmbito deste Contrato, incluindo os direitos de reprodução, distribuição, adaptação e comunicação ao público.

11.3. A Contratada declara que os Serviços prestados e os materiais entregues não violam direitos de propriedade intelectual de terceiros, responsabilizando-se por eventuais reclamações nesse sentido.

11.4. As ferramentas, metodologias e conhecimentos preexistentes da Contratada utilizados na execução dos Serviços permanecerão de sua propriedade, sendo concedida à Contratante licença de uso não exclusiva e não transferível para os fins deste Contrato.

---

CLÁUSULA DÉCIMA SEGUNDA — DA RESPONSABILIDADE

12.1. Cada Parte será responsável pelos danos diretos que causar à outra em decorrência do descumprimento das obrigações previstas neste Contrato, desde que devidamente comprovados.

12.2. Nenhuma das Partes será responsável por danos indiretos, lucros cessantes, perda de oportunidade de negócio ou danos imateriais decorrentes da execução ou inexecução deste Contrato, salvo nos casos de dolo ou culpa grave.

12.3. A responsabilidade total da Contratada perante a Contratante, em qualquer hipótese, ficará limitada ao valor total pago nos últimos 6 (seis) meses de vigência do Contrato, exceto nos casos de dolo, fraude ou violação de obrigações de confidencialidade e proteção de dados.

12.4. A Contratada não será responsável por atrasos ou falhas na execução dos Serviços decorrentes de atos ou omissões da Contratante, caso fortuito ou força maior.

---

CLÁUSULA DÉCIMA TERCEIRA — DAS PENALIDADES

13.1. O descumprimento injustificado de obrigações contratuais relevantes por qualquer das Partes poderá ensejar a aplicação de advertência escrita, como medida prévia à rescisão contratual.

13.2. Em caso de descumprimento reiterado ou de gravidade relevante, a Parte prejudicada poderá rescindir o Contrato, nos termos da Cláusula Décima Quarta, sem prejuízo do direito à reparação dos danos comprovadamente sofridos.

13.3. As penalidades previstas nesta cláusula serão aplicadas de forma proporcional à gravidade do descumprimento, observado o princípio da razoabilidade, e somente após notificação prévia com prazo razoável para regularização.

13.4. Não serão aplicadas penalidades nos casos em que o descumprimento decorra de caso fortuito, força maior ou atos atribuíveis à própria Parte prejudicada.

---

CLÁUSULA DÉCIMA QUARTA — DA RESCISÃO

14.1. Este Contrato poderá ser rescindido:

a) Por mútuo acordo entre as Partes, formalizado por escrito;
b) Por qualquer das Partes, sem justa causa, mediante aviso prévio escrito com antecedência mínima de 30 (trinta) dias;
c) Por qualquer das Partes, com justa causa, em caso de descumprimento grave e não remediado de obrigações contratuais, após notificação prévia com prazo de 15 (quinze) dias para regularização.

14.2. Em caso de rescisão sem justa causa pela Contratante antes do término do período contratual, esta deverá pagar à Contratada os valores correspondentes aos Serviços já prestados e não pagos, sem qualquer multa rescisória adicional.

14.3. Em caso de rescisão sem justa causa pela Contratada antes do término do período contratual, esta deverá concluir os Serviços em andamento ou garantir a transição adequada para outro prestador, no prazo acordado entre as Partes.

14.4. A rescisão deste Contrato não afetará os direitos e obrigações das Partes já constituídos até a data de sua efetivação, incluindo obrigações de pagamento, confidencialidade e proteção de dados.

---

CLÁUSULA DÉCIMA QUINTA — DO COMPLIANCE, ÉTICA E ANTICORRUPÇÃO

15.1. As Partes declaram conhecer e comprometem-se a cumprir integralmente a Lei n.º 12.846/2013 (Lei Anticorrupção), a Lei n.º 8.429/1992 (Lei de Improbidade Administrativa) e demais normas aplicáveis ao combate à corrupção, ao suborno e a práticas ilícitas.

15.2. As Partes declaram que não utilizarão, direta ou indiretamente, os recursos oriundos deste Contrato para financiar atividades ilícitas ou para realizar pagamentos a agentes públicos ou privados com o objetivo de obter vantagens indevidas.

15.3. Cada Parte compromete-se a adotar, em suas operações, práticas de governança corporativa e de compliance compatíveis com os princípios de integridade, transparência e ética nos negócios.

15.4. A violação das obrigações previstas nesta cláusula constituirá justa causa para rescisão imediata deste Contrato, sem prejuízo das demais sanções legais aplicáveis.

---

CLÁUSULA DÉCIMA SEXTA — DA SUBCONTRATAÇÃO E DA CESSÃO

16.1. A Contratada poderá subcontratar partes dos Serviços a terceiros especializados, desde que previamente comunicado à Contratante, responsabilizando-se integralmente pela qualidade e pelo cumprimento das obrigações contratuais pelos subcontratados.

16.2. A Contratante poderá, a seu critério, solicitar a substituição de subcontratado que demonstre incapacidade técnica ou que não atenda aos padrões mínimos de qualidade exigidos.

16.3. A cessão total ou parcial dos direitos e obrigações decorrentes deste Contrato somente será permitida mediante consentimento prévio e escrito da outra Parte.

16.4. A subcontratação não exime a Contratada de sua responsabilidade perante a Contratante pelo cumprimento integral das obrigações contratuais.

---

CLÁUSULA DÉCIMA SÉTIMA — DAS COMUNICAÇÕES ENTRE AS PARTES

17.1. Todas as comunicações, notificações e solicitações relacionadas a este Contrato deverão ser realizadas por escrito, por meio de carta com aviso de recebimento, e-mail com confirmação de leitura ou outro meio que permita a comprovação do recebimento.

17.2. As comunicações deverão ser endereçadas aos representantes e contatos indicados pelas Partes no Anexo III deste instrumento, podendo ser atualizados mediante comunicação escrita, sem necessidade de aditamento contratual.

17.3. As comunicações realizadas por e-mail serão consideradas recebidas no momento em que o remetente obtiver confirmação de leitura ou, na ausência desta, no primeiro dia útil seguinte ao envio.

17.4. Alterações relevantes nas condições de execução dos Serviços, nos valores contratuais ou nos prazos deverão ser formalizadas por aditamento contratual escrito, assinado por representantes autorizados de ambas as Partes.

---

CLÁUSULA DÉCIMA OITAVA — DOS ANEXOS

18.1. Integram o presente Contrato, como partes indissociáveis, os seguintes anexos:

Anexo I — Descrição detalhada dos Serviços, escopo, periodicidade e entregáveis;
Anexo II — Dados bancários da Contratada para fins de pagamento;
Anexo III — Representantes e contatos das Partes para fins de comunicação;
Anexo IV — Cronograma de execução e marcos de entrega, quando aplicável.

18.2. Em caso de conflito entre o disposto neste instrumento e em seus Anexos, prevalecerão as disposições do instrumento principal, salvo quando os Anexos estabelecerem condições mais específicas para situações determinadas.

18.3. Os Anexos poderão ser atualizados de comum acordo entre as Partes, mediante comunicação escrita, sem necessidade de aditamento ao instrumento principal, desde que tais atualizações não impliquem alteração de valores, prazos ou obrigações essenciais.

---

CLÁUSULA DÉCIMA NONA — DAS DISPOSIÇÕES GERAIS

19.1. Este Contrato representa o acordo integral entre as Partes com relação ao seu objeto, substituindo todos os entendimentos, negociações e acordos anteriores, verbais ou escritos, sobre a mesma matéria.

19.2. A tolerância de qualquer das Partes em relação ao descumprimento de obrigações pela outra não constituirá novação, renúncia de direitos ou precedente para situações futuras.

19.3. Se qualquer disposição deste Contrato for considerada inválida, ilegal ou inexequível, as demais disposições permanecerão em pleno vigor e efeito, e as Partes negociarão de boa-fé uma disposição substituta que reflita, na medida do possível, a intenção original.

19.4. Este Contrato poderá ser assinado em vias físicas ou eletronicamente, por meio de plataforma de assinatura digital certificada, tendo ambas as formas igual validade jurídica nos termos da legislação vigente.

19.5. As Partes declaram ter lido e compreendido integralmente o presente instrumento, concordando com todos os seus termos e condições, e que seus representantes possuem os poderes necessários para celebrá-lo.

---

CLÁUSULA VIGÉSIMA — DO FORO

20.1. As Partes elegem o foro da Comarca de [CIDADE/ESTADO] para dirimir quaisquer controvérsias decorrentes deste Contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

20.2. Antes de recorrer ao Poder Judiciário, as Partes comprometem-se a buscar solução amigável para eventuais divergências, por meio de negociação direta entre seus representantes, pelo prazo de 30 (trinta) dias contados da notificação do conflito.

20.3. Não sendo possível a solução amigável no prazo estabelecido, qualquer das Partes poderá submeter a controvérsia ao foro eleito, nos termos do item 20.1.

---

E por estarem assim justas e contratadas, as Partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença de 2 (duas) testemunhas.

[LOCAL], [DATA]

___________________________________
[RAZÃO SOCIAL DA CONTRATANTE]
[NOME DO REPRESENTANTE]
[CARGO]
CPF: [CPF]

___________________________________
[RAZÃO SOCIAL DA CONTRATADA]
[NOME DO REPRESENTANTE]
[CARGO]
CPF: [CPF]

TESTEMUNHAS:

1. ___________________________________
   Nome: ___________________________
   CPF: ____________________________

2. ___________________________________
   Nome: ___________________________
   CPF: ____________________________`;

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const [rows] = await conn.execute(
      "SELECT id FROM contract_templates WHERE name = ?",
      ["Contrato Simples de Prestação de Serviços Recorrentes"]
    );
    if (rows.length > 0) {
      console.log("Template já existe. Atualizando conteúdo...");
      await conn.execute(
        `UPDATE contract_templates SET description = ?, contractType = ?, content = ?, isActive = ? WHERE name = ?`,
        [
          "Modelo contratual para serviços recorrentes de baixa complexidade, com estrutura formal completa e menor rigidez operacional.",
          "service",
          content,
          true,
          "Contrato Simples de Prestação de Serviços Recorrentes",
        ]
      );
      console.log("Template atualizado com sucesso.");
    } else {
      await conn.execute(
        `INSERT INTO contract_templates (name, description, contractType, content, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          "Contrato Simples de Prestação de Serviços Recorrentes",
          "Modelo contratual para serviços recorrentes de baixa complexidade, com estrutura formal completa e menor rigidez operacional.",
          "service",
          content,
          true,
        ]
      );
      console.log("Template inserido com sucesso.");
    }
  } finally {
    await conn.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
