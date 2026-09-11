/**
 * XP, ranks, sequência de dias e conquistas.
 *
 * Números escolhidos no PLANO.md e validados no site. Ficam todos aqui para
 * serem ajustados num lugar só depois de algumas semanas de uso real.
 */

import { diaDaSemana, diferencaEmDias, hoje, mesAtual, somarDias, type Dia } from './datas';

export const XP_ACERTO_DE_PRIMEIRA = 10;
export const XP_ACERTO_APOS_ERRO = 4;
export const XP_SESSAO_COMPLETA = 20;

export const CONGELAMENTOS_POR_MES = 2;

/**
 * Refazer uma lição já concluída continua valendo como revisão, mas paga menos
 * XP. Sem isto, o caminho mais rápido para subir de rank seria repetir a lição
 * mais fácil do acervo.
 */
export const FATOR_REPETICAO = 0.25;

/** Quatro meses cobrem o calendário e não deixam o histórico crescer sem fim. */
export const DIAS_DE_HISTORICO = 120;

export type Meta = { minutos: number; cards: number; rotulo: string };

export const METAS: Meta[] = [
  { minutos: 5, cards: 10, rotulo: 'Leve' },
  { minutos: 10, cards: 20, rotulo: 'Firme' },
  { minutos: 20, cards: 40, rotulo: 'Pesado' }
];

export function metaPara(minutos: number): Meta {
  return METAS.find((meta) => meta.minutos === minutos) ?? METAS[0]!;
}

export type Rank = { nome: string; xp: number };

export const RANKS: Rank[] = [
  { nome: 'Ovo', xp: 0 },
  { nome: 'Cria', xp: 200 },
  { nome: 'Serpente', xp: 600 },
  { nome: 'Naja', xp: 1500 },
  { nome: 'Basilisco', xp: 3000 },
  { nome: 'Ouroboros', xp: 6000 }
];

export function rankPara(xp: number) {
  let indice = 0;
  while (indice + 1 < RANKS.length && xp >= RANKS[indice + 1]!.xp) indice += 1;

  const atual = RANKS[indice]!;
  const proximo = RANKS[indice + 1] ?? null;

  // No último rank não há barra para encher.
  const progresso = proximo ? (xp - atual.xp) / (proximo.xp - atual.xp) : 1;

  return { atual, proximo, progresso, faltam: proximo ? proximo.xp - xp : 0 };
}

export function xpDoCard(errouAntes: boolean): number {
  return errouAntes ? XP_ACERTO_APOS_ERRO : XP_ACERTO_DE_PRIMEIRA;
}

export type Progresso = {
  xp: number;
  sequencia: number;
  ultimaDiaria: Dia | null;
  metaDiariaMin: number;
  congelamentos: number;
  mesCongelamentos: string;
  recordeRelampago: number;
  /** Quantas partidas de relâmpago já foram jogadas. Faz a média existir. */
  relampagoPartidas: number;
  /** Acertos somados em todas elas. */
  relampagoAcertos: number;
  /** Cards respondidos somados — acertos e erros. Faz a taxa de acerto existir. */
  relampagoRespostas: number;
  conquistas: string[];
  historico: Dia[];
  diarias: number;
  /** Cards respondidos em sessões, somando todas elas. */
  cardsRespondidos: number;
  /** Destes, quantos saíram certos de primeira. Junto com o de cima dá a taxa. */
  cardsAcertados: number;
  escritaAcertos: number;
  licoesPerfeitas: number;
  /**
   * O `total` de `desempenhoNosDificeis` (em `nucleo/diaria.ts`) no momento
   * em que a pessoa recusou a última sugestão de subir de nível. `null`
   * quando nunca recusou. Só local — não faz sentido subir pra nuvem, é
   * puramente pra decidir quando perguntar de novo.
   */
  sugestaoNivelRecusadaEm: number | null;
};

export function progressoInicial(): Progresso {
  return {
    xp: 0,
    sequencia: 0,
    ultimaDiaria: null,
    metaDiariaMin: 5,
    congelamentos: CONGELAMENTOS_POR_MES,
    mesCongelamentos: mesAtual(),
    recordeRelampago: 0,
    relampagoPartidas: 0,
    relampagoAcertos: 0,
    relampagoRespostas: 0,
    conquistas: [],
    historico: [],
    diarias: 0,
    cardsRespondidos: 0,
    cardsAcertados: 0,
    escritaAcertos: 0,
    licoesPerfeitas: 0,
    sugestaoNivelRecusadaEm: null
  };
}

/** Marca o dia de hoje no histórico, sem repetir e sem deixar crescer à toa. */
export function registrarDia(historico: Dia[]): Dia[] {
  const dia = hoje();
  if (historico.includes(dia)) return historico;
  return [...historico, dia].sort().slice(-DIAS_DE_HISTORICO);
}

/**
 * Decide a nova sequência ao concluir uma diária.
 *
 * Devolve também se um congelamento foi gasto, para a tela de resumo poder
 * avisar — congelamento gasto em silêncio é congelamento que some sem explicação.
 */
export function calcularSequencia(progresso: Progresso) {
  const hojeIso = hoje();
  const { ultimaDiaria, sequencia } = progresso;

  // Recomeça a cota de congelamentos quando vira o mês.
  const mudouDeMes = progresso.mesCongelamentos !== mesAtual();
  const congelamentos = mudouDeMes ? CONGELAMENTOS_POR_MES : progresso.congelamentos;

  const base = {
    ultimaDiaria: hojeIso,
    mesCongelamentos: mesAtual(),
    congelamentos,
    congelamentoGasto: false
  };

  if (!ultimaDiaria) return { ...base, sequencia: 1 };

  const dias = diferencaEmDias(ultimaDiaria, hojeIso);

  // Segunda diária no mesmo dia não mexe em nada.
  if (dias === 0) return { ...base, sequencia: Math.max(sequencia, 1) };
  if (dias === 1) return { ...base, sequencia: sequencia + 1 };

  // Faltou um dia só e ainda há congelamento? A sequência sobrevive.
  if (dias === 2 && congelamentos > 0) {
    return {
      ...base,
      sequencia: sequencia + 1,
      congelamentos: congelamentos - 1,
      congelamentoGasto: true
    };
  }

  return { ...base, sequencia: 1 };
}

/**
 * O recorde de sequência, tirado do histórico.
 *
 * Não é um campo guardado: é a maior corrida de dias consecutivos que existe em
 * `historico`. Guardar um número separado criaria uma segunda verdade que
 * poderia divergir do calendário — e o calendário é o que a pessoa vê.
 *
 * O limite de `DIAS_DE_HISTORICO` significa que um recorde muito antigo some
 * junto com os dias que o provaram. É o preço de não guardar o número, e é
 * barato: quatro meses cobrem qualquer sequência que ainda importe.
 */
export function recordeSequencia(historico: Dia[]): number {
  const dias = [...new Set(historico)].sort();

  let recorde = 0;
  let corrida = 0;
  let anterior: Dia | null = null;

  for (const dia of dias) {
    corrida = anterior && diferencaEmDias(anterior, dia) === 1 ? corrida + 1 : 1;
    anterior = dia;
    if (corrida > recorde) recorde = corrida;
  }

  return recorde;
}

const DIAS_CURTOS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'] as const;

export type DiaDaRegua = { dia: Dia; feito: boolean; ehHoje: boolean; rotulo: string };

/**
 * Os últimos sete dias, terminando em hoje.
 *
 * É a régua de sequência da tela Hoje. Termina em hoje, e não no sábado, porque
 * a pergunta que ela responde é "quantos dias seguidos eu venho fazendo", e não
 * "como foi minha semana no calendário".
 */
export function reguaDaSemana(historico: Dia[]): DiaDaRegua[] {
  const feitos = new Set(historico);
  const hojeIso = hoje();

  return Array.from({ length: 7 }, (_, indice) => {
    const dia = somarDias(hojeIso, indice - 6);
    const ehHoje = dia === hojeIso;

    return {
      dia,
      feito: feitos.has(dia),
      ehHoje,
      rotulo: ehHoje ? 'HOJE' : DIAS_CURTOS[diaDaSemana(dia)]!
    };
  });
}

export type Conquista = {
  id: string;
  nome: string;
  descricao: string;
  verificar: (p: Progresso) => boolean;
};

export const CONQUISTAS: Conquista[] = [
  {
    id: 'primeira-diaria',
    nome: 'O primeiro giro',
    descricao: 'Conclua sua primeira diária.',
    verificar: (p) => p.diarias >= 1
  },
  {
    id: 'sequencia-7',
    nome: 'Uma semana inteira',
    descricao: '7 dias seguidos sem falhar.',
    verificar: (p) => p.sequencia >= 7
  },
  {
    id: 'sequencia-30',
    nome: 'Um mês de casa',
    descricao: '30 dias seguidos.',
    verificar: (p) => p.sequencia >= 30
  },
  {
    id: 'escrita-50',
    nome: 'Dedo no teclado',
    descricao: '50 acertos escrevendo código à mão.',
    verificar: (p) => p.escritaAcertos >= 50
  },
  {
    id: 'licao-perfeita',
    nome: 'Sem tropeçar',
    descricao: 'Termine uma lição inteira sem errar nenhum card.',
    verificar: (p) => p.licoesPerfeitas >= 1
  },
  {
    id: 'relampago-20',
    nome: 'Reflexo',
    descricao: 'Acerte 20 cards em um Desafio Relâmpago.',
    verificar: (p) => p.recordeRelampago >= 20
  }
];

/** Só as que acabaram de ser desbloqueadas, para o resumo poder anunciá-las. */
export function conquistasNovas(progresso: Progresso): Conquista[] {
  const jaTem = new Set(progresso.conquistas);
  return CONQUISTAS.filter((c) => !jaTem.has(c.id) && c.verificar(progresso));
}
