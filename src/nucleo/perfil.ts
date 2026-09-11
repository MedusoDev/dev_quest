/**
 * Perfil público: nome, borda e a semana da liga.
 *
 * Tudo aqui é puro — nenhuma chamada de rede, nenhum React. Quem fala com o
 * Firebase é `dados/nuvem.ts`.
 */

import { diaDaSemana, hoje, idadeEmAnos, somarDias, type Dia } from './datas';
import type { LinguagemId } from './conteudo';
import { RANKS, type Progresso } from './gamificacao';

/* ─────────────────────────── a semana ──────────────────────────── */

/**
 * A semana é identificada pela data da sua segunda-feira: `2026-08-24`.
 *
 * Número de semana ISO seria mais bonito e bem mais fácil de errar — a regra da
 * quinta-feira, a semana 53, a virada de ano. A segunda-feira é uma data comum,
 * comparável com `<` e `>`, e não tem caso especial nenhum.
 */
export function semanaDe(dia: Dia = hoje()): string {
  const diaSemana = diaDaSemana(dia); // 0 = domingo
  // Domingo pertence à semana que começou na segunda anterior, seis dias atrás.
  const recuo = diaSemana === 0 ? 6 : diaSemana - 1;
  return somarDias(dia, -recuo);
}

/* ─────────────────────────── as bordas ─────────────────────────── */

export type EstiloBorda = 'solida' | 'dupla' | 'tracejada' | 'anel';

export type Borda = {
  id: string;
  nome: string;
  cor: string;
  estilo: EstiloBorda;
  /** XP necessário, quando a borda vem de um rank. */
  xp?: number;
  /** Id da conquista, quando a borda vem de uma. */
  conquista?: string;
  comoConseguir: string;
};

/**
 * Bordas saem do que a pessoa já fez — rank ou conquista. Nenhuma é comprada.
 *
 * A fronteira de pagamento a gente desenha na Fase 6; até lá, item cosmético
 * que se compra ensinaria a errada: que dá para pular o estudo.
 */
export const BORDAS: Borda[] = [
  { id: 'ovo', nome: 'Ovo', cor: '#8ba1bd', estilo: 'solida', xp: 0, comoConseguir: 'você já tem' },
  { id: 'cria', nome: 'Cria', cor: '#a78bfa', estilo: 'solida', xp: RANKS[1]!.xp, comoConseguir: `${RANKS[1]!.xp} XP` },
  { id: 'serpente', nome: 'Serpente', cor: '#5eead4', estilo: 'dupla', xp: RANKS[2]!.xp, comoConseguir: `${RANKS[2]!.xp} XP` },
  { id: 'naja', nome: 'Naja', cor: '#a5b4fc', estilo: 'dupla', xp: RANKS[3]!.xp, comoConseguir: `${RANKS[3]!.xp} XP` },
  { id: 'basilisco', nome: 'Basilisco', cor: '#fb7185', estilo: 'anel', xp: RANKS[4]!.xp, comoConseguir: `${RANKS[4]!.xp} XP` },
  { id: 'ouroboros', nome: 'Ouroboros', cor: '#fbbf24', estilo: 'anel', xp: RANKS[5]!.xp, comoConseguir: `${RANKS[5]!.xp} XP` },

  { id: 'chama', nome: 'Chama', cor: '#fbbf24', estilo: 'tracejada', conquista: 'sequencia-7', comoConseguir: '7 dias seguidos' },
  { id: 'diamante', nome: 'Diamante', cor: '#34d399', estilo: 'dupla', conquista: 'licao-perfeita', comoConseguir: 'uma lição sem erro' },
  { id: 'reflexo', nome: 'Reflexo', cor: '#c4b5fd', estilo: 'tracejada', conquista: 'relampago-20', comoConseguir: '20 acertos no Relâmpago' }
];

export const BORDA_PADRAO = 'ovo';

export function obterBorda(id: string | undefined): Borda {
  return BORDAS.find((b) => b.id === id) ?? BORDAS[0]!;
}

export function bordaLiberada(borda: Borda, progresso: Progresso): boolean {
  if (borda.xp !== undefined) return progresso.xp >= borda.xp;
  if (borda.conquista) return progresso.conquistas.includes(borda.conquista);
  return true;
}

export function bordasLiberadas(progresso: Progresso): Borda[] {
  return BORDAS.filter((b) => bordaLiberada(b, progresso));
}

/* ───────────────────────── as validações ───────────────────────── */

export const NOME_MIN = 2;
export const NOME_MAX = 20;
export const SENHA_MIN = 6;

/**
 * Lista curta e deliberadamente conservadora — primeira barreira contra
 * codinome com conotação sexual explícita, não um filtro de profanidade
 * completo. Comparação normalizada (minúsculo, sem acento) pega variações
 * óbvias sem precisar de um serviço externo de moderação.
 */
const TERMOS_PROIBIDOS = [
  'sexo',
  'buceta',
  'piroca',
  'pinto',
  'caralho',
  'punheta',
  'punheteiro',
  'porno',
  'pornografia',
  'safada',
  'safado',
  'gostosa',
  'gostoso',
  'putaria',
  'puta',
  'vagina',
  'penis',
  'xoxota',
  'siririca',
  'boquete',
  'orgasmo',
  'tesao',
  'ninfeta',
  'gozar',
  'gozada',
  'xvideos',
  'pornhub'
];

function normalizarParaFiltro(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Verdadeiro se o texto contém algum termo da lista, em qualquer parte da palavra. */
export function temConotacaoSexual(texto: string): boolean {
  const normalizado = normalizarParaFiltro(texto);
  return TERMOS_PROIBIDOS.some((termo) => normalizado.includes(termo));
}

/** Devolve a mensagem de erro, ou `null` quando está tudo certo. */
export function validarNome(nome: string): string | null {
  const limpo = nome.trim();
  if (limpo.length < NOME_MIN) return `Escolha um codinome com ${NOME_MIN} caracteres ou mais.`;
  if (limpo.length > NOME_MAX) return `O codinome passa de ${NOME_MAX} caracteres.`;
  if (temConotacaoSexual(limpo)) return 'Esse codinome não pode ser usado. Escolha outro.';
  return null;
}

export function validarEmail(email: string): string | null {
  const limpo = email.trim();
  // Verificação deliberadamente frouxa: quem valida e-mail de verdade é o
  // servidor mandando a mensagem. Regex apertado só recusa endereço válido.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo)) return 'E-mail sem @ ou sem domínio.';
  return null;
}

export function validarSenha(senha: string): string | null {
  if (senha.length < SENHA_MIN) return `A senha precisa de pelo menos ${SENHA_MIN} caracteres.`;
  return null;
}

export const NOME_COMPLETO_MIN = 2;
export const NOME_COMPLETO_MAX = 60;

/** Como `validarNome`, mas para o nome completo do onboarding — sem o teto de 20
 *  caracteres do codinome, que sobra rápido num nome com sobrenome. */
export function validarNomeCompleto(nome: string): string | null {
  const limpo = nome.trim();
  if (limpo.length < NOME_COMPLETO_MIN) return 'Escreva seu nome.';
  if (limpo.length > NOME_COMPLETO_MAX) return 'Esse nome é longo demais.';
  return null;
}

export const IDADE_MIN = 8;
export const IDADE_MAX = 110;

/**
 * Data de nascimento em vez de idade solta: idade muda todo ano e vira dado
 * desatualizado sozinho; data de nascimento é o dado de verdade, e a idade se
 * calcula dela quando precisar (`idadeDe` abaixo).
 *
 * Devolve a mensagem de erro, ou `null` quando está tudo certo.
 */
export function validarDataNascimento(data: Dia | null): string | null {
  if (!data) return 'Escreva sua data de nascimento.';

  const partes = data.split('-').map(Number);
  const [ano, mes, dia] = partes;
  if (partes.length !== 3 || partes.some((n) => Number.isNaN(n))) {
    return 'Data de nascimento inválida.';
  }

  // Confere calendário de verdade: `new Date(2026, 1, 30)` viraria 2 de março
  // em vez de dar erro, e passaria por um teste que só olhasse os números.
  const comoData = new Date(ano!, mes! - 1, dia!);
  const calendarioValido =
    comoData.getFullYear() === ano &&
    comoData.getMonth() === mes! - 1 &&
    comoData.getDate() === dia;
  if (!calendarioValido) return 'Essa data não existe.';

  if (data > hoje()) return 'Essa data ainda não chegou.';

  const idade = idadeEmAnos(data);
  if (idade < IDADE_MIN || idade > IDADE_MAX) {
    return `A idade precisa estar entre ${IDADE_MIN} e ${IDADE_MAX} anos.`;
  }

  return null;
}

/** A idade em anos completos de quem tem essa data de nascimento, ou `null` sem ela. */
export function idadeDe(dataNascimento: Dia | null): number | null {
  return dataNascimento ? idadeEmAnos(dataNascimento) : null;
}

/* ────────────────────────────── o plano ─────────────────────────── */

/**
 * O plano da conta. Só `free` existe de verdade hoje — os demais são o
 * desenho da Fase 3 de `feat/ideia.md` (IA para tirar dúvida dos erros,
 * possivelmente menos anúncio) e ainda não têm nenhuma feature amarrada a
 * eles no código. O tipo já existe agora para toda conta nova nascer com um
 * plano explícito, em vez de precisar de uma migração depois.
 */
export type PlanoId = 'free' | 'plus';

export const PLANO_PADRAO: PlanoId = 'free';

/* ─────────────────────── o perfil de estudo ────────────────────── */

export type NivelConhecimento = 'iniciante' | 'intermediario' | 'avancado';

export const NIVEIS_CONHECIMENTO: { id: NivelConhecimento; nome: string; descricao: string }[] = [
  { id: 'iniciante', nome: 'Iniciante', descricao: 'Nunca programei ou estou começando agora.' },
  {
    id: 'intermediario',
    nome: 'Intermediário',
    descricao: 'Já escrevo código, mas travo em partes do caminho.'
  },
  { id: 'avancado', nome: 'Avançado', descricao: 'Programo com folga; quero afiar o que já sei.' }
];

/**
 * A recomendação do teste de nível do onboarding — 5 cards (3 leve, 1 médio,
 * 1 difícil; ver `montarTesteDeNivel` em `nucleo/diaria`). Só acertar o fácil
 * ainda não é base; acertar a maioria mas errar o difícil é o intermediário
 * clássico; acertar tudo (ou quase) já é avançado.
 */
export function recomendarNivel(acertos: number): NivelConhecimento {
  if (acertos <= 1) return 'iniciante';
  if (acertos <= 3) return 'intermediario';
  return 'avancado';
}

/** A ordem da escada — usada pra saber o que é "mais baixo" que o nível atual. */
export const ORDEM_NIVEL: Record<NivelConhecimento, number> = {
  iniciante: 0,
  intermediario: 1,
  avancado: 2
};

/** O próximo degrau, ou `null` quando já é o topo — usado pela sugestão automática. */
export const PROXIMO_NIVEL: Record<NivelConhecimento, NivelConhecimento | null> = {
  iniciante: 'intermediario',
  intermediario: 'avancado',
  avancado: null
};

/* ─────────────────────────── a liga ────────────────────────────── */

/** Sem 0/O e 1/I: o código é lido em voz alta e digitado por outra pessoa. */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const TAMANHO_CODIGO = 6;

export function gerarCodigoLiga(): string {
  let codigo = '';
  for (let i = 0; i < TAMANHO_CODIGO; i += 1) {
    codigo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return codigo;
}

export function normalizarCodigo(bruto: string): string {
  return bruto.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function codigoValido(codigo: string): boolean {
  const limpo = normalizarCodigo(codigo);
  if (limpo.length !== TAMANHO_CODIGO) return false;
  return [...limpo].every((c) => ALFABETO.includes(c));
}

/** O que o ranking mostra de cada pessoa. */
export type PerfilPublico = {
  uid: string;
  nome: string;
  /** JPEG em base64, já reduzido. Vazio quando não há foto. */
  foto: string;
  borda: string;
  xp: number;
  sequencia: number;
  rank: string;
  /** XP ganho na semana corrente — é por ele que a liga é ordenada. */
  xpSemana: number;
  semana: string;
  ligaCodigo: string | null;

  /** Nome completo, coletado no onboarding — diferente do codinome em `nome`. */
  nomeCompleto: string;
  /** `AAAA-MM-DD`. A idade se calcula dela com `idadeDe` — nunca é gravada solta. */
  dataNascimento: Dia | null;
  /**
   * As linguagens em que a pessoa está focando os estudos. Vazio significa
   * sem foco — a diária mistura todas, como sempre foi.
   *
   * Mais de uma linguagem aqui é o que dá origem às diárias por linguagem:
   * ver `montarDiaria` em `nucleo/diaria.ts` e a tela `app/(abas)/index.tsx`.
   */
  foco: LinguagemId[];
  nivel: NivelConhecimento | null;
  /** Só vira `true` depois que nome, data de nascimento, foco e nível são preenchidos. */
  onboardingCompleto: boolean;
  /**
   * Já viu o teste de nível pelo menos uma vez — seja fazendo o teste, seja
   * recusando e mantendo o nível que já tinha. `false` por padrão em
   * `perfilVazio`, então toda conta que já existia antes deste campo nascer
   * lê `false` do Firestore (o campo nunca existiu no documento) e vê o
   * convite em `/teste-nivel` uma vez só — `Portao`, em `_layout.tsx`, é quem
   * decide isso. Conta nova nunca vê esse convite: o onboarding já grava
   * `true` aqui junto com `onboardingCompleto`, porque o teste já faz parte
   * dele.
   */
  nivelTestado: boolean;
  /**
   * `true` até a pessoa regredir o nível na mão, em Configurações — uma vez
   * só. Depois disso vira `false` para sempre, e o controle manual desaparece
   * de lá; só a sugestão automática de subir (baseada em acerto, ver
   * `sugestaoDeNivel` em `nucleo/diaria.ts`) continua funcionando. É o que
   * impede a pessoa de ficar alternando o nível pra frente e pra trás.
   * `true` por padrão em `perfilVazio`, então conta antiga também ganha a
   * primeira troca de graça.
   */
  podeRegredirNivel: boolean;

  /**
   * Dono desta conta pode ver o painel de métricas em `/admin`. Nunca é
   * gravado pelo app — só existe se alguém subir `true` direto no console do
   * Firebase. As regras do Firestore (`docs/firestore.rules`) impedem o
   * cliente de mudar este campo, para uma conta comum não poder se promover
   * sozinha.
   */
  admin?: boolean;

  /** Toda conta nova começa em `PLANO_PADRAO` ('free'). Ver seção "o plano" acima. */
  plano: PlanoId;

  /** Dia em que a conta foi criada, para calcular retenção por coorte. */
  criadoEm: Dia;
  /**
   * O mesmo instante de `criadoEm`, mas completo (`toISOString()`), guardado
   * porque um registro de LGPD pede a data exata de criação da conta, não só
   * o dia — `criadoEm` continua existindo à parte porque o painel de métricas
   * já agrupa por dia em cima dele.
   */
  criadoEmExato: string;
  /**
   * Quando a pessoa aceitou os termos e a política de privacidade, ou `null`
   * se ainda não aceitou (contas de convidado, por exemplo, veem só um aviso
   * — ver `entrar.tsx`). É o registro de consentimento da Fase 0 de LGPD.
   */
  termosAceitosEm: string | null;
  /** Último dia com diária feita — mesma ideia de `Progresso.ultimaDiaria`. */
  ultimaDiaria: Dia | null;

  /**
   * Cópia dos totais que hoje só existem no SQLite do aparelho — subida para o
   * painel de métricas poder calcular desempenho médio sem precisar de uma
   * coleção de eventos por card. Ver `aplicarProgresso` em `dados/nuvem.ts`.
   */
  diarias: number;
  cardsRespondidos: number;
  cardsAcertados: number;
};
