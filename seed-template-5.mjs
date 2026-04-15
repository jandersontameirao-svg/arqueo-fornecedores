import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const content = `CONTRATO BLINDADO DE PRESTAÇÃO DE SERVIÇOS CRÍTICOS E SENSÍVEIS

Modelo Contratual — Nível de Rigidez: 5/5
Tipo: Prestação de Serviços Críticos e Sensíveis

---

CONTRATO BLINDADO DE PRESTAÇÃO DE SERVIÇOS CRÍTICOS E SENSÍVEIS N.º [NÚMERO]/[ANO]

Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato Blindado de Prestação de Serviços Críticos e Sensíveis ("Contrato"), que se regerá pelas cláusulas e condições seguintes, as quais as Partes declaram ter lido, compreendido, negociado individualmente e aceito integralmente, reconhecendo que o presente instrumento foi elaborado para assegurar o mais elevado nível de proteção patrimonial, operacional, reputacional e jurídica da Contratante, em razão da criticidade máxima, da sensibilidade estratégica e do alto impacto operacional dos Serviços objeto deste instrumento:

CONTRATANTE: [RAZÃO SOCIAL DA CONTRATANTE], pessoa jurídica de direito privado, inscrita no CNPJ sob o n.º [CNPJ], com sede em [ENDEREÇO COMPLETO], CEP [CEP], neste ato representada por [NOME DO REPRESENTANTE], [CARGO], portador do CPF n.º [CPF], nos termos de [INSTRUMENTO DE REPRESENTAÇÃO] ("Contratante").

CONTRATADA: [RAZÃO SOCIAL DA CONTRATADA], pessoa jurídica de direito privado, inscrita no CNPJ sob o n.º [CNPJ], com sede em [ENDEREÇO COMPLETO], CEP [CEP], neste ato representada por [NOME DO REPRESENTANTE], [CARGO], portador do CPF n.º [CPF], nos termos de [INSTRUMENTO DE REPRESENTAÇÃO] ("Contratada").

As Partes, em conjunto, serão denominadas "Partes" e, individualmente, "Parte".

CONSIDERANDO que os Serviços objeto deste Contrato são de natureza crítica, sensível e de alto impacto operacional, reputacional e jurídico para a Contratante, exigindo o mais elevado nível de controle, monitoramento, responsabilização e proteção;

CONSIDERANDO que a Contratada declara possuir toda a capacidade técnica, operacional, financeira, legal, regulatória e de compliance necessária para a execução integral, tempestiva e segura dos Serviços, tendo realizado due diligence completa sobre o escopo, as condições e os riscos envolvidos;

CONSIDERANDO que as Partes reconhecem a necessidade de estabelecer mecanismos de governança, controle, auditoria, responsabilização e proteção da Contratante em nível máximo, compatível com a criticidade dos Serviços;

CONSIDERANDO que a Contratada prestou garantia contratual na forma estabelecida neste instrumento, como condição essencial para a celebração deste Contrato;

As Partes celebram o presente instrumento nos termos e condições a seguir:

---

CLÁUSULA PRIMEIRA — DO OBJETO

1.1. O presente Contrato tem por objeto a prestação, pela Contratada à Contratante, dos serviços técnicos críticos e sensíveis especializados descritos no Anexo I — Especificação Técnica Fechada e Vinculante dos Serviços ("Serviços"), a serem executados em conformidade estrita e integral com o escopo fechado, os entregáveis vinculantes, os critérios formais e rigorosos de aceite, os Acordos de Nível de Serviço (SLA) de máxima exigência, a Matriz de Responsabilidades, o Plano de Continuidade de Negócios e o cronograma estabelecidos neste instrumento e em seus Anexos, que integram o presente Contrato para todos os fins de direito como partes indissociáveis e de igual hierarquia.

1.2. Os Serviços objeto deste Contrato são de natureza crítica e sensível, com impacto operacional máximo sobre as atividades da Contratante, razão pela qual: (i) o escopo é fechado, vinculante e não passível de interpretação extensiva; (ii) os entregáveis são vinculantes e sujeitos a critérios formais rigorosos de aceite; (iii) os mecanismos de controle, monitoramento, auditoria e responsabilização são os mais elevados previstos na biblioteca contratual da Contratante; e (iv) qualquer descumprimento, ainda que parcial, de obrigação contratual essencial poderá ensejar rescisão imediata por justa causa, sem necessidade de notificação prévia adicional.

1.3. A Contratada declara, sob as penas da lei e com plena consciência das consequências jurídicas, que: (i) possui toda a capacidade técnica, operacional, financeira, legal, regulatória e de compliance necessária para a execução integral, tempestiva e segura dos Serviços; (ii) não possui impedimento legal, regulatório, contratual, judicial ou administrativo que inviabilize ou restrinja a execução; (iii) os profissionais designados possuem as qualificações, certificações, habilitações e experiência comprovada exigidas no Anexo I, com registro nos órgãos profissionais competentes; (iv) manterá todas essas condições durante toda a vigência do Contrato, comunicando imediatamente qualquer alteração relevante; e (v) realizou due diligence completa sobre o escopo, as especificações técnicas, os SLAs, os critérios de aceite, as condições operacionais e os riscos envolvidos, não podendo alegar desconhecimento de qualquer condição contratual.

1.4. O escopo dos Serviços é estritamente delimitado pelo Anexo I e pela Matriz de Responsabilidades constante do Anexo VIII. Quaisquer atividades não expressamente previstas nesses documentos não integram o escopo contratual e somente poderão ser executadas mediante: (i) solicitação formal escrita da Contratante; (ii) aprovação formal escrita da Contratante; e (iii) formalização de aditamento contratual com definição prévia e vinculante de escopo adicional, valor, prazo, entregáveis, critérios de aceite e SLAs aplicáveis. A execução de atividades fora do escopo sem observância deste procedimento não gerará qualquer obrigação de pagamento para a Contratante, constituirá descumprimento contratual grave e poderá ensejar rescisão imediata por justa causa.

1.5. A Contratada reconhece que a execução dos Serviços envolverá acesso a ativos estratégicos críticos, sistemas de missão crítica, dados altamente sensíveis, informações confidenciais de máximo sigilo e processos operacionais essenciais da Contratante, comprometendo-se a observar rigorosamente todos os protocolos de segurança, confidencialidade, proteção de dados, gestão de riscos e planos de continuidade estabelecidos neste instrumento, nos Anexos e nas políticas internas da Contratante que lhe forem comunicadas, as quais a Contratada declara ter recebido, lido, compreendido e aceito integralmente.

1.6. Como condição essencial e inafastável para a celebração e vigência deste Contrato, a Contratada deverá prestar, antes do início dos Serviços, garantia contratual na modalidade de [MODALIDADE: garantia bancária / seguro-garantia / caução em dinheiro], no valor correspondente a [PERCENTUAL]% do valor total do Contrato, conforme especificado no Anexo IX, que deverá ser mantida durante toda a vigência do Contrato e pelo prazo de 12 (doze) meses após o seu término, para cobertura de eventuais obrigações remanescentes.

1.7. A não prestação da garantia contratual no prazo estabelecido no item 1.6 impedirá o início dos Serviços, não gerará qualquer obrigação de pagamento para a Contratante e poderá ensejar a rescisão deste instrumento por justa causa, com aplicação das penalidades máximas previstas na Cláusula Décima Terceira.

---

CLÁUSULA SEGUNDA — DO ESCOPO FECHADO, DOS ENTREGÁVEIS VINCULANTES, DOS CRITÉRIOS FORMAIS DE ACEITE, DO SLA E DO PLANO DE CONTINUIDADE

2.1. O escopo técnico dos Serviços é fechado, vinculante e não passível de interpretação extensiva, compreendendo exclusivamente as atividades, tarefas, entregáveis e responsabilidades descritas no Anexo I, com indicação expressa das especificações técnicas, dos padrões de qualidade e segurança aplicáveis, dos marcos de execução, dos critérios formais de aceite, da Matriz de Responsabilidades do Anexo VIII e do Plano de Continuidade de Negócios do Anexo X.

2.2. Cada entregável previsto no Anexo I é vinculante e deverá ser formalmente submetido pela Contratada à apreciação da Contratante, acompanhado obrigatoriamente de: (i) documentação técnica completa, atualizada e auditável; (ii) relatório de testes ou validação com resultados detalhados, evidências documentadas e assinatura do responsável técnico; (iii) declaração formal de conformidade com as especificações, assinada pelo gestor técnico sênior da Contratada e pelo responsável de qualidade; (iv) checklist de critérios de aceite com indicação do status de cada item e evidências de atendimento; (v) relatório de análise de riscos e vulnerabilidades de segurança; e (vi) declaração de conformidade com a LGPD e demais normas de proteção de dados aplicáveis, observado o prazo de submissão estabelecido no cronograma do Anexo VI.

2.3. Os critérios formais de aceite de cada entregável são vinculantes, rigorosos e estão definidos no Anexo I, incluindo, sem limitação: conformidade técnica integral com as especificações, aderência plena e documentada aos padrões de qualidade e segurança estabelecidos, ausência de defeitos críticos, bloqueadores, de alta severidade ou de impacto à segurança, cumprimento integral dos SLAs aplicáveis, aprovação nos testes de aceitação e nos testes de segurança definidos, conformidade com os requisitos de proteção de dados e conformidade com o Plano de Continuidade de Negócios.

2.4. A Contratante terá o prazo de [PRAZO] dias úteis, contados do recebimento formal de cada entregável com sua documentação completa, para aprová-lo ou rejeitá-lo mediante comunicação escrita fundamentada, com indicação detalhada de cada critério de aceite não atendido, do grau de não conformidade, do impacto operacional e de segurança identificado e da documentação de evidência correspondente.

2.5. Em caso de rejeição fundamentada de entregável, a Contratada terá o prazo improrrogável de [PRAZO] dias úteis para realizar as correções e ajustes necessários, sem ônus adicional para a Contratante, submetendo nova versão acompanhada de: (i) relatório detalhado de correções, com indicação de cada não conformidade sanada, da solução técnica adotada e das evidências de correção; (ii) nova declaração formal de conformidade assinada pelo gestor técnico sênior e pelo responsável de qualidade; (iii) novo checklist de critérios de aceite atualizado com evidências; e (iv) relatório de reteste completo.

2.6. A rejeição de entregável em segunda análise, por não conformidades já identificadas na primeira rejeição e não devidamente corrigidas, constituirá descumprimento contratual grave e imediato, sujeitando a Contratada às penalidades máximas previstas na Cláusula Décima Terceira e conferindo à Contratante o direito de rescindir o Contrato imediatamente por justa causa, com execução integral da garantia contratual, sem necessidade de notificação prévia adicional.

2.7. A rejeição de 2 (dois) ou mais entregáveis em segunda análise, em qualquer momento da vigência do Contrato, conferirá à Contratante o direito de rescindir imediatamente o Contrato por justa causa, com execução integral da garantia contratual, independentemente de notificação prévia, com direito à indenização integral pelos danos sofridos, incluindo lucros cessantes, danos emergentes e danos reputacionais.

2.8. Os Acordos de Nível de Serviço (SLA) de máxima exigência aplicáveis a cada categoria de serviço são vinculantes e estão definidos no Anexo VII, incluindo: disponibilidade mínima dos sistemas ou serviços com metas de [PERCENTUAL]% ou superior, tempo máximo de resposta a incidentes críticos de até [TEMPO], tempo máximo de resolução de incidentes críticos de até [TEMPO], janelas de manutenção programada com aprovação prévia obrigatória da Contratante, métricas de desempenho operacional, indicadores-chave de qualidade (KQI) e indicadores-chave de segurança (KSI).

2.9. O descumprimento dos SLAs definidos no Anexo VII ensejará, cumulativamente e de forma automática: (i) aplicação de créditos de serviço conforme tabela do Anexo VII, deduzidos das faturas subsequentes sem necessidade de notificação; (ii) abertura de registro formal de não conformidade pela Contratante com classificação de severidade; (iii) obrigação da Contratada de apresentar, no prazo de 24 (vinte e quatro) horas, análise de causa raiz e plano de ação corretiva com cronograma de implementação e responsáveis identificados; e (iv) reunião de crise com participação obrigatória da alta direção da Contratada no prazo de 48 (quarenta e oito) horas, para incidentes de severidade crítica.

2.10. O descumprimento reiterado de SLAs, definido como 2 (duas) ou mais ocorrências no mesmo indicador em período de 60 (sessenta) dias, constituirá descumprimento contratual grave, sujeitando a Contratada às penalidades máximas previstas na Cláusula Décima Terceira e conferindo à Contratante o direito de rescindir o Contrato imediatamente por justa causa, com execução integral da garantia contratual.

2.11. A Contratada deverá disponibilizar à Contratante relatórios semanais de desempenho operacional e relatórios mensais de desempenho consolidado, no prazo de 3 (três) dias úteis após o encerramento de cada semana/mês, com: (i) indicadores de SLA medidos no período e comparação com as metas; (ii) análise de causa raiz de todos os descumprimentos, por menor que sejam; (iii) plano de ação corretiva com responsáveis, prazos e evidências de implementação; (iv) tendências, riscos emergentes e vulnerabilidades identificadas; (v) indicadores de qualidade e segurança dos entregáveis; e (vi) status do Plano de Continuidade de Negócios.

2.12. A Contratada deverá elaborar, manter atualizado e submeter à aprovação formal da Contratante, antes do início dos Serviços, um Plano de Continuidade de Negócios (PCN) e um Plano de Recuperação de Desastres (PRD) para os Serviços prestados, conforme especificado no Anexo X, realizando testes periódicos documentados e reportando os resultados à Contratante na periodicidade definida no Anexo X. A não aprovação do PCN/PRD pela Contratante impedirá o início dos Serviços.

2.13. A aprovação formal dos entregáveis pela Contratante não exime a Contratada de sua responsabilidade por vícios ocultos, defeitos latentes, não conformidades que se manifestem posteriormente, falhas de segurança identificadas após a aprovação ou vulnerabilidades descobertas durante o período de garantia, estabelecido no Anexo I em prazo não inferior a 24 (vinte e quatro) meses, durante o qual a Contratada deverá corrigir qualquer falha identificada no prazo máximo de [PRAZO] horas para falhas críticas e [PRAZO] dias úteis para demais falhas, sem ônus adicional para a Contratante.

---

CLÁUSULA TERCEIRA — DO PRAZO E DA VIGÊNCIA

3.1. O presente Contrato vigorará pelo prazo de [PRAZO], contado a partir da data de sua assinatura, podendo ser prorrogado por períodos iguais e sucessivos mediante acordo escrito entre as Partes, formalizado com antecedência mínima de 120 (cento e vinte) dias antes do término da vigência, condicionado à avaliação formal de desempenho da Contratada pela Contratante com resultado plenamente satisfatório em todos os indicadores.

3.2. A prorrogação do Contrato estará condicionada ao cumprimento integral e comprovado, pela Contratada, de todas as obrigações contratuais durante o período anterior, incluindo: (i) cumprimento dos SLAs com percentual mínimo de [PERCENTUAL]% de atingimento em todos os indicadores; (ii) ausência de qualquer penalidade aplicada nos últimos 12 (doze) meses; (iii) regularidade fiscal, trabalhista, previdenciária e de compliance; (iv) avaliação de desempenho com nota mínima de [NOTA] na escala definida no Anexo I; (v) garantia contratual vigente e válida; e (vi) aprovação formal da Contratante, que poderá recusá-la sem necessidade de justificativa.

3.3. O início efetivo da prestação dos Serviços dar-se-á na data de [DATA DE INÍCIO] ou na data de assinatura deste instrumento, o que ocorrer primeiro, condicionado ao cumprimento integral de todas as condições precedentes estabelecidas no Anexo I, incluindo, sem limitação: prestação da garantia contratual, apresentação de certidões de regularidade, comprovação de qualificação técnica e certificações dos profissionais designados, assinatura de termos individuais de confidencialidade e proteção de dados por todos os profissionais da Contratada que acessarão os sistemas e informações da Contratante, aprovação dos planos de execução, de gestão de riscos, de continuidade de negócios e de recuperação de desastres, e aprovação do plano de segurança da informação.

3.4. O cronograma detalhado de execução dos Serviços, com os marcos intermediários, as datas de entrega de cada entregável, os marcos de pagamento correspondentes, os pontos de controle obrigatórios e os marcos de auditoria, constará do Anexo VI e será de cumprimento obrigatório por ambas as Partes, sendo considerado documento vinculante de igual hierarquia ao presente instrumento.

3.5. Eventuais atrasos no cronograma de execução deverão ser comunicados pela Contratada à Contratante com antecedência mínima de [PRAZO] dias antes da data prevista de entrega, acompanhados de: (i) justificativa técnica detalhada, documentada e assinada pelo gestor técnico sênior; (ii) análise de impacto no cronograma global, nos demais entregáveis e nos SLAs; (iii) proposta de replanejamento com novo cronograma detalhado; (iv) plano de ação para recuperação do atraso com responsáveis e prazos; e (v) análise de riscos do replanejamento proposto, para análise e aprovação formal da Contratante.

3.6. A aprovação de replanejamento pela Contratante não constituirá renúncia ao direito de aplicar as penalidades cabíveis pelo atraso, não alterará os valores contratuais, não eximirá a Contratada de sua responsabilidade pelos danos decorrentes do atraso e não suspenderá a vigência da garantia contratual, salvo se expressamente e especificamente previsto no instrumento de aprovação do replanejamento.

3.7. Atrasos decorrentes exclusivamente de atos ou omissões documentados e comprovados da Contratante, de caso fortuito ou de força maior, devidamente comunicados no prazo máximo de 2 (duas) horas após a ocorrência e comprovados documentalmente com evidências contemporâneas, não serão imputados à Contratada e ensejarão o replanejamento do cronograma mediante acordo formal entre as Partes, sem direito a acréscimo de valor contratual, salvo disposição expressa em contrário formalizada em aditamento contratual.

---

CLÁUSULA QUARTA — DO VALOR DO CONTRATO

4.1. Pela prestação integral dos Serviços objeto deste Contrato, a Contratante pagará à Contratada o valor total de R$ [VALOR] ([VALOR POR EXTENSO]), conforme o cronograma financeiro detalhado no Anexo II, vinculado à aprovação formal dos respectivos entregáveis ou marcos de execução previstos no Anexo VI, ao cumprimento integral de todas as obrigações contratuais do período e à apresentação de toda a documentação exigida.

4.2. O valor contratual é fixo, global e irreajustável durante o período inicial de vigência, ressalvadas exclusivamente as hipóteses de reajuste previstas na Cláusula Sexta, de alteração de escopo formalizada por aditamento contratual e de variação extraordinária de custos decorrente de fatos absolutamente imprevisíveis, alheios à vontade das Partes e devidamente comprovados documentalmente com evidências contemporâneas, nos termos do artigo 317 do Código Civil.

4.3. O valor estabelecido nesta cláusula é global e inclui, sem exceção, todos os custos diretos e indiretos necessários à execução integral dos Serviços, incluindo: mão de obra especializada e encargos, tributos de qualquer natureza, licenças de software, ferramentas, deslocamentos, hospedagem, materiais, equipamentos, seguros obrigatórios, certificações, auditorias, testes de segurança, testes de continuidade, treinamentos, garantia contratual e quaisquer outras despesas operacionais da Contratada, salvo disposição expressa em contrário no Anexo I.

4.4. A Contratada declara, sob as penas da lei, que o valor proposto foi estabelecido após análise completa e exaustiva do escopo, das especificações técnicas, dos SLAs, dos critérios de aceite, das condições operacionais, dos riscos envolvidos e de todas as condições contratuais, não podendo alegar, em nenhuma hipótese, desequilíbrio econômico-financeiro decorrente de má avaliação do escopo, das condições de execução ou dos riscos inerentes aos Serviços.

4.5. Eventuais serviços adicionais somente serão executados após: (i) solicitação formal escrita da Contratante com descrição detalhada do escopo adicional; (ii) apresentação de proposta detalhada pela Contratada com escopo, valor, prazo, entregáveis, critérios de aceite e SLAs adicionais; (iii) análise de impacto no escopo, no cronograma e nos SLAs existentes; (iv) aprovação formal escrita da Contratante; e (v) formalização de aditamento contratual assinado por representantes autorizados de ambas as Partes. A execução de serviços adicionais sem observância rigorosa deste procedimento não gerará qualquer obrigação de pagamento para a Contratante e constituirá descumprimento contratual grave.

4.6. Os créditos de serviço decorrentes de descumprimento de SLA, conforme tabela do Anexo VII, serão deduzidos automaticamente dos valores das faturas subsequentes, sem necessidade de formalização adicional, com aplicação imediata e sem possibilidade de negociação de redução. A Contratada terá o prazo de 2 (dois) dias úteis para contestar formalmente os créditos aplicados, com fundamentação técnica documentada e evidências contemporâneas, sob pena de aceitação tácita irrevogável.

4.7. A Contratante reterá [PERCENTUAL]% do valor de cada parcela como garantia de execução, a ser liberado somente ao final do Contrato, após: (i) comprovação do cumprimento integral de todas as obrigações contratuais; (ii) entrega de toda a documentação técnica completa e atualizada; (iii) realização integral da transição de conhecimento e transferência de ativos; (iv) ausência de pendências, reclamações, litígios ou passivos relacionados ao Contrato; (v) aprovação formal da Contratante; e (vi) liberação da garantia contratual prestada nos termos do item 1.6.

4.8. A Contratante poderá, a seu critério exclusivo e sem necessidade de autorização judicial, executar parcial ou integralmente a garantia contratual prestada nos termos do item 1.6 nas hipóteses de: (i) rescisão por justa causa; (ii) descumprimento de obrigações contratuais essenciais; (iii) aplicação de penalidades não pagas; (iv) indenizações devidas e não pagas; ou (v) qualquer outra obrigação financeira da Contratada não cumprida no prazo estabelecido.

---

CLÁUSULA QUINTA — DA FORMA E DAS CONDIÇÕES DE PAGAMENTO

5.1. O pagamento será realizado conforme o cronograma financeiro constante do Anexo II, vinculado à aprovação formal dos respectivos entregáveis ou marcos de execução previstos no Anexo VI, mediante apresentação de nota fiscal ou fatura pela Contratada, acompanhada obrigatoriamente de: (i) relatório de execução do período com indicação do percentual de conclusão de cada entregável e das evidências de cumprimento dos SLAs; (ii) certidões de regularidade fiscal federal, estadual, municipal, trabalhista (FGTS e INSS) atualizadas e válidas; (iii) comprovantes de recolhimento de encargos trabalhistas e previdenciários de todos os profissionais alocados no período; (iv) declaração de ausência de passivos trabalhistas relacionados ao Contrato, assinada pelo representante legal da Contratada; (v) relatório de desempenho de SLA do período com evidências; (vi) declaração de conformidade com a LGPD e demais normas de proteção de dados; e (vii) comprovante de vigência e validade da garantia contratual.

5.2. Cada parcela será paga no prazo de [PRAZO] dias úteis contados da aprovação formal do entregável ou marco correspondente e do recebimento da nota fiscal com toda a documentação exigida no item 5.1. A ausência de qualquer documento, a apresentação de documento com irregularidade ou a não conformidade de qualquer certidão suspenderá o prazo de pagamento até a regularização completa, sem que tal suspensão configure inadimplemento da Contratante ou gere qualquer encargo.

5.3. O pagamento será efetuado por meio de transferência bancária para a conta indicada pela Contratada no Anexo III, sendo expressamente vedada a emissão de duplicatas, cheques, boletos bancários ou outros títulos de crédito sem prévia autorização escrita e expressa da Contratante. A Contratada não poderá protestar, executar, ceder, endossar, transferir, penhorar ou onerar quaisquer títulos ou créditos relacionados a este Contrato sem prévia notificação à Contratante com antecedência mínima de 15 (quinze) dias úteis e sem sua autorização escrita, sob pena de rescisão imediata por justa causa.

5.4. Em caso de atraso no pagamento por parte da Contratante, incidirão sobre o valor devido juros moratórios de 1% (um por cento) ao mês, calculados pro rata die, acrescidos de multa de 2% (dois por cento) sobre o valor em atraso e atualização monetária pelo IPCA, desde que, cumulativamente: (i) o atraso não decorra de contestação fundamentada de valores pela Contratante; (ii) a Contratada tenha cumprido integralmente todas as obrigações contratuais do período, incluindo SLAs; (iii) a nota fiscal tenha sido emitida em conformidade com todas as exigências deste instrumento; e (iv) toda a documentação exigida no item 5.1 tenha sido apresentada de forma completa e regular.

5.5. A Contratante poderá reter, glosar ou suspender, total ou parcialmente, o pagamento de qualquer parcela nas seguintes hipóteses, sem que tal retenção configure inadimplemento contratual ou gere qualquer encargo: (i) entregável rejeitado ou em processo de revisão; (ii) SLA não cumprido no período, pelo valor dos créditos de serviço correspondentes; (iii) obrigações acessórias não atendidas, incluindo ausência de qualquer documento exigido; (iv) existência de débitos, penalidades ou indenizações devidas pela Contratada perante a Contratante; (v) irregularidade fiscal, trabalhista, previdenciária ou de compliance da Contratada; (vi) indícios de irregularidade na execução dos Serviços, até a conclusão de apuração formal; (vii) não renovação ou redução da garantia contratual; ou (viii) qualquer descumprimento de obrigação contratual essencial.

5.6. Eventuais glosas ou contestações de valores deverão ser comunicadas pela Contratante à Contratada no prazo de [PRAZO] dias úteis contados do recebimento da nota fiscal, com indicação fundamentada dos valores contestados e dos critérios aplicados. A ausência de contestação no prazo não constituirá renúncia ao direito de contestar vícios ocultos, irregularidades identificadas posteriormente ou descumprimentos de SLA apurados após o pagamento.

5.7. A Contratante poderá compensar, a seu critério exclusivo e sem necessidade de autorização judicial, eventuais créditos que possua perante a Contratada, decorrentes de penalidades, créditos de SLA, retenções, indenizações ou execução de garantia, com os valores devidos à Contratada, mediante comunicação escrita prévia com antecedência mínima de 2 (dois) dias úteis.

5.8. O pagamento de qualquer parcela não constituirá aprovação tácita dos Serviços prestados no período, não implicará renúncia a direitos contratuais e não impedirá a Contratante de identificar e exigir a correção de vícios ocultos ou não conformidades identificadas posteriormente.

---

CLÁUSULA SEXTA — DO REAJUSTE

6.1. Os valores contratados poderão ser reajustados anualmente, a contar da data de assinatura deste Contrato, com base na variação acumulada do Índice Nacional de Preços ao Consumidor Amplo (IPCA), apurado pelo IBGE, ou por outro índice oficial que venha a substituí-lo, limitado ao teto de [PERCENTUAL]% ao ano, não podendo o reajuste superar a variação real dos custos demonstrada documentalmente pela Contratada.

6.2. O reajuste deverá ser solicitado pela Contratada mediante comunicação escrita à Contratante com antecedência mínima de 90 (noventa) dias da data de sua aplicação, sendo aplicado mediante acordo formal entre as Partes, formalizado por aditamento contratual assinado por representantes autorizados de ambas as Partes, com vigência a partir da data acordada.

6.3. O reajuste somente será concedido se a Contratada demonstrar, mediante documentação comprobatória completa e auditável: (i) cumprimento integral dos SLAs no período anterior, com percentual de atingimento mínimo de [PERCENTUAL]% em todos os indicadores; (ii) ausência de qualquer penalidade aplicada nos últimos 12 (doze) meses; (iii) avaliação de desempenho plenamente satisfatória pela Contratante; (iv) regularidade fiscal, trabalhista, previdenciária e de compliance; e (v) garantia contratual vigente e válida.

6.4. Não haverá reajuste durante o período inicial de vigência do Contrato. Eventuais pedidos de revisão de valores por desequilíbrio econômico-financeiro somente serão analisados se a Contratada demonstrar, de forma inequívoca, contemporânea e documentada, a ocorrência de fato absolutamente imprevisível, extraordinário, alheio à sua vontade e não coberto pela análise de riscos realizada antes da celebração do Contrato, que tenha impactado substancialmente os custos dos Serviços, nos termos do artigo 317 do Código Civil.

6.5. A Contratante poderá solicitar auditoria independente dos custos da Contratada como condição para análise de qualquer pedido de revisão de valores, devendo a Contratada cooperar plenamente com o processo de auditoria e fornecer todos os documentos e informações solicitados.

---

CLÁUSULA SÉTIMA — DAS OBRIGAÇÕES DA CONTRATADA

7.1. São obrigações da Contratada, de caráter vinculante, cujo descumprimento ensejará as sanções máximas previstas neste instrumento:

a) Executar os Serviços com excelência técnica máxima, diligência extraordinária, profissionalismo de alto nível, observância das melhores práticas internacionais do mercado, das normas técnicas e regulatórias aplicáveis, das especificações do Anexo I e dos critérios formais de aceite estabelecidos, garantindo a qualidade, a conformidade, a segurança e a resiliência dos entregáveis;

b) Cumprir rigorosamente o cronograma de execução, as datas de entrega dos entregáveis e os SLAs de máxima exigência definidos no Anexo VII, comunicando proativamente à Contratante, com a antecedência estabelecida neste instrumento, qualquer risco de descumprimento identificado, por menor que seja;

c) Manter, durante toda a vigência do Contrato, as condições de habilitação e qualificação técnica exigidas para a execução dos Serviços, incluindo registros profissionais, certificações, licenças, certidões e seguros aplicáveis, apresentando comprovação à Contratante sempre que solicitado e, independentemente de solicitação, na periodicidade definida no Anexo I;

d) Designar profissional sênior de máxima qualificação como gestor técnico do contrato, com poderes para tomar decisões operacionais e estratégicas, coordenar a equipe de execução e ser o ponto focal de comunicação com a Contratante, cuja substituição deverá ser comunicada com antecedência mínima de [PRAZO] dias e estará condicionada à aprovação prévia e expressa da Contratante, que poderá recusá-la sem necessidade de justificativa;

e) Manter equipe técnica altamente qualificada, certificada, com experiência comprovada e em número suficiente para a execução dos Serviços dentro dos prazos e padrões de qualidade e segurança estabelecidos, comunicando à Contratante qualquer substituição de profissional-chave com antecedência mínima de [PRAZO] dias, acompanhada do currículo detalhado do substituto para aprovação prévia e expressa da Contratante;

f) Comunicar à Contratante, no prazo máximo de 1 (uma) hora após a identificação, qualquer ocorrência, incidente, falha, vulnerabilidade de segurança, ameaça, evento ou situação que possa comprometer a execução regular dos Serviços, o cumprimento do cronograma, o atendimento dos SLAs, a segurança dos sistemas e dados da Contratante ou a continuidade operacional;

g) Cumprir integralmente a legislação trabalhista, previdenciária, fiscal, ambiental, de segurança do trabalho, de proteção de dados, de compliance e anticorrupção aplicável às suas atividades, respondendo integralmente por eventuais descumprimentos e por seus reflexos sobre a Contratante, incluindo custos de defesa, multas, indenizações e danos reputacionais;

h) Guardar sigilo absoluto e de máximo nível sobre todas as informações confidenciais e estratégicas da Contratante a que tiver acesso em razão da execução deste Contrato, nos termos da Cláusula Nona, fazendo com que todos os seus profissionais, subcontratados e prestadores de serviços assinem termos individuais de confidencialidade e proteção de dados antes de qualquer acesso a informações, sistemas ou instalações da Contratante, mantendo registros de todos os acessos realizados;

i) Reparar, nos prazos estabelecidos na Cláusula Segunda, eventuais falhas, inadequações, não conformidades, defeitos, vulnerabilidades de segurança ou lacunas nos Serviços prestados ou nos entregáveis entregues, sem ônus adicional para a Contratante, incluindo durante o período de garantia de 24 (vinte e quatro) meses;

j) Apresentar à Contratante, na periodicidade estabelecida no Anexo I, relatórios semanais de progresso, relatórios mensais de desempenho de SLA, relatórios de gestão de riscos, relatórios de segurança e relatórios de status de execução dos Serviços, com indicação do percentual de conclusão de cada entregável, dos indicadores de qualidade e segurança, dos riscos identificados, das ações corretivas em andamento e do status do PCN/PRD;

k) Adotar, em suas operações, práticas robustas e certificadas de governança corporativa, compliance, gestão de riscos, segurança da informação e proteção de dados, compatíveis com os padrões internacionais mais elevados e com os requisitos exigidos pela Contratante, submetendo-se a todas as auditorias previstas neste instrumento e a auditorias extraordinárias solicitadas pela Contratante;

l) Participar de reuniões semanais de acompanhamento operacional, reuniões mensais de revisão de desempenho, comitês de gestão do contrato e reuniões de gestão de riscos e segurança na periodicidade e formato definidos no Anexo I, com participação obrigatória do gestor técnico sênior do contrato e, quando solicitado, da alta direção da Contratada;

m) Manter seguro de responsabilidade civil com cobertura mínima de R$ [VALOR] e seguro de riscos cibernéticos com cobertura mínima de R$ [VALOR] durante toda a vigência do Contrato, apresentando apólices à Contratante antes do início dos Serviços e sempre que renovadas, sendo a não renovação causa de suspensão imediata dos pagamentos;

n) Elaborar, manter atualizado e submeter à aprovação formal da Contratante o Plano de Continuidade de Negócios (PCN) e o Plano de Recuperação de Desastres (PRD) para os Serviços prestados, conforme especificado no Anexo X, realizando testes periódicos documentados com participação de representantes da Contratante e reportando os resultados na periodicidade definida;

o) Realizar a transição de conhecimento ao final do Contrato, conforme plano detalhado definido no Anexo I, garantindo a continuidade operacional da Contratante e a transferência integral de todos os ativos, documentos, códigos, configurações, credenciais, dados e informações relacionados aos Serviços, com acompanhamento por período mínimo de [PRAZO] meses após o término do Contrato, sem ônus adicional para a Contratante;

p) Submeter-se a auditorias técnicas, de compliance, de segurança da informação e de proteção de dados realizadas pela Contratante ou por terceiro por ela designado, com aviso prévio de 3 (três) dias úteis para auditorias programadas e sem aviso prévio para auditorias emergenciais, devendo cooperar plenamente e fornecer todos os documentos, registros, logs e informações solicitados;

q) Manter programa de integridade estruturado e certificado, com código de conduta, canal de denúncias independente, treinamentos regulares e documentados, due diligence de terceiros e controles internos robustos, apresentando evidências à Contratante na periodicidade definida no Anexo I.

---

CLÁUSULA OITAVA — DAS OBRIGAÇÕES DA CONTRATANTE

8.1. São obrigações da Contratante, sem prejuízo das demais previstas neste instrumento:

a) Efetuar os pagamentos devidos à Contratada nos prazos e condições estabelecidos neste Contrato, observadas todas as condições de aprovação de entregáveis, de apresentação de documentação fiscal completa e regular e de cumprimento integral das obrigações contratuais pela Contratada;

b) Fornecer à Contratada, em tempo hábil e de forma completa, todas as informações, documentos, especificações, acessos, credenciais e recursos necessários à execução dos Serviços, conforme especificado no Anexo I e na Matriz de Responsabilidades do Anexo VIII;

c) Designar gestor técnico sênior do contrato com poderes para aprovar entregáveis, emitir ordens de serviço, autorizar alterações de escopo, aplicar penalidades, executar garantias e tomar decisões operacionais e estratégicas no âmbito deste instrumento;

d) Avaliar e aprovar ou rejeitar os entregáveis submetidos pela Contratada no prazo estabelecido na Cláusula Segunda, com fundamentação técnica adequada, documentada e com referência expressa a cada critério de aceite não atendido, ao grau de não conformidade e às evidências identificadas em caso de rejeição;

e) Comunicar à Contratada, com antecedência razoável e não inferior a [PRAZO] dias, eventuais alterações em seus processos internos, requisitos técnicos, sistemas, políticas de segurança ou condições operacionais que possam impactar a execução dos Serviços ou o cumprimento dos SLAs;

f) Disponibilizar infraestrutura, equipamentos, sistemas e recursos materiais necessários à execução dos Serviços, quando expressamente previstos no Anexo I como responsabilidade da Contratante, nos prazos estabelecidos no cronograma;

g) Participar das reuniões de acompanhamento, revisão de desempenho, comitês de gestão do contrato e reuniões de gestão de riscos e segurança na periodicidade e formato definidos no Anexo I;

h) Notificar a Contratada, de forma tempestiva e fundamentada, sobre qualquer descumprimento de obrigação contratual ou de SLA, antes de aplicar as penalidades previstas neste instrumento, exceto nas hipóteses em que a natureza do descumprimento torne desnecessária ou inviável a notificação prévia, incluindo os casos de descumprimento grave e imediato previstos neste instrumento.

---

CLÁUSULA NONA — DA CONFIDENCIALIDADE

9.1. As Partes comprometem-se a manter em estrito sigilo de máximo nível todas as informações confidenciais e estratégicas a que tiverem acesso em razão da execução deste Contrato, incluindo, sem limitação, dados técnicos, comerciais, financeiros, operacionais, estratégicos, de propriedade intelectual, de clientes, de colaboradores, de fornecedores, de parceiros, de processos e de sistemas da outra Parte ("Informações Confidenciais").

9.2. As Informações Confidenciais somente poderão ser divulgadas a colaboradores, prestadores de serviços, assessores jurídicos ou técnicos que: (i) necessitem conhecê-las para os fins deste Contrato, com base no princípio do menor privilégio; (ii) sejam previamente informados da natureza confidencial das informações e das consequências jurídicas de sua violação; (iii) assinem individualmente termos de confidencialidade e proteção de dados com obrigações equivalentes ou superiores às previstas neste instrumento; e (iv) sejam expressamente autorizados por escrito pela Parte titular das informações, com registro da autorização.

9.3. Cada Parte deverá adotar medidas técnicas e organizacionais de máximo nível, compatíveis com os padrões de segurança da informação mais atuais e com as melhores práticas internacionais (ISO 27001, NIST, SOC 2), para proteger as Informações Confidenciais da outra Parte contra acesso não autorizado, divulgação indevida, perda, destruição, alteração ou qualquer forma de uso inadequado.

9.4. A Contratada deverá: (i) implementar controles de acesso baseados no princípio do menor privilégio, com autenticação multifator obrigatória; (ii) manter registros de auditoria (logs) completos, imutáveis e auditáveis de todos os acessos a informações e sistemas da Contratante, pelo prazo mínimo de 5 (cinco) anos; (iii) criptografar as Informações Confidenciais em trânsito e em repouso com algoritmos aprovados pela Contratante; (iv) realizar auditorias de segurança periódicas e testes de intrusão conforme definido no Anexo I; (v) implementar sistema de detecção e resposta a incidentes (SIEM/SOC) para monitoramento contínuo; e (vi) manter inventário atualizado de todos os ativos que processam Informações Confidenciais da Contratante.

9.5. A obrigação de confidencialidade prevista nesta cláusula não se aplica às informações que sejam ou se tornem de domínio público por meios lícitos, que já fossem de conhecimento comprovado e documentado da Parte receptora antes da celebração deste instrumento, que sejam desenvolvidas de forma independente e documentada pela Parte receptora, que sejam recebidas de terceiros de forma lícita e sem restrição, ou que devam ser divulgadas por força de lei ou ordem judicial, hipótese em que a Parte obrigada deverá notificar a outra com a maior brevidade possível, buscar proteção das informações divulgadas e minimizar o escopo da divulgação.

9.6. As obrigações de confidencialidade previstas nesta cláusula subsistirão pelo prazo de 10 (dez) anos após o término ou rescisão deste Contrato, sendo que as informações que constituam segredo de negócio, dados estratégicos críticos ou dados pessoais sensíveis permanecerão protegidas pelo prazo legal aplicável, sem limitação temporal.

9.7. A violação das obrigações de confidencialidade previstas nesta cláusula ensejará: (i) rescisão imediata do Contrato por justa causa, com execução integral da garantia contratual; (ii) responsabilização pelos danos diretos e indiretos causados, incluindo lucros cessantes, danos reputacionais, custos de contenção e custos de notificação de titulares de dados; (iii) adoção de medidas cautelares e inibitórias pela Contratante, independentemente de notificação prévia; e (iv) comunicação às autoridades competentes, incluindo a ANPD, quando aplicável.

---

CLÁUSULA DÉCIMA — DA PROTEÇÃO DE DADOS

10.1. As Partes comprometem-se a cumprir integralmente a Lei n.º 13.709/2018 (LGPD), o GDPR quando aplicável, e demais normas nacionais e internacionais aplicáveis à proteção de dados pessoais no âmbito da execução deste Contrato, adotando uma abordagem de privacy by design, privacy by default e data minimization em todas as atividades de tratamento de dados, com documentação completa de todas as atividades de tratamento.

10.2. A Contratada atuará na qualidade de operadora de dados, processando dados pessoais exclusivamente para as finalidades expressamente previstas neste Contrato, de acordo com as instruções documentadas, específicas e expressas da Contratante, vedado qualquer tratamento para finalidades próprias ou de terceiros, incluindo análise, comercialização, compartilhamento, uso para treinamento de modelos de inteligência artificial ou qualquer outra finalidade não expressamente autorizada.

10.3. A Contratada adotará medidas técnicas e organizacionais de segurança de nível máximo, incluindo, sem limitação: criptografia de dados em trânsito e em repouso com algoritmos aprovados pela Contratante e de acordo com as melhores práticas internacionais, controles de acesso baseados em perfil e no princípio do menor privilégio com autenticação multifator obrigatória, registros de auditoria completos, imutáveis e auditáveis pelo prazo mínimo de 5 (cinco) anos, planos de resposta a incidentes testados semestralmente com participação de representantes da Contratante, treinamento regular e documentado de toda a equipe em proteção de dados, e avaliação de impacto à proteção de dados (DPIA) para todas as atividades de tratamento de alto risco.

10.4. Em caso de incidente de segurança envolvendo dados pessoais, a Contratada notificará a Contratante no prazo máximo de 1 (uma) hora após tomar ciência do ocorrido, fornecendo relatório preliminar com as informações disponíveis, seguido de relatório completo e detalhado no prazo de 12 (doze) horas, contendo: natureza e extensão do incidente, categorias e volume de dados afetados, possível impacto sobre os titulares e sobre a Contratante, medidas adotadas e a adotar para mitigar os efeitos, identificação dos responsáveis pela resposta ao incidente, análise de causa raiz e plano de ação corretiva.

10.5. Ao término deste Contrato, a Contratada deverá, no prazo de 3 (três) dias úteis e conforme instrução documentada da Contratante, devolver ou eliminar de forma segura, certificada e irreversível todos os dados pessoais tratados em razão deste instrumento, fornecendo certificado técnico de eliminação assinado por profissional qualificado e certificado, com indicação do método de eliminação utilizado, salvo obrigação legal de retenção, hipótese em que deverá informar à Contratante os dados retidos, o fundamento legal, o prazo de retenção aplicável e as medidas de segurança adotadas.

10.6. A Contratada não poderá subcontratar o tratamento de dados pessoais sem prévia autorização escrita e expressa da Contratante, devendo garantir contratualmente que os suboperadores observem as mesmas obrigações de proteção de dados previstas neste instrumento, com nível de proteção equivalente ou superior, respondendo solidariamente por eventuais violações de qualquer suboperador.

10.7. A Contratada designará encarregado de proteção de dados (DPO) dedicado e certificado para as atividades desenvolvidas no âmbito deste Contrato, cujos dados de contato deverão constar do Anexo IV, e que deverá estar disponível para comunicação com a Contratante em prazo não superior a 1 (uma) hora em casos de incidentes e em prazo não superior a 4 (quatro) horas para demais comunicações.

10.8. A Contratada submeter-se-á a auditorias de proteção de dados realizadas pela Contratante ou por terceiro por ela designado, com aviso prévio de 3 (três) dias úteis para auditorias programadas e sem aviso prévio para auditorias emergenciais, devendo cooperar plenamente e fornecer todos os documentos, registros, logs e informações solicitados, incluindo acesso aos sistemas de tratamento de dados.

10.9. A Contratada deverá manter, durante toda a vigência do Contrato, certificação ISO 27001 ou equivalente aprovada pela Contratante, apresentando evidências de certificação vigente antes do início dos Serviços e sempre que renovada.

---

CLÁUSULA DÉCIMA PRIMEIRA — DA PROPRIEDADE INTELECTUAL

11.1. Todos os produtos, obras, criações, desenvolvimentos, relatórios, documentos, códigos, algoritmos, metodologias, materiais, dados, modelos, processos e demais criações intelectuais produzidos pela Contratada no âmbito da execução deste Contrato serão de propriedade exclusiva e plena da Contratante, que poderá utilizá-los livremente, sem qualquer restrição, ônus adicional, necessidade de autorização ou pagamento de royalties à Contratada, em qualquer território e por qualquer prazo.

11.2. A Contratada cede à Contratante, de forma irrevogável, irretratável, universal, exclusiva, perpétua e a título gratuito, todos os direitos patrimoniais sobre as criações intelectuais desenvolvidas no âmbito deste Contrato, incluindo todos os direitos de exploração previstos na legislação de propriedade intelectual aplicável, em todos os territórios e por todo o prazo de proteção legal, incluindo o direito de sublicenciar, modificar, adaptar, distribuir e criar obras derivadas.

11.3. A Contratada declara, sob as penas da lei, que os Serviços prestados, os entregáveis entregues e os materiais produzidos não violam direitos de propriedade intelectual, direitos autorais, patentes, marcas, segredos de negócio ou quaisquer outros direitos de terceiros, responsabilizando-se integralmente por eventuais reclamações, demandas, notificações ou ações judiciais nesse sentido, incluindo os custos razoáveis de defesa da Contratante, honorários advocatícios, eventuais condenações e danos reputacionais.

11.4. A Contratada deverá, ao final do Contrato e quando solicitado durante sua vigência, entregar à Contratante todos os arquivos, documentos, códigos-fonte, scripts, configurações, dados, credenciais, chaves de criptografia e demais materiais produzidos no âmbito dos Serviços, em formato editável e acompanhados de documentação técnica completa, atualizada e suficiente para a operação, manutenção e evolução independente pela Contratante ou por terceiro por ela designado, sem qualquer restrição ou dependência da Contratada.

11.5. A Contratada não poderá utilizar o nome, a marca, o logotipo, os dados, os resultados, as metodologias ou qualquer outro elemento relacionado à Contratante em materiais de marketing, portfólio, publicações, apresentações, comunicações externas ou para qualquer outra finalidade sem prévia autorização escrita e expressa da Contratante.

11.6. A Contratada não poderá utilizar os dados, informações, metodologias, processos ou resultados obtidos no âmbito deste Contrato para desenvolver produtos, serviços ou soluções para terceiros, ou para treinar modelos de inteligência artificial, ou para qualquer outra finalidade que não seja a execução dos Serviços objeto deste instrumento, sem prévia autorização escrita e expressa da Contratante.

11.7. A Contratada deverá manter inventário atualizado de todos os ativos de propriedade intelectual desenvolvidos no âmbito deste Contrato, submetendo-o à Contratante na periodicidade definida no Anexo I.

---

CLÁUSULA DÉCIMA SEGUNDA — DA RESPONSABILIDADE

12.1. A Contratada é integralmente responsável pela qualidade técnica, pela conformidade, pela segurança, pela resiliência e pelo desempenho dos Serviços prestados e dos entregáveis entregues, respondendo pelos vícios, defeitos, não conformidades, falhas de desempenho e vulnerabilidades de segurança identificados durante a execução do Contrato e dentro do período de garantia de 24 (vinte e quatro) meses.

12.2. A Contratada será responsável pelos danos diretos e indiretos causados à Contratante em decorrência do descumprimento culposo ou doloso das obrigações previstas neste Contrato, incluindo lucros cessantes, danos emergentes, danos reputacionais, custos de substituição de fornecedor, custos de remediação de incidentes de segurança, custos de notificação de titulares de dados e custos de defesa em processos administrativos e judiciais.

12.3. A Contratada será responsável pelos danos causados a terceiros em decorrência da execução dos Serviços, devendo manter seguro de responsabilidade civil com cobertura mínima de R$ [VALOR] e seguro de riscos cibernéticos com cobertura mínima de R$ [VALOR] durante toda a vigência do Contrato.

12.4. A responsabilidade total da Contratada perante a Contratante ficará limitada ao triplo do valor total do Contrato, exceto nos casos de dolo, fraude, violação de obrigações de confidencialidade, proteção de dados, propriedade intelectual, compliance ou responsabilidade perante terceiros, hipóteses em que a responsabilidade será ilimitada e não poderá ser objeto de negociação ou limitação contratual.

12.5. A Contratada indenizará e manterá a Contratante indene de quaisquer reclamações, demandas, ações judiciais, processos administrativos, custos, despesas e condenações decorrentes de: (i) descumprimento de obrigações trabalhistas, previdenciárias, fiscais ou regulatórias da Contratada; (ii) violação de direitos de propriedade intelectual de terceiros; (iii) incidentes de segurança ou violações de proteção de dados causados pela Contratada; (iv) danos causados a terceiros em razão da execução dos Serviços; e (v) descumprimento de obrigações de compliance e anticorrupção.

12.6. A Contratada não poderá invocar a responsabilidade da Contratante para se eximir de suas próprias obrigações contratuais, salvo nos casos em que o descumprimento decorra exclusivamente de atos ou omissões documentados e comprovados da Contratante.

---

CLÁUSULA DÉCIMA TERCEIRA — DAS PENALIDADES

13.1. O atraso injustificado na entrega de entregáveis previstos no cronograma do Anexo VI sujeitará a Contratada ao pagamento de multa moratória de 2% (dois por cento) do valor da parcela vinculada ao entregável atrasado, por dia de atraso, limitada a 30% (trinta por cento) do valor total do Contrato.

13.2. O descumprimento dos SLAs definidos no Anexo VII, além dos créditos de serviço previstos no mesmo Anexo, ensejará a aplicação de multa adicional de até 15% (quinze por cento) do valor mensal do Contrato, proporcional ao grau de descumprimento e ao impacto operacional e de segurança causado à Contratante.

13.3. O descumprimento injustificado de obrigações contratuais relevantes, não sanado no prazo de notificação, sujeitará a Parte infratora ao pagamento de multa compensatória de 30% (trinta por cento) do valor total do Contrato, sem prejuízo do direito à reparação integral dos danos comprovadamente sofridos.

13.4. A violação de obrigações de confidencialidade, proteção de dados ou propriedade intelectual sujeitará a Contratada ao pagamento de multa específica de R$ [VALOR] por ocorrência, sem prejuízo da responsabilidade pelos danos causados, da rescisão imediata do Contrato por justa causa, da execução integral da garantia contratual e das medidas legais cabíveis.

13.5. O descumprimento de obrigações de compliance, ética e anticorrupção sujeitará a Contratada ao pagamento de multa de 40% (quarenta por cento) do valor total do Contrato, sem prejuízo da rescisão imediata por justa causa, da execução integral da garantia contratual e das demais sanções legais aplicáveis.

13.6. A não prestação ou a não renovação da garantia contratual no prazo estabelecido sujeitará a Contratada ao pagamento de multa diária de 0,5% (zero vírgula cinco por cento) do valor total do Contrato, por dia de atraso, e à suspensão imediata dos pagamentos, sem que tal suspensão configure inadimplemento da Contratante.

13.7. A rejeição de entregável em segunda análise sujeitará a Contratada ao pagamento de multa de 10% (dez por cento) do valor da parcela vinculada ao entregável, por rejeição, sem prejuízo das demais penalidades cabíveis.

13.8. As penalidades previstas nesta cláusula são cumulativas entre si e com a obrigação de reparação integral dos danos, podendo ser aplicadas simultaneamente quando o mesmo fato ensejar a incidência de mais de uma penalidade.

13.9. Os valores das multas serão descontados dos pagamentos devidos à Contratada, cobrados judicialmente, deduzidos de garantias contratuais ou executados diretamente sobre a garantia contratual prestada, a critério exclusivo da Contratante.

13.10. Não serão aplicadas penalidades nos casos em que o descumprimento decorra exclusivamente de caso fortuito, força maior ou atos atribuíveis exclusivamente à própria Contratante, devidamente comunicados no prazo de 1 (uma) hora após a ocorrência e comprovados documentalmente com evidências contemporâneas.

---

CLÁUSULA DÉCIMA QUARTA — DA RESCISÃO

14.1. Este Contrato poderá ser rescindido nas seguintes hipóteses:

a) Por mútuo acordo entre as Partes, formalizado por escrito, com definição das condições de encerramento, acerto de contas, transição de conhecimento, transferência de responsabilidades e liberação da garantia contratual;

b) Pela Contratante, sem justa causa, mediante aviso prévio escrito com antecedência mínima de 120 (cento e vinte) dias, sem prejuízo do pagamento pelos Serviços já prestados e aprovados, dos custos comprovados de desmobilização e de multa rescisória de 15% (quinze por cento) do valor remanescente do Contrato;

c) Pela Contratada, sem justa causa, mediante aviso prévio escrito com antecedência mínima de 180 (cento e oitenta) dias, sem prejuízo do pagamento de multa rescisória de 30% (trinta por cento) do valor remanescente do Contrato, da execução parcial da garantia contratual e da obrigação de garantir a continuidade integral dos Serviços durante todo o período de aviso prévio;

d) Por qualquer das Partes, com justa causa, em caso de descumprimento grave e não remediado de obrigações contratuais essenciais, após notificação prévia com prazo de 5 (cinco) dias úteis para regularização, exceto nas hipóteses de descumprimento que, por sua natureza, tornem inviável ou desnecessária a concessão de prazo;

e) Pela Contratante, de forma imediata e sem necessidade de notificação prévia, nos casos de: (i) falência, recuperação judicial ou extrajudicial, insolvência, dissolução ou liquidação da Contratada; (ii) violação comprovada de obrigações de confidencialidade, proteção de dados, compliance ou anticorrupção; (iii) rejeição de 2 (dois) ou mais entregáveis em segunda análise; (iv) descumprimento reiterado de SLAs conforme definido na Cláusula Segunda; (v) qualquer ato que comprometa a segurança dos sistemas, dados ou operações da Contratante; (vi) não prestação ou não renovação da garantia contratual no prazo estabelecido; ou (vii) subcontratação não autorizada.

14.2. Em caso de rescisão com justa causa pela Contratante, a Contratada fará jus apenas ao pagamento pelos Serviços efetivamente prestados e aceitos até a data de rescisão, sem direito a qualquer indenização adicional, multa rescisória ou reembolso de custos, devendo ainda pagar à Contratante a multa compensatória máxima prevista na Cláusula Décima Terceira, indenizar os danos causados e sujeitar-se à execução integral da garantia contratual.

14.3. Em qualquer hipótese de rescisão, a Contratada deverá: (i) continuar prestando os Serviços durante o período de transição, de até 180 (cento e oitenta) dias, mediante remuneração proporcional; (ii) transferir para a Contratante ou para terceiro por ela indicado todos os materiais, documentos, códigos, dados, credenciais, chaves de criptografia e informações relacionados aos Serviços; (iii) cooperar plenamente com o processo de transição; (iv) garantir a continuidade operacional da Contratante durante todo o período de transição; e (v) manter a garantia contratual vigente durante todo o período de transição.

14.4. A rescisão deste Contrato não afetará as obrigações das Partes já constituídas até a data de sua efetivação, incluindo obrigações de pagamento, confidencialidade, proteção de dados, propriedade intelectual, garantia, responsabilidade por danos causados e obrigações de transição.

---

CLÁUSULA DÉCIMA QUINTA — DO COMPLIANCE, ÉTICA E ANTICORRUPÇÃO

15.1. As Partes declaram conhecer e comprometem-se a cumprir integralmente a Lei n.º 12.846/2013 (Lei Anticorrupção), a Lei n.º 8.429/1992, o FCPA, o UK Bribery Act, quando aplicáveis, e demais normas nacionais e internacionais aplicáveis ao combate à corrupção, ao suborno, à lavagem de dinheiro, ao financiamento do terrorismo e a práticas ilícitas.

15.2. A Contratada declara possuir programa de integridade estruturado e certificado, com: (i) código de conduta e ética; (ii) canal de denúncias independente, acessível e anônimo; (iii) treinamentos regulares e documentados em ética e anticorrupção para toda a equipe; (iv) due diligence de terceiros com análise de riscos de integridade; (v) controles internos robustos e auditáveis; (vi) mecanismos de monitoramento e auditoria periódica; e (vii) política de tolerância zero a qualquer forma de corrupção, suborno ou prática ilícita, comprometendo-se a mantê-lo e aprimorá-lo durante toda a vigência do Contrato e a apresentar evidências à Contratante na periodicidade definida no Anexo I.

15.3. A Contratante poderá realizar auditorias de compliance na Contratada, com aviso prévio de 3 (três) dias úteis para auditorias programadas e sem aviso prévio para auditorias emergenciais, para verificar o cumprimento das obrigações previstas nesta cláusula, devendo a Contratada cooperar plenamente, fornecer os documentos e informações solicitados e permitir o acesso às suas instalações, sistemas e registros.

15.4. A Contratada deverá comunicar à Contratante, no prazo de 2 (duas) horas, qualquer investigação, processo administrativo ou judicial relacionado a práticas de corrupção, suborno, lavagem de dinheiro, financiamento do terrorismo ou outras irregularidades que possam impactar a execução deste Contrato ou a reputação da Contratante.

15.5. A violação das obrigações previstas nesta cláusula constituirá justa causa para rescisão imediata deste Contrato, sem necessidade de notificação prévia, sem direito a qualquer indenização pela Contratada, com execução integral da garantia contratual, com obrigação de pagamento da multa máxima prevista na Cláusula Décima Terceira e com comunicação obrigatória às autoridades competentes.

15.6. A Contratada deverá submeter-se a avaliação periódica de integridade e compliance realizada pela Contratante ou por terceiro por ela designado, na periodicidade definida no Anexo I, devendo cooperar plenamente com o processo de avaliação.

---

CLÁUSULA DÉCIMA SEXTA — DA SUBCONTRATAÇÃO E DA CESSÃO

16.1. A subcontratação de qualquer parte dos Serviços é expressamente vedada sem prévia autorização escrita e expressa da Contratante, que poderá recusá-la sem necessidade de justificativa. A autorização, quando concedida, será específica para o subcontratado, para a atividade indicada e para o prazo determinado, não podendo ser estendida a outros subcontratados, atividades ou prazos sem nova autorização expressa.

16.2. Para obter autorização de subcontratação, a Contratada deverá apresentar à Contratante, com antecedência mínima de 45 (quarenta e cinco) dias: (i) identificação completa do subcontratado; (ii) qualificação técnica, certificações e experiência comprovada; (iii) certidões de regularidade fiscal, trabalhista e previdenciária; (iv) relatório de due diligence de compliance e integridade; (v) minuta do contrato de subcontratação com cláusulas equivalentes às deste instrumento; (vi) declaração de que o subcontratado assinou termos individuais de confidencialidade e proteção de dados; (vii) comprovante de seguro de responsabilidade civil; e (viii) declaração de ausência de conflito de interesses.

16.3. A autorização para subcontratação não exime a Contratada de sua responsabilidade perante a Contratante pelo cumprimento integral das obrigações contratuais, respondendo solidariamente pelos atos, omissões, falhas, descumprimentos e danos dos subcontratados como se fossem seus próprios, sem direito de regresso perante a Contratante.

16.4. A Contratante poderá, a seu critério exclusivo e sem necessidade de justificativa, solicitar a substituição imediata de subcontratado, devendo a Contratada promover a substituição no prazo de 3 (três) dias úteis, sem interrupção dos Serviços e sem ônus adicional para a Contratante.

16.5. A cessão total ou parcial dos direitos e obrigações decorrentes deste Contrato é expressamente vedada sem consentimento prévio e escrito da outra Parte, que poderá recusá-la sem necessidade de justificativa, exceto nos casos de reorganização societária, hipótese em que a cessão será condicionada à assunção integral das obrigações contratuais pela cessionária, à comprovação de capacidade técnica equivalente ou superior, à manutenção da garantia contratual e à aprovação formal da Contratante.

16.6. A subcontratação não autorizada constituirá descumprimento contratual grave e imediato, sujeitando a Contratada às penalidades máximas previstas na Cláusula Décima Terceira, à execução integral da garantia contratual e conferindo à Contratante o direito de rescindir imediatamente o Contrato por justa causa.

---

CLÁUSULA DÉCIMA SÉTIMA — DAS COMUNICAÇÕES ENTRE AS PARTES

17.1. Todas as comunicações, notificações, aprovações, rejeições, solicitações e demais atos com efeitos jurídicos relacionados a este Contrato deverão ser realizados por escrito, por meio de: (i) carta com aviso de recebimento; (ii) e-mail com confirmação de leitura e com cópia para o gestor do contrato e para o assessor jurídico da Parte; ou (iii) plataforma de gestão de contratos previamente acordada entre as Partes, com registro de auditoria completo e imutável.

17.2. As comunicações deverão ser endereçadas aos gestores do contrato e aos pontos focais indicados pelas Partes no Anexo IV, podendo ser atualizados mediante comunicação escrita, sem necessidade de aditamento contratual, com efeitos a partir do recebimento da notificação de atualização, confirmada por escrito pela Parte destinatária.

17.3. Aprovações de entregáveis, ordens de serviço, autorizações de subcontratação, aplicação de penalidades, retenções de pagamento, execução de garantia e demais atos que produzam efeitos jurídicos relevantes deverão ser realizados por escrito e assinados pelo gestor do contrato da Parte responsável, com indicação expressa do objeto e dos efeitos do ato, e arquivados no dossiê do contrato.

17.4. Alterações no escopo, nos valores contratuais, nos prazos globais, nos SLAs, nas condições de garantia ou em quaisquer condições essenciais deste instrumento deverão ser formalizadas por aditamento contratual escrito, assinado por representantes autorizados de ambas as Partes, sendo absolutamente ineficazes quaisquer acordos verbais, e-mails informais ou comunicações não formalizadas sobre tais matérias.

17.5. As Partes comprometem-se a realizar reuniões semanais de acompanhamento operacional e reuniões mensais de revisão de desempenho, com registro em ata assinada pelos gestores do contrato de ambas as Partes, que integrará o histórico documental do Contrato e poderá ser utilizada como evidência em eventuais disputas.

17.6. A Contratada deverá manter um sistema de gestão de comunicações do contrato, com registro de todas as comunicações, aprovações, rejeições e atos com efeitos jurídicos, disponível para consulta pela Contratante a qualquer momento.

---

CLÁUSULA DÉCIMA OITAVA — DOS ANEXOS

18.1. Integram o presente Contrato, como partes indissociáveis e de igual hierarquia, os seguintes Anexos:

Anexo I — Especificação Técnica Fechada e Vinculante dos Serviços: descrição fechada do escopo, entregáveis vinculantes, especificações técnicas, critérios formais de aceite, prazo de garantia de 24 meses, requisitos de segurança, responsabilidades de cada Parte e inventário de ativos de propriedade intelectual;
Anexo II — Cronograma Financeiro: valores, condições e datas de pagamento por entregável ou marco, incluindo retenção de garantia de execução;
Anexo III — Dados Bancários da Contratada: informações para fins de pagamento;
Anexo IV — Gestores do Contrato, Pontos Focais e DPO: dados de contato das Partes para fins de comunicação, gestão, resposta a incidentes e proteção de dados;
Anexo V — Plano de Segurança da Informação: requisitos de segurança, controles obrigatórios, procedimentos de gestão de incidentes e métricas de segurança;
Anexo VI — Cronograma de Execução: marcos intermediários, datas de entrega de entregáveis, marcos de pagamento, pontos de controle obrigatórios e marcos de auditoria;
Anexo VII — Acordo de Nível de Serviço (SLA) de Máxima Exigência: métricas de desempenho, metas, metodologia de medição, créditos de serviço e penalidades por descumprimento;
Anexo VIII — Matriz de Responsabilidades: definição detalhada das responsabilidades de cada Parte para cada atividade, entregável e marco do Contrato;
Anexo IX — Garantia Contratual: modalidade, valor, prazo, condições de vigência, renovação e execução da garantia;
Anexo X — Plano de Continuidade de Negócios e Plano de Recuperação de Desastres: requisitos, estrutura, periodicidade de testes e métricas de resiliência.

18.2. Em caso de conflito entre o disposto neste instrumento e em seus Anexos, prevalecerão as disposições do instrumento principal, salvo quando os Anexos estabelecerem condições mais específicas para situações determinadas, hipótese em que prevalecerão as disposições mais específicas, desde que não contrariem as disposições essenciais deste instrumento.

18.3. Os Anexos I, VI, VII, VIII e X somente poderão ser atualizados mediante aditamento contratual formal, assinado por representantes autorizados de ambas as Partes. Os demais Anexos poderão ser atualizados por comunicação escrita assinada pelos gestores do contrato, desde que tais atualizações não impliquem alteração de valores, prazos globais, SLAs, escopo, obrigações essenciais ou condições de garantia.

18.4. A Contratada deverá manter todos os Anexos atualizados durante a vigência do Contrato, submetendo versões atualizadas à aprovação da Contratante sempre que houver alteração relevante, na periodicidade definida em cada Anexo.

---

CLÁUSULA DÉCIMA NONA — DAS DISPOSIÇÕES GERAIS

19.1. Este Contrato representa o acordo integral entre as Partes com relação ao seu objeto, substituindo todos os entendimentos, negociações, propostas, cartas de intenção e acordos anteriores, verbais ou escritos, sobre a mesma matéria, não podendo ser alterado por acordos verbais ou comunicações informais.

19.2. A tolerância de qualquer das Partes em relação ao descumprimento de obrigações pela outra não constituirá novação, renúncia de direitos, precedente vinculante para situações futuras ou modificação tácita das condições contratuais, devendo qualquer renúncia ser expressa, específica, formalizada por escrito e assinada pelo representante autorizado da Parte renunciante.

19.3. Se qualquer disposição deste Contrato for considerada inválida, ilegal ou inexequível, as demais disposições permanecerão em pleno vigor e efeito, e as Partes negociarão de boa-fé uma disposição substituta que reflita, na medida do possível, a intenção original das Partes e o nível máximo de proteção estabelecido neste instrumento.

19.4. Este Contrato poderá ser assinado em vias físicas ou eletronicamente, por meio de plataforma de assinatura digital certificada nos termos da Medida Provisória n.º 2.200-2/2001, da Lei n.º 14.063/2020 e demais normas aplicáveis, tendo ambas as formas igual validade jurídica e probatória, devendo a plataforma de assinatura digital ser aprovada previamente pela Contratante.

19.5. As Partes declaram ter lido e compreendido integralmente o presente instrumento, concordando com todos os seus termos e condições, e que seus representantes possuem os poderes necessários para celebrá-lo, conforme documentos societários em vigor, apresentados antes da assinatura.

19.6. Quaisquer alterações a este instrumento somente produzirão efeitos se formalizadas por aditamento contratual escrito, assinado por representantes autorizados de ambas as Partes, sendo absolutamente ineficazes quaisquer acordos verbais ou comunicações informais sobre matérias essenciais do Contrato.

19.7. Este Contrato é regido pela legislação brasileira, em especial pelo Código Civil, pela Lei Anticorrupção, pela LGPD, pela Lei de Propriedade Industrial e pelas demais normas aplicáveis à sua natureza e objeto.

19.8. As Partes comprometem-se a manter o presente instrumento e seus Anexos em sigilo, não divulgando seu conteúdo a terceiros sem prévia autorização escrita da outra Parte, exceto quando necessário para o cumprimento de obrigações legais ou regulatórias.

---

CLÁUSULA VIGÉSIMA — DO FORO

20.1. As Partes elegem o foro da Comarca de [CIDADE/ESTADO] para dirimir quaisquer controvérsias decorrentes deste Contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

20.2. Antes de recorrer ao Poder Judiciário ou à arbitragem, as Partes comprometem-se a buscar solução amigável para eventuais divergências, por meio de negociação direta entre seus gestores do contrato e, se necessário, entre seus representantes legais, pelo prazo de 10 (dez) dias corridos contados da notificação formal do conflito.

20.3. Não sendo possível a solução amigável no prazo estabelecido no item 20.2, as Partes comprometem-se a submeter a controvérsia à mediação, nos termos da Lei n.º 13.140/2015, perante câmara de mediação de reconhecida reputação e com especialização em contratos empresariais, pelo prazo de 20 (vinte) dias, antes de recorrer ao Poder Judiciário ou à arbitragem.

20.4. Não sendo resolvida a controvérsia por mediação, as Partes submeterão obrigatoriamente a questão à arbitragem, nos termos da Lei n.º 9.307/1996, perante câmara arbitral de reconhecida reputação e com especialização em contratos empresariais, com sede em [CIDADE], aplicando-se o regulamento da câmara escolhida, com árbitros especializados em direito empresarial e contratos de tecnologia e serviços.

20.5. O procedimento arbitral será conduzido em língua portuguesa, com sede em [CIDADE], e a sentença arbitral será definitiva, vinculante e não sujeita a recurso, exceto nas hipóteses legais de nulidade.

20.6. As medidas cautelares e de urgência poderão ser requeridas ao Poder Judiciário antes ou durante o procedimento arbitral, sem que tal requerimento implique renúncia à arbitragem.

---

E por estarem assim justas e contratadas, as Partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença de 2 (duas) testemunhas, ou eletronicamente por meio de plataforma de assinatura digital certificada previamente aprovada pela Contratante.

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
      ["Contrato Blindado de Prestação de Serviços Críticos e Sensíveis"]
    );
    if (rows.length > 0) {
      console.log("Template já existe. Atualizando...");
      await conn.execute(
        `UPDATE contract_templates SET description = ?, contractType = ?, content = ?, isActive = ? WHERE name = ?`,
        [
          "Modelo contratual de máxima rigidez para serviços críticos, sensíveis e de alto impacto jurídico-operacional.",
          "service",
          content,
          true,
          "Contrato Blindado de Prestação de Serviços Críticos e Sensíveis",
        ]
      );
      console.log("Template atualizado com sucesso.");
    } else {
      await conn.execute(
        `INSERT INTO contract_templates (name, description, contractType, content, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          "Contrato Blindado de Prestação de Serviços Críticos e Sensíveis",
          "Modelo contratual de máxima rigidez para serviços críticos, sensíveis e de alto impacto jurídico-operacional.",
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
