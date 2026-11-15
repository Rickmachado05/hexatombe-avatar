import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { exportarFichaPdf } from "./pdf/exportarFichaPdf";
import {
  novaExploracao, migrarAtivas, migrarPassiva, validaConstrucao
} from "./impeto/habilidades";
import type { Perfil, Ativa, Passiva, Exploracao } from "./impeto/habilidades";
import { CombateImpeto, ExploracaoImpeto, ResumoHabilidadesImpeto } from "./impeto/HabilidadesEditor";
import "./HexatombePdf.css";
import "./App.css";
import "./LayoutAbas.css";
import "./TemaHexatombe.css";
import "./HexatombeHomeRitual.css";
import "./HexatombeEditorIdentidade.css";
import "./HexatombeTemasElementais.css";
import "./HexatombeCombate.css";
import "./HexatombeHabilidades.css";
import "./HexatombePrevia.css";

type Elemento = "agua" | "terra" | "fogo" | "ar" | "neutro";
type PerfilLegadoTecnica = "Lutador" | "Linha de Frente" | "Conjurador";
type TipoHabilidade =
  | "Ofensiva"
  | "Ofensiva em área"
  | "Controle"
  | "Condição"
  | "Defesa"
  | "Buff"
  | "Cura"
  | "Utilidade";

type TipoAcao = "Principal" | "Buff" | "Pré-combate";
type ModeloId =
  | "golpe"
  | "area"
  | "imobilizar"
  | "empurrar"
  | "escudo"
  | "reducao"
  | "ca"
  | "buffDano"
  | "buffAcerto"
  | "buffIniciativa"
  | "cura"
  | "curaArea"
  | "movimento"
  | "danoContinuo"
  | "criarArma"
  | "encantarArma";

type Habilidade = {
  nome: string;
  modelo: ModeloId;
  alvos: 1 | 2;
  efeito: string;
  limitacoes: string;
  nomeCondicao: string;
  nomeArma: string;
};

type RegraModelo = {
  nome: string;
  tipo: TipoHabilidade;
  acao: TipoAcao;
  custo: number | Record<PerfilLegadoTecnica, number>;
  valor: string | Record<PerfilLegadoTecnica, string>;
  rotuloValor: string;
  valorAdicional?: string;
  rotuloAdicional?: string;
  maxAlvos: 1 | 2;
  regra: string;
  experimental?: boolean;
};

const elementos = [
  { id: "agua", nome: "Água", simbolo: "水", descricao: "Adaptação, equilíbrio e fluidez." },
  { id: "terra", nome: "Terra", simbolo: "土", descricao: "Resistência, firmeza e determinação." },
  { id: "fogo", nome: "Fogo", simbolo: "火", descricao: "Energia, transformação e vontade." },
  { id: "ar", nome: "Ar", simbolo: "气", descricao: "Liberdade, movimento e espiritualidade." },
  { id: "neutro", nome: "Não Dobrador", simbolo: "✦", descricao: "Disciplina, técnica e perseverança." },
] as const;

// Modelos de combate baseados nas fichas-piloto v1.0 e no guia v0.8.
// Escudo ATIVO é uma proposta de playtest, ainda não validada em mesa.
const regrasModelos: Record<ModeloId, RegraModelo> = {
  golpe: {
    nome: "Ataque forte (1 alvo)", tipo: "Ofensiva", acao: "Principal",
    custo: { Lutador: 25, "Linha de Frente": 25, Conjurador: 30 },
    valor: { Lutador: "3d8+7", "Linha de Frente": "2d8+6", Conjurador: "3d8+7" },
    rotuloValor: "Dano", maxAlvos: 1,
    regra: "Um alvo. Não aplica estados ou dano adicional automaticamente.",
  },
  area: {
    nome: "Ataque em área", tipo: "Ofensiva em área", acao: "Principal",
    custo: { Lutador: 35, "Linha de Frente": 30, Conjurador: 40 },
    valor: { Lutador: "2d8+5", "Linha de Frente": "2d6+4", Conjurador: "2d8+5" },
    rotuloValor: "Dano por alvo", maxAlvos: 2,
    regra: "No máximo 2 alvos agrupados; uma rolagem de acerto para cada um.",
  },
  imobilizar: {
    nome: "Imobilização", tipo: "Controle", acao: "Principal",
    custo: { Lutador: 20, "Linha de Frente": 20, Conjurador: 25 },
    valor: { Lutador: "2d6+6", "Linha de Frente": "1d8+6", Conjurador: "2d6+6" },
    rotuloValor: "Dano", maxAlvos: 1,
    regra: "Se acertar, impede deslocamento até o início do seu próximo turno. O alvo ainda pode atacar e usar técnicas.",
  },
  empurrar: {
    nome: "Empurrão", tipo: "Controle", acao: "Principal",
    custo: 20, valor: "1d8+6", rotuloValor: "Dano", maxAlvos: 1,
    regra: "Se acertar, reposiciona um alvo conforme o cenário. Sem dano de colisão ou queda automático.",
  },
  escudo: {
    nome: "Escudo temporário", tipo: "Defesa", acao: "Buff",
    custo: 15, valor: "1d8+3", rotuloValor: "Escudo", maxAlvos: 1,
    regra: "Concede pontos temporários de escudo a você ou um aliado. Até o início do seu próximo turno; não acumula com outro escudo: mantém-se apenas o maior.",
    experimental: true,
  },
  reducao: {
    nome: "Redução de dano", tipo: "Defesa", acao: "Buff",
    custo: 15, valor: "1d8+3", rotuloValor: "Redução de dano", maxAlvos: 1,
    regra: "Reduz o dano de um ataque recebido por você ou um aliado; expira no início do seu próximo turno.",
  },
  ca: {
    nome: "Proteção de CA", tipo: "Defesa", acao: "Buff",
    custo: 12, valor: "+2 CA", rotuloValor: "Defesa", maxAlvos: 1,
    regra: "Aplica a você, até o início do seu próximo turno. Não acumula com proteção do mesmo tipo.",
  },
  buffDano: {
    nome: "Reforço ofensivo", tipo: "Buff", acao: "Buff",
    custo: 10, valor: "+4 dano", rotuloValor: "Bônus", maxAlvos: 1,
    regra: "Aplica ao próximo ataque que acertar neste turno. Se errar ou não atacar, o bônus é perdido; não acumula.",
  },
  buffAcerto: {
    nome: "Precisão de combate (+2 acerto)", tipo: "Buff", acao: "Buff",
    custo: 12, valor: "+2 no d20 de acerto", rotuloValor: "Bônus de acerto", maxAlvos: 1,
    regra: "Aplica a você. Use como buff opcional antes de um ataque no seu turno. Some +2 à próxima rolagem de d20 para acertar a CA neste turno, consumindo o bônus mesmo se errar. Não reduz a CA do alvo, não concede ataque extra e não acumula com outros bônus de acerto. Crítico continua exigindo 20 natural.",
    experimental: true,
  },
  buffIniciativa: {
    nome: "Preparação de iniciativa (+2)", tipo: "Buff", acao: "Pré-combate",
    custo: 15, valor: "+2 na iniciativa", rotuloValor: "Bônus de iniciativa", maxAlvos: 1,
    regra: "Use e pague a EN somente antes de rolar a iniciativa de um combate iminente; escolha você ou um aliado presente. O alvo soma +2 ao d20 de iniciativa desse combate. Não acumula com outra Preparação de iniciativa para o mesmo alvo, não altera uma iniciativa já rolada e não pode ser usada durante o combate. Se não houver combate até o fim da cena, o efeito expira.",
    experimental: true,
  },
  cura: {
    nome: "Cura individual", tipo: "Cura", acao: "Principal",
    custo: 30, valor: "2d6+3 HP", rotuloValor: "Cura", maxAlvos: 1,
    regra: "Cura você ou um aliado, sem ultrapassar o HP máximo. Consome ação principal, não buff.",
  },
  curaArea: {
    nome: "Cura em área (até 2 aliados)", tipo: "Cura", acao: "Principal",
    custo: 45, valor: "1d6+3 HP", rotuloValor: "Cura por aliado", maxAlvos: 2,
    regra: "Escolha até 2 aliados próximos, podendo incluir você. Role a cura separadamente para cada alvo selecionado. Pague o custo de EN uma única vez e use sua ação principal. Não ultrapassa o HP máximo, não cura inimigos e não é buff.",
    experimental: true,
  },
  movimento: {
    nome: "Passo adicional", tipo: "Utilidade", acao: "Buff",
    custo: 10, valor: "Movimento narrativo", rotuloValor: "Efeito", maxAlvos: 1,
    regra: "Permite um deslocamento adicional plausível. Não atravessa obstáculos, não causa dano e depende do cenário.",
  },
  danoContinuo: {
    nome: "Aplicar condição com dano", tipo: "Condição", acao: "Principal",
    custo: { Lutador: 25, "Linha de Frente": 25, Conjurador: 30 },
    valor: { Lutador: "1d8+4", "Linha de Frente": "1d8+3", Conjurador: "1d8+4" },
    rotuloValor: "Dano inicial",
    valorAdicional: "1d4 (uma vez)", rotuloAdicional: "Dano da condição",
    maxAlvos: 1,
    regra: "Em 1 alvo: role acerto normalmente. Se acertar, causa o dano inicial e a condição causa 1d4 no início do próximo turno do alvo; então termina. Condições de dano desse modelo não acumulam, e uma reaplicação não antecipa o dano. O nome da condição é narrativo: não adiciona atordoamento, redução de CA nem outros efeitos.",
    experimental: true,
  },
  criarArma: {
    nome: "Criar ou preparar arma", tipo: "Utilidade", acao: "Buff",
    custo: 10,
    valor: { Lutador: "2d6+6", "Linha de Frente": "1d10+6", Conjurador: "2d6+6" },
    rotuloValor: "Dano ao usar como ataque básico", maxAlvos: 1,
    regra: "Cria uma arma com o elemento (ou prepara equipamento, para não dobradores) até o fim da cena. Usá-la substitui seu ataque básico normal: mesmo dano do Ataque Básico atual, sem ataque extra e sem bônus. No máximo uma arma criada/preparada ativa por personagem; criar outra substitui a anterior. O mestre decide se a forma e o material são plausíveis.",
    experimental: true,
  },
  encantarArma: {
    nome: "Encantar ou reforçar arma", tipo: "Utilidade", acao: "Buff",
    custo: 10, valor: "+4 dano", rotuloValor: "Bônus na arma", maxAlvos: 1,
    regra: "Reforça uma arma com dobra elemental (ou preparação tática, para não dobradores). O próximo ataque que acertar neste turno recebe +4 dano. Se errar ou não atacar, perde o bônus; não acumula com Reforço ofensivo nem com outro encantamento. Não concede ataque extra.",
    experimental: true,
  },
};

// O catálogo anterior permanece apenas para a compatibilidade dos JSONs e do PDF.
const MODELO_TECNICA_LEGADO: PerfilLegadoTecnica = "Lutador";

const custoDaTecnica = (modelo: ModeloId) => {
  const custo = regrasModelos[modelo].custo;
  return typeof custo === "number" ? custo : custo[MODELO_TECNICA_LEGADO];
};

const valorDaTecnica = (modelo: ModeloId, danoBasicoAtual?: string) => {
  if (modelo === "criarArma" && danoBasicoAtual) return danoBasicoAtual;
  const valor = regrasModelos[modelo].valor;
  return typeof valor === "string" ? valor : valor[MODELO_TECNICA_LEGADO];
};

const criarHabilidade = (modelo: ModeloId): Habilidade => ({
  nome: "",
  modelo,
  alvos: 1,
  efeito: "",
  limitacoes: "",
  nomeCondicao: "",
  nomeArma: "",
});

const condicaoSugeridaPorElemento: Record<Elemento, string> = {
  agua: "Geada dolorosa",
  terra: "Fragmentos de rocha",
  fogo: "Queimadura",
  ar: "Cortes de vento",
  neutro: "Sangramento",
};

// Modelos de passiva: referências de playtest, ainda sujeitos à revisão do mestre.
type ModeloPassivaId =
  | "ritmo"
  | "protecao"
  | "fluxo"
  | "instinto"
  | "preparacao"
  | "votoMare"
  | "amparoSolidario"
  | "resistenciaInstintiva"
  | "sintoniaEquipe";

type RegraPassiva = {
  nome: string;
  categoria: "Ofensiva" | "Defensiva" | "Suporte";
  gatilho: string;
  efeito: string;
  limite: string;
  experimental?: boolean;
};

const regrasPassivas: Record<ModeloPassivaId, RegraPassiva> = {
  ritmo: {
    nome: "Dano após ataques repetidos (+2)",
    categoria: "Ofensiva",
    gatilho: "Acertar o mesmo alvo com ataque de alvo único em dois turnos consecutivos.",
    efeito: "+2 de dano no segundo ataque acertado.",
    limite: "Erro, troca de alvo ou ataque em área reiniciam a sequência. Não acumula e não gera ataques extras.",
  },
  protecao: {
    nome: "Escudo ao acertar (1d4+2)",
    categoria: "Defensiva",
    gatilho: "Acertar uma técnica ofensiva.",
    efeito: "Recebe 1d4+2 de escudo temporário.",
    limite: "No máximo uma ativação por rodada. Dura até o início do seu próximo turno. Escudos não acumulam: mantém-se o maior.",
  },
  fluxo: {
    nome: "Dano básico após técnica (+1d6)",
    categoria: "Ofensiva",
    gatilho: "Acertar a técnica ativa vinculada escolhida para a passiva.",
    efeito: "O próximo ataque básico que acertar recebe +1d6 de dano.",
    limite: "No máximo uma ativação por rodada. Expira ao fim do próximo turno. Não acumula e não gera ataque extra.",
  },
  instinto: {
    nome: "Dano após esquiva (+1d4)",
    categoria: "Ofensiva",
    gatilho: "Um ataque inimigo errar você.",
    efeito: "O próximo ataque que acertar recebe +1d4 de dano.",
    limite: "No máximo uma ativação por rodada. Expira ao fim do próximo turno, mesmo se o ataque errar. Não acumula.",
  },
  preparacao: {
    nome: "Dano após controle (+1d6)",
    categoria: "Ofensiva",
    gatilho: "Acertar uma técnica de controle.",
    efeito: "O próximo ataque básico que acertar recebe +1d6 de dano.",
    limite: "No máximo uma ativação por rodada. Expira ao fim do próximo turno. Não acumula e não gera ataque extra.",
  },
  votoMare: {
    nome: "Cura extra em aliado ferido (+1d6)",
    categoria: "Suporte",
    gatilho: "Curar um aliado que estava com metade ou menos de seu HP máximo antes da cura.",
    efeito: "Um aliado curado recebe +1d6 HP de cura adicional.",
    limite: "Uma vez por combate. Em cura em área, escolha somente um aliado para o bônus. Não funciona sobre você mesmo, não ultrapassa HP máximo e não custa EN ou ação extra.",
    experimental: true,
  },
  amparoSolidario: {
    nome: "Proteção ao curar aliado (+1 CA)",
    categoria: "Suporte",
    gatilho: "Curar um aliado com uma técnica ativa de Cura.",
    efeito: "Um aliado curado recebe +1 CA até o início do seu próximo turno.",
    limite: "Uma vez por combate. Se a cura atingir dois aliados, escolha somente um. Não funciona em você mesmo e não acumula com outro bônus de CA de proteção; mantenha o maior.",
    experimental: true,
  },
  resistenciaInstintiva: {
    nome: "Redução do primeiro dano (1d4)",
    categoria: "Defensiva",
    gatilho: "Na primeira vez que receber dano de um ataque inimigo direto em um combate.",
    efeito: "Reduz o dano desse ataque em 1d4, até o mínimo de zero.",
    limite: "Uma vez por combate. Não funciona contra dano contínuo, custo de habilidade ou ataque que errou. Não cria escudo e não consome ação.",
    experimental: true,
  },
  sintoniaEquipe: {
    nome: "Iniciativa para um aliado (+1)",
    categoria: "Suporte",
    gatilho: "Antes da rolagem de iniciativa do combate, escolher um aliado presente.",
    efeito: "Esse aliado recebe +1 no d20 de iniciativa para o combate.",
    limite: "Uma vez por combate, apenas um aliado diferente de você. Não se aplica depois da iniciativa rolada e não acumula com outros bônus de iniciativa; mantenha o maior. Sem custo de EN ou ação.",
    experimental: true,
  },
};

type AbaEditor = "identidade" | "arquetipo" | "atributos" | "pericias" | "habilidades" | "exploracao" | "previa";

const abasEditor: { id: AbaEditor; nome: string }[] = [
  { id: "identidade", nome: "Identidade" },
  { id: "arquetipo", nome: "Arquétipo" },
  { id: "atributos", nome: "Atributos" },
  { id: "pericias", nome: "Perícias" },
  { id: "habilidades", nome: "Habilidades" },
  { id: "exploracao", nome: "Exploração" },
  { id: "previa", nome: "Prévia" },
];

function normalizarAbaEditor(aba: AbaEditor | "combate" | undefined): AbaEditor {
  return aba === "combate" ? "atributos" : aba ?? "identidade";
}


type PassivaEditavel = {
  nome: string;
  modelo: ModeloPassivaId;
  descricao: string;
  habilidadeVinculada: number;
};


type NomeAtributoImpeto =
  | "Força" | "Agilidade" | "Destreza" | "Vigor"
  | "Intelecto" | "Percepção" | "Vontade" | "Presença";
type AtributosImpeto = Record<NomeAtributoImpeto, number>;

const NOMES_ATRIBUTOS_IMPETO: NomeAtributoImpeto[] = [
  "Força", "Agilidade", "Destreza", "Vigor",
  "Intelecto", "Percepção", "Vontade", "Presença",
];
const PA_INICIAL_REFERENCIA = 28;
const ATRIBUTO_BASE_REFERENCIA = 8;
const ATRIBUTO_TETO_REFERENCIA = 14;
const ATRIBUTOS_PADRAO_IMPETO: AtributosImpeto = {
  Força: 8, Agilidade: 8, Destreza: 8, Vigor: 8,
  Intelecto: 8, Percepção: 8, Vontade: 8, Presença: 8,
};

function custoPassoAtributo(valorDeChegada: number): number {
  if (valorDeChegada <= 12) return 1;
  if (valorDeChegada <= 14) return 2;
  if (valorDeChegada <= 16) return 3;
  if (valorDeChegada <= 18) return 4;
  return 5;
}

function pontosGastosAtributos(atributos: AtributosImpeto): number {
  return NOMES_ATRIBUTOS_IMPETO.reduce((total, atributo) => {
    let gasto = 0;
    for (let n = ATRIBUTO_BASE_REFERENCIA + 1; n <= atributos[atributo]; n += 1) {
      gasto += custoPassoAtributo(n);
    }
    return total + gasto;
  }, 0);
}

function validarAtributosImpeto(valor: unknown): valor is AtributosImpeto {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return false;
  const dados = valor as Record<string, unknown>;
  const valido = NOMES_ATRIBUTOS_IMPETO.every((nome) => {
    const n = dados[nome];
    return typeof n === "number" && Number.isInteger(n) &&
      n >= ATRIBUTO_BASE_REFERENCIA && n <= ATRIBUTO_TETO_REFERENCIA;
  });
  return valido && pontosGastosAtributos(valor as AtributosImpeto) <= PA_INICIAL_REFERENCIA;
}



type DerivacaoD01Tipo = "" | "resistencia" | "reserva" | "potencia";
type DerivacaoD01 = {
  tipo: DerivacaoD01Tipo;
  atributo: NomeAtributoImpeto | "";
  justificativa: string;
};
const DERIVACAO_D01_PADRAO: DerivacaoD01 = {
  tipo: "", atributo: "", justificativa: "",
};
const DERIVACOES_D01: { id: Exclude<DerivacaoD01Tipo, "">; nome: string; beneficio: string }[] = [
  { id: "resistencia", nome: "Resistência", beneficio: "+3 HP máximo" },
  { id: "reserva", nome: "Reserva", beneficio: "+5 Energia de referência" },
  { id: "potencia", nome: "Potência", beneficio: "+1 dano fixo no Ataque Básico" },
];
function atributosElegiveisD01(atributos: AtributosImpeto): NomeAtributoImpeto[] {
  return NOMES_ATRIBUTOS_IMPETO.filter((atributo) => atributos[atributo] >= 12);
}
function validarDerivacaoD01(valor: unknown, atributos: AtributosImpeto): boolean {
  if (valor === undefined) return true; // Compatibilidade com JSONs anteriores à D01.
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return false;
  const dados = valor as Partial<DerivacaoD01>;
  if (typeof dados.justificativa !== "string" || dados.justificativa.length > 500) return false;
  if (dados.tipo === "") return dados.atributo === "";
  return DERIVACOES_D01.some((item) => item.id === dados.tipo) &&
    !!dados.atributo &&
    NOMES_ATRIBUTOS_IMPETO.some((atributo) =>
      atributo === dados.atributo && atributos[atributo] >= 12
    );
}

type ArquetipoImpeto = "Ofensivo" | "Defensor" | "Controlador" | "Suporte";
type TalentoArquetipoId =
  | "aberturaTatica" | "correcaoGolpe" | "dominioCorporal"
  | "interposicao" | "absorcaoInstintiva" | "sentinela"
  | "janelaOportunidade" | "pressaoResidual" | "leituraTerreno"
  | "fluxoEficiente" | "sustentacaoTecnica" | "analiseAplicada";

type TalentoT02 = {
  id: TalentoArquetipoId;
  nome: string;
  efeito: string;
};

const ARQUETIPOS_T02: Record<
  ArquetipoImpeto,
  { descricao: string; talentos: TalentoT02[] }
> = {
  Ofensivo: {
    descricao: "Pressão, golpes e oportunidade",
    talentos: [
      { id: "aberturaTatica", nome: "Abertura Tática",
        efeito: "Uma vez por combate, após acertar, concede +1 ao próximo ataque de um aliado contra aquele alvo, dentro de um prazo narrativo curto." },
      { id: "correcaoGolpe", nome: "Correção de Golpe",
        efeito: "Uma vez por combate, repete o d20 de um ataque que errou e aceita o novo resultado." },
      { id: "dominioCorporal", nome: "Domínio Corporal",
        efeito: "Uma vez por cena, repete um teste malsucedido de Atletismo ou Acrobacia em manobra apropriada." },
    ],
  },
  Defensor: {
    descricao: "Resistência, proteção e vigilância",
    talentos: [
      { id: "interposicao", nome: "Interposição",
        efeito: "Uma vez por combate, usa sua reação antes de um ataque para se tornar o alvo no lugar de um aliado ao alcance narrativo." },
      { id: "absorcaoInstintiva", nome: "Absorção Instintiva",
        efeito: "Uma vez por combate, usa sua reação para reduzir o dano de um impacto em 1d8 (mínimo zero)." },
      { id: "sentinela", nome: "Sentinela",
        efeito: "Uma vez por cena, repete um teste de Atenção ou Sobrevivência relacionado à identificação de perigos." },
    ],
  },
  Controlador: {
    descricao: "Condições, obstáculos e oportunidades",
    talentos: [
      { id: "janelaOportunidade", nome: "Janela de Oportunidade",
        efeito: "Uma vez por combate, ao aplicar uma condição negativa, concede +1 ao próximo ataque de outro aliado contra o mesmo alvo." },
      { id: "pressaoResidual", nome: "Pressão Residual",
        efeito: "Uma vez por combate, quando um inimigo resiste ou escapa de um efeito de controle, pode impedir uma reação dele até o fim do próximo turno do alvo, desde que seja possível afetá-lo." },
      { id: "leituraTerreno", nome: "Leitura de Terreno",
        efeito: "Uma vez por cena, repete um teste de Atenção ou Investigação ao analisar rotas e obstáculos." },
    ],
  },
  Suporte: {
    descricao: "Assistência, buffs e técnicas especializadas",
    talentos: [
      { id: "fluxoEficiente", nome: "Fluxo Eficiente",
        efeito: "Uma vez por combate, reduz em até 5 EN o custo de uma habilidade, respeitando custo mínimo de 1 EN." },
      { id: "sustentacaoTecnica", nome: "Sustentação Técnica",
        efeito: "Uma vez por combate, prolonga por uma rodada um buff ou proteção própria; não prolonga controle severo, dano ou cura periódica." },
      { id: "analiseAplicada", nome: "Análise Aplicada",
        efeito: "Uma vez por cena, repete um teste malsucedido de Medicina, Engenharia ou Investigação em procedimento especializado." },
    ],
  },
};

function validarEscolhaT02(arquetipo: unknown, talento: unknown): boolean {
  if (arquetipo === undefined && talento === undefined) return true;
  if (arquetipo === "" && (talento === "" || talento === undefined)) return true;
  if (typeof arquetipo !== "string" ||
    !Object.prototype.hasOwnProperty.call(ARQUETIPOS_T02, arquetipo)) return false;
  if (talento === undefined || talento === "") return true;
  return typeof talento === "string" &&
    ARQUETIPOS_T02[arquetipo as ArquetipoImpeto].talentos.some((t) => t.id === talento);
}


const GRUPOS_PERICIAS_IMPETO = [
  { nome: "Físicas", pericias: ["Atletismo", "Acrobacia", "Furtividade", "Precisão Manual"] },
  { nome: "Exploração", pericias: ["Atenção", "Investigação", "Sobrevivência", "Condução"] },
  { nome: "Conhecimento", pericias: ["Conhecimento", "Engenharia", "Medicina"] },
  { nome: "Sociais", pericias: ["Persuasão", "Enganação", "Intimidação", "Empatia", "Liderança"] },
] as const;

type NomePericiaImpeto = (typeof GRUPOS_PERICIAS_IMPETO)[number]["pericias"][number];
type GrauPericiaImpeto = 0 | 1 | 2;
type PericiasImpeto = Record<NomePericiaImpeto, GrauPericiaImpeto>;

const PT_INICIAL_REFERENCIA = 4;
const PERICIAS_PADRAO_IMPETO: PericiasImpeto = {
  Atletismo: 0, Acrobacia: 0, Furtividade: 0, "Precisão Manual": 0,
  Atenção: 0, Investigação: 0, Sobrevivência: 0, Condução: 0,
  Conhecimento: 0, Engenharia: 0, Medicina: 0,
  Persuasão: 0, Enganação: 0, Intimidação: 0, Empatia: 0, Liderança: 0,
};
const NOMES_PERICIAS_IMPETO: NomePericiaImpeto[] =
  GRUPOS_PERICIAS_IMPETO.flatMap((grupo) => [...grupo.pericias]);

function pontosGastosPericias(pericias: PericiasImpeto): number {
  return NOMES_PERICIAS_IMPETO.reduce((total, pericia) => total + pericias[pericia], 0);
}

function validarPericiasImpeto(valor: unknown): valor is PericiasImpeto {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return false;
  const dados = valor as Record<string, unknown>;
  return Object.keys(dados).length === NOMES_PERICIAS_IMPETO.length &&
    NOMES_PERICIAS_IMPETO.every((nome) =>
      Object.prototype.hasOwnProperty.call(dados, nome) &&
      (dados[nome] === 0 || dados[nome] === 1 || dados[nome] === 2)
    ) &&
    pontosGastosPericias(dados as PericiasImpeto) <= PT_INICIAL_REFERENCIA;
}

function nomeGrauPericia(grau: GrauPericiaImpeto): string {
  return grau === 2 ? "Especialista" : grau === 1 ? "Treinado" : "Não treinado";
}

function bonusGrauPericia(grau: GrauPericiaImpeto): number {
  return grau * 2;
}


type RecursoImpeto = "hp" | "energia" | "ca" | "ataqueDados" | "regeneracao";
type RecursosImpeto = {
  hp: number; // PR investidos em HP (+3 HP por PR)
  energia: number; // PR investidos em EN (+5 EN por PR)
  ca: number; // CA Base adquirida na criação (8 a 13)
  ataqueDados: number; // dados d6 adicionais: 0, 1 ou 2
  regeneracao: number; // níveis adquiridos: 0, 1 ou 2
};

const PR_INICIAL_REFERENCIA = 20;
const CUSTOS_CA_PR = [0, 1, 3, 6, 10, 15] as const;
const CUSTOS_ATAQUE_PR = [0, 5, 13] as const;
const CUSTOS_REGENERACAO_PR = [0, 3, 9] as const;
const RECURSOS_PADRAO_IMPETO: RecursosImpeto = {
  hp: 0, energia: 0, ca: 8, ataqueDados: 0, regeneracao: 0,
};

function custoRecursosImpeto(recursos: RecursosImpeto): number {
  return recursos.hp + recursos.energia +
    CUSTOS_CA_PR[recursos.ca - 8] +
    CUSTOS_ATAQUE_PR[recursos.ataqueDados] +
    CUSTOS_REGENERACAO_PR[recursos.regeneracao];
}

function validarRecursosImpeto(valor: unknown): valor is RecursosImpeto {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return false;
  const dados = valor as Record<string, unknown>;
  const chaves: RecursoImpeto[] = ["hp", "energia", "ca", "ataqueDados", "regeneracao"];
  if (Object.keys(dados).length !== chaves.length ||
    !chaves.every((chave) => Number.isInteger(dados[chave]))) return false;
  const recursos = valor as RecursosImpeto;
  return recursos.hp >= 0 && recursos.hp <= PR_INICIAL_REFERENCIA &&
    recursos.energia >= 0 && recursos.energia <= PR_INICIAL_REFERENCIA &&
    recursos.ca >= 8 && recursos.ca <= 13 &&
    recursos.ataqueDados >= 0 && recursos.ataqueDados <= 2 &&
    recursos.regeneracao >= 0 && recursos.regeneracao <= 2 &&
    custoRecursosImpeto(recursos) <= PR_INICIAL_REFERENCIA;
}

function valorRecursosImpeto(recursos: RecursosImpeto, derivacao: DerivacaoD01Tipo) {
  return {
    hp: 40 + 3 * recursos.hp + (derivacao === "resistencia" ? 3 : 0),
    energia: 30 + 5 * recursos.energia + (derivacao === "reserva" ? 5 : 0),
    ca: recursos.ca,
    ataque: `${2 + recursos.ataqueDados}d6+${2 + (derivacao === "potencia" ? 1 : 0)}`,
    regeneracao: recursos.regeneracao,
  };
}


type VantagemUniversalId =
  | "preparadoImprevistos" | "memoriaTreinada" | "sangueFrio"
  | "raciocinioAplicado" | "articulacaoSocial" | "engenhosidade"
  | "conhecimentoCruzado" | "exploradorPreparado";

const VANTAGENS_V01: { id: VantagemUniversalId; nome: string; beneficio: string }[] = [
  {
    id: "preparadoImprevistos", nome: "Preparado para Imprevistos",
    beneficio: "Uma vez por cena, revelar ferramenta mundana simples e plausível.",
  },
  {
    id: "memoriaTreinada", nome: "Memória Treinada",
    beneficio: "Uma vez por cena, recordar fielmente informação testemunhada.",
  },
  {
    id: "sangueFrio", nome: "Sangue-Frio",
    beneficio: "Uma vez por cena, atenuar pequena penalidade situacional de medo ou pressão.",
  },
  {
    id: "raciocinioAplicado", nome: "Raciocínio Aplicado",
    beneficio: "Numa falha próxima fora de combate, obter proposta de avanço com complicação, a critério do mestre.",
  },
  {
    id: "articulacaoSocial", nome: "Articulação Social",
    beneficio: "Identificar uma objeção importante numa negociação, sem controlar o NPC.",
  },
  {
    id: "engenhosidade", nome: "Engenhosidade",
    beneficio: "Improvisar solução de pequeno obstáculo material em tarefa técnica plausível.",
  },
  {
    id: "conhecimentoCruzado", nome: "Conhecimento Cruzado",
    beneficio: "Utilizar um treinamento relacionado em um teste, sem somar duas perícias.",
  },
  {
    id: "exploradorPreparado", nome: "Explorador Preparado",
    beneficio: "Preparar uma precaução prática perante perigo previsível.",
  },
];

function validarVantagemV01(valor: unknown): boolean {
  return valor === undefined || valor === "" ||
    (typeof valor === "string" && VANTAGENS_V01.some((item) => item.id === valor));
}

type RascunhoFicha = {
  versao: 1;
  // Etapa visual opcional para manter compatibilidade com rascunhos anteriores.
  editorAberto?: boolean;
  abaAtiva?: AbaEditor | "combate";
  elemento: Elemento;
  // Opcional para importar fichas JSON produzidas antes desta atualização.
  atributosImpeto?: AtributosImpeto;
  derivacaoD01?: DerivacaoD01;
  recursosImpeto?: RecursosImpeto;
  periciasImpeto?: PericiasImpeto;
  // Módulo T02: campos opcionais para importar fichas JSON mais antigas.
  arquetipoImpeto?: ArquetipoImpeto | "";
  talentoArquetipo?: TalentoArquetipoId | "";
  vantagemUniversal?: VantagemUniversalId | "";
  nome: string;
  classe?: PerfilLegadoTecnica; // campo de JSON anterior, ignorado em novas fichas
  historia: string;
  foto: string;
  ataqueBasico: { nome: string; descricao: string };
  habilidades: Habilidade[];
  passiva: PassivaEditavel;
  // H06/H04.1/PX: opcionais para recuperar JSONs exportados antes da atualização.
  perfilHabilidades?: Perfil;
  ativasImpeto?: Ativa[];
  passivaImpeto?: Passiva;
  exploracaoImpeto?: Exploracao[];
};

const CHAVE_RASCUNHO = "hexatombe-avatar:rascunho:v1";


const FORMATO_JSON = "hexatombe-avatar-ficha";
const LIMITE_JSON_BYTES = 8 * 1024 * 1024;

// Um arquivo de outro projeto ou uma ficha incompleta nunca deve substituir
// a ficha atual; a mesma verificação vale para o rascunho automático.
function validarFicha(valor: unknown): valor is RascunhoFicha {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return false;
  const dados = valor as Partial<RascunhoFicha>;

  const habilidadeValida = (item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const habilidade = item as Partial<Habilidade>;
    return typeof habilidade.nome === "string" &&
      Object.prototype.hasOwnProperty.call(regrasModelos, habilidade.modelo ?? "") &&
      (habilidade.alvos === 1 || habilidade.alvos === 2) &&
      typeof habilidade.efeito === "string" &&
      typeof habilidade.limitacoes === "string" &&
      typeof habilidade.nomeCondicao === "string" &&
      typeof habilidade.nomeArma === "string";
  };

  return dados.versao === 1 &&
    (dados.editorAberto === undefined || typeof dados.editorAberto === "boolean") &&
    (dados.abaAtiva === undefined || dados.abaAtiva === "combate" || abasEditor.some((aba) => aba.id === dados.abaAtiva)) &&
    elementos.some((item) => item.id === dados.elemento) &&
    (dados.atributosImpeto === undefined || validarAtributosImpeto(dados.atributosImpeto)) &&
    validarDerivacaoD01(dados.derivacaoD01, dados.atributosImpeto ?? ATRIBUTOS_PADRAO_IMPETO) &&
    (dados.recursosImpeto === undefined || validarRecursosImpeto(dados.recursosImpeto)) &&
    (dados.periciasImpeto === undefined || validarPericiasImpeto(dados.periciasImpeto)) &&
    validarEscolhaT02(dados.arquetipoImpeto, dados.talentoArquetipo) &&
    validarVantagemV01(dados.vantagemUniversal) &&
    (dados.classe === undefined ||
      (typeof dados.classe === "string" &&
        ["Lutador", "Linha de Frente", "Conjurador"].includes(dados.classe))) &&
    typeof dados.nome === "string" &&
    typeof dados.historia === "string" &&
    typeof dados.foto === "string" &&
    (dados.foto === "" || /^data:image\/(png|jpeg|webp);base64,/i.test(dados.foto)) &&
    !!dados.ataqueBasico &&
    typeof dados.ataqueBasico.nome === "string" &&
    typeof dados.ataqueBasico.descricao === "string" &&
    Array.isArray(dados.habilidades) &&
    dados.habilidades.length === 5 &&
    dados.habilidades.every(habilidadeValida) &&
    !!dados.passiva &&
    typeof dados.passiva.nome === "string" &&
    Object.prototype.hasOwnProperty.call(regrasPassivas, dados.passiva.modelo) &&
    typeof dados.passiva.descricao === "string" &&
    Number.isInteger(dados.passiva.habilidadeVinculada) &&
    dados.passiva.habilidadeVinculada >= 0 &&
    dados.passiva.habilidadeVinculada <= 4 &&
    ((dados.perfilHabilidades === undefined &&
      dados.ativasImpeto === undefined &&
      dados.passivaImpeto === undefined &&
      dados.exploracaoImpeto === undefined) ||
      (dados.perfilHabilidades !== undefined &&
        dados.ativasImpeto !== undefined &&
        dados.passivaImpeto !== undefined &&
        dados.exploracaoImpeto !== undefined &&
        validaConstrucao(dados.perfilHabilidades, dados.ativasImpeto,
          dados.passivaImpeto, dados.exploracaoImpeto)));
}

function carregarRascunho(): RascunhoFicha | null {
  try {
    const texto = window.localStorage.getItem(CHAVE_RASCUNHO);
    if (!texto) return null;
    const dados: unknown = JSON.parse(texto);
    return validarFicha(dados) ? dados : null;
  } catch (erro) {
    console.warn("Não foi possível recuperar o rascunho salvo.", erro);
    return null;
  }
}

// Mantém o mesmo esquema do salvamento local; o invólucro identifica
// o aplicativo e a versão do formato para futuras integrações.
function obterFichaDoArquivo(conteudo: unknown): RascunhoFicha | null {
  if (!conteudo || typeof conteudo !== "object" || Array.isArray(conteudo)) return null;
  const pacote = conteudo as Record<string, unknown>;
  if (pacote.formato === FORMATO_JSON && pacote.versaoFormato === 1) {
    return validarFicha(pacote.ficha) ? pacote.ficha : null;
  }
  // Também aceita uma cópia do rascunho local v1, sem invólucro.
  return validarFicha(conteudo) ? conteudo : null;
}

function App() {
  const [rascunhoInicial] = useState(() => carregarRascunho());
  const seletorJsonRef = useRef<HTMLInputElement>(null);
  const [elemento, setElemento] = useState<Elemento>(rascunhoInicial?.elemento ?? "agua");
  const [atributosImpeto, setAtributosImpeto] = useState<AtributosImpeto>(
    rascunhoInicial?.atributosImpeto ?? { ...ATRIBUTOS_PADRAO_IMPETO }
  );
  const [derivacaoD01, setDerivacaoD01] = useState<DerivacaoD01>(
    rascunhoInicial?.derivacaoD01 ?? { ...DERIVACAO_D01_PADRAO }
  );
  const [recursosImpeto, setRecursosImpeto] = useState<RecursosImpeto>(
    rascunhoInicial?.recursosImpeto ?? { ...RECURSOS_PADRAO_IMPETO }
  );
  const [periciasImpeto, setPericiasImpeto] = useState<PericiasImpeto>(
    rascunhoInicial?.periciasImpeto ?? { ...PERICIAS_PADRAO_IMPETO }
  );
  const [arquetipoImpeto, setArquetipoImpeto] = useState<ArquetipoImpeto | "">(
    rascunhoInicial?.arquetipoImpeto ?? ""
  );
  const [talentoArquetipo, setTalentoArquetipo] = useState<TalentoArquetipoId | "">(
    rascunhoInicial?.talentoArquetipo ?? ""
  );
  const [vantagemUniversal, setVantagemUniversal] = useState<VantagemUniversalId | "">(
    rascunhoInicial?.vantagemUniversal ?? ""
  );
  // Novos rascunhos retomam a tela em que o jogador estava.
  // Rascunhos da versão anterior, que não guardavam a etapa, retomam o editor
  // caso já exista nome ou história preenchidos.
  const [mostrandoIdentidade, setMostrandoIdentidade] = useState(
    rascunhoInicial?.editorAberto ??
      Boolean(rascunhoInicial?.nome.trim() || rascunhoInicial?.historia.trim())
  );
  const [nome, setNome] = useState(rascunhoInicial?.nome ?? "");
  const [historia, setHistoria] = useState(rascunhoInicial?.historia ?? "");
  const [foto, setFoto] = useState(rascunhoInicial?.foto ?? "");
  const [abaAtiva, setAbaAtiva] = useState<AbaEditor>(normalizarAbaEditor(rascunhoInicial?.abaAtiva));
  const [exportandoPdf, setExportandoPdf] = useState(false);

  // Os hooks devem ficar dentro do componente App.
  const [ataqueBasico, setAtaqueBasico] = useState(
    rascunhoInicial?.ataqueBasico ?? { nome: "", descricao: "" }
  );

  const [habilidades, setHabilidades] = useState<Habilidade[]>(() =>
    rascunhoInicial?.habilidades ?? [
      criarHabilidade("golpe"),
      criarHabilidade("area"),
      criarHabilidade("imobilizar"),
      criarHabilidade("ca"),
      criarHabilidade("buffDano"),
    ]
  );

  const [passiva, setPassiva] = useState<PassivaEditavel>(
    rascunhoInicial?.passiva ?? {
      nome: "",
      modelo: "protecao",
      descricao: "",
      habilidadeVinculada: 0,
    }
  );

  // O modelo H06 é independente dos registros antigos preservados para
  // importação e exportação PDF até a diagramação definitiva.
  // Este criador é exclusivo de Hexatombe: Avatar.
  // JSONs antigos com o perfil introdutório são importados no orçamento de Avatar.
  const perfilHabilidades: Perfil = "avatar";
  const [ativasImpeto, setAtivasImpeto] = useState<Ativa[]>(() =>
    rascunhoInicial?.ativasImpeto ?? migrarAtivas(
      rascunhoInicial?.habilidades ?? [
        criarHabilidade("golpe"), criarHabilidade("area"),
        criarHabilidade("imobilizar"), criarHabilidade("ca"), criarHabilidade("buffDano")
      ]
    )
  );
  const [passivaImpeto, setPassivaImpeto] = useState<Passiva>(() =>
    rascunhoInicial?.passivaImpeto ?? migrarPassiva(
      rascunhoInicial?.passiva ?? {nome:"",modelo:"",descricao:""}
    )
  );
  const [exploracaoImpeto, setExploracaoImpeto] = useState<Exploracao[]>(
    rascunhoInicial?.exploracaoImpeto ?? []
  );
  const [alertaConstrutor, setAlertaConstrutor] = useState("");

  useEffect(() => {
    const rascunho: RascunhoFicha = {
      versao: 1,
      editorAberto: mostrandoIdentidade,
      abaAtiva,
      elemento,
      atributosImpeto,
      derivacaoD01,
      recursosImpeto,
      periciasImpeto,
      arquetipoImpeto,
      talentoArquetipo,
      vantagemUniversal,
      nome,
      historia,
      foto,
      ataqueBasico,
      habilidades,
      passiva,
      perfilHabilidades,
      ativasImpeto,
      passivaImpeto,
      exploracaoImpeto,
    };
    try {
      window.localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(rascunho));
    } catch (erro) {
      console.warn("Não foi possível salvar o rascunho neste navegador.", erro);
    }
  }, [mostrandoIdentidade, abaAtiva, elemento, atributosImpeto, derivacaoD01, recursosImpeto, periciasImpeto, arquetipoImpeto, talentoArquetipo, vantagemUniversal, nome, historia, foto, ataqueBasico, habilidades, passiva, perfilHabilidades, ativasImpeto, passivaImpeto, exploracaoImpeto]);


  const exportarJson = () => {
    // Exporta os campos editáveis, sem depender de PDF ou das tabelas
    // do registro atual, independentemente dos perfis antigos.
    const ficha: RascunhoFicha = {
      versao: 1,
      editorAberto: true,
      abaAtiva,
      elemento,
      atributosImpeto,
      derivacaoD01,
      recursosImpeto,
      periciasImpeto,
      arquetipoImpeto,
      talentoArquetipo,
      vantagemUniversal,
      nome,
      historia,
      foto,
      ataqueBasico,
      habilidades,
      passiva,
      perfilHabilidades,
      ativasImpeto,
      passivaImpeto,
      exploracaoImpeto,
    };
    const pacote = {
      formato: FORMATO_JSON,
      versaoFormato: 1,
      exportadoEm: new Date().toISOString(),
      ficha,
    };

    try {
      const dados = new Blob([JSON.stringify(pacote, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(dados);
      const nomeArquivo = nome.trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "").slice(0, 60) || "personagem";
      const link = document.createElement("a");
      link.href = url;
      link.download = nomeArquivo + "-hexatombe-avatar.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (erro) {
      console.error("Falha ao exportar JSON", erro);
      window.alert("Não foi possível baixar o JSON desta ficha.");
    }
  };

  const importarJson = async (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.currentTarget.files?.[0];
    evento.currentTarget.value = "";
    if (!arquivo) return;
    if (arquivo.size > LIMITE_JSON_BYTES) {
      window.alert("Arquivo muito grande. O limite para importação é 8 MB.");
      return;
    }

    try {
      const conteudo: unknown = JSON.parse(await arquivo.text());
      const ficha = obterFichaDoArquivo(conteudo);
      if (!ficha) {
        window.alert("JSON inválido ou incompatível. Selecione uma ficha exportada pelo criador Hexatombe: Avatar.");
        return;
      }

      if (!window.confirm("Importar esta ficha substituirá o rascunho que está em edição neste navegador. Deseja continuar?")) {
        return;
      }

      setElemento(ficha.elemento);
      setAtributosImpeto(ficha.atributosImpeto ?? { ...ATRIBUTOS_PADRAO_IMPETO });
      setDerivacaoD01(ficha.derivacaoD01 ?? { ...DERIVACAO_D01_PADRAO });
      setRecursosImpeto(ficha.recursosImpeto ?? { ...RECURSOS_PADRAO_IMPETO });
      setPericiasImpeto(ficha.periciasImpeto ?? { ...PERICIAS_PADRAO_IMPETO });
      setArquetipoImpeto(ficha.arquetipoImpeto ?? "");
      setTalentoArquetipo(ficha.talentoArquetipo ?? "");
      setVantagemUniversal(ficha.vantagemUniversal ?? "");
      setNome(ficha.nome);
      setHistoria(ficha.historia);
      setFoto(ficha.foto);
      setAtaqueBasico({ ...ficha.ataqueBasico });
      setHabilidades(ficha.habilidades.map((habilidade) => ({ ...habilidade })));
      setPassiva({ ...ficha.passiva });
      setAtivasImpeto(ficha.ativasImpeto ??
        migrarAtivas(ficha.habilidades));
      setPassivaImpeto(ficha.passivaImpeto ??
        migrarPassiva(ficha.passiva));
      setExploracaoImpeto(ficha.exploracaoImpeto ?? []);
      setAlertaConstrutor("");
      setAbaAtiva(normalizarAbaEditor(ficha.abaAtiva));
      setMostrandoIdentidade(true);
      window.alert("Ficha importada! Você pode continuar editando ou gerar o PDF.");
    } catch (erro) {
      console.warn("Erro ao ler o arquivo JSON", erro);
      window.alert("Não foi possível ler este JSON. Confira se o arquivo é válido.");
    }
  };


  const talentoT02Escolhido = arquetipoImpeto
    ? ARQUETIPOS_T02[arquetipoImpeto].talentos.find((item) => item.id === talentoArquetipo)
    : undefined;

  const ptGastos = pontosGastosPericias(periciasImpeto);
  const ptRestantes = PT_INICIAL_REFERENCIA - ptGastos;
  const alterarGrauPericia = (pericia: NomePericiaImpeto, delta: -1 | 1) => {
    setPericiasImpeto((anterior) => {
      const grau = anterior[pericia];
      const proximo = grau + delta;
      if (proximo < 0 || proximo > 2) return anterior;
      if (delta === 1 && pontosGastosPericias(anterior) >= PT_INICIAL_REFERENCIA) return anterior;
      return { ...anterior, [pericia]: proximo as GrauPericiaImpeto };
    });
  };

  const prGastos = custoRecursosImpeto(recursosImpeto);
  const prRestantes = PR_INICIAL_REFERENCIA - prGastos;
  const recursosCalculados = valorRecursosImpeto(recursosImpeto, derivacaoD01.tipo);

  const alterarRecursoImpeto = (campo: RecursoImpeto, delta: -1 | 1) => {
    setRecursosImpeto((anterior) => {
      const seguinte: RecursosImpeto = { ...anterior, [campo]: anterior[campo] + delta };
      if (!validarRecursosImpeto(seguinte)) return anterior;
      return seguinte;
    });
  };

  const podeAumentarRecursoImpeto = (campo: RecursoImpeto): boolean => {
    const seguinte = { ...recursosImpeto, [campo]: recursosImpeto[campo] + 1 };
    return validarRecursosImpeto(seguinte);
  };

  const podeReduzirRecursoImpeto = (campo: RecursoImpeto): boolean => {
    const seguinte = { ...recursosImpeto, [campo]: recursosImpeto[campo] - 1 };
    return validarRecursosImpeto(seguinte);
  };

  const paGastos = pontosGastosAtributos(atributosImpeto);
  const paDisponiveis = PA_INICIAL_REFERENCIA - paGastos;

  const atributosDisponiveisD01 = atributosElegiveisD01(atributosImpeto);
  const alterarAtributoImpeto = (nomeAtributo: NomeAtributoImpeto, delta: -1 | 1) => {
    const proximoValor = atributosImpeto[nomeAtributo] + delta;
    if (proximoValor < ATRIBUTO_BASE_REFERENCIA || proximoValor > ATRIBUTO_TETO_REFERENCIA) {
      return;
    }
    if (delta === 1 && pontosGastosAtributos(atributosImpeto) +
      custoPassoAtributo(proximoValor) > PA_INICIAL_REFERENCIA) {
      return;
    }
    setAtributosImpeto({ ...atributosImpeto, [nomeAtributo]: proximoValor });
    // Não manter um bônus D01 caso o atributo escolhido deixe de cumprir 12+.
    if (derivacaoD01.atributo === nomeAtributo && proximoValor < 12) {
      setDerivacaoD01({ ...DERIVACAO_D01_PADRAO });
    }
  };
  const selecionarDerivacaoD01 = (tipo: DerivacaoD01Tipo) => {
    if (tipo === "" || atributosDisponiveisD01.length === 0) {
      setDerivacaoD01({ ...DERIVACAO_D01_PADRAO });
      return;
    }
    const atributo = derivacaoD01.atributo &&
      atributosDisponiveisD01.includes(derivacaoD01.atributo)
      ? derivacaoD01.atributo : atributosDisponiveisD01[0];
    setDerivacaoD01({ ...derivacaoD01, tipo, atributo });
  };

  const informarLimite = () => setAlertaConstrutor(
    "A alteração ultrapassaria o orçamento ou o limite individual da configuração atual. " +
    "Reduza outro componente ou ajuste a construção junto ao mestre."
  );

  const editarAtivaImpeto = (indice:number, campos:Partial<Ativa>) => {
    const novas = ativasImpeto.map((a,i)=>i===indice?{...a,...campos}:a);
    if (!validaConstrucao(perfilHabilidades, novas, passivaImpeto, exploracaoImpeto)) {
      informarLimite(); return;
    }
    setAtivasImpeto(novas);
    setAlertaConstrutor("");
  };
  const editarPassivaImpeto = (campos:Partial<Passiva>) => {
    const nova = {...passivaImpeto,...campos};
    if (!validaConstrucao(perfilHabilidades, ativasImpeto, nova, exploracaoImpeto)) {
      informarLimite(); return;
    }
    setPassivaImpeto(nova);
    setAlertaConstrutor("");
  };
  const editarExploracaoImpeto = (indice:number,campos:Partial<Exploracao>) => {
    const novas = exploracaoImpeto.map((e,i)=>i===indice?{...e,...campos}:e);
    if (!validaConstrucao(perfilHabilidades, ativasImpeto, passivaImpeto, novas)) {
      informarLimite(); return;
    }
    setExploracaoImpeto(novas);
    setAlertaConstrutor("");
  };
  const adicionarExploracaoImpeto = () => {
    const novas = [...exploracaoImpeto, novaExploracao()];
    if(!validaConstrucao(perfilHabilidades,ativasImpeto,passivaImpeto,novas)) {
      informarLimite(); return;
    }
    setExploracaoImpeto(novas);
    setAlertaConstrutor("");
  };
  const removerExploracaoImpeto = (indice:number) => {
    setExploracaoImpeto(exploracaoImpeto.filter((_,i)=>i!==indice));
    setAlertaConstrutor("");
  };
  const propsConstrutor = {
    perfil:perfilHabilidades, ativas:ativasImpeto, passiva:passivaImpeto,
    exploracao:exploracaoImpeto,
    editarAtiva:editarAtivaImpeto, editarPassiva:editarPassivaImpeto,
    editarExploracao:editarExploracaoImpeto,
    adicionarExploracao:adicionarExploracaoImpeto,
    removerExploracao:removerExploracaoImpeto,
  };

  const selecionado = elementos.find((item) => item.id === elemento)!;
  const regraPassiva = regrasPassivas[passiva.modelo];
  const habilidadeVinculada = habilidades[passiva.habilidadeVinculada];
  const vinculoPodeAcertar = habilidadeVinculada && [
    "Ofensiva", "Ofensiva em área", "Controle", "Condição",
  ].includes(regrasModelos[habilidadeVinculada.modelo].tipo);
  const nomeVinculada = habilidadeVinculada?.nome.trim() ||
    `Habilidade ${passiva.habilidadeVinculada + 1}`;
  const gatilhoPassiva = passiva.modelo === "fluxo"
    ? `Acertar ${nomeVinculada} (técnica ativa vinculada).`
    : regraPassiva.gatilho;
  const semControle = passiva.modelo === "preparacao" &&
    !habilidades.some((habilidade) => regrasModelos[habilidade.modelo].tipo === "Controle");
  const semCura = (passiva.modelo === "votoMare" || passiva.modelo === "amparoSolidario") &&
    !habilidades.some((habilidade) => regrasModelos[habilidade.modelo].tipo === "Cura");

  const carregarRetrato = (arquivo?: File) => {
    if (!arquivo) return;

    const imagem = new Image();
    const url = URL.createObjectURL(arquivo);

    imagem.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 750;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }

      const escala = Math.max(
        canvas.width / imagem.width,
        canvas.height / imagem.height
      );
      const largura = imagem.width * escala;
      const altura = imagem.height * escala;
      const x = (canvas.width - largura) / 2;
      const y = (canvas.height - altura) / 2;

      ctx.drawImage(imagem, x, y, largura, altura);
      setFoto(canvas.toDataURL("image/webp", 0.85));
      URL.revokeObjectURL(url);
    };

    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      alert("Não foi possível carregar essa imagem.");
    };

    imagem.src = url;
  };


  const gerarPdf = async () => {
    if (exportandoPdf) return;
    if (!window.confirm("O PDF ainda utiliza o modelo anterior de habilidades e não inclui as técnicas H06/PX nem os novos atributos. Para preservar a ficha editável atual, exporte JSON. Deseja gerar o PDF antigo mesmo assim?")) return;
    setExportandoPdf(true);
    try {
      await exportarFichaPdf({
        nome: nome.trim(),
        elemento,
        classe: arquetipoImpeto || "Ímpeto RPG",
        historia,
        foto,
        hp: recursosCalculados.hp,
        mana: recursosCalculados.energia,
        ca: recursosCalculados.ca,
        regeneracao: `+${recursosCalculados.regeneracao} EN/rodada`,
        ataqueBasico: {
          nome: ataqueBasico.nome,
          dano: recursosCalculados.ataque,
          descricao: ataqueBasico.descricao,
        },
        habilidades: habilidades.map((h) => {
          const regra = regrasModelos[h.modelo];
          return {
            nome: h.nome,
            categoria: regra.tipo,
            modelo: regra.nome,
            acao: regra.acao,
            custo: custoDaTecnica(h.modelo),
            valor: valorDaTecnica(h.modelo, recursosCalculados.ataque),
            rotuloValor: regra.rotuloValor,
            valorAdicional: regra.valorAdicional,
            rotuloAdicional: regra.rotuloAdicional,
            alvos: regra.maxAlvos === 2 ? h.alvos : 1,
            regra: regra.regra,
            efeitoNarrativo: h.efeito,
            observacoes: h.limitacoes,
            condicao: h.modelo === "danoContinuo"
              ? h.nomeCondicao.trim() || condicaoSugeridaPorElemento[elemento]
              : undefined,
            arma: (h.modelo === "criarArma" || h.modelo === "encantarArma")
              ? h.nomeArma.trim() || "Arma não definida"
              : undefined,
            experimental: Boolean(regra.experimental),
          };
        }),
        passiva: {
          nome: passiva.nome,
          modelo: `${regraPassiva.categoria} - ${regraPassiva.nome}`,
          ativacao: gatilhoPassiva,
          efeito: regraPassiva.efeito,
          limites: regraPassiva.limite,
          descricao: passiva.descricao,
          aviso: passiva.modelo === "fluxo" && !vinculoPodeAcertar
            ? "A técnica vinculada precisa poder acertar um alvo."
            : semControle ? "Esta passiva exige uma técnica de Controle."
            : semCura ? "Esta passiva exige uma técnica de Cura."
            : regraPassiva.experimental ? "Passiva experimental: requer avaliação do mestre." : undefined,
        },
      });
    } catch (erro) {
      console.error("Erro ao gerar PDF", erro);
      alert("Não foi possível gerar o PDF. Confira o console do navegador.");
    } finally {
      setExportandoPdf(false);
    }
  };

  return (
    <main className={`app tema-${elemento}`}>
      <input
        ref={seletorJsonRef}
        type="file"
        accept=".json,application/json"
        aria-label="Escolher arquivo JSON de personagem"
        className="arquivo-json-oculto"
        onChange={importarJson}
      />
      <div className="aura" />
      <div className="conteudo">
        <header className={`cabecalho ${mostrandoIdentidade ? "cabecalho-compacto" : ""}`}>
          <div className="emblema-central">
            <img src="/hexatombe-selo-512.png" alt="Selo de Hexatombe: Avatar" />
          </div>
          <p className="subtitulo">ARQUIVOS ESPIRITUAIS</p>
          <h1>HEXATOMBE</h1>
          <p className="universo">A V A T A R</p>
          <div className="linha-ritual" />
          {!mostrandoIdentidade && (
            <>
              <h2>O despertar de um novo destino</h2>
              <p className="introducao">
                Toda jornada começa com uma escolha. Descubra o caminho que seu
                personagem seguirá.
              </p>
            </>
          )}
        </header>

        {!mostrandoIdentidade && (
          <>
        <section className="selecao">
          <h3>Escolha seu elemento</h3>
          <div className="elementos">
            {elementos.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`elemento ${elemento === item.id ? "ativo" : ""}`}
                onClick={() => setElemento(item.id)}
                aria-pressed={elemento === item.id}
              >
                <span className="simbolo">{item.simbolo}</span>
                <span className="nome">{item.nome}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="detalhes">
          <div className="circulo-espiritual">
            <span>{selecionado.simbolo}</span>
          </div>
          <h2>{selecionado.nome}</h2>
          <p>{selecionado.descricao}</p>
          <span className="mensagem">O caminho foi escolhido.</span>
        </section>

          </>
        )}

        {!mostrandoIdentidade ? (
          <div className="acoes">
            <button
              className="botao-principal"
              type="button"
              onClick={() => setMostrandoIdentidade(true)}
            >
              Criar personagem
            </button>
            <button className="botao-json" type="button" onClick={() => seletorJsonRef.current?.click()}>
              Importar ficha JSON
            </button>
          </div>
        ) : (
          <section className="editor-identidade editor-com-abas">
            <nav className="abas-editor" aria-label="Etapas da ficha">
              {abasEditor.map((aba) => (
                <button
                  key={aba.id}
                  type="button"
                  id={`aba-${aba.id}`}
                  className={`aba-editor ${abaAtiva === aba.id ? "selecionada" : ""}`}
                  aria-current={abaAtiva === aba.id ? "step" : undefined}
                  onClick={() => setAbaAtiva(aba.id)}
                >
                  {aba.nome}
                </button>
              ))}
            </nav>
            <div className="acoes-json" aria-label="Arquivo editável da ficha">
              <button className="botao-json" type="button" onClick={exportarJson}>
                Exportar JSON
              </button>
              <button className="botao-json" type="button" onClick={() => seletorJsonRef.current?.click()}>
                Importar JSON
              </button>
              <small>Salve um arquivo editável e abra-o depois, neste ou em outro navegador.</small>
            </div>

            {abaAtiva === "identidade" && (
              <section className="conteudo-aba" aria-labelledby="aba-identidade">
                <h2>Identidade do Personagem</h2>
                <div className="selecao-identidade">
                  <h3>Elemento</h3>
                  <div className="elementos">
                    {elementos.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`elemento ${elemento === item.id ? "ativo" : ""}`}
                        onClick={() => setElemento(item.id)}
                        aria-pressed={elemento === item.id}
                      >
                        <span className="simbolo">{item.simbolo}</span>
                        <span className="nome">{item.nome}</span>
                      </button>
                    ))}
                  </div>
                </div>
            <p className="descricao-editor">
              Seu caminho espiritual começa aqui.
            </p>

            <div className="area-retrato">
              <div className="moldura-retrato">
                {foto ? (
                  <img
                    src={foto}
                    alt="Retrato do personagem"
                    className="imagem-personagem"
                  />
                ) : (
                  <span className="retrato-vazio">✧</span>
                )}
              </div>
              <label htmlFor="foto-personagem">Escolher retrato</label>
              <input
                id="foto-personagem"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  carregarRetrato(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {foto && (
                <button
                  type="button"
                  className="botao-remover"
                  onClick={() => setFoto("")}
                >
                  Remover retrato
                </button>
              )}
            </div>

            <label htmlFor="nome-personagem">Nome do personagem</label>
            <input
              id="nome-personagem"
              type="text"
              placeholder="Digite o nome..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <label htmlFor="historia-personagem">História</label>
            <textarea
              id="historia-personagem"
              placeholder="Conte a história do seu personagem..."
              rows={6}
              value={historia}
              onChange={(e) => setHistoria(e.target.value)}
            />
              </section>
            )}

            {abaAtiva === "arquetipo" && (
              <section className="conteudo-aba aba-arquetipo" aria-labelledby="aba-arquetipo">
                <h2>Arquétipo</h2>
                <section className="painel-arquetipo-impeto" aria-label="Arquétipo e talento T02 do Ímpeto">
                  <div className="cabecalho-arquetipo-impeto">
                    <span className="rotulo-impeto">ÍMPETO RPG 1.0 · ARQUÉTIPOS T02</span>
                    <h3>Arquétipo e talento exclusivo</h3>
                    <p>Escolha um arquétipo e um dos seus três talentos iniciais.
                      Nenhum talento ocupa espaço de habilidade ativa ou passiva,
                      nem concede PA, PR, PC ou PX.</p>
                  </div>
                  <label htmlFor="arquetipo-impeto">Arquétipo</label>
                  <select
                    id="arquetipo-impeto"
                    value={arquetipoImpeto}
                    onChange={(evento) => {
                      const proximo = evento.target.value as ArquetipoImpeto | "";
                      setArquetipoImpeto(proximo);
                      setTalentoArquetipo("");
                    }}
                  >
                    <option value="">Escolha um arquétipo</option>
                    {(Object.keys(ARQUETIPOS_T02) as ArquetipoImpeto[]).map((arquetipo) => (
                      <option key={arquetipo} value={arquetipo}>
                        {arquetipo} — {ARQUETIPOS_T02[arquetipo].descricao}
                      </option>
                    ))}
                  </select>
                  {arquetipoImpeto ? (
                    <fieldset className="grupo-talentos-impeto">
                      <legend>Escolha um talento de {arquetipoImpeto}</legend>
                      {ARQUETIPOS_T02[arquetipoImpeto].talentos.map((talento) => (
                        <label
                          className={`cartao-talento-impeto ${talentoArquetipo === talento.id ? "selecionado" : ""}`}
                          key={talento.id}
                        >
                          <input
                            type="radio"
                            name="talento-arquetipo"
                            checked={talentoArquetipo === talento.id}
                            onChange={() => setTalentoArquetipo(talento.id)}
                          />
                          <span>
                            <strong>{talento.nome}</strong>
                            <small>{talento.efeito}</small>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  ) : (
                    <p className="nota-talento-impeto">O arquétipo ainda não foi escolhido.</p>
                  )}
                  <p className="nota-talento-impeto">
                    Limites T02: efeitos semelhantes não acumulam automaticamente.
                    Talentos que pedem reação usam a reação normal; nenhum concede
                    ação principal extra. Valores sujeitos ao playtest.
                  </p>
                  {arquetipoImpeto && !talentoArquetipo && (
                    <p className="alerta-talento-impeto" role="status">
                      Falta selecionar um dos três talentos deste arquétipo.
                    </p>
                  )}
                </section>

                <section className="painel-vantagens-v01" aria-label="Vantagem universal V01">
                  <div className="cabecalho-vantagem-v01">
                    <span className="rotulo-impeto">HEXATOMBE: AVATAR · VANTAGENS V01</span>
                    <h3>Vantagem universal</h3>
                    <p>Escolha uma vantagem inicial entre as oito opções do playtest.
                      Ela é independente do talento de arquétipo, das cinco habilidades,
                      da passiva e das técnicas de exploração.</p>
                  </div>
                  <div className="grade-vantagens-v01" role="radiogroup" aria-label="Escolha uma vantagem universal">
                    {VANTAGENS_V01.map((vantagem) => (
                      <label key={vantagem.id}
                        className={`cartao-vantagem-v01 ${vantagemUniversal === vantagem.id ? "selecionada" : ""}`}>
                        <input type="radio" name="vantagem-universal"
                          value={vantagem.id}
                          checked={vantagemUniversal === vantagem.id}
                          onChange={() => setVantagemUniversal(vantagem.id)}/>
                        <span>
                          <strong>{vantagem.nome}</strong>
                          <small>{vantagem.beneficio}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                  {vantagemUniversal && <button type="button" className="limpar-vantagem-v01"
                    onClick={() => setVantagemUniversal("")}>
                    Limpar escolha
                  </button>}
                  <p className="nota-talento-impeto">
                    Biblioteca V01 candidata: limites e equivalência dependem de testes.
                    Desvantagens narrativas não concedem vantagens ou pontos extras.
                  </p>
                </section>

              </section>
            )}

            {abaAtiva === "atributos" && (
              <section className="conteudo-aba" aria-labelledby="aba-atributos">
                <h2>Atributos</h2>

                <section className="painel-atributos-impeto" aria-label="Oito atributos do Ímpeto RPG">
                  <div className="painel-impeto-topo">
                    <div>
                      <span className="rotulo-impeto">ÍMPETO RPG 1.0 · ETAPA DE ADAPTAÇÃO</span>
                      <h3>Oito atributos do personagem</h3>
                    </div>
                    <p className="saldo-pa">
                      <strong>{paDisponiveis}</strong> PA restantes
                      <small>{paGastos} de {PA_INICIAL_REFERENCIA} usados</small>
                    </p>
                  </div>
                  <p className="descricao-atributos-impeto">
                    Valores provisórios para Hexatombe: Avatar: base 8, teto 14 na criação e 28 PA
                    para distribuir. Custos por aumento: 9–12 = 1 PA; 13–14 = 2 PA.
                    Os recursos de combate são calculados pelos PR no painel seguinte.
                  </p>
                  <div className="grade-atributos-impeto">
                    {NOMES_ATRIBUTOS_IMPETO.map((nomeAtributo) => {
                      const valor = atributosImpeto[nomeAtributo];
                      const custoProximo = custoPassoAtributo(valor + 1);
                      return (
                        <div className="atributo-impeto" key={nomeAtributo}>
                          <span>{nomeAtributo}</span>
                          <div className="controle-atributo-impeto">
                            <button type="button"
                              aria-label={`Diminuir ${nomeAtributo}`}
                              disabled={valor <= ATRIBUTO_BASE_REFERENCIA}
                              onClick={() => alterarAtributoImpeto(nomeAtributo, -1)}>−</button>
                            <strong aria-label={`${nomeAtributo}: ${valor}`}>{valor}</strong>
                            <button type="button"
                              aria-label={`Aumentar ${nomeAtributo}`}
                              disabled={valor >= ATRIBUTO_TETO_REFERENCIA || custoProximo > paDisponiveis}
                              onClick={() => alterarAtributoImpeto(nomeAtributo, 1)}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <small className="aviso-impeto">
                    O orçamento de atributos e os recursos avançados da campanha Hexatombe: Avatar
                    serão calibrados para dobradores experientes em uma etapa posterior.
                    A distribuição de PA já é salva automaticamente e incluída no JSON.
                  </small>
                </section>


                <section className="painel-derivacao-d01" aria-label="Derivação opcional D01">
                  <div className="cabecalho-derivacao-d01">
                    <span className="rotulo-impeto">HEXATOMBE: AVATAR · DERIVAÇÃO D01</span>
                    <h3>Derivação do personagem</h3>
                    <p>Com um atributo em 12 ou mais, escolha uma das três derivações
                      experimentais. Não consome PA ou PR, não aumenta CA e não modifica o acerto.</p>
                  </div>
                  {atributosDisponiveisD01.length === 0 ? (
                    <p className="aviso-derivacao-d01" role="status">
                      Nenhum atributo chegou a 12. Distribua seus PA para liberar uma derivação.
                    </p>
                  ) : (
                    <>
                      <fieldset className="grupo-derivacoes-d01">
                        <legend>Escolha uma opção (ou nenhuma)</legend>
                        <label className="opcao-derivacao-d01">
                          <input type="radio" name="derivacao-d01" checked={!derivacaoD01.tipo}
                            onChange={() => selecionarDerivacaoD01("")}/>
                          <span><strong>Sem derivação</strong><small>Não aplicar bônus D01.</small></span>
                        </label>
                        {DERIVACOES_D01.map((opcao) => (
                          <label className={`opcao-derivacao-d01 ${derivacaoD01.tipo === opcao.id ? "selecionada" : ""}`}
                            key={opcao.id}>
                            <input type="radio" name="derivacao-d01"
                              checked={derivacaoD01.tipo === opcao.id}
                              onChange={() => selecionarDerivacaoD01(opcao.id)}/>
                            <span><strong>{opcao.nome}</strong><small>{opcao.beneficio}</small></span>
                          </label>
                        ))}
                      </fieldset>
                      {derivacaoD01.tipo !== "" && (
                        <div className="detalhes-derivacao-d01">
                          <label htmlFor="d01-atributo">Atributo que sustenta a derivação
                            <select id="d01-atributo" value={derivacaoD01.atributo}
                              onChange={(evento) => setDerivacaoD01({
                                ...derivacaoD01,
                                atributo: evento.target.value as NomeAtributoImpeto,
                              })}>
                              {atributosDisponiveisD01.map((atributo) =>
                                <option key={atributo} value={atributo}>
                                  {atributo} ({atributosImpeto[atributo]})
                                </option>)}
                            </select>
                          </label>
                          <label htmlFor="d01-justificativa">Justificativa narrativa
                            <textarea id="d01-justificativa" rows={2} maxLength={500}
                              placeholder="Como este atributo se manifesta nessa derivação?"
                              value={derivacaoD01.justificativa}
                              onChange={(evento) => setDerivacaoD01({
                                ...derivacaoD01, justificativa: evento.target.value,
                              })}/>
                          </label>
                          <small>O mestre avalia se a derivação combina com a história.
                            Se o atributo escolhido cair abaixo de 12, a escolha será removida.</small>
                        </div>
                      )}
                    </>
                  )}
                </section>

                <section className="painel-recursos-impeto" aria-label="Distribuição de Pontos de Recursos">
                  <div className="painel-recursos-topo">
                    <div>
                      <span className="rotulo-impeto">ÍMPETO RPG 1.0 · RECURSOS A04 / CA02</span>
                      <h3>Distribuição de recursos (PR)</h3>
                    </div>
                    <p className="saldo-pr" aria-live="polite">
                      <strong>{prRestantes}</strong> PR restantes
                      <small>{prGastos} de {PR_INICIAL_REFERENCIA} usados</small>
                    </p>
                  </div>
                  <p className="descricao-recursos-impeto">
                    Base provisória em calibração para Avatar: 40 HP, 30 EN, CA Base 8, Ataque Base 2d6+2,
                    regeneração 0 e 20 PR. A escala avançada de Hexatombe: Avatar será calibrada
                    separadamente. Os valores mostrados na ficha são calculados pelos PR.
                  </p>
                  <div className="grade-recursos-impeto">
                    {([
                      { id: "hp", nome: "Vida (HP)", valor: `${recursosCalculados.hp} HP`,
                        custo: "+3 HP por 1 PR", escolhido: recursosImpeto.hp },
                      { id: "energia", nome: "Energia de referência (EN)", valor: `${recursosCalculados.energia} EN`,
                        custo: "+5 EN por 1 PR", escolhido: recursosImpeto.energia },
                      { id: "ca", nome: "Classe de Armadura Base (CA)", valor: `CA ${recursosCalculados.ca}`,
                        custo: "Degraus progressivos: 1 / 2 / 3 / 4 / 5 PR", escolhido: recursosImpeto.ca - 8 },
                      { id: "ataqueDados", nome: "Ataque Base", valor: recursosCalculados.ataque,
                        custo: "Primeiro +1d6: 5 PR; segundo: +8 PR", escolhido: recursosImpeto.ataqueDados },
                      { id: "regeneracao", nome: "Regeneração de EN", valor: `+${recursosCalculados.regeneracao} por rodada`,
                        custo: "Primeiro +1: 3 PR; segundo: +6 PR", escolhido: recursosImpeto.regeneracao },
                    ] as { id: RecursoImpeto; nome: string; valor: string; custo: string; escolhido: number }[]).map((recurso) => (
                      <div className="linha-recurso-impeto" key={recurso.id}>
                        <div className="info-recurso-impeto">
                          <strong>{recurso.nome}</strong>
                          <span>{recurso.valor}</span>
                          <small>{recurso.custo}</small>
                        </div>
                        <div className="controle-recurso-impeto">
                          <button type="button" aria-label={`Reduzir ${recurso.nome}`}
                            onClick={() => alterarRecursoImpeto(recurso.id, -1)}
                            disabled={!podeReduzirRecursoImpeto(recurso.id)}>−</button>
                          <span aria-label={`${recurso.nome}: ${recurso.escolhido} melhorias`}>{recurso.escolhido}</span>
                          <button type="button" aria-label={`Aumentar ${recurso.nome}`}
                            onClick={() => alterarRecursoImpeto(recurso.id, 1)}
                            disabled={!podeAumentarRecursoImpeto(recurso.id)}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <small className="aviso-recursos-impeto">
                    A CA Base é escolhida apenas na criação e permanece fixa durante a campanha.
                    Energia acumulada pode ultrapassar o valor de referência; regeneração ocorre
                    uma vez por rodada. A derivação D01 escolhida acima já altera HP, EN ou dano básico;
                    os investimentos em PR são preservados no salvamento automático e no JSON.
                  </small>
                </section>
            <section className="secao-combate">
              <div className="grupo-habilidade">
                <h3>Ataque Básico</h3>
                <p className="descricao-editor">Não consome Energia (EN).</p>

                <label htmlFor="ataque-nome">Nome do ataque</label>
                <input
                  id="ataque-nome"
                  value={ataqueBasico.nome}
                  onChange={(e) =>
                    setAtaqueBasico((anterior) => ({
                      ...anterior,
                      nome: e.target.value,
                    }))
                  }
                  placeholder="Ex: Punho Flamejante"
                />

                <p>
                  <strong>Dano básico:</strong> {recursosCalculados.ataque}
                </p>
                <p>Custo: 0 EN</p>

                <label htmlFor="ataque-descricao">Descrição</label>
                <textarea
                  id="ataque-descricao"
                  rows={2}
                  value={ataqueBasico.descricao}
                  onChange={(e) =>
                    setAtaqueBasico((anterior) => ({
                      ...anterior,
                      descricao: e.target.value,
                    }))
                  }
                  placeholder="Descreva o ataque..."
                />
              </div>
            </section>
              </section>
            )}


            {abaAtiva === "pericias" && (
              <section className="conteudo-aba aba-pericias" aria-labelledby="aba-pericias">
                <h2>Perícias</h2>
                <div className="painel-pericias-impeto">
                  <div className="painel-pericias-topo">
                    <div>
                      <span className="rotulo-impeto">ÍMPETO RPG 1.0 · TREINAMENTO</span>
                      <h3>Treinamento do personagem</h3>
                      <p>Distribua PT para especializar seu personagem. Perícias não treinadas
                        continuam disponíveis para testes comuns.</p>
                    </div>
                    <div className="saldo-pt" aria-live="polite">
                      <strong>{ptRestantes}</strong>
                      <span>PT restantes</span>
                      <small>{ptGastos} de {PT_INICIAL_REFERENCIA} usados</small>
                    </div>
                  </div>

                  <div className="referencia-treinamento">
                    <span>Não treinado <strong>+0</strong> · 0 PT</span>
                    <span>Treinado <strong>+2</strong> · 1 PT total</span>
                    <span>Especialista <strong>+4</strong> · 2 PT totais</span>
                  </div>

                  <div className="grupos-pericias-impeto">
                    {GRUPOS_PERICIAS_IMPETO.map((grupo) => (
                      <section key={grupo.nome} className="grupo-pericias-impeto">
                        <h3>{grupo.nome}</h3>
                        <div className="lista-pericias-impeto">
                          {grupo.pericias.map((pericia) => {
                            const grau = periciasImpeto[pericia];
                            return (
                              <div className="linha-pericia-impeto" key={pericia}>
                                <div className="info-pericia-impeto">
                                  <strong>{pericia}</strong>
                                  <small>{nomeGrauPericia(grau)} · bônus +{bonusGrauPericia(grau)}</small>
                                </div>
                                <div className="controle-pericia-impeto">
                                  <button
                                    type="button"
                                    aria-label={`Reduzir treinamento em ${pericia}`}
                                    onClick={() => alterarGrauPericia(pericia, -1)}
                                    disabled={grau === 0}
                                  >−</button>
                                  <span aria-label={`${pericia}: ${nomeGrauPericia(grau)}`}>{grau}/2</span>
                                  <button
                                    type="button"
                                    aria-label={`Aumentar treinamento em ${pericia}`}
                                    onClick={() => alterarGrauPericia(pericia, 1)}
                                    disabled={grau === 2 || ptRestantes === 0}
                                  >+</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                  <p className="nota-pericias-impeto">
                    Testes: 1d20 + atributo adequado + bônus da perícia.
                    A combinação depende da situação, não de uma associação fixa.
                    Os 4 PT são a referência inicial do livro e poderão ser adaptados
                    à escala de personagens experientes da campanha.
                    Esta distribuição já é salva no navegador e no JSON.
                  </p>
                </div>
              </section>
            )}

            {abaAtiva === "habilidades" && (
              <section className="conteudo-aba aba-habilidades" aria-labelledby="aba-habilidades">
                <CombateImpeto {...propsConstrutor} />
                {alertaConstrutor && <p className="impeto-alerta" role="alert">{alertaConstrutor}</p>}
              </section>
            )}

            {abaAtiva === "exploracao" && (
              <section className="conteudo-aba aba-exploracao" aria-labelledby="aba-exploracao">
                <ExploracaoImpeto {...propsConstrutor} />
                {alertaConstrutor && <p className="impeto-alerta" role="alert">{alertaConstrutor}</p>}
              </section>
            )}

            {abaAtiva === "previa" && (
              <section className="conteudo-aba aba-previa" aria-labelledby="aba-previa">
                <div className="previa-introducao">
                  <span className="previa-sobretitulo">ARQUIVO ESPIRITUAL · REGISTRO DO PERSONAGEM</span>
                  <h2>Prévia do Personagem</h2>
                  <p>Confira seu registro antes de exportar. Recursos e ataque básico são calculados pelos PR.</p>
                  <button className="botao-gerar-pdf" type="button" onClick={gerarPdf} disabled={exportandoPdf}>
                    {exportandoPdf ? "Gerando PDF..." : "📜 Gerar ficha em PDF"}
                  </button>
                  <small className="pdf-ajuda">A4 • Layout antigo do PDF; novos atributos, talentos e perícias entrarão depois</small>
                </div>

                <section className="previa-identidade" aria-label="Identidade do personagem">
                  <div className="previa-retrato">
                    {foto ? (
                      <img src={foto} alt={`Retrato de ${nome.trim() || "personagem sem nome"}`} />
                    ) : (
                      <div className="previa-retrato-vazio">
                        <span className="previa-simbolo">{selecionado.simbolo}</span>
                        <small>Sem retrato</small>
                      </div>
                    )}
                  </div>
                  <div className="previa-identidade-texto">
                    <span className="previa-rotulo">VÍNCULO ELEMENTAL</span>
                    <h3>{nome.trim() || "Personagem sem nome"}</h3>
                    <div className="previa-chips">
                      <span className="previa-chip-elemento">{selecionado.simbolo} {selecionado.nome}</span>
                      {arquetipoImpeto && <span>{arquetipoImpeto}</span>}
                    </div>
                    <div className="previa-historia">
                      <strong>História</strong>
                      <p>{historia.trim() || "A história deste personagem ainda não foi escrita."}</p>
                    </div>
                    <button className="previa-editar" type="button" onClick={() => setAbaAtiva("identidade")}>
                      Editar identidade
                    </button>
                  </div>
                </section>


                <section className="previa-secao" aria-label="Arquétipo Ímpeto">
                  <div className="previa-secao-topo">
                    <h3>Arquétipo e talento</h3>
                    <button className="previa-editar" type="button" onClick={() => setAbaAtiva("arquetipo")}>
                      Editar arquétipo
                    </button>
                  </div>
                  <div className="previa-arquetipo-impeto">
                    <strong>Ímpeto RPG · Arquétipo T02</strong>
                    <p>{arquetipoImpeto || "Ainda não escolhido"}</p>
                    {talentoT02Escolhido ? (
                      <p><strong>{talentoT02Escolhido.nome}:</strong> {talentoT02Escolhido.efeito}</p>
                    ) : (
                      <small>Nenhum talento T02 selecionado.</small>
                    )}
                    <small>Talento independente das cinco ativas e da passiva. Não incluído no PDF legado nesta etapa.</small>
                  </div>

                  <div className="previa-vantagem-v01">
                    <strong>Vantagem universal · V01</strong>
                    {vantagemUniversal ? (
                      <>
                        <p>{VANTAGENS_V01.find((item) => item.id === vantagemUniversal)?.nome}</p>
                        <small>{VANTAGENS_V01.find((item) => item.id === vantagemUniversal)?.beneficio}</small>
                      </>
                    ) : <small>Nenhuma vantagem universal escolhida ainda.</small>}
                  </div>
                </section>

                <section className="previa-secao" aria-labelledby="previa-titulo-combate">
                  <div className="previa-secao-topo">
                    <h3 id="previa-titulo-combate">Atributos e recursos de combate</h3>
                    <button className="previa-editar" type="button" onClick={() => setAbaAtiva("atributos")}>
                      Editar atributos
                    </button>
                  </div>

                  <div className="previa-impeto-atributos">
                    <strong>Ímpeto RPG · Atributos universais</strong>
                    <p>{NOMES_ATRIBUTOS_IMPETO.map((chave) =>
                      `${chave}: ${atributosImpeto[chave]}`).join(" · ")}</p>
                    <small>PA: {paGastos} usados / {PA_INICIAL_REFERENCIA} disponíveis.
                      Os recursos de combate são determinados pelos PR.</small>
                  </div>


                  <div className="previa-derivacao-d01">
                    <strong>Derivação D01</strong>
                    {derivacaoD01.tipo ? (
                      <>
                        <p>
                          {DERIVACOES_D01.find((item) => item.id === derivacaoD01.tipo)?.nome}
                          {" · "}
                          {DERIVACOES_D01.find((item) => item.id === derivacaoD01.tipo)?.beneficio}
                          {" · "}
                          {derivacaoD01.atributo} {atributosImpeto[derivacaoD01.atributo as NomeAtributoImpeto]}
                        </p>
                        {derivacaoD01.justificativa && <small>{derivacaoD01.justificativa}</small>}
                      </>
                    ) : <small>Nenhuma derivação escolhida.</small>}
                  </div>
                  <div className="previa-recursos-impeto">
                    <strong>Hexatombe: Avatar · Recursos em PR (calibração)</strong>
                    <p>
                      HP {recursosCalculados.hp} · EN {recursosCalculados.energia} ·
                      CA Base {recursosCalculados.ca} · Ataque {recursosCalculados.ataque} ·
                      Regeneração +{recursosCalculados.regeneracao}/rodada
                    </p>
                    <small>{prGastos} PR gastos de {PR_INICIAL_REFERENCIA}.
                      Os valores base e os orçamentos PA, PR e PT ainda serão calibrados para a escala avançada de Avatar.</small>
                  </div>
                  <div className="previa-ataque">
                    <div>
                      <span className="previa-rotulo">ATAQUE BÁSICO</span>
                      <strong>{ataqueBasico.nome.trim() || "Ataque sem nome"}</strong>
                      {ataqueBasico.descricao.trim() && <p>{ataqueBasico.descricao}</p>}
                    </div>
                    <div className="previa-ataque-badges">
                      <span>{recursosCalculados.ataque} dano</span>
                      <span>0 EN</span>
                    </div>
                  </div>
                </section>


                <section className="previa-secao previa-pericias-impeto" aria-label="Perícias do Ímpeto">
                  <div className="previa-secao-topo">
                    <h3>Perícias</h3>
                    <button className="previa-editar" type="button" onClick={() => setAbaAtiva("pericias")}>
                      Editar perícias
                    </button>
                  </div>
                  <p>PT: {ptGastos} de {PT_INICIAL_REFERENCIA} usados · {ptRestantes} restantes</p>
                  <div className="previa-lista-pericias">
                    {NOMES_PERICIAS_IMPETO.filter((pericia) => periciasImpeto[pericia] > 0).map((pericia) => (
                      <span key={pericia}>
                        {pericia}: {nomeGrauPericia(periciasImpeto[pericia])} (+{bonusGrauPericia(periciasImpeto[pericia])})
                      </span>
                    ))}
                    {ptGastos === 0 && <small>Não há perícias treinadas ainda.</small>}
                  </div>
                </section>

                <section className="previa-secao" aria-label="Resumo de habilidades e exploração">
                  <ResumoHabilidadesImpeto perfil={perfilHabilidades} ativas={ativasImpeto}
                    passiva={passivaImpeto} exploracao={exploracaoImpeto} />
                  <button className="previa-editar" type="button"
                    onClick={() => setAbaAtiva("habilidades")}>Editar habilidades</button>
                  <button className="previa-editar" type="button"
                    onClick={() => setAbaAtiva("exploracao")}>Editar exploração</button>
                </section>
                <p className="previa-rodape">Este resumo é para consulta no editor. Gere um PDF para impressão ou exporte um JSON para continuar a edição depois.</p>
              </section>
            )}

            <div className="navegacao-editor">
              {abaAtiva !== "identidade" && (
                <button
                  type="button"
                  onClick={() => setAbaAtiva(abasEditor[abasEditor.findIndex((aba) => aba.id === abaAtiva) - 1].id)}
                >
                  ← Anterior
                </button>
              )}
              {abaAtiva !== "previa" && (
                <button
                  type="button"
                  className="proxima-aba"
                  onClick={() => {
                    const indiceAtual = abasEditor.findIndex((aba) => aba.id === abaAtiva);
                    const proxima = abasEditor[indiceAtual + 1];
                    if (!proxima) return;
                    setAbaAtiva(proxima.id);
                    // Depois da troca de etapa, voltar ao topo da página.
                    window.requestAnimationFrame(() => window.scrollTo(0, 0));
                  }}
                >
                  Próxima etapa →
                </button>
              )}
            </div>

            <button
              className="botao-voltar"
              type="button"
              onClick={() => setMostrandoIdentidade(false)}
            >
              Voltar
            </button>
          </section>
        )}

        <footer>
          <p>HEXATOMBE: AVATAR • CRIADOR DE PERSONAGENS</p>
        </footer>
      </div>
    </main>
  );
}

export default App;
