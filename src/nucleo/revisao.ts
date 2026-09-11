/**
 * O ciclo Ouroboros: repetição espaçada.
 *
 * Cada card acertado é reagendado mais longe no tempo. Errado, volta para o
 * começo da escada. É isso que separa "decorei na hora" de "aprendi", e é de
 * onde o app tira o nome.
 */

import { hoje, somarDias, type Dia } from './datas';

export const ESCADA = [1, 3, 7, 16, 35] as const;

export type Revisao = {
  nivel: number;
  proximaEm: Dia;
  acertosSeguidos: number;
  erros: number;
  /** Nulo enquanto o card nunca foi respondido. */
  vistoEm: Dia | null;
};

/**
 * Um card nunca visto é tratado como se estivesse vencido: ele entra na fila
 * de conteúdo novo, não na de revisão.
 */
export function estadoInicial(): Revisao {
  return { nivel: 0, proximaEm: hoje(), acertosSeguidos: 0, erros: 0, vistoEm: null };
}

export function agendar(atual: Revisao | undefined | null, acertou: boolean): Revisao {
  const estado = atual ?? estadoInicial();

  if (!acertou) {
    return {
      ...estado,
      nivel: 0,
      acertosSeguidos: 0,
      erros: estado.erros + 1,
      // Errou hoje, revê amanhã.
      proximaEm: somarDias(hoje(), ESCADA[0]),
      vistoEm: hoje()
    };
  }

  const nivel = Math.min(estado.nivel + 1, ESCADA.length);
  const dias = ESCADA[nivel - 1]!;

  return {
    ...estado,
    nivel,
    acertosSeguidos: estado.acertosSeguidos + 1,
    proximaEm: somarDias(hoje(), dias),
    vistoEm: hoje()
  };
}

export function estaVencido(estado: Revisao | undefined | null): boolean {
  if (!estado?.proximaEm) return true;
  return estado.proximaEm <= hoje();
}

/** Um card no topo da escada conta como aprendido. */
export function estaDominado(estado: Revisao | undefined | null): boolean {
  return (estado?.nivel ?? 0) >= ESCADA.length;
}

export function foiVisto(estado: Revisao | undefined | null): boolean {
  return Boolean(estado?.vistoEm);
}
