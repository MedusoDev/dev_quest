/**
 * As lições, vindas dos JSON de `conteudo/`.
 *
 * No site isso era `import.meta.glob`, que só existe no Vite. Aqui os arquivos
 * são importados um a um — o Metro embute cada JSON no bundle, então o app
 * funciona sem internet e não há tela de carregamento.
 *
 * Acrescentar uma lição é criar o JSON, importá-lo aqui e listá-lo na trilha.
 */

import { ordenarLicao, type Nivel } from './dificuldade';

import csharpTrilhas from '../../conteudo/csharp/trilhas.json';
import csModificadores from '../../conteudo/csharp/licoes/cs-modificadores.json';
import csTipos from '../../conteudo/csharp/licoes/cs-tipos.json';
import csMetodos from '../../conteudo/csharp/licoes/cs-metodos.json';
import csClasses from '../../conteudo/csharp/licoes/cs-classes.json';
import csConstrutores from '../../conteudo/csharp/licoes/cs-construtores.json';
import csPropriedades from '../../conteudo/csharp/licoes/cs-propriedades.json';
import csListas from '../../conteudo/csharp/licoes/cs-listas.json';
import csDicionarios from '../../conteudo/csharp/licoes/cs-dicionarios.json';
import csForeach from '../../conteudo/csharp/licoes/cs-foreach.json';

import javascriptTrilhas from '../../conteudo/javascript/trilhas.json';
import jsDeclaracoes from '../../conteudo/javascript/licoes/js-declaracoes.json';
import jsFuncoes from '../../conteudo/javascript/licoes/js-funcoes.json';
import jsEscopo from '../../conteudo/javascript/licoes/js-escopo.json';
import jsDesestruturacao from '../../conteudo/javascript/licoes/js-desestruturacao.json';
import jsMap from '../../conteudo/javascript/licoes/js-map.json';
import jsFilter from '../../conteudo/javascript/licoes/js-filter.json';
import jsPromises from '../../conteudo/javascript/licoes/js-promises.json';
import jsAsyncAwait from '../../conteudo/javascript/licoes/js-async-await.json';
import jsErrosAssincronos from '../../conteudo/javascript/licoes/js-erros-assincronos.json';

import pythonTrilhas from '../../conteudo/python/trilhas.json';
import pyVariaveis from '../../conteudo/python/licoes/py-variaveis.json';
import pyFuncoes from '../../conteudo/python/licoes/py-funcoes.json';
import pyEscopo from '../../conteudo/python/licoes/py-escopo.json';
import pyListas from '../../conteudo/python/licoes/py-listas.json';
import pyDicionarios from '../../conteudo/python/licoes/py-dicionarios.json';
import pyCompreensaoLista from '../../conteudo/python/licoes/py-compreensao-lista.json';
import pyClasses from '../../conteudo/python/licoes/py-classes.json';
import pyHeranca from '../../conteudo/python/licoes/py-heranca.json';
import pyExcecoes from '../../conteudo/python/licoes/py-excecoes.json';

import javaTrilhas from '../../conteudo/java/trilhas.json';
import javaTipos from '../../conteudo/java/licoes/java-tipos.json';
import javaMetodos from '../../conteudo/java/licoes/java-metodos.json';
import javaModificadores from '../../conteudo/java/licoes/java-modificadores.json';
import javaClasses from '../../conteudo/java/licoes/java-classes.json';
import javaConstrutores from '../../conteudo/java/licoes/java-construtores.json';
import javaHeranca from '../../conteudo/java/licoes/java-heranca.json';
import javaListas from '../../conteudo/java/licoes/java-listas.json';
import javaMapas from '../../conteudo/java/licoes/java-mapas.json';
import javaStreams from '../../conteudo/java/licoes/java-streams.json';

import phpTrilhas from '../../conteudo/php/trilhas.json';
import phpVariaveis from '../../conteudo/php/licoes/php-variaveis.json';
import phpFuncoes from '../../conteudo/php/licoes/php-funcoes.json';
import phpEscopo from '../../conteudo/php/licoes/php-escopo.json';
import phpArrays from '../../conteudo/php/licoes/php-arrays.json';
import phpArraysFuncionais from '../../conteudo/php/licoes/php-arrays-funcionais.json';
import phpClasses from '../../conteudo/php/licoes/php-classes.json';
import phpExcecoes from '../../conteudo/php/licoes/php-excecoes.json';
import phpSuperglobais from '../../conteudo/php/licoes/php-superglobais.json';
import phpNamespaces from '../../conteudo/php/licoes/php-namespaces.json';

export type LinguagemId = 'csharp' | 'javascript' | 'python' | 'java' | 'php';

export type TipoCard =
  | 'palavra-chave'
  | 'o-que-faz'
  | 'saida'
  | 'estrutura'
  | 'lacuna'
  | 'escreva'
  | 'montar-linha'
  | 'ache-o-erro';

type Origem = {
  licaoId: string;
  licaoTitulo: string;
  linguagem: LinguagemId;
};

export type Card = Origem & {
  id: string;
  tipo: TipoCard;
  nivel: Nivel;
  enunciado: string;
  explicacao: string;
  /** Array de linhas no JSON; junte com '\n' antes de passar ao BlocoCodigo. */
  codigo?: string[];
  // alternativas
  alternativas?: string[];
  correta?: number;
  pergunta?: string;
  // lacuna
  respostas?: string[];
  tokens?: string[];
  // escreva
  resposta?: string;
  dica?: string;
  aceitas?: string[];
  // montar-linha
  partes?: string[];
  // ache-o-erro
  linhaErrada?: number;
};

export type TermoGlossario = {
  termo: string;
  definicao: string;
  exemplo?: string;
  licaoId: string;
  licaoTitulo: string;
  linguagem: LinguagemId;
};

export type Licao = {
  id: string;
  linguagem: LinguagemId;
  trilha: string;
  titulo: string;
  resumo: string;
  conceito: { texto: string[]; exemplo?: string[] };
  glossario?: { termo: string; definicao: string; exemplo?: string }[];
  cards: Card[];
};

export type Trilha = {
  id: string;
  titulo: string;
  descricao: string;
  licoes: string[];
  emBreve?: boolean;
};

export type Linguagem = {
  id: LinguagemId;
  nome: string;
  cor: string;
  descricao: string;
  trilhas: Trilha[];
};

const BRUTAS = [
  csModificadores,
  csTipos,
  csMetodos,
  csClasses,
  csConstrutores,
  csPropriedades,
  csListas,
  csDicionarios,
  csForeach,
  jsDeclaracoes,
  jsFuncoes,
  jsEscopo,
  jsDesestruturacao,
  jsMap,
  jsFilter,
  jsPromises,
  jsAsyncAwait,
  jsErrosAssincronos,
  pyVariaveis,
  pyFuncoes,
  pyEscopo,
  pyListas,
  pyDicionarios,
  pyCompreensaoLista,
  pyClasses,
  pyHeranca,
  pyExcecoes,
  javaTipos,
  javaMetodos,
  javaModificadores,
  javaClasses,
  javaConstrutores,
  javaHeranca,
  javaListas,
  javaMapas,
  javaStreams,
  phpVariaveis,
  phpFuncoes,
  phpEscopo,
  phpArrays,
  phpArraysFuncionais,
  phpClasses,
  phpExcecoes,
  phpSuperglobais,
  phpNamespaces
] as unknown as Licao[];

const licoesPorId = new Map<string, Licao>();
const cardsPorId = new Map<string, Card>();

for (const bruta of BRUTAS) {
  // Duas coisas acontecem aqui. A lição é reordenada em dificuldade crescente
  // — leve para entrar, difícil para fechar. E cada card passa a saber de onde
  // veio, porque a diária mistura cards de lições diferentes e depois precisa
  // reconhecê-los.
  const licao: Licao = {
    ...bruta,
    cards: ordenarLicao(bruta.cards).map((card) => ({
      ...card,
      licaoId: bruta.id,
      licaoTitulo: bruta.titulo,
      linguagem: bruta.linguagem
    }))
  };

  licoesPorId.set(licao.id, licao);
  for (const card of licao.cards) cardsPorId.set(card.id, card);
}

export const linguagens = (
  [csharpTrilhas, javascriptTrilhas, pythonTrilhas, javaTrilhas, phpTrilhas] as unknown as Linguagem[]
).sort((a, b) => a.nome.localeCompare(b.nome));

const linguagensPorId = new Map(linguagens.map((l) => [l.id, l]));

export const obterLinguagem = (id: string) => linguagensPorId.get(id as LinguagemId) ?? null;
export const obterLicao = (id: string) => licoesPorId.get(id) ?? null;
export const obterCard = (id: string) => cardsPorId.get(id) ?? null;

/** Todas as lições de uma linguagem, na ordem em que aparecem nas trilhas. */
export function licoesDaLinguagem(linguagemId: string): Licao[] {
  const linguagem = obterLinguagem(linguagemId);
  if (!linguagem) return [];

  return linguagem.trilhas.flatMap((trilha) =>
    trilha.licoes.map(obterLicao).filter((l): l is Licao => l !== null)
  );
}

export function todasAsLicoes(): Licao[] {
  return linguagens.flatMap((l) => licoesDaLinguagem(l.id));
}

export function todosOsCards(): Card[] {
  return todasAsLicoes().flatMap((l) => l.cards);
}

/** A lição seguinte só abre quando a anterior é concluída. */
export function licaoEstaLiberada(
  linguagemId: string,
  licaoId: string,
  concluidas: Set<string>
): boolean {
  const licoes = licoesDaLinguagem(linguagemId);
  const indice = licoes.findIndex((l) => l.id === licaoId);

  if (indice <= 0) return true;
  return concluidas.has(licoes[indice - 1]!.id);
}

export function glossarioCompleto(): { linguagem: Linguagem; termos: TermoGlossario[] }[] {
  return linguagens.map((linguagem) => ({
    linguagem,
    termos: todasAsLicoes()
      .filter((licao) => licao.linguagem === linguagem.id)
      .flatMap((licao) =>
        (licao.glossario ?? []).map((entrada) => ({
          ...entrada,
          licaoId: licao.id,
          licaoTitulo: licao.titulo,
          linguagem: licao.linguagem
        }))
      )
  }));
}

/** Junta as linhas do JSON no formato que o BlocoCodigo espera. */
export function comoTexto(linhas: string[] | undefined): string {
  return (linhas ?? []).join('\n');
}
