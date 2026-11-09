import { useState } from "react";
import { exportarFichaPdf } from "./pdf/exportarFichaPdf";
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
type Classe = "Lutador" | "Linha de Frente" | "Conjurador";
type TipoHabilidade =
  | "Ofensiva"
  | "Ofensiva em área"
  | "Controle"
  | "Condição"
  | "Defesa"
  | "Buff"
  | "Cura"
  | "Utilidade";

type TipoAcao = "Principal" | "Buff";
type ModeloId =
  | "golpe"
  | "area"
  | "imobilizar"
  | "empurrar"
  | "escudo"
  | "reducao"
  | "ca"
  | "buffDano"
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
  custo: number | Record<Classe, number>;
  valor: string | Record<Classe, string>;
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

const atributosPorClasse: Record<
  Classe,
  { hp: number; mana: number; ca: number; regeneracao: string }
> = {
  Lutador: { hp: 135, mana: 130, ca: 10, regeneracao: "1d4" },
  "Linha de Frente": { hp: 145, mana: 120, ca: 11, regeneracao: "1d6" },
  Conjurador: { hp: 130, mana: 180, ca: 10, regeneracao: "1d10" },
};

const danoBasicoPorClasse: Record<Classe, string> = {
  Lutador: "2d6+6",
  "Linha de Frente": "1d10+6",
  Conjurador: "2d6+6",
};

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
  cura: {
    nome: "Cura individual", tipo: "Cura", acao: "Principal",
    custo: 30, valor: "2d6+3 HP", rotuloValor: "Cura", maxAlvos: 1,
    regra: "Cura você ou um aliado, sem ultrapassar o HP máximo. Consome ação principal, não buff.",
  },
  curaArea: {
    nome: "Cura em área (até 2 aliados)", tipo: "Cura", acao: "Principal",
    custo: 45, valor: "1d6+3 HP", rotuloValor: "Cura por aliado", maxAlvos: 2,
    regra: "Escolha até 2 aliados próximos, podendo incluir você. Role a cura separadamente para cada alvo selecionado. Pague o custo de Mana uma única vez e use sua ação principal. Não ultrapassa o HP máximo, não cura inimigos e não é buff.",
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
    regra: "Cria uma arma com o elemento (ou prepara equipamento, para não dobradores) até o fim da cena. Usá-la substitui seu ataque básico normal: mesmo dano da classe, sem ataque extra e sem bônus. No máximo uma arma criada/preparada ativa por personagem; criar outra substitui a anterior. O mestre decide se a forma e o material são plausíveis.",
    experimental: true,
  },
  encantarArma: {
    nome: "Encantar ou reforçar arma", tipo: "Utilidade", acao: "Buff",
    custo: 10, valor: "+4 dano", rotuloValor: "Bônus na arma", maxAlvos: 1,
    regra: "Reforça uma arma com dobra elemental (ou preparação tática, para não dobradores). O próximo ataque que acertar neste turno recebe +4 dano. Se errar ou não atacar, perde o bônus; não acumula com Reforço ofensivo nem com outro encantamento. Não concede ataque extra.",
    experimental: true,
  },
};

const modelosPorTipo: Record<TipoHabilidade, ModeloId[]> = {
  Ofensiva: ["golpe"],
  "Ofensiva em área": ["area"],
  Controle: ["imobilizar", "empurrar"],
  Condição: ["danoContinuo"],
  Defesa: ["escudo", "reducao", "ca"],
  Buff: ["buffDano"],
  Cura: ["cura", "curaArea"],
  Utilidade: ["movimento", "criarArma", "encantarArma"],
};

const custoDaTecnica = (modelo: ModeloId, classe: Classe) => {
  const custo = regrasModelos[modelo].custo;
  return typeof custo === "number" ? custo : custo[classe];
};

const valorDaTecnica = (modelo: ModeloId, classe: Classe) => {
  const valor = regrasModelos[modelo].valor;
  return typeof valor === "string" ? valor : valor[classe];
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
  | "preparacao";

type RegraPassiva = {
  nome: string;
  gatilho: string;
  efeito: string;
  limite: string;
};

const regrasPassivas: Record<ModeloPassivaId, RegraPassiva> = {
  ritmo: {
    nome: "Ritmo de Combate",
    gatilho: "Acertar o mesmo alvo com ataque de alvo único em dois turnos consecutivos.",
    efeito: "+2 de dano no segundo ataque acertado.",
    limite: "Erro, troca de alvo ou ataque em área reiniciam a sequência. Não acumula e não gera ataques extras.",
  },
  protecao: {
    nome: "Proteção Espiritual",
    gatilho: "Acertar uma técnica ofensiva.",
    efeito: "Recebe 1d4+2 de escudo temporário.",
    limite: "No máximo uma ativação por rodada. Dura até o início do seu próximo turno. Escudos não acumulam: mantém-se o maior.",
  },
  fluxo: {
    nome: "Fluxo de Energia",
    gatilho: "Acertar a técnica ativa vinculada escolhida para a passiva.",
    efeito: "O próximo ataque básico que acertar recebe +1d6 de dano.",
    limite: "No máximo uma ativação por rodada. Expira ao fim do próximo turno. Não acumula e não gera ataque extra.",
  },
  instinto: {
    nome: "Instinto Defensivo",
    gatilho: "Um ataque inimigo errar você.",
    efeito: "O próximo ataque que acertar recebe +1d4 de dano.",
    limite: "No máximo uma ativação por rodada. Expira ao fim do próximo turno, mesmo se o ataque errar. Não acumula.",
  },
  preparacao: {
    nome: "Preparação Tática",
    gatilho: "Acertar uma técnica de controle.",
    efeito: "O próximo ataque básico que acertar recebe +1d6 de dano.",
    limite: "No máximo uma ativação por rodada. Expira ao fim do próximo turno. Não acumula e não gera ataque extra.",
  },
};

type AbaEditor = "identidade" | "combate" | "habilidades" | "previa";

const abasEditor: { id: AbaEditor; nome: string }[] = [
  { id: "identidade", nome: "Identidade" },
  { id: "combate", nome: "Combate" },
  { id: "habilidades", nome: "Habilidades" },
  { id: "previa", nome: "Prévia" },
];

function App() {
  const [elemento, setElemento] = useState<Elemento>("agua");
  const [mostrandoIdentidade, setMostrandoIdentidade] = useState(false);
  const [nome, setNome] = useState("");
  const [classe, setClasse] = useState<Classe>("Lutador");
  const [historia, setHistoria] = useState("");
  const [foto, setFoto] = useState("");
  const [abaAtiva, setAbaAtiva] = useState<AbaEditor>("identidade");
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [habilidadeAberta, setHabilidadeAberta] = useState<number | "passiva" | null>(0);

  // Os hooks devem ficar dentro do componente App.
  const [ataqueBasico, setAtaqueBasico] = useState({
    nome: "",
    descricao: "",
  });

  const [habilidades, setHabilidades] = useState<Habilidade[]>(() => [
    criarHabilidade("golpe"),
    criarHabilidade("area"),
    criarHabilidade("imobilizar"),
    criarHabilidade("ca"),
    criarHabilidade("buffDano"),
  ]);

  const [passiva, setPassiva] = useState<{
    nome: string;
    modelo: ModeloPassivaId;
    descricao: string;
    habilidadeVinculada: number;
  }>({
    nome: "",
    modelo: "protecao",
    descricao: "",
    habilidadeVinculada: 0,
  });

  const atualizarHabilidade = (
    indice: number,
    alteracoes: Partial<Habilidade>
  ) => {
    setHabilidades((anteriores) =>
      anteriores.map((habilidade, i) =>
        i === indice ? { ...habilidade, ...alteracoes } : habilidade
      )
    );
  };

  const selecionado = elementos.find((item) => item.id === elemento)!;
  const atributos = atributosPorClasse[classe];
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
    setExportandoPdf(true);
    try {
      await exportarFichaPdf({
        nome: nome.trim(),
        elemento,
        classe,
        historia,
        foto,
        ...atributos,
        ataqueBasico: {
          nome: ataqueBasico.nome,
          dano: danoBasicoPorClasse[classe],
          descricao: ataqueBasico.descricao,
        },
        habilidades: habilidades.map((h) => {
          const regra = regrasModelos[h.modelo];
          return {
            nome: h.nome,
            categoria: regra.tipo,
            modelo: regra.nome,
            acao: regra.acao,
            custo: custoDaTecnica(h.modelo, classe),
            valor: valorDaTecnica(h.modelo, classe),
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
          modelo: regraPassiva.nome,
          ativacao: gatilhoPassiva,
          efeito: regraPassiva.efeito,
          limites: regraPassiva.limite,
          descricao: passiva.descricao,
          aviso: passiva.modelo === "fluxo" && !vinculoPodeAcertar
            ? "A técnica vinculada precisa poder acertar um alvo."
            : semControle ? "Esta passiva exige uma técnica de Controle." : undefined,
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

            <label htmlFor="classe-personagem">Classe</label>
            <select
              id="classe-personagem"
              value={classe}
              onChange={(e) => setClasse(e.target.value as Classe)}
            >
              <option value="Lutador">Lutador</option>
              <option value="Linha de Frente">Linha de Frente</option>
              <option value="Conjurador">Conjurador</option>
            </select>

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

            {abaAtiva === "combate" && (
              <section className="conteudo-aba" aria-labelledby="aba-combate">
                <h2>Combate</h2>
                <div className="atributos-ficha">
                  <div className="atributo"><span>HP</span><strong>{atributos.hp}</strong></div>
                  <div className="atributo"><span>Mana</span><strong>{atributos.mana}</strong></div>
                  <div className="atributo"><span>CA</span><strong>{atributos.ca}</strong></div>
                </div>
                <p className="regeneracao">
                  Regeneração: <strong>{atributos.regeneracao} por turno</strong>
                </p>
            <section className="secao-combate">
              <div className="grupo-habilidade">
                <h3>Ataque Básico</h3>
                <p className="descricao-editor">Não consome Mana.</p>

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
                  <strong>Dano básico:</strong> {danoBasicoPorClasse[classe]}
                </p>
                <p>Custo: 0 Mana</p>

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

            {abaAtiva === "habilidades" && (
              <section className="conteudo-aba aba-habilidades" aria-labelledby="aba-habilidades">
                <h2>Habilidades</h2>
                <div className="panorama-habilidades" aria-label="Estrutura da ficha">
                  <span><strong>05</strong> técnicas ativas</span>
                  <span><strong>01</strong> passiva</span>
                  <span className="estado-playtest">Valores em playtest</span>
                </div>
                <section className="secao-combate">
              <h3 className="titulo-tecnicas">Habilidades Ativas</h3>
              <p className="descricao-editor">
                Os valores de Mana, dano, cura, escudo e condições são definidos pelo tipo de
                técnica e pela classe. Criar e encantar armas respeita o dano básico e
                o limite de um buff por turno. A descrição não concede efeitos extras.
              </p>

              {habilidades.map((habilidade, indice) => {
                const modelo = regrasModelos[habilidade.modelo];
                return (
                  <div
                    className={`grupo-habilidade cartao-habilidade ${habilidadeAberta === indice ? "aberta" : ""}`}
                    key={indice}
                    data-tipo={modelo.tipo}
                  >
                    <button
                      type="button"
                      className="cabecalho-habilidade"
                      aria-expanded={habilidadeAberta === indice}
                      aria-controls={`corpo-habilidade-${indice}`}
                      onClick={() => setHabilidadeAberta(habilidadeAberta === indice ? null : indice)}
                    >
                      <span className="numero-habilidade">{indice + 1}</span>
                      <span className="texto-habilidade">
                        <strong>{habilidade.nome.trim() || `Habilidade ${indice + 1}`}</strong>
                        <small>{modelo.nome}</small>
                      </span>
                      <span className="resumo-habilidade-cabecalho">
                        <span className="etiqueta-tipo">{modelo.tipo}</span>
                        <span className="etiqueta-mana">{custoDaTecnica(habilidade.modelo, classe)} Mana</span>
                        <span className="etiqueta-valor">{valorDaTecnica(habilidade.modelo, classe)}</span>
                      </span>
                      <span className="icone-expandir" aria-hidden="true">{habilidadeAberta === indice ? "−" : "+"}</span>
                    </button>
                    {habilidadeAberta === indice && (
                      <div id={`corpo-habilidade-${indice}`} className="corpo-habilidade">

                    <label htmlFor={`skill-${indice}-nome`}>Nome</label>
                    <input
                      id={`skill-${indice}-nome`}
                      value={habilidade.nome}
                      onChange={(e) =>
                        atualizarHabilidade(indice, { nome: e.target.value })
                      }
                      placeholder="Ex: Barreira de Rocha"
                    />

                    <label htmlFor={`skill-${indice}-tipo`}>Categoria</label>
                    <select
                      id={`skill-${indice}-tipo`}
                      value={modelo.tipo}
                      onChange={(e) => {
                        const tipo = e.target.value as TipoHabilidade;
                        atualizarHabilidade(indice, {
                          modelo: modelosPorTipo[tipo][0],
                          alvos: 1,
                        });
                      }}
                    >
                      {(Object.keys(modelosPorTipo) as TipoHabilidade[]).map(
                        (tipo) => <option key={tipo} value={tipo}>{tipo}</option>
                      )}
                    </select>

                    <label htmlFor={`skill-${indice}-modelo`}>Efeito mecânico</label>
                    <select
                      id={`skill-${indice}-modelo`}
                      value={habilidade.modelo}
                      onChange={(e) =>
                        atualizarHabilidade(indice, {
                          modelo: e.target.value as ModeloId,
                          alvos: e.target.value === "curaArea" ? 2 : 1,
                        })
                      }
                    >
                      {modelosPorTipo[modelo.tipo].map((opcao) => (
                        <option key={opcao} value={opcao}>
                          {regrasModelos[opcao].nome}
                        </option>
                      ))}
                    </select>

                    <p><strong>Uso no turno:</strong> {modelo.acao === "Buff" ? "Buff opcional" : "Ação principal"}</p>
                    <div className="linha-campos">
                      <div>
                        <label htmlFor={`skill-${indice}-mana`}>Custo de Mana</label>
                        <input
                          id={`skill-${indice}-mana`}
                          type="number"
                          value={custoDaTecnica(habilidade.modelo, classe)}
                          readOnly
                        />
                      </div>
                      <div>
                        <label htmlFor={`skill-${indice}-valor`}>
                          {modelo.rotuloValor}
                        </label>
                        <input
                          id={`skill-${indice}-valor`}
                          value={valorDaTecnica(habilidade.modelo, classe)}
                          readOnly
                        />
                      </div>
                    </div>

                    {modelo.valorAdicional && (
                      <p className="efeito-extra-habilidade">
                        <strong>{modelo.rotuloAdicional}:</strong>{" "}
                        {modelo.valorAdicional}
                      </p>
                    )}

                    {habilidade.modelo === "danoContinuo" && (
                      <>
                        <label htmlFor={`skill-${indice}-condicao`}>
                          Nome da condição (apenas narrativo)
                        </label>
                        <input
                          id={`skill-${indice}-condicao`}
                          value={habilidade.nomeCondicao}
                          onChange={(e) =>
                            atualizarHabilidade(indice, { nomeCondicao: e.target.value })
                          }
                          placeholder={`Ex.: ${condicaoSugeridaPorElemento[elemento]}`}
                          maxLength={60}
                        />
                        <p>
                          <strong>Importante:</strong> o nome não muda a mecânica.
                          Dano contínuo de 1d4 uma vez, sem efeitos extras.
                        </p>
                      </>
                    )}

                    {(habilidade.modelo === "criarArma" ||
                      habilidade.modelo === "encantarArma") && (
                      <>
                        <label htmlFor={`skill-${indice}-arma`}>
                          {habilidade.modelo === "criarArma"
                            ? "Nome da arma criada ou preparada"
                            : "Nome da arma encantada ou reforçada"}
                        </label>
                        <input
                          id={`skill-${indice}-arma`}
                          value={habilidade.nomeArma}
                          onChange={(e) =>
                            atualizarHabilidade(indice, { nomeArma: e.target.value })
                          }
                          placeholder={elemento === "neutro"
                            ? "Ex.: Lança retrátil"
                            : "Ex.: Espada de gelo, lança de pedra..."}
                          maxLength={80}
                        />
                      </>
                    )}

                    {modelo.maxAlvos === 2 ? (
                      <>
                        <label htmlFor={`skill-${indice}-alvos`}>{habilidade.modelo === "curaArea" ? "Quantidade de aliados" : "Quantidade de alvos"}</label>
                        <select
                          id={`skill-${indice}-alvos`}
                          value={habilidade.alvos}
                          onChange={(e) =>
                            atualizarHabilidade(indice, {
                              alvos: Number(e.target.value) as 1 | 2,
                            })
                          }
                        >
                          <option value={1}>{habilidade.modelo === "curaArea" ? "1 aliado" : "1 alvo"}</option>
                          <option value={2}>{habilidade.modelo === "curaArea" ? "2 aliados" : "2 alvos"}</option>
                        </select>
                      </>
                    ) : (
                      <p><strong>Alvos:</strong> 1</p>
                    )}

                    <p className="regra-habilidade"><strong>Regra:</strong> {modelo.regra}</p>
                    {modelo.experimental && (
                      <p className="nota-playtest"><strong>Em playtest:</strong> valor provisório, sujeito à aprovação do mestre.</p>
                    )}

                    <label htmlFor={`skill-${indice}-efeito`}>Descrição narrativa</label>
                    <textarea
                      id={`skill-${indice}-efeito`}
                      rows={3}
                      value={habilidade.efeito}
                      onChange={(e) =>
                        atualizarHabilidade(indice, { efeito: e.target.value })
                      }
                      placeholder="Como seu personagem realiza essa técnica?"
                    />

                    <label htmlFor={`skill-${indice}-limites`}>Observações para o mestre</label>
                    <textarea
                      id={`skill-${indice}-limites`}
                      rows={2}
                      value={habilidade.limitacoes}
                      onChange={(e) =>
                        atualizarHabilidade(indice, { limitacoes: e.target.value })
                      }
                      placeholder="Condições narrativas ou ideias para revisão"
                    />
                      </div>
                    )}
                  </div>
                );
              })}

              <div
                className={`grupo-habilidade cartao-habilidade ${habilidadeAberta === "passiva" ? "aberta" : ""}`}
                data-tipo="Passiva"
              >
                <button
                  type="button"
                  className="cabecalho-habilidade"
                  aria-expanded={habilidadeAberta === "passiva"}
                  aria-controls="corpo-passiva"
                  onClick={() => setHabilidadeAberta(habilidadeAberta === "passiva" ? null : "passiva")}
                >
                  <span className="numero-habilidade">✦</span>
                  <span className="texto-habilidade">
                    <strong>{passiva.nome.trim() || "Habilidade Passiva"}</strong>
                    <small>{regraPassiva.nome}</small>
                  </span>
                  <span className="resumo-habilidade-cabecalho">
                    <span className="etiqueta-tipo">Passiva</span>
                    <span className="etiqueta-mana">0 Mana</span>
                    <span className="etiqueta-valor">Sem ação</span>
                  </span>
                  <span className="icone-expandir" aria-hidden="true">
                    {habilidadeAberta === "passiva" ? "−" : "+"}
                  </span>
                </button>

                {habilidadeAberta === "passiva" && (
                  <div id="corpo-passiva" className="corpo-habilidade">
                    <label htmlFor="passiva-nome">Nome da passiva</label>
                    <input
                      id="passiva-nome"
                      value={passiva.nome}
                      maxLength={80}
                      onChange={(e) => setPassiva((anterior) => ({
                        ...anterior,
                        nome: e.target.value,
                      }))}
                      placeholder="Ex.: Armadura Espiritual"
                    />

                    <label htmlFor="passiva-modelo">Efeito mecânico</label>
                    <select
                      id="passiva-modelo"
                      value={passiva.modelo}
                      onChange={(e) => setPassiva((anterior) => ({
                        ...anterior,
                        modelo: e.target.value as ModeloPassivaId,
                      }))}
                    >
                      {(Object.keys(regrasPassivas) as ModeloPassivaId[]).map((id) => (
                        <option key={id} value={id}>{regrasPassivas[id].nome}</option>
                      ))}
                    </select>

                    {passiva.modelo === "fluxo" && (
                      <>
                        <label htmlFor="passiva-vinculo">Técnica ativa vinculada</label>
                        <select
                          id="passiva-vinculo"
                          value={passiva.habilidadeVinculada}
                          onChange={(e) => setPassiva((anterior) => ({
                            ...anterior,
                            habilidadeVinculada: Number(e.target.value),
                          }))}
                        >
                          {habilidades.map((habilidade, indice) => (
                            <option
                              key={indice}
                              value={indice}
                              disabled={![
                                "Ofensiva", "Ofensiva em área", "Controle", "Condição",
                              ].includes(regrasModelos[habilidade.modelo].tipo)}
                            >
                              {indice + 1}. {habilidade.nome.trim() || `Habilidade ${indice + 1}`}
                            </option>
                          ))}
                        </select>
                        {!vinculoPodeAcertar && (
                          <p className="aviso-passiva" role="alert">
                            Escolha uma técnica ofensiva, de controle ou de condição que possa acertar um alvo.
                          </p>
                        )}
                      </>
                    )}
                    {semControle && (
                      <p className="aviso-passiva" role="alert">
                        Preparação Tática precisa de ao menos uma técnica de Controle entre as cinco habilidades.
                      </p>
                    )}

                    <div className="resumo-passiva-mecanica">
                      <p><strong>Condição de ativação:</strong> {gatilhoPassiva}</p>
                      <p><strong>Efeito:</strong> {regraPassiva.efeito}</p>
                      <p><strong>Limites:</strong> {regraPassiva.limite}</p>
                      <p><strong>Custo:</strong> 0 Mana · não consome ação.</p>
                    </div>

                    <label htmlFor="passiva-descricao">Descrição narrativa</label>
                    <textarea
                      id="passiva-descricao"
                      rows={3}
                      value={passiva.descricao}
                      onChange={(e) => setPassiva((anterior) => ({
                        ...anterior,
                        descricao: e.target.value,
                      }))}
                      placeholder="Como essa passiva se manifesta no seu personagem?"
                    />
                    <p className="aviso-passiva">A descrição não modifica os bônus, os gatilhos ou as limitações mecânicas.</p>
                  </div>
                )}
              </div>
            </section>
              </section>
            )}

            {abaAtiva === "previa" && (
              <section className="conteudo-aba aba-previa" aria-labelledby="aba-previa">
                <div className="previa-introducao">
                  <span className="previa-sobretitulo">ARQUIVO ESPIRITUAL · REGISTRO DO PERSONAGEM</span>
                  <h2>Prévia do Personagem</h2>
                  <p>Confira seu registro antes de exportar. Os valores de combate são calculados pelo sistema.</p>
                  <button className="botao-gerar-pdf" type="button" onClick={gerarPdf} disabled={exportandoPdf}>
                    {exportandoPdf ? "Gerando PDF..." : "📜 Gerar ficha em PDF"}
                  </button>
                  <small className="pdf-ajuda">A4 • Pergaminho espiritual • detalhes e história em páginas adicionais</small>
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
                      <span>{classe}</span>
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

                <section className="previa-secao" aria-labelledby="previa-titulo-combate">
                  <div className="previa-secao-topo">
                    <h3 id="previa-titulo-combate">Atributos de combate</h3>
                    <button className="previa-editar" type="button" onClick={() => setAbaAtiva("combate")}>
                      Editar combate
                    </button>
                  </div>
                  <div className="previa-atributos">
                    <div className="previa-atributo previa-hp">
                      <span className="previa-estat-icone" aria-hidden="true">♥</span>
                      <span>Vida · HP</span>
                      <strong>{atributos.hp}</strong>
                    </div>
                    <div className="previa-atributo previa-mana">
                      <span className="previa-estat-icone" aria-hidden="true">✧</span>
                      <span>Mana / Foco</span>
                      <strong>{atributos.mana}</strong>
                    </div>
                    <div className="previa-atributo previa-ca">
                      <span className="previa-estat-icone" aria-hidden="true">⬡</span>
                      <span>Defesa · CA</span>
                      <strong>{atributos.ca}</strong>
                    </div>
                  </div>
                  <div className="previa-regen">
                    Regeneração por turno <strong>{atributos.regeneracao} de {elemento === "neutro" ? "Foco" : "Mana"}</strong>
                  </div>
                  <div className="previa-ataque">
                    <div>
                      <span className="previa-rotulo">ATAQUE BÁSICO</span>
                      <strong>{ataqueBasico.nome.trim() || "Ataque sem nome"}</strong>
                      {ataqueBasico.descricao.trim() && <p>{ataqueBasico.descricao}</p>}
                    </div>
                    <div className="previa-ataque-badges">
                      <span>{danoBasicoPorClasse[classe]} dano</span>
                      <span>0 Mana</span>
                    </div>
                  </div>
                </section>

                <section className="previa-secao" aria-labelledby="previa-titulo-habilidades">
                  <div className="previa-secao-topo">
                    <div>
                      <h3 id="previa-titulo-habilidades">Técnicas ativas</h3>
                      <p>Cinco técnicas. Abra os detalhes para consultar regras e efeitos.</p>
                    </div>
                    <button className="previa-editar" type="button" onClick={() => setAbaAtiva("habilidades")}>
                      Editar habilidades
                    </button>
                  </div>
                  <div className="previa-grade-tecnicas">
                    {habilidades.map((habilidade, indice) => {
                      const modelo = regrasModelos[habilidade.modelo];
                      return (
                        <article key={indice} className="previa-tecnica" data-tipo={modelo.tipo}>
                          <div className="previa-tecnica-topo">
                            <span className="previa-tecnica-numero">{indice + 1}</span>
                            <div>
                              <strong>{habilidade.nome.trim() || `Habilidade ${indice + 1}`}</strong>
                              <small>{modelo.nome}</small>
                            </div>
                          </div>
                          <div className="previa-chips previa-tecnica-chips">
                            <span>{modelo.tipo}</span>
                            <span>{custoDaTecnica(habilidade.modelo, classe)} Mana</span>
                            <span>{modelo.acao === "Buff" ? "Buff opcional" : "Ação principal"}</span>
                          </div>
                          <p className="previa-tecnica-efeito">
                            <span>{modelo.rotuloValor}</span>
                            <strong>{valorDaTecnica(habilidade.modelo, classe)}</strong>
                            {modelo.valorAdicional && <em> + {modelo.valorAdicional}</em>}
                          </p>
                          {modelo.experimental && <span className="previa-experimental">Em playtest</span>}
                          <details className="previa-detalhes">
                            <summary>Ver regras e descrição</summary>
                            <div className="previa-detalhes-conteudo">
                              <p><strong>Alvos:</strong> {modelo.maxAlvos === 2 ? habilidade.alvos : 1}</p>
                              {modelo.valorAdicional && <p><strong>{modelo.rotuloAdicional}:</strong> {modelo.valorAdicional}</p>}
                              {habilidade.modelo === "danoContinuo" && (
                                <p><strong>Condição:</strong> {habilidade.nomeCondicao.trim() || condicaoSugeridaPorElemento[elemento]}</p>
                              )}
                              {(habilidade.modelo === "criarArma" || habilidade.modelo === "encantarArma") && (
                                <p><strong>Arma:</strong> {habilidade.nomeArma.trim() || "Não definida"}</p>
                              )}
                              <p><strong>Regra:</strong> {modelo.regra}</p>
                              {habilidade.efeito.trim() && <p><strong>Descrição narrativa:</strong> {habilidade.efeito}</p>}
                              {habilidade.limitacoes.trim() && <p><strong>Observações:</strong> {habilidade.limitacoes}</p>}
                              {modelo.experimental && <p className="previa-alerta">Requer aprovação do mestre.</p>}
                            </div>
                          </details>
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="previa-secao previa-passiva" aria-labelledby="previa-titulo-passiva">
                  <div className="previa-secao-topo">
                    <div>
                      <span className="previa-rotulo">✦ DOM ESPIRITUAL</span>
                      <h3 id="previa-titulo-passiva">{passiva.nome.trim() || regraPassiva.nome}</h3>
                    </div>
                    <button className="previa-editar" type="button" onClick={() => {
                      setAbaAtiva("habilidades");
                      setHabilidadeAberta("passiva");
                    }}>
                      Editar passiva
                    </button>
                  </div>
                  <div className="previa-chips">
                    <span>{regraPassiva.nome}</span>
                    <span>0 Mana</span>
                    <span>Sem ação</span>
                  </div>
                  <p><strong>Ativação:</strong> {gatilhoPassiva}</p>
                  <p><strong>Efeito:</strong> {regraPassiva.efeito}</p>
                  <p><strong>Limitações:</strong> {regraPassiva.limite}</p>
                  {passiva.descricao.trim() && <p><strong>Descrição:</strong> {passiva.descricao}</p>}
                  {passiva.modelo === "fluxo" && !vinculoPodeAcertar && (
                    <p className="previa-alerta">A técnica vinculada precisa poder acertar um alvo.</p>
                  )}
                  {semControle && (
                    <p className="previa-alerta">Esta passiva exige uma técnica de Controle.</p>
                  )}
                </section>
                <p className="previa-rodape">Este resumo é para consulta no editor. Use “Gerar ficha em PDF” para exportar o pergaminho com todos os detalhes.</p>
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
                  onClick={() => setAbaAtiva(abasEditor[abasEditor.findIndex((aba) => aba.id === abaAtiva) + 1].id)}
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
