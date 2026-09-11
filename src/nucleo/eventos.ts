/**
 * Eventos de sessão — um registro por sessão concluída, só para o painel de
 * métricas calcular frequência de uso e horário de estudo.
 *
 * É a única coisa no app que carrega data e hora exatas. Tudo o mais que sobe
 * para a nuvem (`PerfilPublico`) é agregado sem timestamp — dá para saber
 * "quanto" mas não "quando". Puro: sem Firebase, sem React.
 */

import type { Dia } from './datas';

export type EventoSessao = {
  uid: string;
  /** ISO 8601 completo (`toISOString()`), fuso UTC — hora local é calculada na leitura. */
  quando: string;
  total: number;
  acertos: number;
  erros: number;
  xpGanho: number;
};

export type PontoDeFrequencia = { dia: Dia; quantidade: number };

function paraIsoLocal(quandoIso: string): Dia {
  const data = new Date(quandoIso);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

/**
 * Sessões por dia, nos últimos `dias` dias (incluindo hoje).
 *
 * É o que responde "a galera está voltando" — picos e vales de uso ao longo do
 * tempo, em vez de um total acumulado que só cresce.
 */
export function frequenciaPorDia(eventos: EventoSessao[], dias = 14): PontoDeFrequencia[] {
  const contagem = new Map<Dia, number>();
  for (const evento of eventos) {
    const dia = paraIsoLocal(evento.quando);
    contagem.set(dia, (contagem.get(dia) ?? 0) + 1);
  }

  const hoje = new Date();
  return Array.from({ length: dias }, (_, indice) => {
    const data = new Date(hoje);
    data.setDate(data.getDate() - (dias - 1 - indice));
    const dia = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    return { dia, quantidade: contagem.get(dia) ?? 0 };
  });
}

export type PontoDeHorario = { hora: number; quantidade: number };

/**
 * Quantas sessões aconteceram em cada hora do dia (0–23), hora local do
 * aparelho de quem está vendo o painel.
 *
 * Responde "de manhã, à tarde ou de madrugada" — o horário em que vale a pena
 * mandar notificação, ou em que o servidor de IA vai precisar aguentar pico.
 */
export function distribuicaoPorHora(eventos: EventoSessao[]): PontoDeHorario[] {
  const contagem = new Array<number>(24).fill(0);
  for (const evento of eventos) contagem[new Date(evento.quando).getHours()] += 1;
  return contagem.map((quantidade, hora) => ({ hora, quantidade }));
}

export type PontoDeAcerto = { dia: Dia; taxa: number | null };

/**
 * Taxa de acerto média por dia, nos últimos `dias` dias.
 *
 * `taxa: null` num dia sem sessão nenhuma — diferente de 0%, que seria "todo
 * mundo errou". O gráfico de linha deixa isso como um buraco na linha, não
 * como um vale no chão.
 */
export function taxaDeAcertoPorDia(eventos: EventoSessao[], dias = 14): PontoDeAcerto[] {
  const porDia = new Map<Dia, { acertos: number; total: number }>();
  for (const evento of eventos) {
    const dia = paraIsoLocal(evento.quando);
    const atual = porDia.get(dia) ?? { acertos: 0, total: 0 };
    atual.acertos += evento.acertos;
    atual.total += evento.total;
    porDia.set(dia, atual);
  }

  const hoje = new Date();
  return Array.from({ length: dias }, (_, indice) => {
    const data = new Date(hoje);
    data.setDate(data.getDate() - (dias - 1 - indice));
    const dia = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    const agregado = porDia.get(dia);
    return { dia, taxa: agregado && agregado.total > 0 ? agregado.acertos / agregado.total : null };
  });
}
