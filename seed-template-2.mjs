import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const content = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS COM CONTROLE BÁSICO DE ENTREGAS

Modelo Contratual — Nível de Rigidez: 2/5
Tipo: Prestação de Serviços com Entregas Definidas

---

CONTRATO DE PRESTAÇÃO DE SERVIÇOS COM CONTROLE BÁSICO DE ENTREGAS N.º [NÚMERO]/[ANO]

Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Prestação de Serviços com Controle Básico de Entregas ("Contrato"), que se regerá pelas cláusulas e condições seguintes:

CONTRATANTE: [RAZÃO SOCIAL DA CONTRATANTE], pessoa jurídica de direito privado, inscrita no CNPJ sob o n.º [CNPJ], com sede em [ENDEREÇO COMPLETO], neste ato representada por [NOME DO REPRESENTANTE], [CARGO], portador do CPF n.º [CPF] ("Contratante").

CONTRATADA: [RAZÃO SOCIAL DA CONTRATADA], pessoa jurídica de direito privado, inscrita no CNPJ sob o n.º [CNPJ], com sede em [ENDEREÇO COMPLETO], neste ato representada por [NOME DO REPRESENTANTE], [CARGO], portador do CPF n.º [CPF] ("Contratada").

---

CLÁUSULA PRIMEIRA — DO OBJETO

1.1. O presente Contrato tem por objeto a prestação, pela Contratada à Contratante, dos serviços especificados e delimitados no Anexo I deste instrumento ("Serviços"), a serem executados conforme o cronograma, os entregáveis e os critérios de aceite estabelecidos neste instrumento e em seus Anexos.

1.2. Os Serviços objeto deste Contrato possuem escopo definido e entregas identificáveis, devendo ser executados com estrita observância das especificações técnicas, dos padrões de qualidade e dos prazos previstos neste instrumento.

1.3. A Contratada declara possuir toda a capacidade técnica, operacional e legal necessária para a execução dos Serviços contratados, comprometendo-se a mantê-la durante toda a vigência deste Contrato e a comunicar à Contratante qualquer alteração que possa comprometer tal capacidade.

1.4. Quaisquer serviços não expressamente previstos no Anexo I não integram o escopo deste Contrato e somente poderão ser executados mediante prévia formalização de aditamento contratual ou ordem de serviço específica, aprovada por escrito pela Contratante.

---

CLÁUSULA SEGUNDA — DO ESCOPO, DOS ENTREGÁVEIS E DOS CRITÉRIOS DE ACEITE

2.1. O escopo dos Serviços compreende todas as atividades, tarefas e entregas descritas no Anexo I, que integra o presente Contrato para todos os fins de direito, com indicação expressa dos entregáveis, das especificações técnicas aplicáveis e dos marcos de execução.

2.2. Cada entregável previsto no Anexo I deverá ser formalmente submetido pela Contratada à apreciação da Contratante, acompanhado de documentação técnica suficiente para sua avaliação, observado o prazo de submissão estabelecido no cronograma.

2.3. A Contratante terá o prazo de [PRAZO] dias úteis, contados do recebimento de cada entregável, para aprová-lo ou rejeitá-lo, mediante comunicação escrita fundamentada. O silêncio da Contratante no referido prazo implicará aceitação tácita do entregável submetido.

2.4. Em caso de rejeição fundamentada de entregável, a Contratada terá o prazo de [PRAZO] dias úteis para realizar as correções e ajustes indicados pela Contratante, sem ônus adicional para esta, submetendo nova versão para aprovação.

2.5. A rejeição reiterada de um mesmo entregável, sem justificativa técnica válida, ou o descumprimento do prazo de correção previsto no item 2.4, poderá ensejar a aplicação das penalidades previstas na Cláusula Décima Terceira deste instrumento.

2.6. A aprovação formal dos entregáveis pela Contratante não exime a Contratada de sua responsabilidade por vícios ocultos ou defeitos que se manifestem posteriormente, dentro do prazo de garantia estabelecido no Anexo I.

---

CLÁUSULA TERCEIRA — DO PRAZO E DA VIGÊNCIA

3.1. O presente Contrato vigorará pelo prazo de [PRAZO], contado a partir da data de sua assinatura, podendo ser prorrogado por igual período mediante acordo escrito entre as Partes, formalizado com antecedência mínima de [PRAZO] dias antes do término da vigência.

3.2. O início efetivo da prestação dos Serviços dar-se-á na data de [DATA DE INÍCIO] ou na data de assinatura deste instrumento, o que ocorrer primeiro, salvo disposição diversa constante do Anexo I.

3.3. O cronograma detalhado de execução dos Serviços, com os marcos intermediários e as datas de entrega de cada entregável, constará do Anexo I e será de cumprimento obrigatório por ambas as Partes.

3.4. Eventuais atrasos no cronograma de execução deverão ser comunicados pela Contratada à Contratante com a maior brevidade possível, acompanhados de justificativa técnica e de proposta de replanejamento, para análise e aprovação da Contratante.

3.5. Atrasos decorrentes de atos ou omissões da Contratante, de caso fortuito ou de força maior, devidamente comprovados, não serão imputados à Contratada e ensejarão o replanejamento do cronograma mediante acordo entre as Partes.

---

CLÁUSULA QUARTA — DO VALOR DO CONTRATO

4.1. Pela prestação dos Serviços objeto deste Contrato, a Contratante pagará à Contratada o valor total de R$ [VALOR] ([VALOR POR EXTENSO]), conforme o cronograma financeiro estabelecido no Anexo II deste instrumento.

4.2. O valor contratual é fixo e irreajustável durante o período inicial de vigência, ressalvadas as hipóteses de reajuste previstas na Cláusula Sexta deste instrumento e de alteração de escopo formalizada por aditamento contratual.

4.3. O valor estabelecido nesta cláusula é global e inclui todos os custos diretos e indiretos necessários à execução dos Serviços, incluindo, sem limitação, mão de obra, encargos trabalhistas e previdenciários, tributos, deslocamentos, materiais e demais despesas operacionais da Contratada, salvo disposição expressa em contrário no Anexo I.

4.4. Eventuais serviços adicionais não previstos no escopo original somente serão executados após prévia aprovação escrita da Contratante e formalização de aditamento contratual com definição de valor, prazo e entregáveis adicionais.

4.5. A Contratante não será responsável pelo pagamento de quaisquer valores além dos expressamente previstos neste instrumento e em seus Anexos, salvo nos casos de aditamento contratual devidamente formalizado.

---

CLÁUSULA QUINTA — DA FORMA E DAS CONDIÇÕES DE PAGAMENTO

5.1. O pagamento será realizado conforme o cronograma financeiro constante do Anexo II, vinculado à aprovação formal dos respectivos entregáveis ou marcos de execução previstos no Anexo I, mediante apresentação de nota fiscal ou fatura pela Contratada.

5.2. Cada parcela será paga no prazo de [PRAZO] dias úteis contados da aprovação formal do entregável ou marco correspondente e do recebimento da respectiva nota fiscal, devidamente acompanhada dos documentos exigidos pela legislação fiscal aplicável.

5.3. O pagamento será efetuado por meio de transferência bancária para a conta indicada pela Contratada, cujos dados constam do Anexo III deste instrumento.

5.4. Em caso de atraso no pagamento por parte da Contratante, incidirão sobre o valor devido juros moratórios de 1% (um por cento) ao mês, calculados pro rata die, acrescidos de multa de 2% (dois por cento) sobre o valor em atraso, sem prejuízo da atualização monetária pelo IPCA.

5.5. A Contratante poderá reter o pagamento de parcela vinculada a entregável rejeitado até a aprovação formal da versão corrigida, sem que tal retenção configure inadimplemento contratual.

5.6. Eventuais glosas ou contestações de valores deverão ser comunicadas pela Contratante à Contratada no prazo de [PRAZO] dias úteis contados do recebimento da nota fiscal, com indicação fundamentada dos valores contestados, sob pena de aceitação tácita do valor faturado.

---

CLÁUSULA SEXTA — DO REAJUSTE

6.1. Os valores contratados poderão ser reajustados anualmente, a contar da data de assinatura deste Contrato, com base na variação acumulada do Índice Nacional de Preços ao Consumidor Amplo (IPCA), apurado pelo Instituto Brasileiro de Geografia e Estatística (IBGE), ou por outro índice oficial que venha a substituí-lo.

6.2. O reajuste deverá ser solicitado pela Contratada mediante comunicação escrita à Contratante com antecedência mínima de 30 (trinta) dias da data de sua aplicação, sendo aplicado automaticamente caso a Contratante não se manifeste contrariamente no prazo de 15 (quinze) dias.

6.3. Não haverá reajuste durante o período inicial de vigência do Contrato, salvo nos casos de alteração de escopo formalizada por aditamento ou de variação extraordinária de custos decorrente de fatos imprevisíveis e alheios à vontade das Partes.

6.4. As Partes poderão, de comum acordo, adotar índice diverso do previsto nesta cláusula, desde que tal acordo seja formalizado por escrito e não implique desequilíbrio econômico-financeiro do Contrato.

---

CLÁUSULA SÉTIMA — DAS OBRIGAÇÕES DA CONTRATADA

7.1. São obrigações da Contratada, sem prejuízo das demais previstas neste instrumento:

a) Executar os Serviços com qualidade, diligência e profissionalismo, observando as normas técnicas, as especificações do Anexo I e as melhores práticas do mercado aplicáveis à natureza das atividades contratadas;

b) Cumprir rigorosamente o cronograma de execução e as datas de entrega dos entregáveis previstos no Anexo I;

c) Manter, durante toda a vigência do Contrato, as condições de habilitação e qualificação exigidas para a execução dos Serviços, incluindo registros profissionais e certidões aplicáveis;

d) Designar profissional qualificado como gestor do contrato, responsável pelo acompanhamento, coordenação e comunicação com a Contratante, com poderes para tomar decisões operacionais no âmbito dos Serviços;

e) Comunicar à Contratante, com a maior brevidade possível, qualquer ocorrência que possa comprometer a execução regular dos Serviços ou o cumprimento do cronograma;

f) Cumprir a legislação trabalhista, previdenciária, fiscal, ambiental e de segurança do trabalho aplicável às suas atividades, respondendo integralmente por eventuais descumprimentos;

g) Guardar sigilo sobre todas as informações confidenciais da Contratante a que tiver acesso em razão da execução deste Contrato;

h) Reparar, no prazo estabelecido na Cláusula Segunda, eventuais falhas, inadequações ou não conformidades nos Serviços prestados, sem ônus adicional para a Contratante;

i) Apresentar, quando solicitado pela Contratante, relatórios de progresso e de status de execução dos Serviços, com indicação do percentual de conclusão de cada entregável.

---

CLÁUSULA OITAVA — DAS OBRIGAÇÕES DA CONTRATANTE

8.1. São obrigações da Contratante, sem prejuízo das demais previstas neste instrumento:

a) Efetuar os pagamentos devidos à Contratada nos prazos e condições estabelecidos neste Contrato;

b) Fornecer à Contratada, em tempo hábil, todas as informações, documentos, acessos e recursos necessários à execução dos Serviços, conforme especificado no Anexo I;

c) Designar gestor do contrato com poderes para aprovar entregáveis, emitir ordens de serviço e tomar decisões operacionais no âmbito deste instrumento;

d) Avaliar e aprovar ou rejeitar os entregáveis submetidos pela Contratada no prazo estabelecido na Cláusula Segunda, com fundamentação técnica adequada em caso de rejeição;

e) Comunicar à Contratada, com antecedência razoável, eventuais alterações em seus processos internos, requisitos técnicos ou condições operacionais que possam impactar a execução dos Serviços;

f) Colaborar com a Contratada para a resolução de eventuais dificuldades operacionais que estejam dentro de sua esfera de responsabilidade, evitando atrasos no cronograma de execução;

g) Disponibilizar infraestrutura, equipamentos e recursos materiais necessários à execução dos Serviços, quando expressamente previstos no Anexo I como responsabilidade da Contratante.

---

CLÁUSULA NONA — DA CONFIDENCIALIDADE

9.1. As Partes comprometem-se a manter em estrito sigilo todas as informações confidenciais a que tiverem acesso em razão da execução deste Contrato, incluindo, sem limitação, dados técnicos, comerciais, financeiros, operacionais, estratégicos e de propriedade intelectual da outra Parte ("Informações Confidenciais").

9.2. As Informações Confidenciais somente poderão ser divulgadas a colaboradores, prestadores de serviços ou assessores que necessitem conhecê-las para os fins deste Contrato, desde que previamente informados da natureza confidencial das informações e vinculados a obrigações de sigilo equivalentes às previstas neste instrumento.

9.3. A obrigação de confidencialidade prevista nesta cláusula não se aplica às informações que:

a) Sejam ou se tornem de domínio público por meios lícitos, sem violação deste Contrato;
b) Já fossem de conhecimento comprovado da Parte receptora antes da celebração deste instrumento;
c) Sejam desenvolvidas de forma independente pela Parte receptora, sem utilização das Informações Confidenciais, o que deverá ser comprovado documentalmente;
d) Devam ser divulgadas por força de lei, regulamento ou ordem judicial, hipótese em que a Parte obrigada deverá notificar a outra com a maior brevidade possível, buscando, na medida do possível, a proteção das informações divulgadas.

9.4. As obrigações de confidencialidade previstas nesta cláusula subsistirão pelo prazo de 3 (três) anos após o término ou rescisão deste Contrato, independentemente do motivo que lhe deu causa.

9.5. A violação das obrigações de confidencialidade previstas nesta cláusula ensejará a responsabilização da Parte infratora pelos danos causados, nos termos da Cláusula Décima Segunda deste instrumento.

---

CLÁUSULA DÉCIMA — DA PROTEÇÃO DE DADOS

10.1. As Partes comprometem-se a cumprir integralmente a Lei n.º 13.709/2018 (Lei Geral de Proteção de Dados — LGPD), o Regulamento Geral de Proteção de Dados da União Europeia (GDPR), quando aplicável, e demais normas aplicáveis à proteção de dados pessoais no âmbito da execução deste Contrato.

10.2. Caso a Contratada, no exercício de suas atividades, tenha acesso a dados pessoais de titulares relacionados à Contratante, atuará na qualidade de operadora de dados, processando-os exclusivamente para as finalidades previstas neste Contrato e de acordo com as instruções documentadas da Contratante.

10.3. A Contratada adotará medidas técnicas e organizacionais adequadas e proporcionais aos riscos envolvidos para proteger os dados pessoais a que tiver acesso contra acessos não autorizados, perdas, destruição, alteração ou qualquer forma de tratamento inadequado.

10.4. Em caso de incidente de segurança envolvendo dados pessoais, a Contratada notificará a Contratante no prazo máximo de 48 (quarenta e oito) horas após tomar ciência do ocorrido, fornecendo as informações disponíveis sobre a natureza, extensão e possível impacto do incidente.

10.5. Ao término deste Contrato, a Contratada deverá, conforme instrução da Contratante, devolver ou eliminar de forma segura os dados pessoais tratados em razão deste instrumento, fornecendo comprovação documental da eliminação, salvo obrigação legal de retenção.

10.6. A Contratada não poderá subcontratar o tratamento de dados pessoais sem prévia autorização escrita da Contratante, devendo garantir que os suboperadores observem as mesmas obrigações de proteção de dados previstas neste instrumento.

---

CLÁUSULA DÉCIMA PRIMEIRA — DA PROPRIEDADE INTELECTUAL

11.1. Todos os produtos, obras, criações, desenvolvimentos, relatórios, documentos e materiais produzidos pela Contratada no âmbito da execução deste Contrato serão de propriedade exclusiva da Contratante, que poderá utilizá-los livremente, sem qualquer restrição ou ônus adicional.

11.2. A Contratada cede à Contratante, de forma irrevogável, irretratável e a título gratuito, todos os direitos patrimoniais sobre as criações intelectuais desenvolvidas no âmbito deste Contrato, incluindo os direitos de reprodução, distribuição, adaptação, comunicação ao público e quaisquer outros direitos de exploração previstos na legislação aplicável.

11.3. A Contratada declara que os Serviços prestados e os materiais entregues não violam direitos de propriedade intelectual de terceiros, responsabilizando-se integralmente por eventuais reclamações, demandas ou ações judiciais nesse sentido, incluindo os custos de defesa da Contratante.

11.4. As ferramentas, metodologias, processos e conhecimentos preexistentes da Contratada utilizados na execução dos Serviços permanecerão de sua propriedade, sendo concedida à Contratante licença de uso não exclusiva, intransferível e limitada aos fins deste Contrato.

11.5. A Contratada deverá, ao final do Contrato, entregar à Contratante todos os arquivos, documentos, códigos-fonte e demais materiais produzidos no âmbito dos Serviços, em formato editável e acompanhados de documentação técnica adequada.

---

CLÁUSULA DÉCIMA SEGUNDA — DA RESPONSABILIDADE

12.1. Cada Parte será responsável pelos danos diretos e comprovados que causar à outra em decorrência do descumprimento culposo ou doloso das obrigações previstas neste Contrato.

12.2. A Contratada será responsável pela qualidade técnica dos Serviços prestados e dos entregáveis entregues, respondendo pelos vícios, defeitos e não conformidades identificados durante o prazo de garantia estabelecido no Anexo I.

12.3. Nenhuma das Partes será responsável por danos indiretos, lucros cessantes, perda de oportunidade de negócio ou danos imateriais decorrentes da execução ou inexecução deste Contrato, salvo nos casos de dolo, fraude ou culpa grave devidamente comprovados.

12.4. A responsabilidade total da Contratada perante a Contratante, em qualquer hipótese, ficará limitada ao valor total do Contrato, exceto nos casos de dolo, fraude, violação de obrigações de confidencialidade, proteção de dados ou propriedade intelectual.

12.5. A Contratada não será responsável por atrasos ou falhas na execução dos Serviços decorrentes de atos ou omissões da Contratante, de caso fortuito ou de força maior, desde que tais ocorrências sejam devidamente comunicadas e comprovadas.

---

CLÁUSULA DÉCIMA TERCEIRA — DAS PENALIDADES

13.1. O atraso injustificado na entrega de entregáveis previsto no cronograma do Anexo I sujeitará a Contratada ao pagamento de multa moratória de 0,5% (zero vírgula cinco por cento) do valor da parcela vinculada ao entregável atrasado, por dia de atraso, limitada a 10% (dez por cento) do valor total do Contrato.

13.2. O descumprimento injustificado de obrigações contratuais relevantes, não sanado no prazo de notificação, sujeitará a Parte infratora ao pagamento de multa compensatória de 5% (cinco por cento) do valor total do Contrato, sem prejuízo do direito à reparação dos danos comprovadamente sofridos.

13.3. As penalidades previstas nesta cláusula serão aplicadas de forma proporcional à gravidade do descumprimento, observado o princípio da razoabilidade, e somente após notificação prévia com prazo razoável para regularização, exceto nos casos de descumprimento que, por sua natureza, tornem inviável a concessão de prazo.

13.4. Os valores das multas poderão ser descontados dos pagamentos devidos à Contratada ou cobrados judicialmente, a critério da Contratante.

13.5. Não serão aplicadas penalidades nos casos em que o descumprimento decorra de caso fortuito, força maior, atos atribuíveis à própria Parte prejudicada ou de circunstâncias devidamente comunicadas e aceitas pela outra Parte.

---

CLÁUSULA DÉCIMA QUARTA — DA RESCISÃO

14.1. Este Contrato poderá ser rescindido:

a) Por mútuo acordo entre as Partes, formalizado por escrito, com definição das condições de encerramento;
b) Por qualquer das Partes, sem justa causa, mediante aviso prévio escrito com antecedência mínima de 45 (quarenta e cinco) dias;
c) Por qualquer das Partes, com justa causa, em caso de descumprimento grave e não remediado de obrigações contratuais, após notificação prévia com prazo de 15 (quinze) dias para regularização;
d) Por qualquer das Partes, de forma imediata, nos casos de falência, recuperação judicial ou extrajudicial, insolvência ou dissolução da outra Parte.

14.2. Em caso de rescisão sem justa causa pela Contratante antes do término do período contratual, esta deverá pagar à Contratada:

a) Os valores correspondentes aos Serviços já prestados e entregáveis aprovados até a data de rescisão;
b) Os custos comprovados e não reembolsados incorridos pela Contratada em razão do Contrato;
c) Multa rescisória equivalente a 10% (dez por cento) do valor remanescente do Contrato.

14.3. Em caso de rescisão com justa causa pela Contratante, a Contratada fará jus apenas ao pagamento pelos Serviços efetivamente prestados e aceitos até a data de rescisão, sem direito a qualquer indenização adicional.

14.4. Em caso de rescisão com justa causa pela Contratada, esta terá direito ao recebimento de todos os valores devidos pelos Serviços prestados até a data de rescisão, acrescidos de indenização pelos danos comprovadamente sofridos.

14.5. A rescisão deste Contrato não afetará as obrigações das Partes já constituídas até a data de sua efetivação, incluindo obrigações de pagamento, confidencialidade, proteção de dados e propriedade intelectual.

---

CLÁUSULA DÉCIMA QUINTA — DO COMPLIANCE, ÉTICA E ANTICORRUPÇÃO

15.1. As Partes declaram conhecer e comprometem-se a cumprir integralmente a Lei n.º 12.846/2013 (Lei Anticorrupção), a Lei n.º 8.429/1992 (Lei de Improbidade Administrativa), o Foreign Corrupt Practices Act (FCPA), quando aplicável, e demais normas nacionais e internacionais aplicáveis ao combate à corrupção, ao suborno e a práticas ilícitas.

15.2. As Partes declaram que não utilizarão, direta ou indiretamente, os recursos oriundos deste Contrato para financiar atividades ilícitas, para realizar pagamentos a agentes públicos ou privados com o objetivo de obter vantagens indevidas, ou para qualquer finalidade que contrarie a legislação vigente.

15.3. Cada Parte compromete-se a adotar, em suas operações, práticas de governança corporativa e de compliance compatíveis com os princípios de integridade, transparência, ética nos negócios e responsabilidade social.

15.4. A Contratada declara que não emprega menores de 18 (dezoito) anos em trabalho noturno, perigoso ou insalubre, nem menores de 16 (dezesseis) anos em qualquer trabalho, salvo na condição de aprendiz, a partir de 14 (quatorze) anos.

15.5. A violação das obrigações previstas nesta cláusula constituirá justa causa para rescisão imediata deste Contrato, sem prejuízo das demais sanções legais aplicáveis e da responsabilização pelos danos causados.

---

CLÁUSULA DÉCIMA SEXTA — DA SUBCONTRATAÇÃO E DA CESSÃO

16.1. A Contratada somente poderá subcontratar partes dos Serviços a terceiros especializados mediante prévia autorização escrita da Contratante, que poderá condicioná-la à apresentação de informações sobre o subcontratado, incluindo qualificação técnica e certidões de regularidade fiscal e trabalhista.

16.2. A autorização para subcontratação não exime a Contratada de sua responsabilidade perante a Contratante pelo cumprimento integral das obrigações contratuais, respondendo solidariamente pelos atos e omissões dos subcontratados.

16.3. A Contratante poderá, a seu critério, solicitar a substituição de subcontratado que demonstre incapacidade técnica, irregularidade legal ou que não atenda aos padrões de qualidade exigidos, devendo a Contratada promover a substituição no prazo de [PRAZO] dias.

16.4. A cessão total ou parcial dos direitos e obrigações decorrentes deste Contrato somente será permitida mediante consentimento prévio e escrito da outra Parte, não podendo ser recusado sem justificativa razoável.

16.5. A subcontratação não autorizada constituirá descumprimento contratual grave, sujeitando a Contratada às penalidades previstas na Cláusula Décima Terceira e podendo ensejar a rescisão do Contrato por justa causa.

---

CLÁUSULA DÉCIMA SÉTIMA — DAS COMUNICAÇÕES ENTRE AS PARTES

17.1. Todas as comunicações, notificações, aprovações e solicitações relacionadas a este Contrato deverão ser realizadas por escrito, por meio de carta com aviso de recebimento, e-mail com confirmação de leitura ou plataforma de gestão de projetos previamente acordada entre as Partes.

17.2. As comunicações deverão ser endereçadas aos gestores do contrato indicados pelas Partes no Anexo IV deste instrumento, podendo ser atualizados mediante comunicação escrita, sem necessidade de aditamento contratual.

17.3. As comunicações realizadas por e-mail serão consideradas recebidas no momento em que o remetente obtiver confirmação de leitura ou, na ausência desta, no primeiro dia útil seguinte ao envio, desde que não haja notificação de falha no envio.

17.4. Aprovações de entregáveis, ordens de serviço, autorizações de subcontratação e demais atos que produzam efeitos jurídicos relevantes deverão ser realizados por escrito e assinados pelo gestor do contrato da Parte responsável.

17.5. Alterações no escopo, nos valores contratuais, nos prazos ou em quaisquer condições essenciais deste instrumento deverão ser formalizadas por aditamento contratual escrito, assinado por representantes autorizados de ambas as Partes.

---

CLÁUSULA DÉCIMA OITAVA — DOS ANEXOS

18.1. Integram o presente Contrato, como partes indissociáveis, os seguintes anexos:

Anexo I — Descrição detalhada dos Serviços, escopo, entregáveis, especificações técnicas, critérios de aceite e prazo de garantia;
Anexo II — Cronograma financeiro com valores e condições de pagamento por entregável ou marco;
Anexo III — Dados bancários da Contratada para fins de pagamento;
Anexo IV — Gestores do contrato e contatos das Partes para fins de comunicação;
Anexo V — Cronograma detalhado de execução com marcos intermediários e datas de entrega.

18.2. Em caso de conflito entre o disposto neste instrumento e em seus Anexos, prevalecerão as disposições do instrumento principal, salvo quando os Anexos estabelecerem condições mais específicas para situações determinadas, hipótese em que prevalecerão as disposições mais específicas.

18.3. Os Anexos poderão ser atualizados de comum acordo entre as Partes, mediante comunicação escrita assinada pelos gestores do contrato, sem necessidade de aditamento ao instrumento principal, desde que tais atualizações não impliquem alteração de valores, prazos globais ou obrigações essenciais.

---

CLÁUSULA DÉCIMA NONA — DAS DISPOSIÇÕES GERAIS

19.1. Este Contrato representa o acordo integral entre as Partes com relação ao seu objeto, substituindo todos os entendimentos, negociações e acordos anteriores, verbais ou escritos, sobre a mesma matéria.

19.2. A tolerância de qualquer das Partes em relação ao descumprimento de obrigações pela outra não constituirá novação, renúncia de direitos, precedente para situações futuras ou modificação tácita das condições contratuais.

19.3. Se qualquer disposição deste Contrato for considerada inválida, ilegal ou inexequível por decisão judicial ou arbitral, as demais disposições permanecerão em pleno vigor e efeito, e as Partes negociarão de boa-fé uma disposição substituta que reflita, na medida do possível, a intenção original.

19.4. Este Contrato poderá ser assinado em vias físicas ou eletronicamente, por meio de plataforma de assinatura digital certificada nos termos da Medida Provisória n.º 2.200-2/2001 e demais normas aplicáveis, tendo ambas as formas igual validade jurídica.

19.5. As Partes declaram ter lido e compreendido integralmente o presente instrumento, concordando com todos os seus termos e condições, e que seus representantes possuem os poderes necessários para celebrá-lo, conforme documentos societários em vigor.

19.6. Quaisquer alterações a este instrumento somente produzirão efeitos se formalizadas por escrito e assinadas por representantes autorizados de ambas as Partes.

---

CLÁUSULA VIGÉSIMA — DO FORO

20.1. As Partes elegem o foro da Comarca de [CIDADE/ESTADO] para dirimir quaisquer controvérsias decorrentes deste Contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

20.2. Antes de recorrer ao Poder Judiciário, as Partes comprometem-se a buscar solução amigável para eventuais divergências, por meio de negociação direta entre seus gestores do contrato, pelo prazo de 15 (quinze) dias contados da notificação do conflito.

20.3. Não sendo possível a solução amigável no prazo estabelecido no item 20.2, as Partes poderão, de comum acordo, submeter a controvérsia à mediação ou à arbitragem, nos termos da Lei n.º 9.307/1996 e da Lei n.º 13.140/2015, antes de recorrer ao Poder Judiciário.

20.4. Não havendo acordo quanto à mediação ou arbitragem, qualquer das Partes poderá submeter a controvérsia ao foro eleito nos termos do item 20.1.

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
      ["Contrato de Prestação de Serviços com Controle Básico de Entregas"]
    );
    if (rows.length > 0) {
      console.log("Template já existe. Atualizando...");
      await conn.execute(
        `UPDATE contract_templates SET description = ?, contractType = ?, content = ?, isActive = ? WHERE name = ?`,
        [
          "Modelo contratual para serviços com entregas definidas, aceite básico e maior previsibilidade operacional.",
          "service",
          content,
          true,
          "Contrato de Prestação de Serviços com Controle Básico de Entregas",
        ]
      );
      console.log("Template atualizado com sucesso.");
    } else {
      await conn.execute(
        `INSERT INTO contract_templates (name, description, contractType, content, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          "Contrato de Prestação de Serviços com Controle Básico de Entregas",
          "Modelo contratual para serviços com entregas definidas, aceite básico e maior previsibilidade operacional.",
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
