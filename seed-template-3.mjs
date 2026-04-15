import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const content = `CONTRATO CORPORATIVO DE PRESTAÇÃO DE SERVIÇOS COM SLA

Modelo Contratual — Nível de Rigidez: 3/5
Tipo: Prestação de Serviços Corporativos com Acordo de Nível de Serviço

---

CONTRATO CORPORATIVO DE PRESTAÇÃO DE SERVIÇOS COM SLA N.º [NÚMERO]/[ANO]

Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato Corporativo de Prestação de Serviços com Acordo de Nível de Serviço ("Contrato"), que se regerá pelas cláusulas e condições seguintes, as quais as Partes declaram ter lido, compreendido e aceito integralmente:

CONTRATANTE: [RAZÃO SOCIAL DA CONTRATANTE], pessoa jurídica de direito privado, inscrita no CNPJ sob o n.º [CNPJ], com sede em [ENDEREÇO COMPLETO], CEP [CEP], neste ato representada por [NOME DO REPRESENTANTE], [CARGO], portador do CPF n.º [CPF], nos termos de [INSTRUMENTO DE REPRESENTAÇÃO] ("Contratante").

CONTRATADA: [RAZÃO SOCIAL DA CONTRATADA], pessoa jurídica de direito privado, inscrita no CNPJ sob o n.º [CNPJ], com sede em [ENDEREÇO COMPLETO], CEP [CEP], neste ato representada por [NOME DO REPRESENTANTE], [CARGO], portador do CPF n.º [CPF], nos termos de [INSTRUMENTO DE REPRESENTAÇÃO] ("Contratada").

As Partes, em conjunto, serão denominadas "Partes" e, individualmente, "Parte".

---

CLÁUSULA PRIMEIRA — DO OBJETO

1.1. O presente Contrato tem por objeto a prestação, pela Contratada à Contratante, dos serviços técnicos especializados descritos no Anexo I — Especificação Técnica dos Serviços ("Serviços"), a serem executados em conformidade com o escopo, os entregáveis, os critérios de aceite, os Acordos de Nível de Serviço (SLA) e o cronograma estabelecidos neste instrumento e em seus Anexos.

1.2. Os Serviços objeto deste Contrato possuem escopo técnico detalhado, com entregáveis claramente identificados, métricas de desempenho mensuráveis e critérios formais de aceite, devendo ser executados com estrita observância das especificações técnicas, das normas aplicáveis, dos padrões de qualidade corporativa e dos SLAs definidos no Anexo VI.

1.3. A Contratada declara possuir toda a capacidade técnica, operacional, financeira e legal necessária para a execução integral dos Serviços contratados, comprometendo-se a mantê-la durante toda a vigência deste Contrato e a comunicar imediatamente à Contratante qualquer alteração que possa comprometer tal capacidade.

1.4. Quaisquer serviços não expressamente previstos no Anexo I não integram o escopo deste Contrato e somente poderão ser executados mediante prévia aprovação formal da Contratante e formalização de aditamento contratual escrito, com definição de escopo, valor, prazo e entregáveis adicionais.

1.5. A Contratada reconhece que a execução dos Serviços poderá envolver acesso a sistemas, infraestrutura, dados e informações sensíveis da Contratante, comprometendo-se a observar todos os protocolos de segurança, confidencialidade e proteção de dados estabelecidos neste instrumento e nas políticas internas da Contratante que lhe forem comunicadas.

---

CLÁUSULA SEGUNDA — DO ESCOPO, DOS ENTREGÁVEIS, DOS CRITÉRIOS DE ACEITE E DO SLA

2.1. O escopo técnico dos Serviços compreende todas as atividades, tarefas, entregáveis e responsabilidades descritas no Anexo I, que integra o presente Contrato para todos os fins de direito, com indicação expressa das especificações técnicas, dos padrões de qualidade aplicáveis e dos marcos de execução.

2.2. Cada entregável previsto no Anexo I deverá ser formalmente submetido pela Contratada à apreciação da Contratante, acompanhado de documentação técnica completa, relatório de testes ou validação e declaração de conformidade com as especificações, observado o prazo de submissão estabelecido no cronograma do Anexo V.

2.3. Os critérios formais de aceite de cada entregável estão definidos no Anexo I e incluem, sem limitação: conformidade técnica com as especificações, aderência aos padrões de qualidade estabelecidos, ausência de defeitos críticos ou bloqueadores, cumprimento dos SLAs aplicáveis e aprovação nos testes de aceitação definidos.

2.4. A Contratante terá o prazo de [PRAZO] dias úteis, contados do recebimento formal de cada entregável com sua documentação completa, para aprová-lo ou rejeitá-lo mediante comunicação escrita fundamentada, com indicação detalhada das não conformidades identificadas e dos critérios de aceite não atendidos.

2.5. Em caso de rejeição fundamentada de entregável, a Contratada terá o prazo de [PRAZO] dias úteis para realizar as correções e ajustes necessários, sem ônus adicional para a Contratante, submetendo nova versão acompanhada de relatório de correções com indicação das não conformidades sanadas.

2.6. A rejeição de entregável em segunda análise, por não conformidades já identificadas na primeira rejeição e não devidamente corrigidas, constituirá descumprimento contratual grave, sujeitando a Contratada às penalidades previstas na Cláusula Décima Terceira e podendo ensejar a rescisão do Contrato por justa causa.

2.7. Os Acordos de Nível de Serviço (SLA) aplicáveis a cada categoria de serviço estão definidos no Anexo VI e incluem, sem limitação: disponibilidade mínima dos sistemas ou serviços, tempo máximo de resposta a incidentes, tempo máximo de resolução, janelas de manutenção programada e métricas de desempenho operacional.

2.8. O descumprimento dos SLAs definidos no Anexo VI ensejará a aplicação de créditos de serviço ou penalidades conforme tabela constante do mesmo Anexo, calculados proporcionalmente ao grau e à duração do descumprimento, sem prejuízo das demais sanções contratuais aplicáveis.

2.9. A Contratada deverá disponibilizar à Contratante relatórios mensais de desempenho com indicação dos SLAs medidos no período, comparação com as metas estabelecidas, análise de causa raiz de eventuais descumprimentos e plano de ação corretiva para os indicadores abaixo da meta.

2.10. A aprovação formal dos entregáveis pela Contratante não exime a Contratada de sua responsabilidade por vícios ocultos, defeitos latentes ou não conformidades que se manifestem posteriormente, dentro do prazo de garantia estabelecido no Anexo I.

---

CLÁUSULA TERCEIRA — DO PRAZO E DA VIGÊNCIA

3.1. O presente Contrato vigorará pelo prazo de [PRAZO], contado a partir da data de sua assinatura, podendo ser prorrogado por períodos iguais e sucessivos mediante acordo escrito entre as Partes, formalizado com antecedência mínima de 60 (sessenta) dias antes do término da vigência.

3.2. O início efetivo da prestação dos Serviços dar-se-á na data de [DATA DE INÍCIO] ou na data de assinatura deste instrumento, o que ocorrer primeiro, salvo disposição diversa constante do Anexo V, e estará condicionado ao cumprimento das condições precedentes eventualmente estabelecidas no Anexo I.

3.3. O cronograma detalhado de execução dos Serviços, com os marcos intermediários, as datas de entrega de cada entregável e os marcos de pagamento correspondentes, constará do Anexo V e será de cumprimento obrigatório por ambas as Partes.

3.4. Eventuais atrasos no cronograma de execução deverão ser comunicados pela Contratada à Contratante com antecedência mínima de [PRAZO] dias antes da data prevista de entrega, acompanhados de justificativa técnica detalhada, análise de impacto e proposta de replanejamento, para análise e aprovação formal da Contratante.

3.5. A aprovação de replanejamento pela Contratante não constituirá renúncia ao direito de aplicar as penalidades cabíveis pelo atraso, salvo se expressamente previsto no instrumento de aprovação do replanejamento.

3.6. Atrasos decorrentes exclusivamente de atos ou omissões da Contratante, de caso fortuito ou de força maior, devidamente comunicados e comprovados documentalmente, não serão imputados à Contratada e ensejarão o replanejamento do cronograma mediante acordo formal entre as Partes.

---

CLÁUSULA QUARTA — DO VALOR DO CONTRATO

4.1. Pela prestação integral dos Serviços objeto deste Contrato, a Contratante pagará à Contratada o valor total de R$ [VALOR] ([VALOR POR EXTENSO]), conforme o cronograma financeiro detalhado no Anexo II deste instrumento, vinculado à aprovação formal dos respectivos entregáveis ou marcos de execução.

4.2. O valor contratual é fixo e irreajustável durante o período inicial de vigência, ressalvadas as hipóteses de reajuste previstas na Cláusula Sexta deste instrumento, de alteração de escopo formalizada por aditamento contratual e de variação extraordinária de custos decorrente de fatos imprevisíveis e alheios à vontade das Partes.

4.3. O valor estabelecido nesta cláusula é global e inclui todos os custos diretos e indiretos necessários à execução integral dos Serviços, incluindo, sem limitação, mão de obra especializada, encargos trabalhistas e previdenciários, tributos, licenças de software, deslocamentos, hospedagem, materiais, equipamentos e demais despesas operacionais da Contratada, salvo disposição expressa em contrário no Anexo I.

4.4. Eventuais serviços adicionais não previstos no escopo original somente serão executados após aprovação formal escrita da Contratante, com indicação de valor, prazo e entregáveis adicionais, e formalização de aditamento contratual. A execução de serviços adicionais sem autorização prévia não gerará obrigação de pagamento para a Contratante.

4.5. A Contratante não será responsável pelo pagamento de quaisquer valores além dos expressamente previstos neste instrumento e em seus Anexos, salvo nos casos de aditamento contratual devidamente formalizado e assinado por representantes autorizados de ambas as Partes.

4.6. Os créditos de serviço decorrentes de descumprimento de SLA, conforme tabela do Anexo VI, serão deduzidos automaticamente dos valores das faturas subsequentes, sem necessidade de formalização adicional, salvo contestação fundamentada da Contratada no prazo de 5 (cinco) dias úteis.

---

CLÁUSULA QUINTA — DA FORMA E DAS CONDIÇÕES DE PAGAMENTO

5.1. O pagamento será realizado conforme o cronograma financeiro constante do Anexo II, vinculado à aprovação formal dos respectivos entregáveis ou marcos de execução previstos no Anexo V, mediante apresentação de nota fiscal ou fatura pela Contratada, acompanhada dos documentos comprobatórios exigidos.

5.2. Cada parcela será paga no prazo de [PRAZO] dias úteis contados da aprovação formal do entregável ou marco correspondente e do recebimento da respectiva nota fiscal, devidamente acompanhada de: (i) relatório de execução do período; (ii) certidões de regularidade fiscal e trabalhista atualizadas; e (iii) comprovantes de recolhimento de encargos aplicáveis.

5.3. O pagamento será efetuado por meio de transferência bancária para a conta indicada pela Contratada no Anexo III deste instrumento, sendo vedada a emissão de duplicatas, cheques ou outros títulos de crédito sem prévia autorização escrita da Contratante.

5.4. Em caso de atraso no pagamento por parte da Contratante, incidirão sobre o valor devido juros moratórios de 1% (um por cento) ao mês, calculados pro rata die, acrescidos de multa de 2% (dois por cento) sobre o valor em atraso e atualização monetária pelo IPCA, desde que o atraso não decorra de contestação fundamentada de valores pela Contratante.

5.5. A Contratante poderá reter o pagamento de parcela vinculada a entregável rejeitado, a SLA não cumprido ou a obrigações acessórias não atendidas, sem que tal retenção configure inadimplemento contratual, devendo comunicar à Contratada os motivos da retenção no prazo de 5 (cinco) dias úteis.

5.6. Eventuais glosas ou contestações de valores deverão ser comunicadas pela Contratante à Contratada no prazo de [PRAZO] dias úteis contados do recebimento da nota fiscal, com indicação fundamentada dos valores contestados e dos critérios aplicados, sob pena de aceitação tácita do valor faturado.

5.7. A Contratada não poderá ceder, endossar ou transferir os créditos decorrentes deste Contrato a terceiros sem prévia autorização escrita da Contratante.

---

CLÁUSULA SEXTA — DO REAJUSTE

6.1. Os valores contratados poderão ser reajustados anualmente, a contar da data de assinatura deste Contrato, com base na variação acumulada do Índice Nacional de Preços ao Consumidor Amplo (IPCA), apurado pelo Instituto Brasileiro de Geografia e Estatística (IBGE), ou por outro índice oficial que venha a substituí-lo.

6.2. O reajuste deverá ser solicitado pela Contratada mediante comunicação escrita à Contratante com antecedência mínima de 45 (quarenta e cinco) dias da data de sua aplicação, sendo aplicado mediante acordo formal entre as Partes, formalizado por aditamento contratual ou por comunicação escrita assinada pelos gestores do contrato.

6.3. Não haverá reajuste durante o período inicial de vigência do Contrato, salvo nos casos de alteração de escopo formalizada por aditamento, de variação extraordinária de custos decorrente de fatos imprevisíveis e alheios à vontade das Partes, ou de alteração de legislação tributária que impacte diretamente os custos dos Serviços.

6.4. Em caso de desequilíbrio econômico-financeiro do Contrato decorrente de fatos imprevisíveis e alheios à vontade das Partes, qualquer delas poderá solicitar a revisão dos valores contratuais, mediante apresentação de documentação comprobatória e negociação de boa-fé, nos termos do artigo 317 do Código Civil.

---

CLÁUSULA SÉTIMA — DAS OBRIGAÇÕES DA CONTRATADA

7.1. São obrigações da Contratada, sem prejuízo das demais previstas neste instrumento:

a) Executar os Serviços com excelência técnica, diligência, profissionalismo e observância das melhores práticas do mercado, das normas técnicas aplicáveis e das especificações do Anexo I, garantindo a qualidade e a conformidade dos entregáveis com os critérios de aceite estabelecidos;

b) Cumprir rigorosamente o cronograma de execução, as datas de entrega dos entregáveis e os SLAs definidos no Anexo VI, comunicando proativamente à Contratante qualquer risco de descumprimento;

c) Manter, durante toda a vigência do Contrato, as condições de habilitação e qualificação técnica exigidas para a execução dos Serviços, incluindo registros profissionais, certificações, licenças e certidões aplicáveis;

d) Designar profissional sênior qualificado como gestor técnico do contrato, com poderes para tomar decisões operacionais, coordenar a equipe de execução e ser o ponto focal de comunicação com a Contratante;

e) Manter equipe técnica qualificada e em número suficiente para a execução dos Serviços dentro dos prazos e padrões de qualidade estabelecidos, comunicando à Contratante qualquer substituição de profissional-chave com antecedência mínima de [PRAZO] dias;

f) Comunicar à Contratante, com a maior brevidade possível e em prazo não superior a 24 (vinte e quatro) horas, qualquer ocorrência, incidente ou evento que possa comprometer a execução regular dos Serviços, o cumprimento do cronograma ou o atendimento dos SLAs;

g) Cumprir integralmente a legislação trabalhista, previdenciária, fiscal, ambiental, de segurança do trabalho e de proteção de dados aplicável às suas atividades, respondendo integralmente por eventuais descumprimentos e por seus reflexos sobre a Contratante;

h) Guardar sigilo absoluto sobre todas as informações confidenciais da Contratante a que tiver acesso em razão da execução deste Contrato, nos termos da Cláusula Nona;

i) Reparar, no prazo estabelecido na Cláusula Segunda, eventuais falhas, inadequações, não conformidades ou defeitos nos Serviços prestados ou nos entregáveis entregues, sem ônus adicional para a Contratante;

j) Apresentar à Contratante, na periodicidade estabelecida no Anexo I, relatórios de progresso, de desempenho de SLA e de status de execução dos Serviços, com indicação do percentual de conclusão de cada entregável, dos indicadores de qualidade e das ações corretivas em andamento;

k) Adotar, em suas operações, práticas de governança corporativa, compliance e gestão de riscos compatíveis com os padrões exigidos pela Contratante e com a legislação aplicável;

l) Participar de reuniões de acompanhamento, revisão de desempenho e comitês de gestão do contrato na periodicidade e formato definidos no Anexo I.

---

CLÁUSULA OITAVA — DAS OBRIGAÇÕES DA CONTRATANTE

8.1. São obrigações da Contratante, sem prejuízo das demais previstas neste instrumento:

a) Efetuar os pagamentos devidos à Contratada nos prazos e condições estabelecidos neste Contrato, observadas as condições de aprovação de entregáveis e de apresentação de documentação fiscal;

b) Fornecer à Contratada, em tempo hábil e de forma completa, todas as informações, documentos, especificações, acessos, credenciais e recursos necessários à execução dos Serviços, conforme especificado no Anexo I;

c) Designar gestor técnico do contrato com poderes para aprovar entregáveis, emitir ordens de serviço, autorizar alterações de escopo e tomar decisões operacionais no âmbito deste instrumento;

d) Avaliar e aprovar ou rejeitar os entregáveis submetidos pela Contratada no prazo estabelecido na Cláusula Segunda, com fundamentação técnica adequada e referência expressa aos critérios de aceite não atendidos em caso de rejeição;

e) Comunicar à Contratada, com antecedência razoável e não inferior a [PRAZO] dias, eventuais alterações em seus processos internos, requisitos técnicos, sistemas, políticas de segurança ou condições operacionais que possam impactar a execução dos Serviços ou o cumprimento dos SLAs;

f) Colaborar ativamente com a Contratada para a resolução de eventuais dificuldades operacionais que estejam dentro de sua esfera de responsabilidade, evitando atrasos no cronograma de execução e no cumprimento dos SLAs;

g) Disponibilizar infraestrutura, equipamentos, sistemas e recursos materiais necessários à execução dos Serviços, quando expressamente previstos no Anexo I como responsabilidade da Contratante;

h) Participar das reuniões de acompanhamento, revisão de desempenho e comitês de gestão do contrato na periodicidade e formato definidos no Anexo I;

i) Notificar a Contratada, de forma tempestiva e fundamentada, sobre qualquer descumprimento de obrigação contratual ou de SLA, antes de aplicar as penalidades previstas neste instrumento.

---

CLÁUSULA NONA — DA CONFIDENCIALIDADE

9.1. As Partes comprometem-se a manter em estrito sigilo todas as informações confidenciais a que tiverem acesso em razão da execução deste Contrato, incluindo, sem limitação, dados técnicos, comerciais, financeiros, operacionais, estratégicos, de propriedade intelectual, de clientes e de colaboradores da outra Parte ("Informações Confidenciais").

9.2. As Informações Confidenciais somente poderão ser divulgadas a colaboradores, prestadores de serviços, assessores jurídicos ou técnicos que: (i) necessitem conhecê-las para os fins deste Contrato; (ii) sejam previamente informados da natureza confidencial das informações; e (iii) estejam vinculados a obrigações de sigilo equivalentes às previstas neste instrumento, por contrato escrito ou por disposição legal.

9.3. Cada Parte deverá adotar medidas técnicas e organizacionais adequadas para proteger as Informações Confidenciais da outra Parte contra acesso não autorizado, divulgação indevida, perda, destruição ou qualquer forma de uso inadequado, observando padrões de segurança equivalentes aos que adota para proteger suas próprias informações confidenciais de mesma natureza, mas nunca inferiores a um padrão razoável de diligência.

9.4. A obrigação de confidencialidade prevista nesta cláusula não se aplica às informações que:

a) Sejam ou se tornem de domínio público por meios lícitos, sem violação deste Contrato ou de qualquer outra obrigação de confidencialidade;
b) Já fossem de conhecimento comprovado e documentado da Parte receptora antes da celebração deste instrumento, sem restrição de divulgação;
c) Sejam desenvolvidas de forma independente pela Parte receptora, sem utilização das Informações Confidenciais, o que deverá ser comprovado documentalmente;
d) Sejam recebidas de terceiros que as divulguem de forma lícita e sem restrição de confidencialidade;
e) Devam ser divulgadas por força de lei, regulamento, ordem judicial ou determinação de autoridade competente, hipótese em que a Parte obrigada deverá notificar a outra com a maior brevidade possível, buscando a proteção das informações divulgadas na medida do possível.

9.5. As obrigações de confidencialidade previstas nesta cláusula subsistirão pelo prazo de 5 (cinco) anos após o término ou rescisão deste Contrato, independentemente do motivo que lhe deu causa, sendo que as informações que constituam segredo de negócio permanecerão protegidas pelo prazo legal aplicável.

9.6. A violação das obrigações de confidencialidade previstas nesta cláusula ensejará a responsabilização da Parte infratora pelos danos diretos e indiretos causados, incluindo lucros cessantes e danos reputacionais, nos termos da Cláusula Décima Segunda deste instrumento.

---

CLÁUSULA DÉCIMA — DA PROTEÇÃO DE DADOS

10.1. As Partes comprometem-se a cumprir integralmente a Lei n.º 13.709/2018 (Lei Geral de Proteção de Dados — LGPD), o Regulamento Geral de Proteção de Dados da União Europeia (GDPR), quando aplicável, e demais normas nacionais e internacionais aplicáveis à proteção de dados pessoais no âmbito da execução deste Contrato.

10.2. Caso a Contratada, no exercício de suas atividades, tenha acesso a dados pessoais de titulares relacionados à Contratante, atuará na qualidade de operadora de dados, processando-os exclusivamente para as finalidades previstas neste Contrato, de acordo com as instruções documentadas da Contratante e em observância aos princípios da finalidade, adequação, necessidade, livre acesso, qualidade dos dados, transparência, segurança, prevenção, não discriminação e responsabilização.

10.3. A Contratada adotará medidas técnicas e organizacionais robustas e proporcionais aos riscos envolvidos para proteger os dados pessoais a que tiver acesso, incluindo, sem limitação: controles de acesso baseados em perfil, criptografia de dados em trânsito e em repouso, registros de auditoria (logs), planos de resposta a incidentes e treinamento regular de sua equipe em proteção de dados.

10.4. Em caso de incidente de segurança envolvendo dados pessoais, a Contratada notificará a Contratante no prazo máximo de 24 (vinte e quatro) horas após tomar ciência do ocorrido, fornecendo as informações disponíveis sobre: (i) natureza do incidente; (ii) categorias e volume de dados afetados; (iii) possível impacto sobre os titulares; (iv) medidas adotadas ou a adotar para mitigar os efeitos do incidente.

10.5. Ao término deste Contrato, a Contratada deverá, conforme instrução documentada da Contratante, devolver ou eliminar de forma segura e irreversível os dados pessoais tratados em razão deste instrumento, fornecendo comprovação técnica da eliminação, salvo obrigação legal de retenção, hipótese em que deverá informar à Contratante os dados retidos e o fundamento legal aplicável.

10.6. A Contratada não poderá subcontratar o tratamento de dados pessoais sem prévia autorização escrita da Contratante, devendo garantir contratualmente que os suboperadores observem as mesmas obrigações de proteção de dados previstas neste instrumento e respondendo solidariamente por eventuais violações.

10.7. A Contratada deverá designar encarregado de proteção de dados (DPO) ou ponto focal de privacidade para as atividades desenvolvidas no âmbito deste Contrato, cujos dados de contato deverão constar do Anexo IV.

10.8. As Partes comprometem-se a cooperar com a Autoridade Nacional de Proteção de Dados (ANPD) e com as autoridades de proteção de dados de outras jurisdições aplicáveis, fornecendo as informações solicitadas no âmbito de suas competências.

---

CLÁUSULA DÉCIMA PRIMEIRA — DA PROPRIEDADE INTELECTUAL

11.1. Todos os produtos, obras, criações, desenvolvimentos, relatórios, documentos, códigos, algoritmos, metodologias, materiais e demais criações intelectuais produzidos pela Contratada no âmbito da execução deste Contrato serão de propriedade exclusiva da Contratante, que poderá utilizá-los livremente, sem qualquer restrição, ônus adicional ou necessidade de autorização da Contratada.

11.2. A Contratada cede à Contratante, de forma irrevogável, irretratável, universal e a título gratuito, todos os direitos patrimoniais sobre as criações intelectuais desenvolvidas no âmbito deste Contrato, incluindo os direitos de reprodução, distribuição, adaptação, comunicação ao público, transformação, incorporação em outras obras e quaisquer outros direitos de exploração previstos na legislação de propriedade intelectual aplicável.

11.3. A Contratada declara que os Serviços prestados, os entregáveis entregues e os materiais produzidos não violam direitos de propriedade intelectual, direitos autorais, patentes, marcas ou segredos de negócio de terceiros, responsabilizando-se integralmente por eventuais reclamações, demandas, notificações ou ações judiciais nesse sentido, incluindo os custos razoáveis de defesa da Contratante.

11.4. As ferramentas, metodologias, frameworks, processos, bibliotecas e conhecimentos preexistentes da Contratada utilizados na execução dos Serviços permanecerão de sua propriedade exclusiva, sendo concedida à Contratante licença de uso não exclusiva, intransferível, irrevogável e limitada aos fins deste Contrato e à operação dos entregáveis produzidos.

11.5. A Contratada deverá, ao final do Contrato e quando solicitado durante sua vigência, entregar à Contratante todos os arquivos, documentos, códigos-fonte, scripts, configurações e demais materiais produzidos no âmbito dos Serviços, em formato editável e acompanhados de documentação técnica completa e atualizada.

11.6. A Contratada não poderá utilizar o nome, a marca, o logotipo ou qualquer outro elemento de identidade visual da Contratante em materiais de marketing, portfólio ou comunicações externas sem prévia autorização escrita da Contratante.

---

CLÁUSULA DÉCIMA SEGUNDA — DA RESPONSABILIDADE

12.1. Cada Parte será responsável pelos danos diretos e comprovados que causar à outra em decorrência do descumprimento culposo ou doloso das obrigações previstas neste Contrato, devendo a Parte prejudicada demonstrar o nexo de causalidade entre o descumprimento e o dano sofrido.

12.2. A Contratada será responsável pela qualidade técnica dos Serviços prestados e dos entregáveis entregues, respondendo pelos vícios, defeitos, não conformidades e falhas de desempenho identificados durante a execução do Contrato e dentro do prazo de garantia estabelecido no Anexo I.

12.3. A Contratada será responsável pelos danos causados a terceiros em decorrência da execução dos Serviços, incluindo danos a colaboradores, clientes e parceiros da Contratante, devendo manter seguro de responsabilidade civil com cobertura mínima de R$ [VALOR] durante toda a vigência do Contrato.

12.4. Nenhuma das Partes será responsável por danos indiretos, lucros cessantes, perda de oportunidade de negócio, danos imateriais ou danos consequenciais decorrentes da execução ou inexecução deste Contrato, salvo nos casos de dolo, fraude, culpa grave, violação de obrigações de confidencialidade, proteção de dados ou propriedade intelectual, devidamente comprovados.

12.5. A responsabilidade total da Contratada perante a Contratante, em qualquer hipótese, ficará limitada ao valor total do Contrato, exceto nos casos de dolo, fraude, violação de obrigações de confidencialidade, proteção de dados, propriedade intelectual ou responsabilidade perante terceiros.

12.6. A Contratada não será responsável por atrasos ou falhas na execução dos Serviços decorrentes exclusivamente de atos ou omissões da Contratante, de caso fortuito ou de força maior, desde que tais ocorrências sejam comunicadas imediatamente e comprovadas documentalmente.

---

CLÁUSULA DÉCIMA TERCEIRA — DAS PENALIDADES

13.1. O atraso injustificado na entrega de entregáveis previsto no cronograma do Anexo V sujeitará a Contratada ao pagamento de multa moratória de 0,5% (zero vírgula cinco por cento) do valor da parcela vinculada ao entregável atrasado, por dia de atraso, limitada a 15% (quinze por cento) do valor total do Contrato.

13.2. O descumprimento dos SLAs definidos no Anexo VI, além dos créditos de serviço previstos no mesmo Anexo, poderá ensejar a aplicação de multa adicional de até 5% (cinco por cento) do valor mensal do Contrato, proporcional ao grau de descumprimento e ao impacto operacional causado à Contratante.

13.3. O descumprimento injustificado de obrigações contratuais relevantes, não sanado no prazo de notificação, sujeitará a Parte infratora ao pagamento de multa compensatória de 10% (dez por cento) do valor total do Contrato, sem prejuízo do direito à reparação integral dos danos comprovadamente sofridos.

13.4. As penalidades previstas nesta cláusula serão aplicadas de forma proporcional à gravidade do descumprimento, observados os princípios da razoabilidade e da proporcionalidade, e somente após notificação prévia com prazo razoável para regularização, exceto nos casos de descumprimento que, por sua natureza ou gravidade, tornem inviável ou desnecessária a concessão de prazo.

13.5. Os valores das multas poderão ser descontados dos pagamentos devidos à Contratada, cobrados judicialmente ou deduzidos de garantias contratuais eventualmente prestadas, a critério da Contratante.

13.6. Não serão aplicadas penalidades nos casos em que o descumprimento decorra exclusivamente de caso fortuito, força maior, atos atribuíveis à própria Parte prejudicada ou de circunstâncias devidamente comunicadas, documentadas e aceitas formalmente pela outra Parte.

13.7. A aplicação de penalidades não exclui o direito da Parte prejudicada de exigir a execução específica das obrigações inadimplidas ou de rescindir o Contrato por justa causa, conforme as hipóteses previstas na Cláusula Décima Quarta.

---

CLÁUSULA DÉCIMA QUARTA — DA RESCISÃO

14.1. Este Contrato poderá ser rescindido nas seguintes hipóteses:

a) Por mútuo acordo entre as Partes, formalizado por escrito, com definição das condições de encerramento, acerto de contas e transferência de responsabilidades;
b) Por qualquer das Partes, sem justa causa, mediante aviso prévio escrito com antecedência mínima de 60 (sessenta) dias, sem prejuízo do pagamento pelos Serviços já prestados e das obrigações assumidas até a data de rescisão;
c) Por qualquer das Partes, com justa causa, em caso de descumprimento grave e não remediado de obrigações contratuais essenciais, após notificação prévia com prazo de 15 (quinze) dias para regularização, exceto nas hipóteses de descumprimento que, por sua natureza, tornem inviável a concessão de prazo;
d) Por qualquer das Partes, de forma imediata, nos casos de falência, recuperação judicial ou extrajudicial, insolvência, dissolução ou liquidação da outra Parte;
e) Por qualquer das Partes, de forma imediata, em caso de violação comprovada de obrigações de confidencialidade, proteção de dados, compliance ou anticorrupção.

14.2. Em caso de rescisão sem justa causa pela Contratante antes do término do período contratual, esta deverá pagar à Contratada:

a) Os valores correspondentes aos Serviços já prestados e entregáveis aprovados até a data de rescisão, calculados proporcionalmente ao cronograma financeiro do Anexo II;
b) Os custos comprovados, razoáveis e não reembolsados incorridos pela Contratada em razão do Contrato, mediante apresentação de documentação comprobatória;
c) Multa rescisória equivalente a 15% (quinze por cento) do valor remanescente do Contrato.

14.3. Em caso de rescisão com justa causa pela Contratante, a Contratada fará jus apenas ao pagamento pelos Serviços efetivamente prestados e aceitos até a data de rescisão, sem direito a qualquer indenização adicional, multa rescisória ou reembolso de custos.

14.4. Em caso de rescisão com justa causa pela Contratada, esta terá direito ao recebimento de todos os valores devidos pelos Serviços prestados até a data de rescisão, acrescidos de indenização pelos danos diretos e comprovadamente sofridos em razão do descumprimento da Contratante.

14.5. Em qualquer hipótese de rescisão, a Contratada deverá: (i) concluir os Serviços em andamento que possam ser finalizados no prazo de aviso prévio; (ii) transferir para a Contratante ou para terceiro por ela indicado todos os materiais, documentos, códigos e informações relacionados aos Serviços; e (iii) cooperar com a transição para o novo prestador de serviços pelo prazo de até 30 (trinta) dias após a data de rescisão, mediante remuneração proporcional.

14.6. A rescisão deste Contrato não afetará as obrigações das Partes já constituídas até a data de sua efetivação, incluindo obrigações de pagamento, confidencialidade, proteção de dados, propriedade intelectual e responsabilidade por danos causados.

---

CLÁUSULA DÉCIMA QUINTA — DO COMPLIANCE, ÉTICA E ANTICORRUPÇÃO

15.1. As Partes declaram conhecer e comprometem-se a cumprir integralmente a Lei n.º 12.846/2013 (Lei Anticorrupção), a Lei n.º 8.429/1992 (Lei de Improbidade Administrativa), o Foreign Corrupt Practices Act (FCPA) e o UK Bribery Act, quando aplicáveis, e demais normas nacionais e internacionais aplicáveis ao combate à corrupção, ao suborno, à lavagem de dinheiro e a práticas ilícitas.

15.2. As Partes declaram que não utilizarão, direta ou indiretamente, os recursos oriundos deste Contrato para financiar atividades ilícitas, para realizar pagamentos a agentes públicos ou privados com o objetivo de obter vantagens indevidas, ou para qualquer finalidade que contrarie a legislação vigente ou os princípios éticos corporativos.

15.3. Cada Parte compromete-se a adotar, em suas operações, práticas robustas de governança corporativa, compliance e integridade, incluindo: (i) programa de integridade estruturado; (ii) canal de denúncias acessível e independente; (iii) treinamentos regulares em ética e anticorrupção; e (iv) due diligence de terceiros aplicável.

15.4. A Contratada declara que não emprega menores de 18 (dezoito) anos em trabalho noturno, perigoso ou insalubre, nem menores de 16 (dezesseis) anos em qualquer trabalho, salvo na condição de aprendiz, a partir de 14 (quatorze) anos, e que não utiliza trabalho análogo ao escravo ou em condições degradantes.

15.5. A Contratante poderá realizar auditorias de compliance na Contratada, com aviso prévio de 10 (dez) dias úteis, para verificar o cumprimento das obrigações previstas nesta cláusula, devendo a Contratada cooperar plenamente e fornecer os documentos e informações solicitados.

15.6. A violação das obrigações previstas nesta cláusula constituirá justa causa para rescisão imediata deste Contrato, sem prejuízo das demais sanções legais aplicáveis, da responsabilização pelos danos causados e da comunicação às autoridades competentes.

---

CLÁUSULA DÉCIMA SEXTA — DA SUBCONTRATAÇÃO E DA CESSÃO

16.1. A Contratada somente poderá subcontratar partes dos Serviços a terceiros especializados mediante prévia autorização escrita e expressa da Contratante, que poderá condicioná-la à: (i) apresentação de informações detalhadas sobre o subcontratado, incluindo qualificação técnica, experiência comprovada e certidões de regularidade; (ii) realização de due diligence de compliance; e (iii) assinatura de instrumento de confidencialidade e proteção de dados pelo subcontratado.

16.2. A autorização para subcontratação não exime a Contratada de sua responsabilidade perante a Contratante pelo cumprimento integral das obrigações contratuais, respondendo solidariamente pelos atos, omissões, falhas e descumprimentos dos subcontratados como se fossem seus próprios.

16.3. A Contratante poderá, a seu critério, solicitar a substituição imediata de subcontratado que demonstre incapacidade técnica, irregularidade legal, descumprimento de SLA, violação de obrigações de confidencialidade ou proteção de dados, ou que não atenda aos padrões de qualidade e compliance exigidos, devendo a Contratada promover a substituição no prazo de [PRAZO] dias.

16.4. A cessão total ou parcial dos direitos e obrigações decorrentes deste Contrato somente será permitida mediante consentimento prévio e escrito da outra Parte, que poderá recusá-la com ou sem justificativa, exceto nos casos de reorganização societária da Parte cedente, hipótese em que a cessão será permitida desde que a cessionária assuma integralmente as obrigações contratuais e possua capacidade técnica equivalente.

16.5. A subcontratação não autorizada constituirá descumprimento contratual grave, sujeitando a Contratada às penalidades máximas previstas na Cláusula Décima Terceira e podendo ensejar a rescisão imediata do Contrato por justa causa.

---

CLÁUSULA DÉCIMA SÉTIMA — DAS COMUNICAÇÕES ENTRE AS PARTES

17.1. Todas as comunicações, notificações, aprovações, rejeições, solicitações e demais atos com efeitos jurídicos relacionados a este Contrato deverão ser realizados por escrito, por meio de: (i) carta com aviso de recebimento; (ii) e-mail com confirmação de leitura; ou (iii) plataforma de gestão de projetos ou de comunicação corporativa previamente acordada entre as Partes.

17.2. As comunicações deverão ser endereçadas aos gestores do contrato e aos pontos focais indicados pelas Partes no Anexo IV deste instrumento, podendo ser atualizados mediante comunicação escrita, sem necessidade de aditamento contratual, com efeitos a partir do recebimento da notificação de atualização.

17.3. As comunicações realizadas por e-mail serão consideradas recebidas no momento em que o remetente obtiver confirmação de leitura ou, na ausência desta, no primeiro dia útil seguinte ao envio, desde que não haja notificação de falha no envio ou de endereço inválido.

17.4. Aprovações de entregáveis, ordens de serviço, autorizações de subcontratação, aplicação de penalidades e demais atos que produzam efeitos jurídicos relevantes deverão ser realizados por escrito e assinados pelo gestor do contrato da Parte responsável, com indicação expressa do objeto e dos efeitos do ato.

17.5. Alterações no escopo, nos valores contratuais, nos prazos globais, nos SLAs ou em quaisquer condições essenciais deste instrumento deverão ser formalizadas por aditamento contratual escrito, assinado por representantes autorizados de ambas as Partes, sendo ineficazes quaisquer acordos verbais sobre tais matérias.

17.6. As Partes comprometem-se a realizar reuniões periódicas de acompanhamento do contrato, na periodicidade e formato definidos no Anexo I, para revisão de desempenho, análise de SLAs, discussão de riscos e alinhamento de expectativas.

---

CLÁUSULA DÉCIMA OITAVA — DOS ANEXOS

18.1. Integram o presente Contrato, como partes indissociáveis e de igual hierarquia, os seguintes Anexos:

Anexo I — Especificação Técnica dos Serviços: descrição detalhada do escopo, entregáveis, especificações técnicas, critérios de aceite, prazo de garantia e responsabilidades de cada Parte;
Anexo II — Cronograma Financeiro: valores, condições e datas de pagamento por entregável ou marco;
Anexo III — Dados Bancários da Contratada: informações para fins de pagamento;
Anexo IV — Gestores do Contrato e Pontos Focais: dados de contato das Partes para fins de comunicação e gestão;
Anexo V — Cronograma de Execução: marcos intermediários, datas de entrega de entregáveis e marcos de pagamento;
Anexo VI — Acordo de Nível de Serviço (SLA): métricas de desempenho, metas, metodologia de medição, créditos de serviço e penalidades por descumprimento.

18.2. Em caso de conflito entre o disposto neste instrumento e em seus Anexos, prevalecerão as disposições do instrumento principal, salvo quando os Anexos estabelecerem condições mais específicas para situações determinadas, hipótese em que prevalecerão as disposições mais específicas, desde que não contrariem as disposições essenciais deste instrumento.

18.3. Os Anexos I, V e VI somente poderão ser atualizados mediante aditamento contratual formal, assinado por representantes autorizados de ambas as Partes. Os demais Anexos poderão ser atualizados por comunicação escrita assinada pelos gestores do contrato, desde que tais atualizações não impliquem alteração de valores, prazos globais, SLAs ou obrigações essenciais.

---

CLÁUSULA DÉCIMA NONA — DAS DISPOSIÇÕES GERAIS

19.1. Este Contrato representa o acordo integral entre as Partes com relação ao seu objeto, substituindo todos os entendimentos, negociações, propostas, cartas de intenção e acordos anteriores, verbais ou escritos, sobre a mesma matéria.

19.2. A tolerância de qualquer das Partes em relação ao descumprimento de obrigações pela outra não constituirá novação, renúncia de direitos, precedente vinculante para situações futuras ou modificação tácita das condições contratuais, devendo qualquer renúncia ser expressa e formalizada por escrito.

19.3. Se qualquer disposição deste Contrato for considerada inválida, ilegal ou inexequível por decisão judicial ou arbitral transitada em julgado, as demais disposições permanecerão em pleno vigor e efeito, e as Partes negociarão de boa-fé uma disposição substituta que reflita, na medida do possível, a intenção original das Partes.

19.4. Este Contrato poderá ser assinado em vias físicas ou eletronicamente, por meio de plataforma de assinatura digital certificada nos termos da Medida Provisória n.º 2.200-2/2001, da Lei n.º 14.063/2020 e demais normas aplicáveis, tendo ambas as formas igual validade jurídica e probatória.

19.5. As Partes declaram ter lido e compreendido integralmente o presente instrumento, concordando com todos os seus termos e condições, e que seus representantes possuem os poderes necessários para celebrá-lo, conforme documentos societários em vigor.

19.6. Quaisquer alterações a este instrumento somente produzirão efeitos se formalizadas por aditamento contratual escrito, assinado por representantes autorizados de ambas as Partes, sendo ineficazes quaisquer acordos verbais ou comunicações informais sobre matérias essenciais do Contrato.

19.7. Este Contrato é regido pela legislação brasileira, em especial pelo Código Civil, pelo Código de Defesa do Consumidor, quando aplicável, pela Lei Anticorrupção, pela LGPD e pelas demais normas aplicáveis à sua natureza e objeto.

---

CLÁUSULA VIGÉSIMA — DO FORO

20.1. As Partes elegem o foro da Comarca de [CIDADE/ESTADO] para dirimir quaisquer controvérsias decorrentes deste Contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

20.2. Antes de recorrer ao Poder Judiciário, as Partes comprometem-se a buscar solução amigável para eventuais divergências, por meio de negociação direta entre seus gestores do contrato, pelo prazo de 20 (vinte) dias corridos contados da notificação formal do conflito.

20.3. Não sendo possível a solução amigável no prazo estabelecido no item 20.2, as Partes comprometem-se a submeter a controvérsia à mediação, nos termos da Lei n.º 13.140/2015, perante câmara de mediação de reconhecida reputação, pelo prazo de 30 (trinta) dias, antes de recorrer ao Poder Judiciário ou à arbitragem.

20.4. Não sendo resolvida a controvérsia por mediação, as Partes poderão, de comum acordo, submeter a questão à arbitragem, nos termos da Lei n.º 9.307/1996, perante câmara arbitral de reconhecida reputação, com sede em [CIDADE], aplicando-se o regulamento da câmara escolhida.

20.5. Não havendo acordo quanto à arbitragem ou sendo esta inviável, qualquer das Partes poderá submeter a controvérsia ao foro eleito nos termos do item 20.1.

---

E por estarem assim justas e contratadas, as Partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença de 2 (duas) testemunhas, ou eletronicamente por meio de plataforma de assinatura digital certificada.

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
      ["Contrato Corporativo de Prestação de Serviços com SLA"]
    );
    if (rows.length > 0) {
      console.log("Template já existe. Atualizando...");
      await conn.execute(
        `UPDATE contract_templates SET description = ?, contractType = ?, content = ?, isActive = ? WHERE name = ?`,
        [
          "Modelo contratual corporativo com SLA, critérios de aceite e maior rigor operacional.",
          "service",
          content,
          true,
          "Contrato Corporativo de Prestação de Serviços com SLA",
        ]
      );
      console.log("Template atualizado com sucesso.");
    } else {
      await conn.execute(
        `INSERT INTO contract_templates (name, description, contractType, content, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          "Contrato Corporativo de Prestação de Serviços com SLA",
          "Modelo contratual corporativo com SLA, critérios de aceite e maior rigor operacional.",
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
