/**
 * Leitura e gravação do progresso.
 *
 * Nenhuma função joga exceção para cima: se o banco falhar, o app continua
 * jogável e aquela sessão simplesmente não é gravada. Melhor perder XP do que
 * travar a pessoa numa tela de erro no meio de uma lição.
 */

import { abrirBanco } from './bd';
import { progressoInicial, type Progresso } from '@/nucleo/gamificacao';
import type { Revisao } from '@/nucleo/revisao';

function avisar(operacao: string, erro: unknown) {
  console.warn(`[progresso] ${operacao} falhou; seguindo sem gravar.`, erro);
}

/* ──────────────────────── de quem é este banco ─────────────────── */

/**
 * O banco local guarda o progresso de **uma** conta.
 *
 * Sem isto, dois amigos entrando no mesmo celular veriam o XP e a sequência um
 * do outro — e o segundo ainda mandaria esses números para o ranking como se
 * fossem dele. Ao detectar troca de dono, o local é zerado e o app recomeça
 * daquela conta.
 *
 * @returns `true` quando apagou o que havia (conta diferente da anterior).
 */
export async function fixarDono(uid: string): Promise<boolean> {
  try {
    const bd = await abrirBanco();
    const linha = await bd.getFirstAsync<{ valor: string }>(
      'SELECT valor FROM ajustes WHERE chave = ?',
      'dono'
    );

    const trocou = linha != null && linha.valor !== uid;
    if (trocou) {
      await bd.execAsync('DELETE FROM ajustes; DELETE FROM revisoes; DELETE FROM licoes;');
    }

    await bd.runAsync(
      'INSERT INTO ajustes (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor',
      'dono',
      uid
    );

    return trocou;
  } catch (erro) {
    avisar('fixarDono', erro);
    return false;
  }
}

/**
 * Apaga todo o progresso local — parte do "excluir conta". Diferente de
 * `fixarDono`, que só limpa ao detectar troca de dono, esta é chamada de
 * propósito quando a própria pessoa pede para excluir a conta.
 */
export async function apagarTudoLocal(): Promise<void> {
  try {
    const bd = await abrirBanco();
    await bd.execAsync('DELETE FROM ajustes; DELETE FROM revisoes; DELETE FROM licoes;');
  } catch (erro) {
    avisar('apagarTudoLocal', erro);
  }
}

/* ─────────────────────────── progresso ─────────────────────────── */

export async function lerProgresso(): Promise<Progresso> {
  const padrao = progressoInicial();

  try {
    const bd = await abrirBanco();
    const linha = await bd.getFirstAsync<{ valor: string }>(
      'SELECT valor FROM ajustes WHERE chave = ?',
      'progresso'
    );

    if (!linha) return padrao;

    // O espalhamento do padrão primeiro garante que campos novos, criados em
    // versões posteriores do app, apareçam em instalações antigas.
    return { ...padrao, ...(JSON.parse(linha.valor) as Partial<Progresso>) };
  } catch (erro) {
    avisar('lerProgresso', erro);
    return padrao;
  }
}

export async function gravarProgresso(progresso: Progresso): Promise<void> {
  try {
    const bd = await abrirBanco();
    await bd.runAsync(
      'INSERT INTO ajustes (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor',
      'progresso',
      JSON.stringify(progresso)
    );
  } catch (erro) {
    avisar('gravarProgresso', erro);
  }
}

/* ──────────────────────────── revisões ─────────────────────────── */

type LinhaRevisao = {
  cardId: string;
  nivel: number;
  proximaEm: string;
  acertosSeguidos: number;
  erros: number;
  vistoEm: string | null;
};

export async function lerRevisoes(): Promise<Map<string, Revisao>> {
  try {
    const bd = await abrirBanco();
    const linhas = await bd.getAllAsync<LinhaRevisao>('SELECT * FROM revisoes');

    return new Map(
      linhas.map((l) => [
        l.cardId,
        {
          nivel: l.nivel,
          proximaEm: l.proximaEm,
          acertosSeguidos: l.acertosSeguidos,
          erros: l.erros,
          vistoEm: l.vistoEm
        }
      ])
    );
  } catch (erro) {
    avisar('lerRevisoes', erro);
    return new Map();
  }
}

/**
 * Grava várias de uma vez, numa transação só.
 *
 * Uma sessão fecha com ~10 cards; sem a transação seriam dez gravações
 * separadas, cada uma com o custo de sincronizar o arquivo em disco.
 */
export async function gravarRevisoes(novas: Map<string, Revisao>): Promise<void> {
  if (novas.size === 0) return;

  try {
    const bd = await abrirBanco();

    await bd.withTransactionAsync(async () => {
      for (const [cardId, r] of novas) {
        await bd.runAsync(
          `INSERT INTO revisoes (cardId, nivel, proximaEm, acertosSeguidos, erros, vistoEm)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(cardId) DO UPDATE SET
             nivel = excluded.nivel,
             proximaEm = excluded.proximaEm,
             acertosSeguidos = excluded.acertosSeguidos,
             erros = excluded.erros,
             vistoEm = excluded.vistoEm`,
          cardId,
          r.nivel,
          r.proximaEm,
          r.acertosSeguidos,
          r.erros,
          r.vistoEm
        );
      }
    });
  } catch (erro) {
    avisar('gravarRevisoes', erro);
  }
}

/* ───────────────────────────── lições ──────────────────────────── */

export async function lerLicoesConcluidas(): Promise<Set<string>> {
  try {
    const bd = await abrirBanco();
    const linhas = await bd.getAllAsync<{ licaoId: string }>('SELECT licaoId FROM licoes');
    return new Set(linhas.map((l) => l.licaoId));
  } catch (erro) {
    avisar('lerLicoesConcluidas', erro);
    return new Set();
  }
}

export async function gravarLicoesConcluidas(ids: string[], quando: string): Promise<void> {
  if (ids.length === 0) return;

  try {
    const bd = await abrirBanco();
    await bd.withTransactionAsync(async () => {
      for (const id of ids) {
        await bd.runAsync(
          'INSERT INTO licoes (licaoId, concluidaEm) VALUES (?, ?) ON CONFLICT(licaoId) DO NOTHING',
          id,
          quando
        );
      }
    });
  } catch (erro) {
    avisar('gravarLicoesConcluidas', erro);
  }
}
