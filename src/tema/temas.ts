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
 *   escuro — azul-marinho do Devzinho, acento azul e dourado (tema padrão)
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
  /** Dourado da recompensa: XP, sequência, lição concluída, conquista. */
  ouro: string;
  /** Fundo atrás de algo dourado. */
  ouroFundo: string;
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
  fundo: '#F2F6FD',
  superficie: '#FFFFFF',
  linha: '#DCE5F3',
  acento: '#1877E6',
  acentoFundo: '#EAF3FF',
  acentoLinha: '#B9D6FA',
  acentoTexto: '#4D74AE',
  acentoSecundario: '#0FA3D8',
  ouro: '#E0A100',
  ouroFundo: '#FFF6DA',
  textoForte: '#0B1E3A',
  texto: '#26375A',
  textoFraco: '#5A6B8C',
  legenda: '#7A8AA8',
  desativado: '#AAB7CC',
  desativado2: '#CBD5E4',
  erro: '#D6304B',
  erroFundo: '#FDECEF',
  erroLinha: '#F5C6CE',
  ok: '#1AA563',
  atencao: '#C98A00',
  nivel1: '#1AA563',
  nivel2: '#1877E6',
  nivel3: '#D6304B',
  varredura: 'rgba(24,119,230,0.30)',
  barraStatus: 'dark'
};

/** TEMA ESCURO — a identidade do Devzinho: azul-marinho, azul #1E90FF e dourado. */
const escuro: Paleta = {
  fundo: '#0B1630',
  superficie: '#14254A',
  linha: '#24396A',
  acento: '#1E90FF',
  acentoFundo: '#0E1F45',
  acentoLinha: '#1F4E9E',
  acentoTexto: '#8DB8F0',
  acentoSecundario: '#4DD0FF',
  ouro: '#FFC107',
  ouroFundo: '#2B2615',
  textoForte: '#FFFFFF',
  texto: '#DCE6F7',
  textoFraco: '#A3B4D3',
  legenda: '#7F95BC',
  desativado: '#4A5F88',
  desativado2: '#2C416C',
  erro: '#FF5C70',
  erroFundo: '#2A1428',
  erroLinha: '#5E2440',
  ok: '#2ED47A',
  atencao: '#FFC107',
  nivel1: '#2ED47A',
  nivel2: '#1E90FF',
  nivel3: '#FF5C70',
  varredura: 'rgba(77,208,255,0.35)',
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
