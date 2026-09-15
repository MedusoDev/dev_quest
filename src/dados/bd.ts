/**
 * O banco local. Uma única conexão SQLite, aberta uma vez e reaproveitada.
 *
 * Tudo do app cabe aqui: não há servidor, não há conta, e o progresso nunca sai
 * do aparelho. É o que faz o app abrir instantâneo e funcionar no metrô.
 */

import * as SQLite from 'expo-sqlite';

const NOME = 'devquest.db';

let conexao: SQLite.SQLiteDatabase | null = null;
let abrindo: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * `WAL` deixa leitura e escrita acontecerem ao mesmo tempo — sem ele, gravar o
 * fim de uma sessão travaria a tela por um instante.
 *
 * O progresso mora como um JSON só em `ajustes` porque ele é sempre lido e
 * gravado inteiro. Revisões e lições ganham tabela própria porque crescem com o
 * tempo e são consultadas por id.
 */
const ESQUEMA = `
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS ajustes (
    chave TEXT PRIMARY KEY NOT NULL,
    valor TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS revisoes (
    cardId          TEXT PRIMARY KEY NOT NULL,
    nivel           INTEGER NOT NULL DEFAULT 0,
    proximaEm       TEXT NOT NULL,
    acertosSeguidos INTEGER NOT NULL DEFAULT 0,
    erros           INTEGER NOT NULL DEFAULT 0,
    vistoEm         TEXT
  );

  CREATE TABLE IF NOT EXISTS licoes (
    licaoId     TEXT PRIMARY KEY NOT NULL,
    concluidaEm TEXT NOT NULL
  );
`;

export async function abrirBanco(): Promise<SQLite.SQLiteDatabase> {
  if (conexao) return conexao;

  // Duas telas montando ao mesmo tempo pediriam a abertura duas vezes; guardar
  // a promessa faz a segunda esperar a primeira em vez de abrir outra conexão.
  if (!abrindo) {
    abrindo = (async () => {
      const bd = await SQLite.openDatabaseAsync(NOME);
      await bd.execAsync(ESQUEMA);
      conexao = bd;
      return bd;
    })();
  }

  return abrindo;
}

/** Só para desenvolvimento: apaga tudo e devolve o app ao primeiro uso. */
export async function limparTudo(): Promise<void> {
  const bd = await abrirBanco();
  await bd.execAsync('DELETE FROM ajustes; DELETE FROM revisoes; DELETE FROM licoes;');
}
