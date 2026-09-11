/**
 * Monta a fila da diária: ~60% conteúdo novo, ~40% revisão vencida.
 *
 * A pessoa não escolhe o que revisar — esse é o ponto. Ela abre o app, e a
 * sessão do dia já vem montada pelo agendamento do ciclo Ouroboros.
 */

import { embaralhar } from './aleatorio';
import {
  licoesDaLinguagem,
  obterCard,
  obterLicao,
  obterLinguagem,
  todasAsLicoes,
  todosOsCards,
  type Card,
  type Licao,
  type LinguagemId,
  type TipoCard
} from './conteudo';
import { nivelDe, ordenarParaSessao, type Nivel } from './dificuldade';
import { PROXIMO_NIVEL, type NivelConhecimento } from './perfil';
import { estaVencido, foiVisto, type Revisao } from './revisao';

const FATIA_NOVA = 0.6;

/**
 * Quanto da diária é leve/médio/difícil, por nível de conhecimento. Só se
 * aplica à revisão — o conteúdo novo continua saindo na ordem da lição, sem
 * pular pra frente por dificuldade (ver `selecionarRevisao` abaixo).
 */
const PROPORCAO_NIVEL: Record<NivelConhecimento, Record<Nivel, number>> = {
  iniciante: { 1: 0.6, 2: 0.2, 3: 0.2 },
  intermediario: { 1: 0.4, 2: 0.4, 3: 0.2 },
  avancado: { 1: 0.1, 2: 0.2, 3: 0.7 }
};

export type MapaRevisoes = Map<string, Revisao>;

type Bloco = { licao: Licao; cards: Card[] };

/**
 * Lições de uma linguagem que ainda têm card não visto, em ordem de trilha.
 *
 * Uma lição sem nada de novo é pulada em vez de interromper a busca — no site,
 * um `break` no lugar errado fazia a diária secar depois de uma semana e nunca
 * mais oferecer conteúdo novo.
 */
function filaDeNovos(
  linguagemId: LinguagemId,
  revisoes: MapaRevisoes,
  concluidas: Set<string>
): Bloco[] {
  const fila: Bloco[] = [];

  for (const licao of licoesDaLinguagem(linguagemId)) {
    if (concluidas.has(licao.id)) continue;

    const naoVistos = licao.cards.filter((card) => !foiVisto(revisoes.get(card.id)));
    if (naoVistos.length > 0) fila.push({ licao, cards: naoVistos });
  }

  return fila;
}

/**
 * Escolhe `quantidade` cards de revisão, tentando fazer o **dia inteiro**
 * (novo + revisão) bater a proporção leve/médio/difícil do nível — não só a
 * fatia de revisão sozinha. Sem nível definido, é sorteio puro, do jeito que
 * sempre foi.
 *
 * Quando não há vencido o bastante de alguma dificuldade (avançado pedindo
 * muito difícil, por exemplo, e a revisão do dia não tem tanto assim), o que
 * faltar vem de qualquer outra dificuldade — entregar um dia mais curto do
 * que devia seria pior do que entregar fora da proporção ideal.
 */
function selecionarRevisao(
  paraRevisar: Card[],
  quantidade: number,
  nivel: NivelConhecimento | null,
  jaEscolhidosHoje: Card[]
): Card[] {
  if (quantidade <= 0) return [];
  if (!nivel) return embaralhar(paraRevisar).slice(0, quantidade);

  const proporcao = PROPORCAO_NIVEL[nivel];
  const totalDoDia = jaEscolhidosHoje.length + quantidade;

  const contarPorNivel = (cards: Card[]): Record<Nivel, number> => {
    const contagem: Record<Nivel, number> = { 1: 0, 2: 0, 3: 0 };
    for (const card of cards) contagem[nivelDe(card)] += 1;
    return contagem;
  };

  const jaTem = contarPorNivel(jaEscolhidosHoje);

  // O nível 3 absorve o arredondamento — mesma ideia de `ordenarParaSessao`.
  const alvo: Record<Nivel, number> = {
    1: Math.round(totalDoDia * proporcao[1]),
    2: Math.round(totalDoDia * proporcao[2]),
    3: 0
  };
  alvo[3] = totalDoDia - alvo[1] - alvo[2];

  const disponiveis: Record<Nivel, Card[]> = { 1: [], 2: [], 3: [] };
  for (const card of paraRevisar) disponiveis[nivelDe(card)].push(card);

  const escolhidos: Card[] = [];
  const usados = new Set<string>();

  for (const nivelDoCard of [1, 2, 3] as Nivel[]) {
    const precisa = Math.max(0, alvo[nivelDoCard] - jaTem[nivelDoCard]);
    const pegos = embaralhar(disponiveis[nivelDoCard]).slice(0, precisa);
    for (const card of pegos) usados.add(card.id);
    escolhidos.push(...pegos);
  }

  if (escolhidos.length < quantidade) {
    const sobras = paraRevisar.filter((card) => !usados.has(card.id));
    escolhidos.push(...embaralhar(sobras).slice(0, quantidade - escolhidos.length));
  }

  return escolhidos.slice(0, quantidade);
}

export type Diaria = {
  cards: Card[];
  /** Lições cujo conceito ainda não foi mostrado e que entraram nesta sessão. */
  apresentar: Licao[];
};

export function montarDiaria({
  revisoes,
  concluidas,
  linguagens,
  meta,
  nivel = null
}: {
  revisoes: MapaRevisoes;
  concluidas: Set<string>;
  linguagens: LinguagemId[];
  meta: number;
  /** `null` (padrão): sorteio puro na revisão, sem viés de dificuldade. */
  nivel?: NivelConhecimento | null;
}): Diaria {
  const paraRevisar: Card[] = [];

  for (const [cardId, estado] of revisoes) {
    // Card que nunca foi respondido não é revisão, é conteúdo novo.
    if (!foiVisto(estado) || !estaVencido(estado)) continue;

    const card = obterCard(cardId);
    // Uma lição removida do /conteudo deixa revisões órfãs para trás.
    if (card && linguagens.includes(card.linguagem)) paraRevisar.push(card);
  }

  // Uma fila por linguagem, consumidas em rodízio, para as trilhas andarem
  // juntas em vez de uma ficar parada até a outra acabar.
  const filas = linguagens.map((id) => filaDeNovos(id, revisoes, concluidas));
  const escolhidosNovos: Card[] = [];
  const licoesTocadas = new Map<string, Licao>();

  function puxarNovos(quantidade: number) {
    let restam = quantidade;

    while (restam > 0) {
      const antes = escolhidosNovos.length;

      for (const fila of filas) {
        if (restam === 0) break;

        const bloco = fila[0];
        if (!bloco) continue;

        escolhidosNovos.push(bloco.cards.shift()!);
        licoesTocadas.set(bloco.licao.id, bloco.licao);
        restam -= 1;

        if (bloco.cards.length === 0) fila.shift();
      }

      // Nenhuma fila tinha o que dar: acabou o conteúdo novo que existe.
      if (escolhidosNovos.length === antes) break;
    }
  }

  puxarNovos(Math.round(meta * FATIA_NOVA));

  // O que sobrar da cota de novos vira espaço para revisão, e vice-versa.
  const escolhidosRevisao = selecionarRevisao(
    paraRevisar,
    meta - escolhidosNovos.length,
    nivel,
    escolhidosNovos
  );

  // Faltou revisão vencida para fechar a meta? O resto vem de conteúdo novo —
  // é o caso do primeiro dia, quando ainda não há nada agendado para rever.
  puxarNovos(meta - escolhidosNovos.length - escolhidosRevisao.length);

  // Conceito só é apresentado de lição em que nenhum card foi respondido ainda.
  const apresentar = [...licoesTocadas.values()].filter((licao) =>
    licao.cards.every((card) => !foiVisto(revisoes.get(card.id)))
  );

  return {
    cards: ordenarParaSessao([...escolhidosNovos, ...escolhidosRevisao]),
    apresentar
  };
}

/** Cards de resposta rápida — múltipla escolha, sem card de digitar/montar. */
const TIPOS_RAPIDOS: TipoCard[] = ['palavra-chave', 'o-que-faz', 'saida', 'estrutura'];

/** Cards para o Desafio Relâmpago: só os de resposta rápida. */
export function montarRelampago(linguagens: LinguagemId[]): Card[] {
  const rapidos = todosOsCards().filter(
    (card) => linguagens.includes(card.linguagem) && TIPOS_RAPIDOS.includes(card.tipo)
  );

  return embaralhar(rapidos);
}

/**
 * Os 5 cards do teste de nível no onboarding: 3 leves, 1 médio, 1 difícil, só
 * de tipo múltipla escolha — a mesma UI do Relâmpago, sem exigir digitação ou
 * montar linha antes mesmo de a pessoa ver a primeira lição.
 *
 * Tirados do primeiro módulo (trilha) da linguagem escolhida: é a única
 * amostra de conteúdo que existe pra calibrar antes da trilha abrir. Fora do
 * ciclo de repetição espaçada — não passa por `agendar`, não marca nada como
 * visto, é só uma calibração; a pessoa vê esses cards de novo, frescos, na
 * primeira diária de verdade.
 */
export function montarTesteDeNivel(linguagemId: LinguagemId): Card[] {
  const primeiraTrilha = obterLinguagem(linguagemId)?.trilhas[0];
  if (!primeiraTrilha) return [];

  const candidatos = primeiraTrilha.licoes
    .map(obterLicao)
    .filter((licao): licao is Licao => licao !== null)
    .flatMap((licao) => licao.cards)
    .filter((card) => TIPOS_RAPIDOS.includes(card.tipo));

  const porNivel: Record<Nivel, Card[]> = { 1: [], 2: [], 3: [] };
  for (const card of candidatos) porNivel[nivelDe(card)].push(card);

  const escolhidos = [
    ...embaralhar(porNivel[1]).slice(0, 3),
    ...embaralhar(porNivel[2]).slice(0, 1),
    ...embaralhar(porNivel[3]).slice(0, 1)
  ];

  return embaralhar(escolhidos);
}

/**
 * Lições em que todo card já foi respondido pelo menos uma vez.
 *
 * Quem estuda só pela diária nunca abre a lição na trilha, e sem isto a trilha
 * ficaria travada no primeiro degrau para sempre.
 */
export function licoesCompletadas(revisoes: MapaRevisoes, concluidas: Set<string>): string[] {
  return todasAsLicoes()
    .filter((licao) => !concluidas.has(licao.id))
    .filter((licao) => licao.cards.every((card) => foiVisto(revisoes.get(card.id))))
    .map((licao) => licao.id);
}

export type PontoFraco = {
  card: Card;
  erros: number;
  nivelRevisao: number;
  dominado: boolean;
};

/**
 * Cards ordenados por quanto já custaram: mais erros primeiro, e entre os
 * empatados, os que estão mais atrás na escada de revisão.
 */
export function pontosFracos(revisoes: MapaRevisoes, limite = 12): PontoFraco[] {
  const lista: PontoFraco[] = [];

  for (const [cardId, estado] of revisoes) {
    if (!estado.erros) continue;

    const card = obterCard(cardId);
    if (!card) continue;

    lista.push({
      card,
      erros: estado.erros,
      nivelRevisao: estado.nivel,
      dominado: estado.nivel >= 5
    });
  }

  return lista
    .sort((a, b) => b.erros - a.erros || a.nivelRevisao - b.nivelRevisao)
    .slice(0, limite);
}

/** Amostra mínima e taxa mínima pra sugerir o próximo nível — ver `sugestaoDeNivel`. */
export const AMOSTRA_MINIMA_NIVEL = 15;
const TAXA_MINIMA_NIVEL = 0.8;

/**
 * Quantos cards médio/difícil já vistos nunca foram errados nenhuma vez, do
 * total de médio/difícil vistos. Fácil não entra na conta: acertar o fácil
 * não prova que a pessoa está pronta pra mais — quem define "pronto" é como
 * ela se sai no que já desafia no nível atual dela.
 */
export function desempenhoNosDificeis(revisoes: MapaRevisoes): { semErro: number; total: number } {
  let semErro = 0;
  let total = 0;

  for (const [cardId, estado] of revisoes) {
    if (!foiVisto(estado)) continue;

    const card = obterCard(cardId);
    if (!card || nivelDe(card) === 1) continue;

    total += 1;
    if (estado.erros === 0) semErro += 1;
  }

  return { semErro, total };
}

/**
 * Sugere o próximo nível quando a taxa de acerto nos médio/difícil já vistos
 * é alta e a amostra é grande o bastante pra significar algo — devolve
 * `null` quando não há o que sugerir (amostra pequena, taxa baixa, ou já no
 * topo da escada). Só sugere **subir**: descer é decisão manual, em
 * Configurações (`podeRegredirNivel` em `nucleo/perfil.ts`).
 */
export function sugestaoDeNivel(
  revisoes: MapaRevisoes,
  nivel: NivelConhecimento | null
): NivelConhecimento | null {
  if (!nivel) return null;

  const proximo = PROXIMO_NIVEL[nivel];
  if (!proximo) return null;

  const { semErro, total } = desempenhoNosDificeis(revisoes);
  if (total < AMOSTRA_MINIMA_NIVEL) return null;

  return semErro / total >= TAXA_MINIMA_NIVEL ? proximo : null;
}

/** Quantos cards estão vencidos e voltam na próxima diária. */
export function contarVencidos(revisoes: MapaRevisoes): number {
  let total = 0;
  for (const [cardId, estado] of revisoes) {
    if (foiVisto(estado) && estaVencido(estado) && obterCard(cardId)) total += 1;
  }
  return total;
}

/** Quantos cards voltam num dia específico. */
export function revisoesEm(revisoes: MapaRevisoes, dia: string): number {
  let total = 0;
  for (const [cardId, estado] of revisoes) {
    if (foiVisto(estado) && estado.proximaEm === dia && obterCard(cardId)) total += 1;
  }
  return total;
}
