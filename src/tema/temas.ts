import { Platform } from 'react-native';

/**
 * OS DOIS TEMAS.
 *
 * O `tema/index.ts` continua exportando `cores` como a paleta estática — é o
 * que todo arquivo ainda não migrado para `useCores()` lê. Este arquivo é a
 * fonte de verdade para quem já migrou: `TemaContexto` importa `temas` daqui
 * e decide, em runtime, qual paleta entregar.
 *
 *   claro  — fundo quase branco, acento azul
 *   escuro — fundo azul-marinho escuro, acento azul (tema padrão)
 */

export type IdTema = 'claro' | 'escuro';

/** A forma da paleta. Todo tema preenche todas as chaves. */
export type Paleta = {
  fundo: string;
  superficie: string;
  linha: string;
  acento: string;
  acentoFundo: string;
  acentoLinha: string;
  acentoTexto: string;
  /** Acento ciano secundário — realces, ícones e links de segundo plano. */
  acentoSecundario: string;
  textoForte: string;
  texto: string;
  textoFraco: string;
  legenda: string;
  desativado: string;
  desativado2: string;
  erro: string;
  erroFundo: string;
  erroLinha: string;
  ok: string;
  atencao: string;
  nivel1: string;
  nivel2: string;
  nivel3: string;
  /** A linha que desce no cartão da diária. */
  varredura: string;
  /** A cor dos ícones da barra de status: clara sobre fundo escuro, escura sobre fundo claro. */
  barraStatus: 'light' | 'dark';
};

/** TEMA CLARO — fundo quase branco, acento azul. Espelha o tema escuro. */
const claro: Paleta = {
  fundo: '#F4F7FB',
  superficie: '#FFFFFF',
  linha: '#E1E6EE',
  acento: '#3157D5',
  acentoFundo: '#EEF2FC',
  acentoLinha: '#C7D3F5',
  acentoTexto: '#5670B0',
  acentoSecundario: '#1D8FCC',
  textoForte: '#131B2C',
  texto: '#2B3446',
  textoFraco: '#5C6B82',
  legenda: '#7C8AA0',
  desativado: '#AAB4C4',
  desativado2: '#C9D0DC',
  erro: '#D6304B',
  erroFundo: '#FDECEF',
  erroLinha: '#F5C6CE',
  ok: '#1F9E64',
  atencao: '#B8860B',
  nivel1: '#1F9E64',
  nivel2: '#3157D5',
  nivel3: '#D6304B',
  varredura: 'rgba(49,87,213,0.35)',
  barraStatus: 'dark'
};

/** TEMA ESCURO — a identidade nova do DevQuest, valor por valor. */
const escuro: Paleta = {
  fundo: '#131B2C',
  superficie: '#1C2638',
  linha: '#2A3548',
  acento: '#3157D5',
  acentoFundo: '#0F1830',
  acentoLinha: '#2A4180',
  acentoTexto: '#8AA0D6',
  acentoSecundario: '#4CC2FF',
  textoForte: '#F4F7FB',
  texto: '#D7DEE9',
  textoFraco: '#9AA7BB',
  legenda: '#7C879C',
  desativado: '#4B5568',
  desativado2: '#333F52',
  erro: '#FF5C70',
  erroFundo: '#2A1620',
  erroLinha: '#5A2530',
  ok: '#61D095',
  atencao: '#FFC857',
  nivel1: '#61D095',
  nivel2: '#3157D5',
  nivel3: '#FF5C70',
  varredura: 'rgba(49,87,213,0.35)',
  barraStatus: 'light'
};

export const temas: Record<IdTema, Paleta> = { claro, escuro };

/** Nome e nota de cada tema, para a lista em Configurações. */
export const fichasTema: { id: IdTema; nome: string; nota: string }[] = [
  { id: 'claro', nome: 'Claro', nota: 'fundo quase branco, acento azul' },
  { id: 'escuro', nome: 'Escuro', nota: 'azul-marinho escuro, acento azul' }
];

export const temaPadrao: IdTema = 'escuro';

/** O tema que o sistema pede, quando "seguir o sistema" está ligado. */
export function temaDoSistema(esquema: 'light' | 'dark' | null | undefined): IdTema {
  return esquema === 'light' ? 'claro' : 'escuro';
}

/** Sem uso no runtime; existe para o Platform não ficar importado à toa. */
export const plataforma = Platform.OS;
