import { describe, expect, it } from 'vitest';

import { destacarSintaxe } from './destacarSintaxe';

/**
 * Estes testes já estão escritos e estão falhando. Faça passar um por um, de
 * cima para baixo — eles estão em ordem de dificuldade e cada um cobre uma
 * decisão do enunciado.
 *
 * `npm run test:watch` deixa isso rodando enquanto você escreve.
 *
 * Um atalho útil na hora de depurar: um helper que devolve só os tipos, ou só
 * os textos, deixa o erro do vitest muito mais fácil de ler que um array de
 * objetos inteiro.
 */

const tipos = (linha: string, lang: 'csharp' | 'javascript' = 'javascript') =>
  destacarSintaxe(linha, lang).map((t) => t.tipo);

const textos = (linha: string, lang: 'csharp' | 'javascript' = 'javascript') =>
  destacarSintaxe(linha, lang).map((t) => t.texto);

describe('destacarSintaxe', () => {
  it('não perde nenhum caractere pelo caminho', () => {
    const linha = 'const taxa = 0.15; // imposto';
    expect(textos(linha).join('')).toBe(linha);
  });

  it('linha vazia devolve lista vazia', () => {
    expect(destacarSintaxe('', 'javascript')).toEqual([]);
  });

  it('reconhece palavra-chave de JavaScript', () => {
    expect(destacarSintaxe('const', 'javascript')[0]).toEqual({
      texto: 'const',
      tipo: 'palavraChave'
    });
  });

  it('cada linguagem tem sua lista: foreach é palavra-chave em C#, não em JS', () => {
    expect(tipos('foreach', 'csharp')[0]).toBe('palavraChave');
    expect(tipos('foreach', 'javascript')[0]).toBe('identificador');
  });

  it('número é número', () => {
    expect(tipos('0.15')).toEqual(['numero']);
  });

  it('nome com maiúscula vira tipo', () => {
    expect(tipos('Contador')).toEqual(['tipo']);
  });

  it('preserva a indentação como espaço', () => {
    const t = destacarSintaxe('    return x;', 'javascript');
    expect(t[0]!.texto).toBe('    ');
  });

  // ── daqui para baixo é onde a ordem do regex importa ────────────────────

  it('número dentro de string NÃO é número', () => {
    // Se este falhar, o grupo de número está vindo antes do de texto.
    expect(tipos('"taxa 15"')).toEqual(['texto']);
  });

  it('palavra-chave dentro de comentário NÃO é palavra-chave', () => {
    // Se este falhar, o grupo de comentário não está em primeiro lugar.
    expect(tipos('// const aqui')).toEqual(['comentario']);
  });

  it('duas chamadas seguidas dão o mesmo resultado', () => {
    // O REGEX é global e guarda a posição da última busca. Sem zerar
    // `lastIndex`, a segunda chamada começa no meio e devolve menos tokens.
    const linha = 'let x = 3;';
    expect(destacarSintaxe(linha, 'javascript')).toEqual(
      destacarSintaxe(linha, 'javascript')
    );
  });

  it('classifica uma linha de C# inteira', () => {
    expect(tipos('Console.WriteLine(nomes.Count);', 'csharp')).toEqual([
      'tipo',          // Console
      'pontuacao',     // .
      'tipo',          // WriteLine
      'pontuacao',     // (
      'identificador', // nomes
      'pontuacao',     // .
      'tipo',          // Count
      'pontuacao'      // );
    ]);
  });
});
