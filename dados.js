// Fonte dos dados de constantes e autocomplete usados pelo formulário.
// Não faz chamadas de rede — é só dado estático embutido.

// Prefixo fixo da organização no GitHub. Único lugar a mudar se o org mudar.
var GITHUB_ORG = "ufcimg";

// Nome da instituição titular. Único lugar a mudar se o nome mudar: o
// index.html preenche os elementos marcados com data-instituicao a partir
// daqui, e o PDF e as mensagens de validação também leem estes valores.
// No JSON, a instituição se identifica por instituicao_tipo "propria", nunca
// pelo nome.
var INSTITUICAO = {
  sigla: "UFCIMG",
  nome: "Universidade Federal de Ciência e Inovação de Minas Gerais"
};

// Versão do formato do JSON que vai no PDF (anexo submissao.json e bloco
// sentinela) e no "Salvar rascunho". Quem lê esse JSON (a extensão do NIT e o
// "Carregar rascunho") usa o número para saber qual formato recebeu. Depois que
// houver PDF no SIPAC, mudanças no formato só acrescentam chaves opcionais;
// remover, renomear ou mudar o tipo de uma chave exige subir o número maior e
// fazer os leitores aceitarem as duas versões.
var VERSAO_FLUXO = "0.3";

// Domínio do e-mail institucional. Único lugar a mudar se o domínio mudar.
var EMAIL_DOMINIO_INSTITUCIONAL = "cefetmg.br";

// TRL a partir do qual o registro exige justificativa com comprovantes e
// manifestação de interesse de empresa/instituição (INPI).
var TRL_MINIMO_MATURIDADE = 6;

// Mínimo de caracteres dos campos de parágrafo (justificativa do TRL,
// contribuição de cada instituição parceira).
var MIN_CARACTERES_PARAGRAFO = 250;

// Tipos de interesse de uma empresa ou instituição no software (marcação múltipla).
// `valor` é o que vai no JSON do PDF e, pela extensão do NIT, para a propriedade de
// seleção múltipla do Notion; `rotulo` é o que o docente vê e sai no PDF. Mantenha as
// mesmas opções do modelo de carta (modelos/carta-manifestacao-interesse.docx).
var INTERESSE_TIPOS = [
  { valor: "avaliar_uso", rotulo: "Conhecer e avaliar o software para uso na organização" },
  { valor: "continuidade_desenvolvimento", rotulo: "Dar continuidade ao desenvolvimento do software, em parceria com a instituição" },
  { valor: "parceria_em_andamento", rotulo: "Manter parceria já em andamento (projeto, convênio ou edital)" },
  { valor: "outro", rotulo: "Outro" }
];

// Tipos de projeto relacionado ao software (etapa Identificação; pode haver vários).
// `valor` é o que vai no JSON do PDF; `rotulo` é o que o docente vê e sai no PDF.
var PROJETO_RELACIONADO_TIPOS = [
  { valor: "processo_sipac", rotulo: "Processo no SIPAC" },
  { valor: "extensao", rotulo: "Ação de extensão" },
  { valor: "pesquisa", rotulo: "Projeto de pesquisa" },
  { valor: "fomento_externo", rotulo: "Projeto com fomento externo" },
  { valor: "edital", rotulo: "Edital" },
  { valor: "outro", rotulo: "Outro" }
];

// Agências de fomento de um projeto relacionado do tipo "fomento_externo".
// Com "outra", o docente escreve o nome em `agencia_fomento_outra`.
var AGENCIAS_FOMENTO = [
  { valor: "cnpq", rotulo: "CNPq" },
  { valor: "fapemig", rotulo: "FAPEMIG" },
  { valor: "capes", rotulo: "CAPES" },
  { valor: "outra", rotulo: "Outra" }
];

// Quantidade de palavras-chave aceitas na etapa Classificação.
var MIN_PALAVRAS_CHAVE = 2;
var MAX_PALAVRAS_CHAVE = 5;

// Máximo de sugestões exibidas por lista de autocomplete.
var MAX_RESULTS = 40;

var LINGUAGENS_COMUNS = ["Python","JavaScript","TypeScript",
                      "Java","C","C++","C#","PHP","Go","R",
                      "SQL","HTML/CSS","Shell/Bash","Kotlin"];

// Campi da instituição usados no seletor de Campus (autor com instituicao_tipo "propria").
var CAMPI_INSTITUICAO = [
  "BH/Nova Suíça", "BH/Nova Gameleira", "BH/Gameleira",
  "Araxá", "Contagem", "Curvelo", "Divinópolis",
  "Leopoldina", "Nepomuceno", "Timóteo", "Varginha"
];

// Escala TRL (Technology Readiness Level) — títulos e descrições adaptados da
// Embrapa (embrapa.br/escala-dos-niveis-de-maturidade-tecnologica-trl-mrl).
var TRL_NIVEIS = [
  { nivel: 1, titulo: "Ideação", descricao: "Princípios básicos observados e reportados." },
  { nivel: 2, titulo: "Concepção", descricao: "Concepção tecnológica e/ou aplicação formulada." },
  { nivel: 3, titulo: "Prova de conceito", descricao: "Prova de conceito das funções críticas, de forma analítica ou experimental." },
  { nivel: 4, titulo: "Otimização", descricao: "Validado em ambiente de laboratório, com componentes ou arranjos experimentais básicos." },
  { nivel: 5, titulo: "Prototipagem", descricao: "Validado em ambiente relevante, com componentes ou arranjos experimentais com configurações físicas finais." },
  { nivel: 6, titulo: "Escalonamento", descricao: "Modelo do sistema/subsistema ou protótipo demonstrado em ambiente relevante." },
  { nivel: 7, titulo: "Demonstração em ambiente operacional", descricao: "Prototipo demonstrado em ambiente operacional." },
  { nivel: 8, titulo: "Produção", descricao: "Sistema completo, testado, qualificado e demonstrado." },
  { nivel: 9, titulo: "Produção continuada", descricao: "Sistema já operado em todas as condições, extensão e alcance esperados." }
];

// Links oficiais das tabelas de classificação do INPI, verificados em 2026-09-21.
// Se o INPI reorganizar o site e o link quebrar, é só trocar aqui.
//
// Estas linhas guardam links de citação: endereços estáticos que o usuário clica para abrir
// numa aba nova. Nada é carregado pela página nem usado em fetch/XHR. O marcador
// ALLOW-REDE-LINK-CITACAO avisa o guarda de rede (.github/scripts/verificar-sem-rede.py,
// usado pelo sem-rede.yml e pelo testes/rodar.sh) para não barrar exatamente estas linhas.
// Não copie esse marcador para nenhuma outra linha sem entender por quê ele existe.
// (A Política de Inovação é diferente: é uma âncora direta no index.html, que o guarda aceita
// por ter rel="noopener noreferrer".)
var LINK_TABELA_CAMPO_APLICACAO = "https://www.gov.br/inpi/pt-br/servicos/programas-de-computador/arquivos/manual/campo_de_aplicacao.pdf"; // ALLOW-REDE-LINK-CITACAO
var LINK_TABELA_TIPO_PROGRAMA = "https://www.gov.br/inpi/pt-br/assuntos/programas-de-computador/tipos_de_programa.pdf"; // ALLOW-REDE-LINK-CITACAO

// Página oficial da CIE com o processo vigente de registro de programa de
// computador (substitui o cadastro no Integra, que não é mais o pré-requisito
// — confirmado 2026-09-21; a página é atualizada por eles, não por nós).
var LINK_CIE_PROGRAMA_COMPUTADOR = "https://www.cie.cefetmg.br/programa-de-computador/"; // ALLOW-REDE-LINK-CITACAO

// Fonte: Portal de Classificação do INPI (hominpi.serpro.gov.br), tabela vigente em 05/06/2006.
// [codigo, rotulo_curto, descricao_de_apoio_a_busca]
var CAMPO_APLICACAO_GRUPOS = [
["Administração",[
["AD01","Administração","desenvolvimento organizacional, desburocratização"],
["AD02","Função Administrativa","planejamento governamental: estratégico, operacional; organização administrativa, organograma, estrutura organizacional, controle e avaliação de desempenho"],
["AD03","Modernização Administrativa","análise organizacional, O&M"],
["AD04","Administração Pública","federal, estadual, municipal; direito administrativo, reforma administrativa, intervenção do Estado na economia"],
["AD05","Administração de Empresas","negócios, privada, organização de empresas"],
["AD06","Administração da Produção","planejamento da fábrica, engenharia do produto, protótipo, controle de qualidade"],
["AD07","Administração de Pessoal","recrutamento, seleção, admissão, avaliação, promoção"],
["AD08","Administração de Material","aquisição, armazenamento, almoxarifado, controle de estoque, inventário"],
["AD09","Administração Patrimonial","inventário patrimonial, fiscalização, conservação, manutenção do patrimônio"],
["AD10","Marketing","mercadologia, pesquisa de mercado, estratégia de marketing, administração de vendas"],
["AD11","Administração de Escritório","serviços de escritório, comunicação administrativa, arquivo"]
]],
["Agricultura",[
["AG01","Agricultura","agropecuária, desenvolvimento rural, extensão rural, política agrícola, zoneamento agrícola"],
["AG02","Ciências Agrárias","agrologia, agronomia, agrostologia, edafologia, pomologia"],
["AG03","Administração Agrícola","imóvel rural: fazenda, granja, empresa rural"],
["AG04","Economia Agrícola",""],
["AG05","Sistemas Agrícolas","agricultura extensiva, intensiva, itinerante, monocultura, policultura"],
["AG06","Engenharia Agrícola","construção rural: açude, barragem, estufa, habitação rural, drenagem, irrigação"],
["AG07","Edafologia","conservação de solo, controle da erosão, manejo do solo: adubação, fertilização"],
["AG08","Fitopatologia","doenças e pragas vegetais, defensivo agrícola"],
["AG09","Produção Vegetal","fitotecnia: cultura agrícola, lavoura, cultivo"],
["AG10","Produção Animal","zootecnia, veterinária, zoopatologia"],
["AG11","Ciências Florestais","dasonomia, economia florestal, silvicultura, reflorestamento"],
["AG12","Aquacultura","aquicultura animal, vegetal"],
["AG13","Extrativismo Vegetal","celulose, cera, fibra, goma natural, madeira, látex"],
["AG14","Extrativismo Animal","caça, pesca, couro, pele, pescado"]
]],
["Antropologia e Sociologia",[
["AN01","Sociedade","sistema social, estrutura, mobilização, controle, mudança e reforma social"],
["AN02","Desenvolvimento Social","planejamento social, política social, bem-estar social"],
["AN03","Grupos Sociais","tribo, etnia, grupo local, desenvolvimento comunitário"],
["AN04","Cultura","civilização, cultura popular, folclore, usos e costumes"],
["AN05","Religião","doutrina, teologia, prática religiosa"],
["AN06","Antropologia","antropologia física, etnografia, etnologia"],
["AN07","Sociologia","urbana, rural, política, econômica, do trabalho, da educação, do direito"]
]],
["Assentamentos Humanos",[
["AH01","Assentamentos Humanos","povoamento, núcleo populacional, assentamento rural, urbano, cinturão verde"],
["AH02","Cidade","metrópole, região metropolitana, rurópolis"],
["AH03","Organização Territorial","organização do espaço, rede urbana, conurbação"],
["AH04","Políticas de Assentamento Humano","política demográfica, migratória, planejamento familiar, política urbana"],
["AH05","População","distribuição, mobilidade, migração, dinâmica populacional"],
["AH06","Disciplinas Auxiliares","demografia, geografia urbana, agrária, teoria dos limiares"]
]],
["Biologia",[
["BL01","Biologia","ser vivo, biometria, bioclimatologia, parasitologia, filogenia, histologia, limnologia"],
["BL02","Genética","citogenética, engenharia genética, hereditariedade, melhoramento genético"],
["BL03","Citologia","biologia celular, célula, meiose"],
["BL04","Microbiologia","bacteriologia, virologia, biogeografia"],
["BL05","Anatomia","sistema cardiovascular, digestivo, tegumentar, embriologia"],
["BL06","Fisiologia","nascimento, digestão, reprodução, metabolismo"],
["BL07","Bioquímica","aminoácido, proteína, hormônio, biossíntese, fermentação"],
["BL08","Biofísica","bioenergética, biomecânica, eletrofisiologia"]
]],
["Botânica",[
["BT01","Botânica","fitologia, vegetal, morfologia, fisiologia vegetal, biologia floral"],
["BT02","Fitogeografia","caatinga, cerrado, campo, mangue"],
["BT03","Botânica Econômica","planta condimentícia, aromática, têxtil, cereal, hortaliça"],
["BT04","Botânica Sistemática","taxonomia vegetal"]
]],
["Conhecimento e Comunicação",[
["CO01","Filosofia","metafísica, estética, ética, teoria do conhecimento, lógica"],
["CO02","Ciência","ciências humanas, sociais, naturais, biológicas; política científica; metodologia científica"],
["CO03","Ciências da Linguagem","linguística, sociolinguística, linguagem natural e artificial"],
["CO04","Comunicação","comunicação de massa, propaganda, relações públicas, radiocomunicação, imprensa, editoração"],
["CO05","Arte","criação artística, patrimônio artístico, fotografia, cinema, música, literatura"],
["CO06","História","política, econômica, social; arqueologia, numismática, genealogia, patrimônio histórico"]
]],
["Construção Civil",[
["CC01","Construção","construção civil habitacional, comercial, industrial, pré-fabricada"],
["CC02","Processo Construtivo","tradicional, alvenaria, concreto, máquina de construção"],
["CC03","Organização da Construção","licitação de obra, custo da construção, gerência de projeto, fiscalização"],
["CC04","Obra Pública","engenharia civil, contrato de obra pública, obra de grande porte"],
["CC05","Estrutura","cálculo estrutural, tipo de estrutura: concreto, aço, metálico, armadura"],
["CC06","Edificação","prédio, edifício, fundação, pilar, viga, manutenção da construção"],
["CC07","Tecnologia da Construção","ancoragem, concretagem, escoramento, terraplanagem, pavimentação"],
["CC08","Higiene das Construções","ventilação, iluminação, conforto térmico, isolamento acústico"],
["CC09","Engenharia Hidráulica","obra hidráulica, tubulação, canal, reservatório, barragem, drenagem"],
["CC10","Solo (construção)","mecânica das rochas e dos solos, aterro, escavação, obra de contenção"]
]],
["Direito",[
["DI01","Legislação","federal, estadual, municipal; hermenêutica jurídica; proteção legal"],
["DI02","Direito Constitucional","poder constituinte, organização nacional, direitos políticos, direito eleitoral"],
["DI03","Outras Disciplinas do Direito","previdenciário, ecológico, urbanístico, tributário, penal, civil, do trabalho, comercial, industrial"]
]],
["Ecologia",[
["EL01","Ecologia","biosfera, relação biótica e abiótica, ecologia agrícola, aquática, florestal"],
["EL02","Ecofisiologia","ecofisiologia animal e vegetal"],
["EL03","Ecologia Humana","ecodesenvolvimento, ecologia social, ecologia urbana"],
["EL04","Ecologia Vegetal/Animal","autoecologia, sinecologia, habitat, vida selvagem"],
["EL05","Etologia","migração, hibernação, comportamento animal e vegetal"]
]],
["Economia",[
["EC01","Economia","teoria econômica, metodologia da economia, sistema econômico"],
["EC02","Análise Microeconômica","teoria da oferta, da produção, dos custos, da demanda, do preço"],
["EC03","Teoria Microeconômica","demanda agregada, oferta agregada, nível de emprego"],
["EC04","Atividade Econômica","setores primário, secundário, terciário; distribuição da renda, investimento"],
["EC05","Contabilidade Nacional","conta nacional, PIB, PNB, renda nacional, insumo-produto"],
["EC06","Economia Monetária","moeda, sistema monetário, reforma monetária"],
["EC07","Mercado","demanda, oferta, mercado consumidor, externo, interno, internacional"],
["EC08","Bens Econômicos","bens de consumo, de capital, duráveis, não duráveis"],
["EC09","Engenharia/Dinâmica Econômica","análise custo-benefício, ciclo econômico, inflação, deflação"],
["EC10","Economia Regional","economia local, urbana, regionalização"],
["EC11","Propriedade","propriedade do capital, da terra, estrutura agrária, loteamento"],
["EC12","Economia Internacional","balanço de pagamentos, câmbio, dívida externa, integração econômica"],
["EC13","Política Econômica","fiscal, monetária, de crédito, de comércio exterior, de preços"],
["EC14","Empresa","tipos de empresa: pública, privada, multinacional; holding, joint-venture"]
]],
["Educação",[
["ED01","Ensino Regular","pré-escolar, 1º grau, 2º grau, superior, pós-graduação"],
["ED02","Ensino Supletivo","alfabetização, aprendizagem, curso de atualização e treinamento"],
["ED03","Instituição/Administração de Ensino","escola, universidade, evasão escolar, método de ensino, didática"],
["ED04","Formas de Ensino / Material Instrucional","ensino direto, teleducação, radioeducação, material audiovisual"],
["ED05","Currículo","currículo ou programa de ensino, corpo docente e discente, graus e diplomas"],
["ED06","Educação","pedagogia, sistema educacional, rede de ensino, política educacional"]
]],
["Energia",[
["EN01","Energia","política energética, economia energética, consumo de energia"],
["EN02","Recursos/Serviços/Formas de Energia","hidrelétricos, carboníferos, petrolíferos, energia elétrica, térmica"],
["EN03","Combustível","fóssil, vegetal, biomassa, nuclear, sólido, líquido, gasoso"],
["EN04","Tecnologia e Energia","fonte convencional/alternativa, geração, distribuição, engenharia elétrica"],
["EN05","Engenharia Eletrônica","microeletrônica, circuito eletrônico, semicondutor"],
["EN06","Engenharia Nuclear","tecnologia de reatores, reator nuclear"]
]],
["Finanças",[
["FN01","Finanças Públicas","receita pública, orçamento público, sistema tributário, despesa pública"],
["FN02","Finanças Privadas",""],
["FN03","Sistema Financeiro","instituição financeira, operações de crédito, mercado de capitais"],
["FN04","Recursos/Orçamento/Instrumentos","orçamento, título de crédito, ação, cartão de crédito, financiamento"],
["FN05","Administração Financeira","juro, crédito, débito, planejamento e controle financeiro"],
["FN06","Contabilidade","financeira, gerencial, técnicas contábeis, balancete, depreciação"]
]],
["Física e Química",[
["FQ01","Física das Partículas","matéria, estados da matéria, partícula elementar, ionização"],
["FQ02","Acústica/Ótica","onda sonora, som, luz, ótica geométrica e física"],
["FQ03","Onda","amplitude, difração, frequência, modulação, reflexão, refração, ressonância"],
["FQ04","Metrologia","unidade de medida, dimensão, sistema de medida, medição"],
["FQ05","Mecânica","estática, dinâmica, cinemática, força, densidade, massa, trabalho"],
["FQ06","Física dos Sólidos/Fluídos/Plasmas","mecânica dos sólidos e fluídos, hidromecânica, plasma-física"],
["FQ07","Termodinâmica","calor, calorimetria, temperatura, radiação térmica"],
["FQ08","Eletrônica","quântica, linear, não linear"],
["FQ09","Magnetismo/Eletromagnetismo","campo magnético, onda eletromagnética, micro-onda"],
["FQ10","Física de Superfície/Dispersão","tensão superficial, capilaridade, física coloidal"],
["FQ11","Radiação","efeito da radiação, radiação atmosférica, radiação ionizante"],
["FQ12","Espectroscopia","espectrografia, espectrometria, espectrofotometria"],
["FQ13","Física Molecular","física atômica, reação nuclear, estrutura molecular, radiatividade"],
["FQ14","Química","composto químico, propriedade química, reação química, polímero"],
["FQ15","Química Analítica / dos Polímeros","calorimetria, cromatografia, polímero orgânico e inorgânico"],
["FQ16","Físico-Química","análise físico-química, processos físico-químicos"],
["FQ17","Química Orgânica","composto orgânico, ácido, sal"],
["FQ18","Química Inorgânica","elemento químico, metal, composto inorgânico, nuclídeo"]
]],
["Geografia e Cartografia",[
["GC01","Geografia Física","fisiografia, geomorfologia, acidente geográfico"],
["GC02","Geografia Humana","antropogeografia, geografia econômica, política, da população"],
["GC03","Geografia Regional","região homogênea, zona geográfica"],
["GC04","Orientação Geográfica","pontos cardeais, colaterais, hemisfério"],
["GC05","Geodesia","astronômica, espacial, gravimétrica, levantamento geodésico"],
["GC06","Topografia","topometria, planimetria, altimetria, sensoriamento remoto"],
["GC07","Fotogrametria","fotogrametria terrestre, aerofotogrametria"],
["GC08","Mapeamento","mapa, carta, fotocarta, mosaico"],
["GC09","Métodos e Processos de Cartografia","processo astrogeodésico, método das direções"],
["GC10","Plano Cartográfico","azimute, ponto meridiano, paralelo, polo geográfico"]
]],
["Geologia",[
["GL01","Geologia Física","intemperismo, erosão, tectonismo, geologia estrutural"],
["GL02","Glaciologia","criologia, glaciação, moraina"],
["GL03","Geotectônica","tectônica, geodinâmica, sismologia"],
["GL04","Geologia Marinha","fotogeologia, mapeamento geológico"],
["GL05","Geologia Histórica","paleontologia, sedimentologia, estratigrafia"],
["GL06","Geologia Econômica","petrologia, petrografia, jazida mineral, prospecção, mineralogia"],
["GL07","Geoquímica / Hidrogeologia / Geofísica / Geotécnica","geoquímica dos solos e rochas, água subterrânea, ensaio geotécnico"]
]],
["Habitação",[
["HB01","Habitação","moradia, função habitacional, mercado e política habitacional"],
["HB02","Tipologia Habitacional","unifamiliar, multifamiliar, habitação provisória"]
]],
["Hidrologia e Oceanografia",[
["HD01","Hidrologia","água, ciclo hidrológico"],
["HD02","Hidrografia","bacia hidrográfica, curso de água, bacia lacustre"],
["HD03","Hidrometria","fluviometria, pluviometria, estação hidrométrica"],
["HD04","Oceanografia","oceano, mar; física, química, biológica, geológica, batimetria"]
]],
["Indústria",[
["IN01","Indústria","política industrial, produção industrial, empresa industrial"],
["IN02","Tecnologia","política tecnológica, cooperação técnica, inovação tecnológica"],
["IN03","Engenharia","desenho técnico, engenharia metalúrgica, química, mecânica, automotiva, aeronáutica"],
["IN04","Indústria Extrativa Mineral","política mineral, mineração, extrativismo mineral"],
["IN05","Indústria de Transformação","manufatureira, industrialização, gênero da indústria: metalúrgica, química, têxtil"]
]],
["Informação",[
["IF01","Informação","científica, tecnológica, bibliográfica, estratégica, dados"],
["IF02","Documentação","processamento, armazenamento, recuperação, disseminação, bibliometria"],
["IF03","Reprografia","fotocópia, microfotografia, microfilmagem"],
["IF04","Documento","informação registrada, documento científico, confidencial, obra de referência"],
["IF05","Biblioteconomia","administração de biblioteca, processos técnicos"],
["IF06","Arquivologia","arquivística, administração de arquivos"],
["IF07","Ciência da Informação","sistema de informação, rede de informação, fluxo de informação"],
["IF08","Serviços de Informação","biblioteca, centro de documentação, arquivo, museu"],
["IF09","Uso da Informação","usuário, estudo e perfil do usuário"],
["IF10","Genérico (Informação)","processamento de dados"]
]],
["Matemática",[
["MT01","Lógica Matemática","metamatemática, método e processo matemático, teoria lógica"],
["MT02","Álgebra","teoria dos conjuntos, teoria dos números, estrutura algébrica"],
["MT03","Geometria","geometria plana, sólida, analítica, trigonometria, descritiva"],
["MT04","Análise Matemática","topologia, análise real, numérica, complexa, vetorial, funcional"],
["MT05","Cálculo","diferencial, integral, operacional, vetorial, matricial, numérico"],
["MT06","Matemática Aplicada","modelo matemático, estatística, probabilidade, pesquisa operacional, matemática atuarial"]
]],
["Meio Ambiente",[
["MA01","Meio Ambiente","artificial, natural, política do meio ambiente"],
["MA02","Recursos Naturais","conservação, recursos renováveis e não renováveis, área protegida"],
["MA03","Poluição","atmosférica, do solo, da água, química, radioativa, sonora"],
["MA04","Qualidade Ambiental","qualidade da água e do ar, monitoramento ambiental, engenharia ambiental"]
]],
["Meteorologia e Climatologia",[
["ME01","Metodologia (Meteorologia)","física, dinâmica, aplicada"],
["ME02","Atmosfera","circulação e pressão atmosférica, previsão meteorológica, vento, radiação solar"],
["ME03","Climatologia","clima, aclimatação, agroclimatologia, tipos de clima"]
]],
["Pedologia",[
["PD01","Pedologia","ciência do solo; solo mineral ou orgânico"],
["PD02","Pedogênese","formação do solo, morfopedologia, química e biologia do solo"],
["PD03","Tipos de Solo",""]
]],
["Política",[
["PL01","Ciência Política","teoria política, metodologia política"],
["PL02","Política","sistema político, Estado, soberania, formas de governo, regime político"]
]],
["Previdência e Assistência Social",[
["PR01","Previdência","seguridade social, previdência social e privada"],
["PR02","Benefícios Previdenciários","aposentadoria, auxílio, pecúlio, abono"],
["PR03","Assistência Social","médica, odontológica, alimentar, habitacional, serviço social"]
]],
["Psicologia",[
["PS01","Psicologia","comportamento, psicologia social, aplicada, clínica, educacional"],
["PS02","Comportamento","conduta humana, motivação"],
["PS03","Teoria Psicológica","behaviorismo, psicologia existencialista"]
]],
["Saneamento",[
["SM01","Saneamento","engenharia sanitária, saneamento básico"],
["SM02","Resíduo","lixo, resíduo gasoso, líquido, orgânico, químico, tóxico"],
["SM03","Limpeza","limpeza pública, drenagem urbana, coleta e destinação de lixo"],
["SM04","Abastecimento de Água","captação, adução, tratamento, reservatório, distribuição"],
["SM05","Esgoto","serviço de esgoto sanitário e industrial, tratamento"]
]],
["Saúde",[
["SD01","Saúde","política de saúde, higiene, saúde física, mental, pública"],
["SD02","Administração Sanitária","serviços de saúde, hospital, sistema de saúde, educação sanitária"],
["SD03","Doença","congênita, infecciosa, do sistema reprodutor, do sistema glandular"],
["SD04","Deficiência Física","física, mental"],
["SD05","Assistência Médica","hospitalar, domiciliar, ambulatorial"],
["SD06","Terapia e Diagnóstico","fisioterapia, hemoterapia, diagnóstico laboratorial e radiológico"],
["SD07","Medicina","alopática, homeopática, preventiva, tropical, nuclear, legal, de urgência"],
["SD08","Especialidades Médicas","cardiologia, endocrinologia, epidemiologia, ginecologia, psiquiatria, radiologia"],
["SD09","Engenharia Biomédica","bioengenharia, biotecnologia, enfermagem, fonoaudiologia"],
["SD10","Farmacologia","assistência farmacêutica, toxicologia, medicamento"],
["SD11","Odontologia","saúde oral, periodontia, prótese dentária"]
]],
["Serviços",[
["SV01","Serviços","públicos: telefonia, correio, energia elétrica; privados: alojamento, reparo, vigilância"],
["SV02","Seguro","social, privado, pessoal, patrimonial, contrato de seguro"],
["SV03","Comércio","interno, exterior, comercialização, corretagem, mercadoria, zona franca"],
["SV04","Turismo","política de turismo, intercâmbio turístico, agência de turismo"]
]],
["Telecomunicações",[
["TC01","Telecomunicações","política de telecomunicações, modelo de telecomunicações"],
["TC02","Sistemas de Telecomunicações","radiocomunicação, televisão, telefonia, radar, transmissão de dados"],
["TC03","Engenharia de Telecomunicações","linha de comunicação, recepção, transmissão"],
["TC04","Serviços/Redes de Telecomunicações","serviços, redes, estações e material"]
]],
["Trabalho",[
["TB01","Trabalho","intelectual, técnico, manual, mecanizado, rural, doméstico"],
["TB02","Recursos Humanos","desenvolvimento de RH, pessoal trabalhador, classe trabalhadora"],
["TB03","Mercado de Trabalho","política empregatícia, salarial, desemprego, subemprego"],
["TB04","Condições de Trabalho","ergonomia, ambiente de trabalho"],
["TB05","Estrutura Ocupacional","ocupação, profissão liberal, sindicato, emprego, cargo"],
["TB06","Lazer","recreação, colônia de férias"]
]],
["Transporte",[
["TP01","Transporte","política de transporte, planejamento de transporte"],
["TP02","Sistema de Transporte","doméstico, regional, urbano, integrado; infraestrutura de transporte"],
["TP03","Serviços de Transporte","transporte de carga, de passageiro, linha de transporte"],
["TP04","Engenharia de Transporte","de tráfego, aeronáutica, ferroviária, rodoviária, naval, automotiva"],
["TP05","Modalidades de Transporte","aéreo, terrestre, hidroviário, dutoviário, vertical"]
]],
["Urbanismo",[
["UB01","Urbanismo","organização do espaço urbano, projeto urbanístico, planejamento urbano"],
["UB02","Solo Urbano","imóvel urbano, parcelamento do solo, cadastro imobiliário, tributação urbana"],
["UB03","Área Urbana","zona urbana, estrutura urbana, uso do solo, zoneamento urbano"],
["UB04","Circulação Urbana","via de circulação, terminal de transporte, tráfego urbano"],
["UB05","Arquitetura","projeto de arquitetura, doméstica, industrial, institucional, de interiores"]
]]
];

var TIPO_PROGRAMA_GRUPOS = [
["Sistemas Operacionais",[
["SO01","Sistema Operacional",""],
["SO02","Interface de Entrada e Saída",""],
["SO03","Interface Básica de Disco",""],
["SO04","Interface de Comunicação",""],
["SO05","Gerenciador de Usuários",""],
["SO06","Administrador de Dispositivos",""],
["SO07","Controlador de Processos",""],
["SO08","Controlador de Redes",""],
["SO09","Processador de Comandos",""]
]],
["Linguagens",[
["LG01","Linguagens",""],
["LG02","Compilador",""],
["LG03","Montador",""],
["LG04","Pré-Compilador",""],
["LG05","Compilador Cruzado",""],
["LG06","Pré-Processador",""],
["LG07","Interpretador",""],
["LG08","Linguagem Procedural",""],
["LG09","Linguagem Não Procedural",""]
]],
["Gerenciamento de Informações",[
["GI01","Gerenciador de Informações",""],
["GI02","Gerenciador de Banco de Dados",""],
["GI03","Gerador de Telas",""],
["GI04","Gerador de Relatórios",""],
["GI05","Dicionário de Dados",""],
["GI06","Entrada e Validação de Dados",""],
["GI07","Organização, Tratamento e Manutenção de Arquivos",""],
["GI08","Recuperação de Dados",""]
]],
["Comunicação de Dados",[
["CD01","Comunicação de Dados",""],
["CD02","Emuladores de Terminais",""],
["CD03","Monitores de Teleprocessamento",""],
["CD04","Gerenciador de Dispositivos e Periféricos",""],
["CD05","Gerenciador de Rede de Comunicação de Dados",""],
["CD06","Rede Local",""]
]],
["Ferramentas de Apoio",[
["FA01","Ferramenta de Apoio",""],
["FA02","Processadores de Texto",""],
["FA03","Planilhas Eletrônicas",""],
["FA04","Geradores de Gráficos",""]
]],
["Suporte ao Desenvolvimento de Sistemas",[
["DS01","Ferramentas de Suporte ao Desenvolvimento de Sistemas",""],
["DS02","Gerador de Aplicações",""],
["DS03","CASE","Computer Aided Software Engineering"],
["DS04","Desenvolvido conforme Metodologia Determinada",""],
["DS05","Bibliotecas de Rotinas","libraries"],
["DS06","Apoio à Programação",""],
["DS07","Suporte à Documentação",""],
["DS08","Conversor de Sistemas",""]
]],
["Avaliação",[
["AV01","Avaliação de Desempenho",""],
["AV02","Contabilização de Recursos",""]
]],
["Segurança e Proteção de Dados",[
["PD01","Segurança e Proteção de Dados",""],
["PD02","Senha",""],
["PD03","Criptografia",""],
["PD04","Manutenção da Integridade dos Dados",""],
["PD05","Controle de Acessos",""]
]],
["Simulação e Modelagem",[
["SM01","Simulação e Modelagem",""],
["SM02","Simulador","voo, carro, submarino"],
["SM03","Simuladores de Ambiente Operacional",""],
["SM04","CAE/CAD/CAM","CAE/CAD/CAM/CAL/CBT"]
]],
["Inteligência Artificial",[
["IA01","Inteligência Artificial",""],
["IA02","Sistemas Especialistas",""],
["IA03","Processamento de Linguagem Natural",""]
]],
["Instrumentação",[
["IT01","Instrumentação",""],
["IT02","Instrumentação de Teste e Medição",""],
["IT03","Instrumentação Biomédica",""],
["IT04","Instrumentação Analítica",""]
]],
["Automação",[
["AT01","Automação",""],
["AT02","Automação de Escritório",""],
["AT03","Automação Comercial",""],
["AT04","Automação Bancária",""],
["AT05","Automação Industrial",""],
["AT06","Controle de Processos",""],
["AT07","Automação da Manufatura","controle numérico computadorizado, robótica"],
["AT08","Eletrônica Automotiva","computador de bordo, injeção e ignição eletrônica"]
]],
["Teleinformática",[
["TI01","Teleinformática",""],
["TI02","Terminais",""],
["TI03","Transmissão de Dados",""],
["TI04","Comutação de Dados",""]
]],
["Comutação Telefônica",[
["CT01","Comutação Telefônica e Telegráfica",""],
["CT02","Implementador de Funções Adicionais",""],
["CT03","Gerenciador de Operação e Manutenção",""],
["CT04","Terminal de Operação e Manutenção de Central",""]
]],
["Utilitários",[
["UT01","Utilitários",""],
["UT02","Compressor de Dados",""],
["UT03","Conversor de Meios de Armazenamento",""],
["UT04","Classificador/Intercalador",""],
["UT05","Controlador de Spool",""],
["UT06","Transferência de Arquivos",""]
]],
["Aplicativos",[
["AP01","Aplicativos",""],
["AP02","Planejamento",""],
["AP03","Controle",""],
["AP04","Auditoria",""],
["AP05","Contabilização",""]
]],
["Aplicações Técnico-Científicas",[
["TC01","Aplicações Técnico-Científicas",""],
["TC02","Pesquisa Operacional",""],
["TC03","Reconhecimento de Padrões",""],
["TC04","Processamento de Imagem",""]
]],
["Entretenimento",[
["ET01","Entretenimento",""],
["ET02","Jogos Animados","arcade games"],
["ET03","Geradores de Desenhos",""],
["ET04","Simuladores Destinados ao Lazer",""]
]]
];

var QUALIFICACAO_GRUPOS_RAW = [
  ["Estudante de Graduação","Relacionadas com Instituições de Ensino"],
  ["Estudante de Mestrado","Relacionadas com Instituições de Ensino"],
  ["Estudante de Doutorado","Relacionadas com Instituições de Ensino"],
  ["Técnico","Relacionadas com Instituições de Ensino"],
  ["Ensino Médio","Relacionadas com Instituições de Ensino"],
  ["Ensino Fundamental","Relacionadas com Instituições de Ensino"],
  ["Instrutor e professor de escolas livres","Relacionadas com Instituições de Ensino"],
  ["Pedagogo, orientador educacional","Relacionadas com Instituições de Ensino"],
  ["Pesquisador","Relacionadas com Instituições de Ensino"],
  ["Professor do ensino fundamental","Relacionadas com Instituições de Ensino"],
  ["Professor do ensino médio","Relacionadas com Instituições de Ensino"],
  ["Professor do ensino profissional","Relacionadas com Instituições de Ensino"],
  ["Professor do ensino superior","Relacionadas com Instituições de Ensino"],
  ["Professor na educação infantil","Relacionadas com Instituições de Ensino"],
  ["Advogado","Demais Qualificações"],
  ["Advogado do setor público, Procurador da Fazenda, Consultor Jurídico, Procurador de autarquias e fundações públicas, Defensor Público","Demais Qualificações"],
  ["Agente de Bolsa de Valores, câmbio e outros serviços financeiros","Demais Qualificações"],
  ["Agente e representante comercial, corretor, leiloeiro e afins","Demais Qualificações"],
  ["Agrônomo e afins","Demais Qualificações"],
  ["Analista de sistemas, desenvolvedor de software, administrador de redes e bancos de dados e outros especialistas em informática (exceto técnico)","Demais Qualificações"],
  ["Antropólogo e arqueólogo","Demais Qualificações"],
  ["Apresentador, artista de artes populares e modelo","Demais Qualificações"],
  ["Assistente social e economista doméstico","Demais Qualificações"],
  ["Atleta, desportista e afins","Demais Qualificações"],
  ["Ator, diretor de espetáculos","Demais Qualificações"],
  ["Bancário, economiário, escriturário, secretário, assistente e auxiliar administrativo","Demais Qualificações"],
  ["Bibliotecário, documentalista, arquivólogo, museólogo","Demais Qualificações"],
  ["Biólogo, biomédico e afins","Demais Qualificações"],
  ["Bombeiro Militar","Demais Qualificações"],
  ["Cantor e compositor","Demais Qualificações"],
  ["Cenógrafo, decorador de interiores","Demais Qualificações"],
  ["Cientista de Dados","Demais Qualificações"],
  ["Cinegrafista, fotógrafo e outros técnicos em operação de máquinas de tratamento de dados","Demais Qualificações"],
  ["Comissário de bordo, guia de turismo, agente de viagem e afins","Demais Qualificações"],
  ["Condutor e operador de robôs, veículos e equipamentos de movimentação de carga e afins","Demais Qualificações"],
  ["Decorador e vitrinista","Demais Qualificações"],
  ["Delegado de Polícia e outros servidores das carreiras de polícia, exceto militar","Demais Qualificações"],
  ["Desenhista industrial (designer), escultor, pintor artístico e afins","Demais Qualificações"],
  ["Desenhista técnico e modelista","Demais Qualificações"],
  ["Diplomata e afins","Demais Qualificações"],
  ["Dirigente, presidente e diretor de empresa industrial, comercial ou prestadora de serviços","Demais Qualificações"],
  ["Dirigente ou administrador de partido político, organização patronal, sindical, filantrópica e religiosa","Demais Qualificações"],
  ["Dirigente superior da administração pública (ocupante de cargo de direção, chefia, assessoria e de natureza especial), inclusive os das fundações públicas e autarquias","Demais Qualificações"],
  ["Economista, administrador, contador, auditor e afins","Demais Qualificações"],
  ["Empresário e produtor de espetáculos","Demais Qualificações"],
  ["Enfermeiro de nível superior, nutricionista, farmacêutico e afins","Demais Qualificações"],
  ["Engenheiro, arquiteto e afins","Demais Qualificações"],
  ["Escritor, crítico, redator","Demais Qualificações"],
  ["Filósofo","Demais Qualificações"],
  ["Físico, químico, meteorologista, geólogo, oceanógrafo e afins","Demais Qualificações"],
  ["Fonoaudiólogo, fisioterapeuta, terapeuta ocupacional e afins","Demais Qualificações"],
  ["Geógrafo","Demais Qualificações"],
  ["Gerente ou supervisor de empresa industrial, comercial ou prestadora de serviços","Demais Qualificações"],
  ["Gerente ou supervisor de empresa pública e sociedade de economia mista","Demais Qualificações"],
  ["Historiador","Demais Qualificações"],
  ["Joalheiro, vidreiro, ceramista e afins","Demais Qualificações"],
  ["Jornalista e repórter","Demais Qualificações"],
  ["Locutor, comentarista","Demais Qualificações"],
  ["Matemático, estatístico, atuário e afins","Demais Qualificações"],
  ["Médico","Demais Qualificações"],
  ["Membro do Ministério Público (Procurador e Promotor)","Demais Qualificações"],
  ["Membro do Poder Executivo (Presidente da República, Vice-Presidente da República, Ministro de Estado, Governador, Vice-Governador, Prefeito, Vice-Prefeito)","Demais Qualificações"],
  ["Membro do Poder Judiciário (Ministro, Juiz e Desembargador) e de Tribunal de Contas (Ministro e Conselheiro)","Demais Qualificações"],
  ["Membro do Poder Legislativo (Senador, Deputado Federal, Deputado Estadual e Vereador)","Demais Qualificações"],
  ["Militar da Aeronáutica","Demais Qualificações"],
  ["Militar da Marinha","Demais Qualificações"],
  ["Militar do Exército","Demais Qualificações"],
  ["Montador de aparelhos e instrumentos de precisão e musicais","Demais Qualificações"],
  ["Motorista e condutor do transporte de passageiros (motorista de táxi, ônibus, pequena embarcação etc.)","Demais Qualificações"],
  ["Músico, arranjador, regente de orquestra ou coral","Demais Qualificações"],
  ["Odontólogo","Demais Qualificações"],
  ["Operador de instalações de produção e distribuição de energia","Demais Qualificações"],
  ["Operador de máquina agropecuária e florestal","Demais Qualificações"],
  ["Outras ocupações não especificadas anteriormente","Demais Qualificações"],
  ["Outros profissionais do espetáculo e das artes","Demais Qualificações"],
  ["Outros técnicos de nível médio","Demais Qualificações"],
  ["Outros técnicos de nível médio das ciências físicas, químicas, engenharia e afins","Demais Qualificações"],
  ["Outros trabalhadores de serviços diversos","Demais Qualificações"],
  ["Pescador, caçador e extrativista florestal","Demais Qualificações"],
  ["Piloto de aeronaves, comandante de embarcações e oficiais de máquinas","Demais Qualificações"],
  ["Policial Militar","Demais Qualificações"],
  ["Presidente, diretor, gerente e supervisor de organismo internacional e de organização não-governamental","Demais Qualificações"],
  ["Presidente e diretor de empresa pública e sociedade de economia mista","Demais Qualificações"],
  ["Produtor na exploração agropecuária","Demais Qualificações"],
  ["Profissional da educação física (exceto professor)","Demais Qualificações"],
  ["Profissional de marketing, de publicidade e de comercialização","Demais Qualificações"],
  ["Psicólogo e psicanalista","Demais Qualificações"],
  ["Sacerdote ou membro de ordens ou seitas religiosas","Demais Qualificações"],
  ["Servidor das carreiras de auditoria fiscal e de fiscalização","Demais Qualificações"],
  ["Servidor das carreiras de ciência e tecnologia","Demais Qualificações"],
  ["Servidor das carreiras de gestão governamental, analista, gestor e técnico de planejamento","Demais Qualificações"],
  ["Servidor das carreiras do Banco Central, CVM e Susep","Demais Qualificações"],
  ["Servidor das carreiras do Ministério Público","Demais Qualificações"],
  ["Servidor das carreiras do Poder Judiciário, Oficial de Justiça, Auxiliar, Assistente e Analista Judiciário","Demais Qualificações"],
  ["Servidor das carreiras do Poder Legislativo","Demais Qualificações"],
  ["Servidor das demais carreiras da administração pública direta, autárquica e fundacional","Demais Qualificações"],
  ["Sociólogo e cientista político","Demais Qualificações"],
  ["Técnico da ciência da saúde animal","Demais Qualificações"],
  ["Técnico da ciência da saúde humana","Demais Qualificações"],
  ["Técnico da produção agropecuária","Demais Qualificações"],
  ["Técnico das ciências administrativas e contábeis","Demais Qualificações"],
  ["Técnico de bioquímica e da biotecnologia","Demais Qualificações"],
  ["Técnico de conservação, dissecação e empalhamento de corpos","Demais Qualificações"],
  ["Técnico de inspeção, fiscalização e coordenação administrativa","Demais Qualificações"],
  ["Técnico de laboratório, Raios-X e outros equipamentos e instrumentos de diagnóstico","Demais Qualificações"],
  ["Técnico de serviços culturais","Demais Qualificações"],
  ["Técnico em biologia","Demais Qualificações"],
  ["Técnico em ciências físicas e químicas","Demais Qualificações"],
  ["Técnico em construção civil, de edificações e obras de infra-estrutura","Demais Qualificações"],
  ["Técnico em eletro-eletrônica e fotônica","Demais Qualificações"],
  ["Técnico em informática","Demais Qualificações"],
  ["Técnico em metalmecânica","Demais Qualificações"],
  ["Técnico em mineralogia e geologia","Demais Qualificações"],
  ["Técnico em navegação aérea, marítima, fluvial e metroferroviária","Demais Qualificações"],
  ["Técnico em operação de aparelhos de sonorização, cenografia e projeção","Demais Qualificações"],
  ["Técnico em operação de estações de rádio e televisão","Demais Qualificações"],
  ["Técnico em transportes (logística)","Demais Qualificações"],
  ["Titular de Cartório","Demais Qualificações"],
  ["Trabalhador da fabricação de alimentos, bebidas, fumo e de agroindústrias","Demais Qualificações"],
  ["Trabalhador da fabricação e instalação eletro-eletrônica","Demais Qualificações"],
  ["Trabalhador da indústria extrativa e da construção civil","Demais Qualificações"],
  ["Trabalhador das indústrias de madeira e do mobiliário","Demais Qualificações"],
  ["Trabalhador das indústrias química, petroquímica, borracha e plástico e afins","Demais Qualificações"],
  ["Trabalhador das indústrias têxteis, do curtimento, do vestuário e das artes gráficas","Demais Qualificações"],
  ["Trabalhador da transformação de metais e compósitos","Demais Qualificações"],
  ["Trabalhador de atendimento ao público, caixa, despachante, recenseador e afins","Demais Qualificações"],
  ["Trabalhador de instalações e máquinas de fabricação de celulose e papel","Demais Qualificações"],
  ["Trabalhador de instalações siderúrgicas e de materiais de construção","Demais Qualificações"],
  ["Trabalhador de outras instalações agroindustriais","Demais Qualificações"],
  ["Trabalhador de reparação e manutenção","Demais Qualificações"],
  ["Trabalhador dos serviços de administração, conservação e manutenção de edifícios","Demais Qualificações"],
  ["Trabalhador dos serviços de embelezamento e cuidados pessoais","Demais Qualificações"],
  ["Trabalhador dos serviços de hotelaria e alimentação","Demais Qualificações"],
  ["Trabalhador dos serviços de proteção e segurança (exceto militar)","Demais Qualificações"],
  ["Trabalhador dos serviços de saúde","Demais Qualificações"],
  ["Trabalhador dos serviços domésticos em geral","Demais Qualificações"],
  ["Trabalhador na exploração agropecuária","Demais Qualificações"],
  ["Tradutor, intérprete, filólogo","Demais Qualificações"],
  ["Vendedor e prestador de serviços do comércio, ambulante, caixeiro-viajante e camelô","Demais Qualificações"],
  ["Veterinário, patologista (veterinário) e zootecnista","Demais Qualificações"]
];
