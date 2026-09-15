/**
 * O que sobe para a nuvem: o perfil público e a liga.
 *
 * O progresso continua morando no SQLite do aparelho — ele é a fonte da
 * verdade. Aqui vai só uma cópia do que precisa ser comparado com outras
 * pessoas. É isso que deixa o app abrir instantâneo e funcionar no metrô:
 * se a rede falhar, nada aqui trava o estudo.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
  type DocumentData
} from 'firebase/firestore';

import { bdNuvem } from './firebase';
import { hoje } from '@/nucleo/datas';
import type { EventoSessao } from '@/nucleo/eventos';
import { rankPara, type Progresso } from '@/nucleo/gamificacao';
import {
  BORDA_PADRAO,
  gerarCodigoLiga,
  normalizarCodigo,
  PLANO_PADRAO,
  semanaDe,
  type PerfilPublico
} from '@/nucleo/perfil';

function avisar(operacao: string, erro: unknown) {
  console.warn(`[nuvem] ${operacao} falhou; o app segue sem isso.`, erro);
}

/* ─────────────────────────── o perfil ──────────────────────────── */

export function perfilVazio(uid: string, nome: string): PerfilPublico {
  return {
    uid,
    nome,
    foto: '',
    borda: BORDA_PADRAO,
    xp: 0,
    sequencia: 0,
    rank: 'Ovo',
    xpSemana: 0,
    semana: semanaDe(),
    ligaCodigo: null,
    nomeCompleto: '',
    dataNascimento: null,
    foco: [],
    nivel: null,
    onboardingCompleto: false,
    nivelTestado: false,
    podeRegredirNivel: true,
    plano: PLANO_PADRAO,
    criadoEm: hoje(),
    criadoEmExato: new Date().toISOString(),
    termosAceitosEm: null,
    ultimaDiaria: null,
    diarias: 0,
    cardsRespondidos: 0,
    cardsAcertados: 0
  };
}

const prefixoCache = 'devquest:perfil:v1:';

/**
 * Uma cópia do último perfil lido com sucesso, guardada no aparelho.
 *
 * Existe só para o caso de `lerPerfil` falhar por falta de rede — comum bem no
 * início do app abrindo, antes da conexão estar pronta. Sem isto, uma leitura
 * que falhasse virava `null`, `null` virava `perfilVazio()`, e a pessoa via o
 * onboarding de novo toda vez que o app abrisse sem rede ainda disponível.
 */
async function cachearPerfilLocal(perfil: PerfilPublico): Promise<void> {
  try {
    await AsyncStorage.setItem(`${prefixoCache}${perfil.uid}`, JSON.stringify(perfil));
  } catch {
    // Cache é conveniência, não fonte da verdade — se falhar, segue o jogo.
  }
}

async function lerPerfilCache(uid: string): Promise<PerfilPublico | null> {
  try {
    const bruto = await AsyncStorage.getItem(`${prefixoCache}${uid}`);
    return bruto ? (JSON.parse(bruto) as PerfilPublico) : null;
  } catch {
    return null;
  }
}

export async function lerPerfil(uid: string): Promise<PerfilPublico | null> {
  try {
    const instantaneo = await getDoc(doc(bdNuvem, 'perfis', uid));
    // A leitura funcionou e o documento não existe: é mesmo conta nova.
    if (!instantaneo.exists()) return null;

    const dados = instantaneo.data() as Partial<PerfilPublico>;
    // Contas criadas antes do onboarding não têm estes campos no documento —
    // sem o merge, `foco` chega `undefined` e quebra quem espera um array. E
    // contas do onboarding antigo (uma linguagem só, ou nenhuma) gravaram
    // `foco` como string ou `null` — valores explícitos, que o merge sozinho
    // não troca por `[]`. Precisa normalizar os dois casos à parte.
    const foco: PerfilPublico['foco'] = Array.isArray(dados.foco)
      ? dados.foco
      : typeof dados.foco === 'string'
        ? [dados.foco]
        : [];

    const perfil = { ...perfilVazio(uid, dados.nome ?? 'Sem nome'), ...dados, foco };
    await cachearPerfilLocal(perfil);
    return perfil;
  } catch (erro) {
    avisar('lerPerfil', erro);
    // A leitura falhou — não dá para saber se a conta é nova ou se foi só a
    // rede. Devolve o último perfil visto em vez de deixar quem chamou
    // assumir "conta nova" e apagar nome, foco e onboarding já preenchidos.
    return lerPerfilCache(uid);
  }
}

export async function gravarPerfil(perfil: PerfilPublico): Promise<void> {
  await cachearPerfilLocal(perfil);
  try {
    await setDoc(doc(bdNuvem, 'perfis', perfil.uid), perfil, { merge: true });
  } catch (erro) {
    avisar('gravarPerfil', erro);
  }
}

/**
 * Sobe o progresso local para o perfil público, somando o XP da semana.
 *
 * A virada de semana é detectada aqui: se a semana gravada não é a de hoje, o
 * contador semanal recomeça. Fazer isso no aparelho é suficiente para uma liga
 * entre amigos — servidor com tarefa agendada seria custo sem retorno.
 */
export function aplicarProgresso(
  perfil: PerfilPublico,
  progresso: Progresso,
  xpGanho: number
): PerfilPublico {
  const semanaAtual = semanaDe(hoje());
  const virouSemana = perfil.semana !== semanaAtual;

  return {
    ...perfil,
    xp: progresso.xp,
    sequencia: progresso.sequencia,
    rank: rankPara(progresso.xp).atual.nome,
    semana: semanaAtual,
    xpSemana: (virouSemana ? 0 : perfil.xpSemana) + xpGanho,
    ultimaDiaria: progresso.ultimaDiaria,
    diarias: progresso.diarias,
    cardsRespondidos: progresso.cardsRespondidos,
    cardsAcertados: progresso.cardsAcertados
  };
}

/**
 * Apaga o documento do perfil na nuvem — parte do "excluir conta" (LGPD:
 * direito de eliminação). Chamada de `dados/conta.ts`, antes de apagar a
 * conta do Firebase Auth: as regras do Firestore (`docs/firestore.rules`)
 * exigem estar autenticado como o próprio uid para poder apagar.
 *
 * Ao contrário do resto deste arquivo, propaga o erro em vez de engolir —
 * quem chama precisa saber se a exclusão de verdade aconteceu antes de seguir
 * para apagar a conta em si.
 */
export async function excluirPerfil(uid: string): Promise<void> {
  await deleteDoc(doc(bdNuvem, 'perfis', uid));
}

/**
 * Todos os perfis existentes — só para o painel de métricas em `/admin`.
 *
 * Sem filtro porque a análise é do app inteiro, não de uma liga. A tela que
 * chama isto já barra quem não é admin antes de chegar aqui; ver `app/admin.tsx`.
 */
export async function lerTodosPerfis(): Promise<PerfilPublico[]> {
  try {
    const instantaneo = await getDocs(collection(bdNuvem, 'perfis'));
    return instantaneo.docs.map((d) => d.data() as DocumentData as PerfilPublico);
  } catch (erro) {
    avisar('lerTodosPerfis', erro);
    return [];
  }
}

/* ──────────────────────── eventos de sessão ────────────────────── */

/**
 * Grava um evento de sessão concluída — só para o painel de métricas calcular
 * frequência e horário de uso. Nunca trava o app: dado de análise, não fonte
 * da verdade (essa continua no SQLite local). Chamado de `ContaContexto`, no
 * mesmo lugar que já sincroniza o perfil, e não de dentro de nenhuma tela.
 */
export async function registrarEventoSessao(evento: EventoSessao): Promise<void> {
  try {
    await addDoc(collection(bdNuvem, 'eventosSessao'), evento);
  } catch (erro) {
    avisar('registrarEventoSessao', erro);
  }
}

/**
 * Os eventos mais recentes — só para o painel de métricas em `/admin`.
 *
 * Limitado porque a coleção só cresce; sem limite, o painel ficaria mais lento
 * a cada mês de uso do app. Calcular "frequência dos últimos 14 dias" com
 * 3000 eventos recentes é sobra de dado, não falta.
 */
export async function lerEventosSessao(): Promise<EventoSessao[]> {
  try {
    const consulta = query(collection(bdNuvem, 'eventosSessao'), limit(3000));
    const instantaneo = await getDocs(consulta);
    return instantaneo.docs.map((d) => d.data() as DocumentData as EventoSessao);
  } catch (erro) {
    avisar('lerEventosSessao', erro);
    return [];
  }
}

/**
 * Apaga todos os eventos de sessão de um uid — parte do "excluir conta".
 * Propaga erro como `excluirPerfil`, pelo mesmo motivo: quem chama precisa
 * saber se falhou antes de seguir para apagar a conta do Auth.
 */
export async function excluirEventosDoUsuario(uid: string): Promise<void> {
  const consulta = query(collection(bdNuvem, 'eventosSessao'), where('uid', '==', uid));
  const instantaneo = await getDocs(consulta);
  await Promise.all(instantaneo.docs.map((d) => deleteDoc(d.ref)));
}

/**
 * O top da semana entre TODOS os perfis, sem filtro de liga.
 *
 * Ordenado no Firestore, ao contrário de `lerRanking` — aqui não dá para
 * trazer todo mundo para ordenar no aparelho, então precisa de `orderBy` +
 * `limit`. `xpSemana` some sozinho de quem não estuda (a leitura em
 * `lerPerfil`/`aplicarProgresso` não zera campo antigo), então a lista pode
 * mostrar gente com XP de uma semana passada por um instante — aceitável para
 * um "top global" de vitrine, diferente da liga fechada onde isso importaria.
 */
export async function lerLigaGlobal(limiteDeLinhas = 50): Promise<PerfilPublico[]> {
  try {
    const consulta = query(
      collection(bdNuvem, 'perfis'),
      orderBy('xpSemana', 'desc'),
      limit(limiteDeLinhas)
    );
    const instantaneo = await getDocs(consulta);
    return instantaneo.docs.map((d) => d.data() as DocumentData as PerfilPublico);
  } catch (erro) {
    avisar('lerLigaGlobal', erro);
    return [];
  }
}

/* ──────────────────────────── a liga ───────────────────────────── */

export type Liga = { codigo: string; nome: string; criadaPor: string; criadaEm: string };

export async function criarLiga(nome: string, uid: string): Promise<Liga | null> {
  try {
    // Colisão de código é improvável (32^6), mas custa uma leitura conferir.
    for (let tentativa = 0; tentativa < 5; tentativa += 1) {
      const codigo = gerarCodigoLiga();
      const referencia = doc(bdNuvem, 'ligas', codigo);

      if ((await getDoc(referencia)).exists()) continue;

      const liga: Liga = { codigo, nome: nome.trim(), criadaPor: uid, criadaEm: hoje() };
      await setDoc(referencia, liga);
      return liga;
    }

    return null;
  } catch (erro) {
    avisar('criarLiga', erro);
    return null;
  }
}

export async function buscarLiga(codigoBruto: string): Promise<Liga | null> {
  try {
    const codigo = normalizarCodigo(codigoBruto);
    const instantaneo = await getDoc(doc(bdNuvem, 'ligas', codigo));
    if (!instantaneo.exists()) return null;
    return instantaneo.data() as Liga;
  } catch (erro) {
    avisar('buscarLiga', erro);
    return null;
  }
}

/**
 * O ranking da semana.
 *
 * Uma consulta só: os perfis daquela liga, ordenados no aparelho. Ordenar aqui
 * em vez de no Firestore evita ter que criar índice composto no console — e com
 * uma liga de amigos a lista nunca passa de algumas dezenas.
 */
export async function lerRanking(codigo: string): Promise<PerfilPublico[]> {
  try {
    const consulta = query(collection(bdNuvem, 'perfis'), where('ligaCodigo', '==', codigo));
    const instantaneo = await getDocs(consulta);
    const semanaAtual = semanaDe(hoje());

    return instantaneo.docs
      .map((d) => d.data() as DocumentData as PerfilPublico)
      // Quem não estudou nesta semana entra com zero, em vez de carregar o
      // número da semana passada.
      .map((p) => (p.semana === semanaAtual ? p : { ...p, xpSemana: 0 }))
      .sort((a, b) => b.xpSemana - a.xpSemana || b.xp - a.xp);
  } catch (erro) {
    avisar('lerRanking', erro);
    return [];
  }
}
