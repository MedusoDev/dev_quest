/**
 * Agregados do painel de métricas — puro, sem Firebase nem React.
 *
 * Tudo aqui parte de uma lista de `PerfilPublico`, que é o que já sobe para a
 * nuvem hoje (ver `dados/nuvem.ts`). Nenhum dado novo é coletado: isto só lê o
 * que o app já grava a cada sessão.
 */

import { diferencaEmDias, hoje, somarDias, type Dia } from './datas';
import type { PerfilPublico } from './perfil';

export type VisaoGeral = {
  totalUsuarios: number;
  ativosHoje: number;
  ativos7Dias: number;
  diariasTotais: number;
  mediaSequencia: number;
  mediaXp: number;
  /** Taxa de acerto ponderada pelo total de cards de todo mundo, não a média das médias. */
  taxaDeAcertoGeral: number;
};

/**
 * Perfis gravados antes de um destes campos existir não têm a chave no
 * Firestore — chega como `undefined`, não como o zero/null que o tipo promete.
 * Toda leitura abaixo passa por aqui em vez de confiar direto no tipo.
 */
function respondidos(p: PerfilPublico): number {
  return p.cardsRespondidos ?? 0;
}
function acertados(p: PerfilPublico): number {
  return p.cardsAcertados ?? 0;
}
function diariasFeitas(p: PerfilPublico): number {
  return p.diarias ?? 0;
}

function taxaDeAcerto(perfil: PerfilPublico): number | null {
  const total = respondidos(perfil);
  if (total === 0) return null;
  return acertados(perfil) / total;
}

export function visaoGeral(perfis: PerfilPublico[]): VisaoGeral {
  const hojeIso = hoje();
  const total = perfis.length;

  const cardsRespondidos = perfis.reduce((s, p) => s + respondidos(p), 0);
  const cardsAcertados = perfis.reduce((s, p) => s + acertados(p), 0);

  return {
    totalUsuarios: total,
    ativosHoje: perfis.filter((p) => p.ultimaDiaria === hojeIso).length,
    // `!!` porque `ultimaDiaria` ausente chega como `undefined`, não `null` —
    // `!== null` deixaria passar para `diferencaEmDias`, que quebra com data
    // indefinida.
    ativos7Dias: perfis.filter(
      (p) => !!p.ultimaDiaria && diferencaEmDias(p.ultimaDiaria, hojeIso) <= 7
    ).length,
    diariasTotais: perfis.reduce((s, p) => s + diariasFeitas(p), 0),
    mediaSequencia: total === 0 ? 0 : perfis.reduce((s, p) => s + (p.sequencia ?? 0), 0) / total,
    mediaXp: total === 0 ? 0 : perfis.reduce((s, p) => s + (p.xp ?? 0), 0) / total,
    taxaDeAcertoGeral: cardsRespondidos === 0 ? 0 : cardsAcertados / cardsRespondidos
  };
}

export type FaixaDeRank = { rank: string; quantidade: number };

/** Quantas pessoas em cada rank, na ordem em que `RANKS` já está declarado. */
export function distribuicaoPorRank(perfis: PerfilPublico[]): FaixaDeRank[] {
  const contagem = new Map<string, number>();
  for (const p of perfis) contagem.set(p.rank, (contagem.get(p.rank) ?? 0) + 1);
  return [...contagem.entries()].map(([rank, quantidade]) => ({ rank, quantidade }));
}

export type PontoDeCrescimento = { dia: Dia; total: number };

/**
 * Total acumulado de contas, dia a dia, nos últimos `dias` dias.
 *
 * Usa `criadoEm`, que perfis gravados antes deste campo existir não têm de
 * verdade — a leitura em `dados/nuvem.ts` cai de volta para "hoje" nesse
 * caso, então contas bem antigas aparecem como se tivessem se cadastrado
 * agora. Aceitável para uma curva de tendência; não é o gráfico certo para
 * "quando exatamente entrou fulano".
 */
export function crescimentoAcumulado(perfis: PerfilPublico[], dias = 30): PontoDeCrescimento[] {
  const porDia = new Map<Dia, number>();
  for (const p of perfis) porDia.set(p.criadoEm, (porDia.get(p.criadoEm) ?? 0) + 1);

  const inicioJanela = somarDias(hoje(), -(dias - 1));

  // Quem se cadastrou antes da janela visível ainda conta no acumulado — sem
  // isto, o gráfico começaria de um zero artificial mesmo com o app já tendo
  // meses de gente cadastrada.
  let acumulado = 0;
  for (const [dia, quantidade] of porDia) {
    if (dia < inicioJanela) acumulado += quantidade;
  }

  return Array.from({ length: dias }, (_, indice) => {
    const dia = somarDias(inicioJanela, indice);
    acumulado += porDia.get(dia) ?? 0;
    return { dia, total: acumulado };
  });
}

export type FaixaDeUso = { rotulo: string; quantidade: number; taxaDeAcertoMedia: number | null };

const FAIXAS_DE_DIARIAS = [
  { rotulo: '1–5 diárias', minimo: 1, maximo: 5 },
  { rotulo: '6–15 diárias', minimo: 6, maximo: 15 },
  { rotulo: '16–30 diárias', minimo: 16, maximo: 30 },
  { rotulo: '31+ diárias', minimo: 31, maximo: Infinity }
];

/**
 * A taxa de acerto média de quem já fez N diárias, por faixa.
 *
 * É a resposta a "melhora conforme o uso": se as faixas mais altas tiverem
 * taxa de acerto maior que as baixas, o produto está de fato ensinando com o
 * tempo. Gente com zero diária fica de fora — não há o que medir nela ainda.
 */
export function evolucaoPorUso(perfis: PerfilPublico[]): FaixaDeUso[] {
  return FAIXAS_DE_DIARIAS.map(({ rotulo, minimo, maximo }) => {
    const doGrupo = perfis.filter((p) => diariasFeitas(p) >= minimo && diariasFeitas(p) <= maximo);
    const comTaxa = doGrupo.map(taxaDeAcerto).filter((t): t is number => t !== null);

    return {
      rotulo,
      quantidade: doGrupo.length,
      taxaDeAcertoMedia:
        comTaxa.length === 0 ? null : comTaxa.reduce((s, t) => s + t, 0) / comTaxa.length
    };
  });
}
