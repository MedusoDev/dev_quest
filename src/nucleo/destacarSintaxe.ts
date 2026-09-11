/**
 * DESTAQUE DE SINTAXE — ESQUELETO. A implementação é sua.
 *
 * Recebe uma linha de código e devolve os pedaços dela já classificados. Quem
 * pinta é o `BlocoCodigo`; aqui só se decide o que é o quê.
 *
 * Isto vive em `nucleo/` porque não tem nada de React: entra string, sai lista.
 * É por isso que dá para testar no terminal com `npm test`, em dois segundos,
 * sem abrir emulador. Os testes já estão escritos em
 * `destacarSintaxe.teste.ts` e estão falhando — faça passar um por um.
 *
 * ── NÃO É UM PARSER ───────────────────────────────────────────────────────
 *
 * E não deve ser. Os trechos do app têm cinco linhas. Um regex que separa
 * comentário, texto entre aspas, número, palavra e pontuação acerta 100% do
 * conteúdo real e cabe em vinte linhas. Um parser de verdade seria semanas de
 * trabalho para o mesmo resultado na tela.
 *
 * ── A ORDEM DAS ALTERNATIVAS DO REGEX É A REGRA TODA ──────────────────────
 *
 * Comentário primeiro, texto entre aspas depois, e só então o resto. Se número
 * vier antes de texto, o `15` dentro de `"taxa 15"` sai colorido de número no
 * meio da string. Se palavra vier antes de comentário, o `//` deixa de existir.
 *
 * O regex abaixo já está na ordem certa. Cada grupo capturado corresponde a um
 * tipo, na ordem: comentário, texto, número, palavra, espaço, pontuação.
 */

export type TipoToken =
  | 'palavraChave'
  | 'texto'
  | 'numero'
  | 'comentario'
  | 'tipo'
  | 'identificador'
  | 'pontuacao';

export type Token = { texto: string; tipo: TipoToken };

export type Linguagem = 'csharp' | 'javascript' | 'python' | 'java' | 'php';

/** As palavras que ganham a cor de palavra-chave em cada linguagem. */
const PALAVRAS: Record<Linguagem, readonly string[]> = {
  javascript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'new', 'typeof', 'of', 'in',
    'class', 'await', 'async', 'try', 'catch', 'throw'
  ],
  csharp: [
    'public', 'private', 'protected', 'internal', 'class', 'void', 'int',
    'string', 'bool', 'double', 'float', 'long', 'var', 'new', 'return', 'if',
    'else', 'for', 'foreach', 'while', 'using', 'namespace', 'static', 'get',
    'set', 'this', 'null', 'true', 'false', 'override', 'virtual'
  ],
  python: [
    'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and',
    'or', 'is', 'class', 'import', 'from', 'as', 'try', 'except', 'finally',
    'raise', 'with', 'lambda', 'pass', 'break', 'continue', 'None', 'True',
    'False', 'yield', 'global', 'nonlocal', 'del'
  ],
  java: [
    'public', 'private', 'protected', 'class', 'interface', 'extends',
    'implements', 'static', 'final', 'void', 'int', 'double', 'float', 'long',
    'boolean', 'char', 'new', 'return', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw',
    'throws', 'this', 'super', 'null', 'true', 'false', 'abstract', 'import',
    'package', 'enum', 'default'
  ],
  php: [
    'function', 'return', 'if', 'elseif', 'else', 'foreach', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'class', 'public', 'private',
    'protected', 'static', 'const', 'new', 'try', 'catch', 'finally', 'throw',
    'namespace', 'use', 'extends', 'implements', 'interface', 'abstract',
    'echo', 'print', 'null', 'true', 'false', 'global', 'require',
    'require_once', 'include', 'array', 'as', 'fn'
  ]
};

/**
 * Nomes que não são palavra-chave mas merecem a cor de tipo: as classes e os
 * métodos da biblioteca que aparecem nas lições.
 */
const CONHECIDOS = [
  'console', 'log', 'Console', 'WriteLine', 'List', 'Add', 'Count', 'push',
  'length', 'print', 'len', 'range', 'append', 'System', 'out',
  'println', 'ArrayList', 'HashMap', 'Map', 'Collectors', 'stream',
  'array_map', 'array_filter', 'array_reduce', 'count', 'strlen'
] as const;

/**
 * Um grupo por tipo, na ordem que importa. Não mexa na ordem sem rodar os
 * testes depois.
 *
 *   1 comentário  2 texto entre aspas  3 número
 *   4 palavra     5 espaço             6 pontuação
 */
const REGEX =
  /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)|(\s+)|([^\sA-Za-z0-9_$]+)/g;

/**
 * Quebra uma linha em tokens classificados.
 *
 * @param linha  uma linha de código, sem `\n`
 * @param linguagem  decide qual lista de palavras-chave vale
 */
export function destacarSintaxe(linha: string, linguagem: Linguagem): Token[] {
  const tokens: Token[] = [];

  // Sem isto a segunda chamada continua de onde a primeira parou: o regex é
  // global e guarda a posição em `lastIndex`. É a pegadinha que faz a mesma
  // linha devolver resultados diferentes em chamadas seguidas.
  REGEX.lastIndex = 0;

  let m: RegExpExecArray | null;
  while ((m = REGEX.exec(linha)) !== null) {
    // A ordem aqui espelha a ordem das alternativas do regex. Só um grupo vem
    // preenchido por casamento.
    if (m[1] !== undefined) tokens.push({ texto: m[1], tipo: 'comentario' });
    else if (m[2] !== undefined) tokens.push({ texto: m[2], tipo: 'texto' });
    else if (m[3] !== undefined) tokens.push({ texto: m[3], tipo: 'numero' });
    else if (m[4] !== undefined) tokens.push({ texto: m[4], tipo: classificar(m[4], linguagem) });
    // Espaço e pontuação recebem o mesmo tipo: espaço é invisível, e assim
    // toda entrada de `coresCodigo` continua sendo uma cor que existe.
    else if (m[5] !== undefined) tokens.push({ texto: m[5], tipo: 'pontuacao' });
    else if (m[6] !== undefined) tokens.push({ texto: m[6], tipo: 'pontuacao' });
  }

  return tokens;
}

/**
 * Decide o que uma palavra é. A ordem das perguntas é a regra:
 * palavra-chave da linguagem primeiro, depois nome conhecido de biblioteca, e
 * só então a heurística da maiúscula.
 */
function classificar(palavra: string, linguagem: Linguagem): TipoToken {
  if (PALAVRAS[linguagem].includes(palavra)) return 'palavraChave';

  // `CONHECIDOS` é `as const`, então o TypeScript o vê como uma lista de
  // literais e recusa `includes` com uma string qualquer. O alargamento para
  // `readonly string[]` é só para a checagem de tipo.
  if ((CONHECIDOS as readonly string[]).includes(palavra)) return 'tipo';

  // Convenção das duas linguagens: nome que começa com maiúscula é tipo.
  if (/^[A-Z]/.test(palavra)) return 'tipo';

  return 'identificador';
}
