/**
 * Níveis de dificuldade.
 *
 * O nível não é o tipo do card — é **quanto apoio a tela dá**. Um `escreva` de
 * `let xp = 0;` é leve; um card de alternativas sobre 15 linhas de código é
 * difícil. Por isso o nível é declarado no JSON, card a card.
 */

export type Nivel = 1 | 2 | 3;

export const NIVEIS: Record<Nivel, { nome: string; descricao: string }> = {
  1: { nome: 'Leve', descricao: 'a resposta está na tela, basta lembrar' },
  2: { nome: 'Médio', descricao: 'está na tela, mas exige simular ou comparar' },
  3: { nome: 'Difícil', descricao: 'não há nada na tela para copiar' }
};

type ComNivel = { nivel?: number; tipo?: string };

// Rede de segurança para conteúdo em edição: o validador exige `nivel`, mas se
// um card chegar sem ele o tipo dá um palpite razoável em vez de quebrar.
const PADRAO_POR_TIPO: Record<string, Nivel> = {
  'palavra-chave': 1,
  'o-que-faz': 1,
  saida: 2,
  lacuna: 2,
  'montar-linha': 2,
  'ache-o-erro': 2,
  escreva: 3,
  estrutura: 3
};

export function nivelDe(card: ComNivel): Nivel {
  if (card.nivel === 1 || card.nivel === 2 || card.nivel === 3) return card.nivel;
  return PADRAO_POR_TIPO[card.tipo ?? ''] ?? 2;
}

function agrupar<T extends ComNivel>(cards: T[]): Record<Nivel, T[]> {
  const grupos: Record<Nivel, T[]> = { 1: [], 2: [], 3: [] };
  for (const card of cards) grupos[nivelDe(card)].push(card);
  return grupos;
}

/**
 * Ordem da lição: estritamente crescente, leve → médio → difícil.
 *
 * Dentro do mesmo nível a ordem é a do arquivo, que é a ordem em que o assunto
 * foi escrito — trocar isso quebraria cards que se apoiam no anterior.
 */
export function ordenarLicao<T extends ComNivel>(cards: T[]): T[] {
  const g = agrupar(cards);
  return [...g[1], ...g[2], ...g[3]];
}

/**
 * Ordem da sessão diária: também crescente, mas com um card leve reservado
 * para o fim.
 *
 * Subir até o mais difícil e parar ali faz a sessão terminar na pior sensação
 * do dia. Fechar com algo fácil custa um card e muda como a pessoa lembra da
 * sessão inteira.
 */
export function ordenarParaSessao<T extends ComNivel>(cards: T[]): T[] {
  if (cards.length <= 3) return ordenarLicao(cards);

  const g = agrupar(cards);
  const fecho = g[1].pop() ?? g[2].pop();
  const subida = [...g[1], ...g[2], ...g[3]];

  return fecho ? [...subida, fecho] : subida;
}

export function contarNiveis<T extends ComNivel>(cards: T[]): Record<Nivel, number> {
  const g = agrupar(cards);
  return { 1: g[1].length, 2: g[2].length, 3: g[3].length };
}
