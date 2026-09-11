/**
 * Datas aqui são sempre strings 'AAAA-MM-DD' no fuso local.
 *
 * Usar Date direto no banco traria fuso UTC, e aí quem estuda às 22h no Brasil
 * teria a diária contada no dia seguinte — a sequência quebraria sozinha.
 */

export type Dia = string;

function doisDigitos(numero: number): string {
  return String(numero).padStart(2, '0');
}

export function paraIso(data: Date): Dia {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

export function hoje(): Dia {
  return paraIso(new Date());
}

function paraData(iso: Dia): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano!, mes! - 1, dia!);
}

export function somarDias(iso: Dia, dias: number): Dia {
  const data = paraData(iso);
  data.setDate(data.getDate() + dias);
  return paraIso(data);
}

/** Positivo quando `fim` vem depois de `inicio`. */
export function diferencaEmDias(inicio: Dia, fim: Dia): number {
  const umDia = 24 * 60 * 60 * 1000;
  return Math.round((paraData(fim).getTime() - paraData(inicio).getTime()) / umDia);
}

export function mesAtual(): string {
  return hoje().slice(0, 7);
}

/** Idade em anos completos, a partir de uma data de nascimento. */
export function idadeEmAnos(nascimento: Dia, referencia: Dia = hoje()): number {
  const [anoNasc, mesNasc, diaNasc] = nascimento.split('-').map(Number);
  const [anoRef, mesRef, diaRef] = referencia.split('-').map(Number);

  let idade = anoRef! - anoNasc!;
  // Ainda não fez aniversário este ano: o ano de diferença sozinho conta um a mais.
  if (mesRef! < mesNasc! || (mesRef === mesNasc && diaRef! < diaNasc!)) idade -= 1;

  return idade;
}

/** Dia da semana, 0 = domingo. Usado pelo calendário de sequência. */
export function diaDaSemana(iso: Dia): number {
  return paraData(iso).getDay();
}
