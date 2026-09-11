/**
 * Fichas de design do Ouroboros — identidade **Terminal**.
 *
 * Todo valor aqui saiu do handoff `design_handoff_ouroboros_terminal/`, não foi
 * inventado. Quando houver dúvida entre este arquivo e o desenho, o desenho
 * vence — abra `Ouroboros - Protótipo.dc.html` e meça.
 *
 * O app é escuro e só escuro. Suportar tema claro dobraria o trabalho de cada
 * tela em troca de quase nada, num app que se usa cinco minutos por dia.
 *
 * Três regras da identidade, e elas explicam quase todo valor abaixo:
 *
 *   1. **Raio zero em tudo.** Nenhum canto arredondado em lugar nenhum. O que
 *      separa dois blocos é uma régua de 1px, não uma borda de cartão.
 *   2. **Um acento só.** O verde-lima aparece no que é ação ou progresso.
 *      Espalhado, deixa de significar qualquer coisa.
 *   3. **O número é o herói.** Cada tela tem um número grande, e ele é a
 *      primeira coisa que o olho encontra.
 *
 * Regra da casa: nenhuma cor, espaçamento ou tamanho de fonte escrito solto
 * numa tela. Tudo sai daqui.
 */

import { Platform } from 'react-native';

import type { Paleta } from './temas';

/* ──────────────────────────── cores ────────────────────────────── */

export let cores: Paleta = {
  /** Fundo de todas as telas. Preto quase absoluto. */
  fundo: '#08090b',
  /** Campo de formulário, alternativa não escolhida. A única superfície. */
  superficie: '#0f1115',
  /** TODA régua, borda e trilho de barra. Não existe segunda cor de linha. */
  linha: '#1e2128',

  /** Verde-lima: o único acento do app. */
  acento: '#c7f74e',
  /** Fundo do bloco de código e do cartão da diária. */
  acentoFundo: '#0d1006',
  /** Borda dentro de área com `acentoFundo`. */
  acentoLinha: '#2b3417',
  /** Texto secundário sobre `acentoFundo`. */
  acentoTexto: '#7e8a5c',

  /** Números e títulos. */
  textoForte: '#f2f4f7',
  /** Corpo. */
  texto: '#c3c9d2',
  /** Corpo secundário. */
  textoFraco: '#9aa1ad',
  /** Rótulos mono, métricas, notas. */
  legenda: '#6f7683',
  /** Aba inativa, item "em breve". */
  desativado: '#4a505b',
  /** Letra de alternativa descartada. */
  desativado2: '#31363f',

  erro: '#f87171',
  erroFundo: '#170b0b',
  erroLinha: '#4a2020',

  /** Nível "leve". */
  ok: '#34d399',
  /** Força de senha "ok". */
  atencao: '#fbbf24',

  // Uma cor por nível de dificuldade — as mesmas de cima, nomeadas pelo uso.
  nivel1: '#34d399',
  nivel2: '#c7f74e',
  nivel3: '#f87171',
  varredura: 'rgba(199,247,78,0.35)',
  barraStatus: 'light' as const
} as const;

export function aplicarPaletaTema(paleta: Paleta) {
  Object.assign(cores, paleta);
  Object.assign(coresLinguagem, {
    csharp: paleta.acento,
    javascript: paleta.legenda,
    python: paleta.legenda,
    java: paleta.legenda,
    php: paleta.legenda
  });
  Object.assign(coresCodigo, {
    palavraChave: paleta.acento,
    texto: paleta.acentoTexto,
    numero: paleta.acento,
    comentario: paleta.legenda,
    tipo: paleta.acento,
    identificador: paleta.textoFraco,
    pontuacao: paleta.legenda
  });
  varredura = paleta.varredura;
}

/** A linha de varredura que desce no cartão da diária. */
export let varredura = 'rgba(199,247,78,0.35)';

/**
 * Cada linguagem tem uma cor, e ela é sempre a mesma em todo o app.
 *
 * Com um acento só, "cor de linguagem" virou hierarquia: C# é a trilha em foco
 * e fica no acento; toda outra linguagem fica em legenda. Cor cheia por
 * linguagem só existe no ponto (`linguagem.cor`, vindo do próprio JSON da
 * linguagem) usado nos seletores de Onboarding/Configurações/Teste de Nível —
 * ali sim precisa distinguir N linguagens numa lista. Aqui, onde a cor marca
 * hierarquia dentro de uma tela só, várias cores cheias competiriam e
 * quebrariam a regra do acento único.
 */
export let coresLinguagem: {
  csharp: string;
  javascript: string;
  python: string;
  java: string;
  php: string;
} = {
  csharp: cores.acento,
  javascript: cores.legenda,
  python: cores.legenda,
  java: cores.legenda,
  php: cores.legenda
};

/** A sigla mono que identifica a linguagem numa linha de lista. */
export const siglaLinguagem = {
  csharp: 'C#',
  javascript: 'js',
  python: 'py',
  java: 'jav',
  php: 'php'
} as const;

/**
 * Cores do destaque de sintaxe, reduzidas a três.
 *
 * O bloco de código do redesign é quase monocromático de propósito: o realce
 * aponta a palavra que importa, não pinta a linha inteira de arco-íris.
 */
export let coresCodigo: {
  palavraChave: string;
  texto: string;
  numero: string;
  comentario: string;
  tipo: string;
  identificador: string;
  pontuacao: string;
} = {
  palavraChave: cores.acento,
  texto: cores.acentoTexto,
  numero: cores.acento,
  comentario: cores.legenda,
  tipo: cores.acento,
  identificador: cores.textoFraco,
  pontuacao: cores.legenda
};

/* ─────────────────────── espaço e medida ───────────────────────── */

export const espaco = { xs: 4, sm: 9, md: 14, lg: 22, xl: 26, xxl: 34 } as const;

/** O redesign não usa raio em nenhum lugar. A ficha existe para dizer isso. */
export const raio = { nada: 0 } as const;

/** Margem lateral de toda tela. */
export const margemTela = 22;

/** O conteúdo começa aqui, logo abaixo da barra de status. */
export const topoConteudo = 54;

/** Respiro do rodapé de tela sem abas. */
export const rodapeFixo = 30;

export const tamanhos = {
  /** Altura mínima de qualquer área tocável. */
  alvoMin: 44,
  botao: 60,
  botaoSecundario: 54,
  campo: 52,
  /** Altura mínima de alternativa. */
  alternativa: 58,
  abas: 76,
  /** Espessura de régua. */
  linha: 1,
  /** Barra de progresso fina: trilha, XP do topo. */
  trilho: 2,
  /** Barra de progresso da sessão e do rank. */
  trilhoGrosso: 3,
  /** Nó quadrado da timeline. */
  no: 26,
  /** Altura das barras da régua de sequência. */
  celulaSemana: 26,
  /** Avatar do cabeçalho de Hoje e do Perfil. */
  avatar: 44,
  avatarGrande: 60
} as const;

/* ─────────────────────────── tipografia ────────────────────────── */

/**
 * Com fonte customizada, **peso é o nome da família** — nunca `fontWeight`.
 * No Android, pedir `fontWeight: '700'` faz o sistema inventar um negrito
 * sintético borrado, diferente do desenho.
 *
 * Duas famílias, sem exceção: Space Grotesk para número, título e corpo;
 * JetBrains Mono para todo rótulo, toda métrica e todo código.
 */
export const fontes = {
  corpo: 'SpaceGrotesk_400Regular',
  medio: 'SpaceGrotesk_500Medium',
  semi: 'SpaceGrotesk_600SemiBold',
  forte: 'SpaceGrotesk_700Bold',

  mono: 'JetBrainsMono_400Regular',
  monoMedio: 'JetBrainsMono_500Medium',
  monoForte: 'JetBrainsMono_700Bold'
} as const;

/** Rede de segurança caso as fontes não carreguem. */
export const fontesDoSistema = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  corpo: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' })
} as const;

/** Nada de texto de leitura abaixo disto. */
export const tamanhoMinimoTexto = 13.5;

/**
 * `includeFontPadding: false` nos números herói é obrigatório no Android: com
 * o padding de fonte ligado, uma entrelinha menor que o corpo (0.82em) corta a
 * parte de baixo do algarismo.
 */
const semPaddingAndroid = Platform.OS === 'android' ? { includeFontPadding: false } : {};

/**
 * Combinações prontas, tiradas da tabela do handoff.
 *
 * Em React Native `lineHeight` e `letterSpacing` são absolutos, não proporção —
 * por isso os valores já vêm multiplicados: o `0.82em` sobre 76 virou 62.
 */
export const tipo = {
  /** Contagem de cards do cartão da diária. */
  heroi: {
    fontFamily: fontes.forte,
    fontSize: 76,
    lineHeight: 62,
    letterSpacing: -4,
    ...semPaddingAndroid
  },
  /** O relógio do relâmpago. O maior número do app. */
  heroiGigante: {
    fontFamily: fontes.forte,
    fontSize: 128,
    lineHeight: 102,
    letterSpacing: -7,
    ...semPaddingAndroid
  },
  /** XP ganho, na tela de resumo. */
  heroiXp: {
    fontFamily: fontes.forte,
    fontSize: 96,
    lineHeight: 79,
    letterSpacing: -5,
    ...semPaddingAndroid
  },

  /** Título de tela de entrada e o rank em Hoje. */
  tituloGrande: { fontFamily: fontes.forte, fontSize: 34, lineHeight: 35, letterSpacing: -1.6 },
  /** Título das demais telas. */
  titulo: { fontFamily: fontes.forte, fontSize: 30, lineHeight: 31, letterSpacing: -1.3 },
  /** Nome no perfil. */
  tituloPerfil: { fontFamily: fontes.forte, fontSize: 26, lineHeight: 26, letterSpacing: -1 },

  /** Sequência em Hoje. */
  metricaGrande: { fontFamily: fontes.forte, fontSize: 46, lineHeight: 39, letterSpacing: -2 },
  /** Célula da grade do perfil. */
  metrica: { fontFamily: fontes.forte, fontSize: 30, lineHeight: 30, letterSpacing: -1.3 },
  /** Número pequeno de métrica: contagem por nível, valor de régua. */
  metricaPequena: { fontFamily: fontes.forte, fontSize: 15, lineHeight: 18 },

  pergunta: { fontFamily: fontes.semi, fontSize: 23, lineHeight: 30, letterSpacing: -0.4 },
  /** Título de item de lista: lição, conquista, linha da liga. */
  tituloItem: { fontFamily: fontes.semi, fontSize: 17, lineHeight: 20 },
  tituloItemMenor: { fontFamily: fontes.semi, fontSize: 15, lineHeight: 18 },
  /** Nome de trilha na lista de Hoje. */
  tituloLinha: { fontFamily: fontes.semi, fontSize: 16, lineHeight: 19 },
  /** Título do painel de feedback. */
  tituloFeedback: { fontFamily: fontes.forte, fontSize: 20, lineHeight: 24, letterSpacing: -0.5 },

  botao: { fontFamily: fontes.forte, fontSize: 18, lineHeight: 18, letterSpacing: -0.3 },
  botaoMenor: { fontFamily: fontes.forte, fontSize: 17, lineHeight: 17, letterSpacing: -0.3 },
  botaoSecundario: { fontFamily: fontes.semi, fontSize: 15, lineHeight: 18 },
  botaoDiscreto: { fontFamily: fontes.semi, fontSize: 14, lineHeight: 17 },

  /** Explicação do painel de feedback. */
  corpo: { fontFamily: fontes.corpo, fontSize: 14.5, lineHeight: 24 },
  /** Definição do glossário. */
  corpoMenor: { fontFamily: fontes.corpo, fontSize: 13.5, lineHeight: 22 },
  /** Texto de alternativa. */
  alternativa: { fontFamily: fontes.medio, fontSize: 16, lineHeight: 23 },

  /**
   * A assinatura da identidade: mono, caixa alta, `letterSpacing` 2.6.
   * Aparece **uma vez por seção** — no acento quando a seção é o foco.
   */
  rotuloSecao: { fontFamily: fontes.monoForte, fontSize: 11, lineHeight: 11, letterSpacing: 2.6 },
  rotuloAba: { fontFamily: fontes.monoForte, fontSize: 9, lineHeight: 9, letterSpacing: 1.4 },
  rotuloCampo: { fontFamily: fontes.monoForte, fontSize: 10, lineHeight: 10, letterSpacing: 1.8 },
  /** Rótulo de célula da grade do perfil e do bloco "desbloqueou". */
  rotuloCelula: { fontFamily: fontes.mono, fontSize: 10, lineHeight: 10, letterSpacing: 1.4 },
  /** Faixa de contexto do exercício, tag do glossário, "mostrar/ocultar". */
  rotuloFino: { fontFamily: fontes.mono, fontSize: 10, lineHeight: 12, letterSpacing: 1.2 },

  /** Métrica curta: contador, XP, contagem de lista. */
  metricaMono: { fontFamily: fontes.mono, fontSize: 11, lineHeight: 11 },
  metricaMonoMedia: { fontFamily: fontes.mono, fontSize: 12, lineHeight: 12 },
  /** Régua de estatística: "melhor", "média", "acerto". */
  reguaMono: { fontFamily: fontes.mono, fontSize: 12.5, lineHeight: 15 },
  /** Nota que ocupa mais de uma linha: subtítulo, nota de lição. */
  notaMono: { fontFamily: fontes.mono, fontSize: 12.5, lineHeight: 21 },
  notaMonoMenor: { fontFamily: fontes.mono, fontSize: 11.5, lineHeight: 18 },
  notaMonoCurta: { fontFamily: fontes.mono, fontSize: 12, lineHeight: 18 },
  /** Termo do glossário. */
  monoForte: { fontFamily: fontes.monoForte, fontSize: 14, lineHeight: 17 },
  /** Iniciais dentro do avatar. */
  iniciais: { fontFamily: fontes.monoForte, fontSize: 13, lineHeight: 16 },
  iniciaisGrandes: { fontFamily: fontes.monoForte, fontSize: 18, lineHeight: 22 },
  /** Texto digitado num campo de formulário. */
  campo: { fontFamily: fontes.mono, fontSize: 15, lineHeight: 20 },

  codigo: { fontFamily: fontes.mono, fontSize: 14, lineHeight: 26 },
  /** Trecho de código dentro de uma frase: 0.92em do pai. */
  codigoNoTexto14: { fontFamily: fontes.mono, fontSize: 13.5 },
  codigoNoTexto21: { fontFamily: fontes.mono, fontSize: 21 },

  /** O cursor ▌ que pisca ao lado do rótulo do botão. */
  cursor: { fontFamily: fontes.monoForte, fontSize: 14, lineHeight: 18 },
  /** O ✕ que fecha a sessão e o glossário. */
  fechar: { fontFamily: fontes.semi, fontSize: 18, lineHeight: 22 }
} as const;

/* ──────────────────────────── movimento ────────────────────────── */

/**
 * `useNativeDriver: true` em tudo que for `transform` ou `opacity`. Largura de
 * barra é layout: ou `useNativeDriver: false`, ou anime `scaleX` de uma View de
 * largura fixa.
 */
export const curva = {
  /** A de quase tudo: sai rápido e desacelera. */
  saida: [0.2, 0.85, 0.25, 1] as const,
  /** Barras e anéis: um pouco mais preguiçosa no fim. */
  barra: [0.2, 0.9, 0.3, 1] as const,
  anel: [0.3, 0.9, 0.3, 1] as const,
  tremor: [0.36, 0.07, 0.19, 0.97] as const
} as const;

export const animacao = {
  /** Troca de aba: desliza 46 dp na direção do toque. */
  aba: 380,
  /** Sessão abrindo: escala 0.9 → 1 com opacidade. */
  sessao: 400,
  /** Painel de feedback e glossário subindo do rodapé. */
  feedback: 300,
  /** Saída da tela de auth: sobe 40 dp e apaga. */
  auth: 340,
  /** Barra de progresso da sessão. */
  barra: 420,
  /** Anel da diária preenchendo. */
  anel: 700,
  /** Barra do rank e das trilhas. */
  rank: 900,
  /** Nó desbloqueando, número do resumo aparecendo. */
  pop: 520,
  popResumo: 480,
  /** A sequência batendo ao fechar o dia. */
  beat: 900,
  tremor: 420,
  /** ▌ piscando, em `steps(1)`. */
  cursor: 1100,
  /** A linha que desce no cartão da diária. */
  varredura: 5500,
  /** Alternativa mudando de estado depois da resposta. */
  alternativa: 180,
  /** O confete do resumo: cada peça sorteia a sua entre estes limites. */
  confeteMin: 1700,
  confeteMax: 3000,
  confeteAtraso: 1000,

  curva
} as const;

/** Os passos do tremor, em dp. Ver `animacao.tremor`. */
export const passosTremor = [0, -7, 6, -4, 3, 0] as const;

/** O deslocamento lateral da troca de aba, em dp. */
export const deslocamentoAba = 46;

export type Cor = keyof typeof cores;
export type Linguagem = keyof typeof coresLinguagem;
export type Tipo = keyof typeof tipo;
