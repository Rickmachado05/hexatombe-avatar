import { jsPDF } from "jspdf";

export type ElementoFicha = "agua" | "terra" | "fogo" | "ar" | "neutro";

export type TecnicaPDF = {
  nome: string;
  categoria: string;
  modelo: string;
  acao: string;
  custo: number;
  valor: string;
  rotuloValor: string;
  valorAdicional?: string;
  rotuloAdicional?: string;
  alvos: number;
  regra: string;
  efeitoNarrativo: string;
  observacoes: string;
  condicao?: string;
  arma?: string;
  experimental: boolean;
};

export type FichaPDF = {
  nome: string;
  elemento: ElementoFicha;
  classe: string;
  historia: string;
  foto: string;
  hp: number;
  mana: number;
  ca: number;
  regeneracao: string;
  ataqueBasico: { nome: string; dano: string; descricao: string };
  habilidades: TecnicaPDF[];
  passiva: {
    nome: string;
    modelo: string;
    ativacao: string;
    efeito: string;
    limites: string;
    descricao: string;
    aviso?: string;
  };
};

type RGB = [number, number, number];
type PaletaElemento = {
  nome: string;
  cor: RGB;
  escura: RGB;
  clara: RGB;
  glifo: string;
};
const ELEMENTOS: Record<ElementoFicha, PaletaElemento> = {
  agua: { nome: "Água", cor: [37, 111, 150], escura: [20, 60, 86], clara: [217, 237, 239], glifo: "ÁGUA" },
  terra: { nome: "Terra", cor: [79, 112, 61], escura: [42, 70, 42], clara: [226, 236, 207], glifo: "TERRA" },
  fogo: { nome: "Fogo", cor: [177, 77, 43], escura: [103, 39, 28], clara: [244, 225, 198], glifo: "FOGO" },
  ar: { nome: "Ar", cor: [85, 135, 146], escura: [43, 84, 98], clara: [225, 242, 238], glifo: "AR" },
  neutro: { nome: "Não Dobrador", cor: [133, 98, 62], escura: [75, 56, 44], clara: [237, 222, 193], glifo: "FOCO" },
};

const W = 210;
const H = 297;
const M = 13;
const BOTTOM = 281;
const DARK: [number, number, number] = [54, 30, 26];
const BLOOD: [number, number, number] = [117, 31, 42];
const GOLD: [number, number, number] = [153, 103, 49];
const CREAM: [number, number, number] = [243, 229, 198];

function hasText(value: string | undefined): string {
  return (value || "").trim();
}

function clampLines(pdf: jsPDF, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = pdf.splitTextToSize(text, maxWidth) as string[];
  if (lines.length <= maxLines) return lines;
  const shown = lines.slice(0, maxLines);
  let last = shown[maxLines - 1].trim();
  while (last.length > 3 && pdf.getTextWidth(last + "…") > maxWidth) last = last.slice(0, -1);
  shown[maxLines - 1] = last + "…";
  return shown;
}

function safeFileName(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 45) || "personagem";
}

async function loadImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function convertToJPEG(src: string): Promise<string | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 750;
        const context = canvas.getContext("2d");
        if (!context) { resolve(null); return; }
        context.fillStyle = "#e0ceb0";
        context.fillRect(0, 0, 600, 750);
        const scale = Math.max(600 / image.width, 750 / image.height);
        const sw = image.width * scale;
        const sh = image.height * scale;
        context.drawImage(image, (600 - sw) / 2, (750 - sh) / 2, sw, sh);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      } catch { resolve(null); }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/** Gera um PDF A4 a partir da ficha atual, sem alterar o estado do React. */
export async function exportarFichaPdf(ficha: FichaPDF): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  pdf.setProperties({ title: `Hexatombe: Avatar - ${ficha.nome || "Personagem"}`, subject: "Ficha de RPG", author: "Hexatombe: Avatar" });
  const paleta = ELEMENTOS[ficha.elemento];
  // Cada elemento usa seu próprio pergaminho ornamental.
  // Se a pasta public ainda não tiver os novos arquivos, preserva o fundo v1.
  const recursoPapel = (await loadImage(`/hexatombe-pergaminho-${ficha.elemento}.jpg`))
    || (await loadImage("/hexatombe-pergaminho-pdf.jpg"));
  const recursoSelo = await loadImage("/hexatombe-selo-512.png");
  const retrato = await convertToJPEG(ficha.foto);
  let pageCount = 1;
  let y = 40;

  // Símbolos e ornamentos são desenhados no PDF e acompanham a paleta do elemento.
  // O vermelho de sangue fica restrito às marcas rituais e não colore títulos/boxes.
  const diamond = (cx: number, cy: number, r: number, fill: RGB = GOLD) => {
    pdf.setFillColor(...fill);
    pdf.lines([[r, -r], [r, r], [-r, r], [-r, -r]], cx - r, cy, [1, 1], "F", true);
  };

  const ritualMark = (x: number, yy: number, mirrorX = 1, mirrorY = 1) => {
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.42);
    const xx = (dx: number) => x + dx * mirrorX;
    const yyy = (dy: number) => yy + dy * mirrorY;
    pdf.line(x, yyy(8.5), x, yyy(0));
    pdf.line(xx(0), yy, xx(8.5), yy);
    pdf.line(xx(2), yyy(1), xx(8), yyy(1));
    pdf.line(xx(1), yyy(2), xx(1), yyy(8));
    pdf.line(xx(2.6), yyy(4.2), xx(4.2), yyy(2.6));
    diamond(xx(1.3), yyy(1.3), 1.1, paleta.cor);
    pdf.setDrawColor(...paleta.cor);
    pdf.circle(xx(6.3), yyy(6.3), 1.0, "S");
  };

  const bloodStains = (pageNo: number) => {
    // Manchas controladas somente nas margens. Posições determinísticas,
    // de modo que a impressão e a paginação sejam reproduzíveis.
    const seeds = [
      { x: 7.8, y: 44, sign: 1 },
      { x: 201.5, y: 73, sign: -1 },
      { x: 7.8, y: 166, sign: 1 },
      { x: 201.5, y: 246, sign: -1 },
      { x: 41, y: 5.8, sign: 1 },
      { x: 170, y: 291, sign: -1 },
    ];
    for (const [index, origin] of seeds.entries()) {
      const yy = origin.y + (pageNo % 2 ? 0 : (index % 2 ? 4 : -3));
      pdf.setFillColor(...BLOOD);
      pdf.circle(origin.x, yy, 1.0 + (index % 3) * 0.35, "F");
      for (let i = 0; i < 7; i++) {
        const a = i * 2.39996 + index * 0.7;
        const d = 1.8 + (i % 4) * 1.3;
        const px = origin.x + Math.cos(a) * d * (index > 3 ? 1 : 0.65);
        const py = yy + Math.sin(a) * d;
        pdf.circle(px, py, i % 3 === 0 ? 0.55 : 0.24, "F");
      }
      pdf.setDrawColor(...BLOOD);
      pdf.setLineWidth(0.35);
      pdf.line(origin.x, yy, origin.x + origin.sign * 1.7, yy + 5);
    }
  };

  const elementSigil = (cx: number, cy: number, radius = 7) => {
    pdf.setFillColor(...paleta.escura);
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.65);
    pdf.circle(cx, cy, radius, "FD");
    pdf.setLineWidth(0.25);
    pdf.setDrawColor(...paleta.clara);
    pdf.circle(cx, cy, radius - 1.2, "S");
    pdf.setDrawColor(...paleta.clara);
    pdf.setLineWidth(0.65);
    const line = (x1: number, y1: number, x2: number, y2: number) => pdf.line(cx+x1,cy+y1,cx+x2,cy+y2);
    if (ficha.elemento === "agua" || ficha.elemento === "ar") {
      for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 12; i++) {
          const x0 = -4.5 + i * 0.76;
          const x1 = x0 + 0.76;
          const f = (x: number) => Math.sin(x * 1.0 + j * 0.55) * (ficha.elemento === "agua" ? 0.72 : 0.48);
          line(x0, -1.9 + j * 1.6 + f(x0), x1, -1.9 + j * 1.6 + f(x1));
        }
      }
    } else if (ficha.elemento === "terra") {
      line(-4, 3, -1.7, -2); line(-1.7, -2, 0, 0); line(0, 0, 2, -3.6);
      line(2, -3.6, 4.7, 3); line(-4.6, 3, 4.7, 3);
    } else if (ficha.elemento === "fogo") {
      line(0, -4.6, -2.5, -0.6); line(-2.5, -0.6, -1.4, 3.6);
      line(-1.4, 3.6, 2.6, 3.6); line(2.6, 3.6, 3.2, -1.5);
      line(3.2, -1.5, 0.6, 0.5); line(0.6, 0.5, 0, -4.6);
    } else {
      line(0, -4.5, 4.4, 0); line(4.4, 0, 0, 4.5);
      line(0, 4.5, -4.4, 0); line(-4.4, 0, 0, -4.5);
      pdf.circle(cx, cy, 1.4, "S");
    }
  };

  const inkFlourish = (xx: number, yy: number, dir = 1) => {
    // Traço de tinta inspirado na caligrafia de Avatar; acompanha o elemento.
    pdf.setDrawColor(...paleta.cor);
    pdf.setLineWidth(0.85);
    for (let i = 0; i < 8; i++) {
      const a = i / 7 * Math.PI * 1.55;
      const b = (i + 1) / 7 * Math.PI * 1.55;
      const r0 = 2 + i * 0.35;
      const r1 = 2 + (i+1) * 0.35;
      pdf.line(xx + dir*Math.cos(a)*r0, yy + Math.sin(a)*r0,
               xx + dir*Math.cos(b)*r1, yy + Math.sin(b)*r1);
    }
    pdf.setLineWidth(0.26);
  };

  const text = (str: string, x: number, yy: number, size = 10, color: [number, number, number] = DARK, bold = false) => {
    pdf.setFont("times", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    pdf.text(str, x, yy);
  };

  const pageBase = (subtitulo: string) => {
    if (recursoPapel) {
      try { pdf.addImage(recursoPapel, "JPEG", 0, 0, W, H, undefined, "FAST"); }
      catch { pdf.setFillColor(236, 216, 180); pdf.rect(0, 0, W, H, "F"); }
    } else {
      pdf.setFillColor(236, 216, 180);
      pdf.rect(0, 0, W, H, "F");
    }
    bloodStains(pageCount);
    // Pergaminho ornamentado com quatro cantos e duplo contorno.
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.82);
    pdf.rect(7.2, 7.2, W - 14.4, H - 14.4);
    pdf.setDrawColor(...paleta.cor);
    pdf.setLineWidth(0.22);
    pdf.rect(9.7, 9.7, W - 19.4, H - 19.4);
    ritualMark(9.6, 9.6);
    ritualMark(W - 9.6, 9.6, -1, 1);
    ritualMark(9.6, H - 9.6, 1, -1);
    ritualMark(W - 9.6, H - 9.6, -1, -1);
    // Marcas espirituais nas laterais, sem interferir no texto.
    for (let i = 0; i < 11; i++) {
      const yy = 49 + i * 19.6;
      pdf.setDrawColor(...(i % 3 === 0 ? BLOOD : paleta.cor));
      pdf.setLineWidth(i % 3 === 0 ? 0.5 : 0.25);
      pdf.line(7.7, yy, 9.0, yy - 1.3);
      pdf.line(9.0, yy - 1.3, 10.3, yy);
      pdf.line(W - 7.7, yy, W - 9.0, yy - 1.3);
      pdf.line(W - 9.0, yy - 1.3, W - 10.3, yy);
    }

    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.6);
    pdf.line(15, 34, W - 15, 34);
    pdf.setLineWidth(0.25);
    pdf.setDrawColor(...paleta.cor);
    pdf.line(15, 35.1, W - 15, 35.1);
    diamond(W / 2, 34, 1.3, paleta.cor);
    inkFlourish(17, 34, 1);
    inkFlourish(W - 17, 34, -1);
    if (recursoSelo) {
      try { pdf.addImage(recursoSelo, "PNG", 13, 11, 21, 21); }
      catch { elementSigil(22.5, 20, 7); }
    } else { elementSigil(22.5, 20, 7); }
    text("HEXATOMBE: AVATAR", 38, 21.5, 17, DARK, true);
    text(subtitulo.toUpperCase(), 38.3, 29.0, 8.2, paleta.escura, true);
    elementSigil(W - 23, 19, 7.7);
    pdf.setFont("times", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...paleta.escura);
    pdf.text(paleta.nome.toUpperCase(), W - 23, 30, { align: "center" });
  };

  const footer = () => {
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.3);
    pdf.line(M + 3, 285.3, W - M - 3, 285.3);
    text("ARQUIVOS ESPIRITUAIS  •  REGISTRO RITUAL", M + 4, 290.2, 7, paleta.escura, true);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...DARK);
    pdf.text(`Página ${pageCount}`, W - M - 3, 290.2, { align: "right" });
  };

  const sectionHeading = (titulo: string, sy: number) => {
    const width = W - M * 2;
    pdf.setFillColor(...paleta.escura);
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.55);
    pdf.roundedRect(M + 4, sy, width - 8, 9, 0.8, 0.8, "FD");
    pdf.setFillColor(...paleta.cor);
    pdf.triangle(M, sy + 4.5, M + 5, sy + 0.4, M + 5, sy + 8.6, "F");
    pdf.triangle(W - M, sy + 4.5, W - M - 5, sy + 0.4, W - M - 5, sy + 8.6, "F");
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.24);
    pdf.line(M + 10, sy + 1.2, W - M - 10, sy + 1.2);
    pdf.line(M + 10, sy + 7.9, W - M - 10, sy + 7.9);
    diamond(M + 6.6, sy + 4.5, 1, GOLD);
    diamond(W - M - 6.6, sy + 4.5, 1, GOLD);
    pdf.setFont("times", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(...CREAM);
    pdf.text(titulo.toUpperCase(), W / 2, sy + 6.2, { align: "center" });
  };

  const newPage = (subtitle: string) => {
    pdf.addPage("a4", "portrait");
    pageCount += 1;
    pageBase(subtitle);
    footer();
    y = 41;
  };

  // LIVRO DE TÉCNICAS V3: campos densos, cartões paginados por linha.
  // O conteúdo fica selecionável e nunca é "fotografado" na textura.
  type LinhaDetalhe = { rotulo: string; texto: string; inicio: boolean };
  type CampoDetalhe = { rotulo: string; valor: string };
  const CARD_H = 11.8;
  const LINE_H = 4.0;
  const FIELD_GAP = 0.65;
  const CARD_PAD_BOTTOM = 2.6;
  const TEXT_X = M + 31;
  const TEXT_WIDTH = W - M - 5.5 - TEXT_X;

  const linhasDoCampo = (campo: CampoDetalhe): LinhaDetalhe[] => {
    pdf.setFont("times", "normal");
    pdf.setFontSize(9.1);
    const conteudo = hasText(campo.valor) || "Não informado.";
    const partes = conteudo.replace(/\r\n?/g, "\n").split("\n");
    const linhas: LinhaDetalhe[] = [];
    let primeira = true;
    for (const parte of partes) {
      const quebradas = (pdf.splitTextToSize(parte || " ", TEXT_WIDTH) as string[]);
      for (const trecho of quebradas) {
        linhas.push({ rotulo: primeira ? campo.rotulo : "", texto: trecho, inicio: primeira });
        primeira = false;
      }
    }
    return linhas;
  };

  const novaPaginaTecnicas = (continuacao = true) => {
    newPage(continuacao ? "Livro de técnicas • Continuação" : "Livro de técnicas • Detalhes");
    sectionHeading(continuacao ? "Registros continuados" : "Livro de técnicas", 39);
    // Duas marcas caligráficas nas bordas internas do capítulo.
    inkFlourish(M + 8, 50, 1);
    inkFlourish(W - M - 8, 50, -1);
    y = 53.5;
  };

  const cartaoDetalhado = (
    titulo: string,
    metadados: string,
    campos: CampoDetalhe[],
    numero?: number,
  ) => {
    // Títulos muito longos podem ser abreviados apenas na tarja; o nome
    // completo continua impresso no conteúdo, sem perda de informação.
    pdf.setFont("times", "bold");
    pdf.setFontSize(11);
    const camposComNome = pdf.getTextWidth(titulo) > W - 2 * M - 30
      ? [{ rotulo: "Nome completo", valor: titulo }, ...campos]
      : campos;
    const linhas = camposComNome.flatMap(linhasDoCampo);
    if (!linhas.length) linhas.push({ rotulo: "Informação", texto: "Não informada.", inicio: true });
    let indice = 0;
    let trechoPagina = 0;
    while (indice < linhas.length) {
      // Nunca deixar um título de cartão sozinho no final da página.
      if (y + CARD_H + LINE_H + CARD_PAD_BOTTOM + 2 > BOTTOM) novaPaginaTecnicas();
      const inicioY = y;
      const limiteDeAltura = BOTTOM - inicioY - CARD_H - CARD_PAD_BOTTOM;
      let alturaConteudo = 0;
      const linhasNesteCartao: LinhaDetalhe[] = [];
      while (indice < linhas.length) {
        const atual = linhas[indice];
        const adicional = LINE_H + (atual.inicio && linhasNesteCartao.length ? FIELD_GAP : 0);
        if (alturaConteudo + adicional > limiteDeAltura) break;
        linhasNesteCartao.push(atual);
        alturaConteudo += adicional;
        indice++;
      }
      // Cada linha do texto tem altura fixa e cabe nas margens.
      if (!linhasNesteCartao.length) { novaPaginaTecnicas(); continue; }
      const altura = CARD_H + alturaConteudo + CARD_PAD_BOTTOM;
      pdf.setFillColor(250, 241, 217);
      pdf.setDrawColor(...GOLD);
      pdf.setLineWidth(0.38);
      pdf.roundedRect(M, inicioY, W - 2 * M, altura, 1.6, 1.6, "FD");
      pdf.setDrawColor(...paleta.cor);
      pdf.setLineWidth(0.24);
      pdf.line(M + 2, inicioY + altura - 1.6, W - M - 2, inicioY + altura - 1.6);

      // Tarja principal do cartão: cor do elemento, filetes em ouro, marca ritual.
      pdf.setFillColor(...paleta.escura);
      pdf.rect(M + 0.6, inicioY + 0.7, W - 2 * M - 1.2, CARD_H - 1.2, "F");
      pdf.setDrawColor(...GOLD);
      pdf.setLineWidth(0.23);
      pdf.line(M + 2, inicioY + 1.8, W - M - 2, inicioY + 1.8);
      pdf.line(M + 2, inicioY + CARD_H - 1.7, W - M - 2, inicioY + CARD_H - 1.7);
      if (numero !== undefined) {
        pdf.setFillColor(...paleta.cor);
        pdf.circle(M + 7.8, inicioY + 5.7, 3.75, "F");
        pdf.setDrawColor(...GOLD);
        pdf.circle(M + 7.8, inicioY + 5.7, 3.75, "S");
        pdf.setFont("times", "bold");
        pdf.setFontSize(10.2);
        pdf.setTextColor(...CREAM);
        pdf.text(String(numero), M + 7.8, inicioY + 7.0, { align: "center" });
      } else {
        diamond(M + 7.8, inicioY + 5.7, 2.4, GOLD);
      }
      pdf.setFont("times", "bold");
      pdf.setFontSize(11);
      const tituloAtual = titulo + (trechoPagina ? " (continuação)" : "");
      const tituloCurto = clampLines(pdf, tituloAtual, W - 2 * M - 30, 1)[0];
      text(tituloCurto, M + 15, inicioY + 5.5, 11, CREAM, true);
      pdf.setFont("times", "normal");
      pdf.setFontSize(8);
      const meta = clampLines(pdf, metadados, W - 2 * M - 27, 1)[0];
      text(meta, M + 15, inicioY + 9.6, 8, CREAM);
      diamond(W - M - 5.2, inicioY + 5.8, 1.15, GOLD);

      let linhaY = inicioY + CARD_H + 3.0;
      for (const linha of linhasNesteCartao) {
        if (linha.inicio && linha !== linhasNesteCartao[0]) linhaY += FIELD_GAP;
        if (linha.rotulo) text(linha.rotulo.toUpperCase(), M + 4.3, linhaY, 8.0, paleta.escura, true);
        text(linha.texto, TEXT_X, linhaY, 9.1, DARK);
        linhaY += LINE_H;
      }
      // O sangue é sempre um ornamento de borda, nunca substitui conteúdo.
      pdf.setDrawColor(...BLOOD);
      pdf.setLineWidth(0.18);
      pdf.line(W - M - 12, inicioY + altura - 1.7, W - M - 8.1, inicioY + altura - 1.7);
      pdf.circle(W - M - 8.0, inicioY + altura - 1.7, 0.35, "S");
      y = inicioY + altura + 3.1;
      trechoPagina++;
      if (indice < linhas.length) novaPaginaTecnicas();
    }
  };

  // PRIMEIRA PÁGINA: consulta rápida durante a sessão.
  pageBase("Registro Espiritual • Visão geral");
  footer();
  sectionHeading("O escolhido", 39);
  // Bloco do retrato, nome, classe, elemento e resumo da história.
  pdf.setFillColor(250, 241, 218);
  pdf.setDrawColor(...paleta.cor);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(M, 49, W - M * 2, 48, 2, 2, "FD");
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.25);
  pdf.line(M + 2, 51, W - M - 2, 51);
  pdf.line(M + 2, 95, W - M - 2, 95);
  diamond(W - M - 3.5, 53, 1, GOLD);
  if (retrato) {
    try { pdf.addImage(retrato, "JPEG", M + 3, 52, 30, 38, undefined, "FAST"); }
    catch { /* foto opcional */ }
  } else {
    pdf.setFillColor(...paleta.cor);
    pdf.roundedRect(M + 3, 52, 30, 38, 2, 2, "F");
    text("SEM RETRATO", M + 6, 73, 7, CREAM, true);
  }
  text("NOME", M + 38, 56.5, 7.3, paleta.escura, true);
  pdf.setFont("times", "bold"); pdf.setFontSize(14);
  const nm = clampLines(pdf, hasText(ficha.nome) || "Personagem sem nome", 130, 1);
  text(nm[0], M + 38, 65.5, 14, DARK, true);
  text(`Elemento: ${paleta.nome}`, M + 38, 72.7, 9.5, paleta.cor, true);
  text(`Classe: ${ficha.classe}`, M + 38, 78.8, 9.5, DARK);
  text("HISTÓRIA — RESUMO", M + 38, 85, 7, paleta.escura, true);
  pdf.setFont("times", "normal"); pdf.setFontSize(8.1);
  const histResumo = clampLines(pdf, hasText(ficha.historia) || "Não definida.", 136, 2);
  histResumo.forEach((line, i) => text(line, M + 38, 90 + i * 3.7, 8, DARK));

  sectionHeading("Atributos de combate", 101);
  const colWidth = (W - 2 * M - 9) / 4;
  const statData = [
    ["HP", String(ficha.hp)],
    [ficha.elemento === "neutro" ? "FOCO" : "MANA", String(ficha.mana)],
    ["CA", String(ficha.ca)],
    ["REGENERAÇÃO", ficha.regeneracao],
  ];
  statData.forEach(([label, value], index) => {
    const x = M + index * (colWidth + 3);
    pdf.setFillColor(250, 238, 210);
    pdf.setDrawColor(...paleta.cor);
    pdf.setLineWidth(0.55);
    pdf.roundedRect(x, 112, colWidth, 20, 1.5, 1.5, "FD");
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.25);
    pdf.line(x + 1.4, 114, x + colWidth - 1.4, 114);
    text(label, x + 3, 117.5, 8, paleta.escura, true);
    text(value, x + 3, 128.5, 15, index === 1 ? paleta.cor : DARK, true);
  });
  text(`HP atual: __________ / ${ficha.hp}`, M + 4, 137.8, 9, DARK);
  text(`${ficha.elemento === "neutro" ? "Foco" : "Mana"} atual: __________ / ${ficha.mana}`, M + 95, 137.8, 9, DARK);

  sectionHeading("Ataque básico", 143);
  pdf.setDrawColor(...paleta.cor);
  pdf.setFillColor(250, 239, 216);
  pdf.setLineWidth(0.45);
  pdf.roundedRect(M, 154, W - 2 * M, 22, 1.8, 1.8, "FD");
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.25);
  pdf.line(M + 2, 156, W - M - 2, 156);
  text(hasText(ficha.ataqueBasico.nome) || "Ataque sem nome", M + 4, 160.4, 10.2, DARK, true);
  pdf.setFont("times", "bold"); pdf.setFontSize(9);
  const dano = `Dano: ${ficha.ataqueBasico.dano}   |   Custo: 0`;
  text(dano, W - M - pdf.getTextWidth(dano) - 5, 160.4, 9, paleta.escura, true);
  pdf.setFontSize(8.1);
  const ataqueCurto = clampLines(pdf, hasText(ficha.ataqueBasico.descricao) || "Um ataque básico sem gasto de Mana.", W - 2 * M - 10, 2);
  ataqueCurto.forEach((line, idx) => text(line, M + 4, 166.9 + idx * 3.7, 8.3, DARK));

  sectionHeading("Técnicas ativas", 178);
  const rowsY = 189;
  ficha.habilidades.slice(0, 5).forEach((h, idx) => {
    const yy = rowsY + idx * 13.1;
    pdf.setFillColor(idx % 2 ? 245 : 251, idx % 2 ? 231 : 241, idx % 2 ? 208 : 220);
    pdf.setDrawColor(...paleta.cor);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(M, yy, W - 2 * M, 12.7, 1.3, 1.3, "FD");
    pdf.setFillColor(...paleta.cor);
    pdf.roundedRect(M + 2, yy + 2, 10, 8.8, 1.4, 1.4, "F");
    text(String(idx + 1), M + 5.2, yy + 8.3, 11, CREAM, true);
    pdf.setFont("times", "bold"); pdf.setFontSize(9.6);
    const skillName = clampLines(pdf, hasText(h.nome) || `Habilidade ${idx + 1}`, 85, 1)[0];
    text(skillName, M + 15, yy + 5.6, 9.6, DARK, true);
    pdf.setFontSize(7.7);
    const details = `${h.categoria} • ${h.custo} Mana • ${h.rotuloValor}: ${h.valor}`;
    const detailsShort = clampLines(pdf, details, W - 2 * M - 22, 1)[0];
    text(detailsShort, M + 15, yy + 10.2, 7.7, paleta.escura);
  });

  sectionHeading("Dom passivo", 256);
  pdf.setFillColor(...paleta.clara);
  pdf.setDrawColor(...paleta.cor);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(M, 267, W - 2 * M, 12.2, 1.2, 1.2, "FD");
  diamond(W - M - 4, 272.9, 1.2, GOLD);
  text(hasText(ficha.passiva.nome) || ficha.passiva.modelo, M + 4, 272.2, 9.1, DARK, true);
  pdf.setFont("times", "normal"); pdf.setFontSize(8);
  const previaPassiva = clampLines(pdf, ficha.passiva.efeito, W - M * 2 - 10, 1);
  text(previaPassiva[0] || "Sem efeito definido", M + 4, 277, 7.8, DARK);

  // SEGUNDA PÁGINA: cada técnica em cartão próprio e não em múltiplas
  // caixas de rótulo. Com pouco texto, as cinco técnicas, a passiva e a
  // história cabem em UMA página adicional. Com muito texto, continuam.
  novaPaginaTecnicas(false);
  for (const [index, habilidade] of ficha.habilidades.entries()) {
    const campos: CampoDetalhe[] = [
      {
        rotulo: "Efeito",
        valor: `${habilidade.rotuloValor}: ${habilidade.valor}${habilidade.valorAdicional ? `; ${habilidade.rotuloAdicional || "Adicional"}: ${habilidade.valorAdicional}` : ""}`,
      },
      { rotulo: "Regra", valor: habilidade.regra },
    ];
    if (hasText(habilidade.condicao)) campos.push({ rotulo: "Condição", valor: habilidade.condicao! });
    if (hasText(habilidade.arma)) campos.push({ rotulo: "Arma", valor: habilidade.arma! });
    if (hasText(habilidade.efeitoNarrativo)) campos.push({ rotulo: "Narrativa", valor: habilidade.efeitoNarrativo });
    if (hasText(habilidade.observacoes)) campos.push({ rotulo: "Mestre", valor: habilidade.observacoes });
    if (habilidade.experimental) campos.push({ rotulo: "Playtest", valor: "Modelo experimental: requer avaliação do mestre." });
    const recurso = ficha.elemento === "neutro" ? "Foco" : "Mana";
    cartaoDetalhado(
      hasText(habilidade.nome) || `Habilidade ${index + 1}`,
      `${habilidade.categoria}  •  ${habilidade.acao === "Buff" ? "Buff opcional" : "Ação principal"}  •  ${habilidade.custo} ${recurso}  •  ${habilidade.alvos} alvo(s)`,
      campos,
      index + 1,
    );
  }

  const passiva = ficha.passiva;
  const camposPassiva: CampoDetalhe[] = [
    { rotulo: "Ativação", valor: passiva.ativacao },
    { rotulo: "Efeito", valor: passiva.efeito },
    { rotulo: "Limitações", valor: passiva.limites },
  ];
  if (hasText(passiva.descricao)) camposPassiva.push({ rotulo: "Narrativa", valor: passiva.descricao });
  if (hasText(passiva.aviso)) camposPassiva.push({ rotulo: "Atenção", valor: passiva.aviso || "" });
  cartaoDetalhado(
    hasText(passiva.nome) || passiva.modelo,
    `DOM PASSIVO  •  ${passiva.modelo}  •  0 Mana / Foco  •  Não consome ação`,
    camposPassiva,
  );

  // História completa com fluxo por linhas; cria novas páginas apenas quando
  // o campo for realmente grande, sem reduzir a fonte até ficar ilegível.
  cartaoDetalhado(
    "História do personagem",
    `REGISTRO NARRATIVO  •  ${hasText(ficha.nome) || "Personagem sem nome"}`,
    [{ rotulo: "História", valor: ficha.historia || "História não informada." }],
  );
  pdf.save(`Hexatombe_Avatar_${safeFileName(ficha.nome)}.pdf`);
}
