/**
 * Como se julga a resposta de cada tipo de card.
 *
 * Vive no núcleo porque é regra, não tela: entra o card e o que a pessoa
 * respondeu, sai certo ou errado. A tela de sessão não sabe julgar nada — ela
 * pergunta aqui.
 */

import type { Card } from './conteudo';

/** O formato muda por tipo de card; a tela guarda o que couber. */
export type Resposta = number | string | (string | null)[] | number[] | null;

const TIPOS_ALTERNATIVAS = ['palavra-chave', 'o-que-faz', 'saida', 'estrutura'];

/**
 * Compara código ignorando o que não muda o significado: espaço em excesso e
 * espaço em volta de pontuação. `int a = 3;` e `int a=3;` são a mesma resposta.
 *
 * Maiúsculas continuam contando, de propósito: em C# e em JavaScript, `nome` e
 * `Nome` são coisas diferentes.
 */
export function normalizarCodigo(texto: string | null | undefined): string {
  return String(texto ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*([=(){},;:+\-*/<>[\]])\s*/g, '$1');
}

/** Verdadeiro enquanto ainda falta responder — o botão fica desabilitado. */
export function respostaVazia(card: Card, resposta: Resposta): boolean {
  if (TIPOS_ALTERNATIVAS.includes(card.tipo)) return resposta == null;

  switch (card.tipo) {
    case 'lacuna': {
      const dadas = (resposta as (string | null)[] | null) ?? [];
      return dadas.length < (card.respostas?.length ?? 0) || dadas.some((v) => !v);
    }
    case 'escreva':
      return typeof resposta !== 'string' || resposta.trim() === '';
    case 'montar-linha':
      return (
        !Array.isArray(resposta) || (resposta as number[]).length !== (card.partes?.length ?? 0)
      );
    case 'ache-o-erro':
      return resposta == null;
    default:
      return resposta == null;
  }
}

export function avaliar(card: Card, resposta: Resposta): boolean {
  if (TIPOS_ALTERNATIVAS.includes(card.tipo)) return resposta === card.correta;

  switch (card.tipo) {
    case 'lacuna': {
      const dadas = (resposta as (string | null)[] | null) ?? [];
      return (card.respostas ?? []).every((certa, indice) => dadas[indice] === certa);
    }

    case 'escreva': {
      const dada = normalizarCodigo(resposta as string);
      const aceitas = [card.resposta ?? '', ...(card.aceitas ?? [])];
      return aceitas.some((certa) => normalizarCodigo(certa) === dada);
    }

    case 'montar-linha': {
      const partes = card.partes ?? [];
      const ordem = (resposta as number[] | null) ?? [];
      if (ordem.length !== partes.length) return false;
      // Compara por texto, não por índice: duas peças com o mesmo texto podem
      // trocar de lugar sem mudar a linha montada.
      return ordem.every((indice, posicao) => partes[indice] === partes[posicao]);
    }

    case 'ache-o-erro':
      return resposta === card.linhaErrada;

    default:
      return false;
  }
}

/** O que mostrar na caixa "resposta certa" do painel de feedback. */
export function respostaCertaEmTexto(card: Card): string | undefined {
  switch (card.tipo) {
    case 'escreva':
      return card.resposta;
    case 'montar-linha':
      return (card.partes ?? []).join(' ');
    case 'lacuna':
      return (card.respostas ?? []).join('  ·  ');
    case 'ache-o-erro':
      return `A linha ${(card.linhaErrada ?? 0) + 1}`;
    default:
      // Em múltipla escolha a alternativa certa já está verde na tela.
      return undefined;
  }
}
