/**
 * O motor de uma sessão: uma fila de cards que só esvazia quando tudo foi
 * acertado pelo menos uma vez.
 *
 * Errar não tira vida e não encerra nada. O card volta para o fim da fila e
 * reaparece antes do término. A punição por errar é ver o card de novo — e
 * ganhar 4 de XP em vez de 10.
 *
 * Todas as funções devolvem um objeto novo; nada é alterado no lugar, para o
 * React perceber a mudança.
 */

import type { Card } from './conteudo';
import { xpDoCard, XP_SESSAO_COMPLETA } from './gamificacao';

const TIPOS_DE_ESCRITA = ['escreva', 'montar-linha'];

export type EstadoCard = { errouAntes: boolean; tentativas: number };

export type Sessao = {
  cards: Card[];
  porId: Record<string, Card>;
  fila: string[];
  estados: Record<string, EstadoCard>;
  /** Cards pulados: saíram da fila sem resposta e não voltam. */
  pulados: string[];
  total: number;
  concluidos: number;
  acertosDePrimeira: number;
  erros: number;
  escritaAcertos: number;
  xp: number;
};

export function iniciarSessao(cards: Card[]): Sessao {
  const estados: Record<string, EstadoCard> = {};
  for (const card of cards) estados[card.id] = { errouAntes: false, tentativas: 0 };

  return {
    cards,
    porId: Object.fromEntries(cards.map((c) => [c.id, c])),
    fila: cards.map((c) => c.id),
    estados,
    pulados: [],
    total: cards.length,
    concluidos: 0,
    acertosDePrimeira: 0,
    erros: 0,
    escritaAcertos: 0,
    xp: 0
  };
}

export function cardAtual(sessao: Sessao): Card | null {
  const id = sessao.fila[0];
  return id ? sessao.porId[id] ?? null : null;
}

export function terminou(sessao: Sessao): boolean {
  return sessao.fila.length === 0;
}

export function progresso(sessao: Sessao): number {
  return sessao.total === 0 ? 1 : sessao.concluidos / sessao.total;
}

/** Verdadeiro se este card ainda não foi errado nesta sessão. */
export function dePrimeira(sessao: Sessao, id: string): boolean {
  return !sessao.estados[id]?.errouAntes;
}

/** Quantos cards dá para pular numa sessão só. Depois disso, o botão trava. */
export const LIMITE_PULOS = 5;

/**
 * Pula o card atual: sai da fila sem resposta e sem julgamento — não conta
 * como erro, não dá XP, e **não volta** para o fim da fila como um erro
 * voltaria. `total` desce junto, para o progresso continuar batendo com o
 * que de fato precisa de resposta.
 */
export function pular(sessao: Sessao): Sessao {
  const id = sessao.fila[0];
  if (!id || sessao.pulados.length >= LIMITE_PULOS) return sessao;

  return {
    ...sessao,
    fila: sessao.fila.slice(1),
    pulados: [...sessao.pulados, id],
    total: sessao.total - 1
  };
}

export function responder(sessao: Sessao, acertou: boolean): Sessao {
  const id = sessao.fila[0];
  if (!id) return sessao;

  const anterior = sessao.estados[id]!;
  const estados = {
    ...sessao.estados,
    [id]: {
      errouAntes: anterior.errouAntes || !acertou,
      tentativas: anterior.tentativas + 1
    }
  };

  if (!acertou) {
    // Vai para o fim da fila. Com um card só restando, ele reaparece na hora —
    // que é exatamente o comportamento desejado: não dá para sair devendo.
    return {
      ...sessao,
      estados,
      fila: [...sessao.fila.slice(1), id],
      erros: sessao.erros + 1
    };
  }

  const card = sessao.porId[id]!;
  const ganho = xpDoCard(anterior.errouAntes);

  return {
    ...sessao,
    estados,
    fila: sessao.fila.slice(1),
    concluidos: sessao.concluidos + 1,
    acertosDePrimeira: sessao.acertosDePrimeira + (anterior.errouAntes ? 0 : 1),
    escritaAcertos: sessao.escritaAcertos + (TIPOS_DE_ESCRITA.includes(card.tipo) ? 1 : 0),
    xp: sessao.xp + ganho
  };
}

export type Resultado = {
  xpCards: number;
  xpBonus: number;
  xpTotal: number;
  total: number;
  acertosDePrimeira: number;
  erros: number;
  escritaAcertos: number;
  semErro: boolean;
  errados: Card[];
};

/** O que a tela de resumo precisa saber. */
export function resultado(sessao: Sessao): Resultado {
  const errados = sessao.cards.filter((card) => sessao.estados[card.id]!.errouAntes);

  return {
    xpCards: sessao.xp,
    xpBonus: XP_SESSAO_COMPLETA,
    xpTotal: sessao.xp + XP_SESSAO_COMPLETA,
    total: sessao.total,
    acertosDePrimeira: sessao.acertosDePrimeira,
    erros: sessao.erros,
    escritaAcertos: sessao.escritaAcertos,
    semErro: errados.length === 0,
    errados
  };
}
