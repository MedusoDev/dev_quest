import { Platform } from 'react-native';

/**
 * OS TRÊS TEMAS.
 *
 * O `tema/index.ts` atual diz, no comentário do topo, que o app é escuro e só
 * escuro. Isto **não revoga** aquela decisão sozinho: é a paleta pronta para
 * quando ela for revogada. As três regras da identidade continuam valendo em
 * todos os três — raio zero, um acento só, o número é o herói.
 *
 * O que muda entre eles é fundo, texto e acento. O que **não** muda é a
 * estrutura: mesma régua de 1px, mesmos espaçamentos, mesma tipografia.
 *
 *   leve   — papel claro, acento tinta azul
 *   medio  — grafite suave, acento ciano
 *   pesado — a paleta Terminal atual, acento verde-lima
 *
 * ── Como aplicar ────────────────────────────────────────────────────────────
 * Hoje as telas fazem `import { cores } from '@/tema'` e leem um objeto
 * estático. Trocar tema em tempo de execução pede um passo intermediário:
 *
 *   1. Um `TemaContexto` que guarda o id escolhido (AsyncStorage) e expõe
 *      `{ cores, tema, definirTema }`.
 *   2. Um hook `useCores()` que devolve a paleta do tema corrente.
 *   3. Nas telas, `StyleSheet.create` estático não serve para o que depende de
 *      cor: mova essas propriedades para o `style` inline (`{ color: c.acento }`)
 *      e deixe no StyleSheet só o que é geometria. Layout não muda com o tema.
 *
 * Vale fazer tela por tela. Enquanto uma tela não migrou, ela continua lendo
 * `cores` do index e fica no tema pesado — nada quebra.
 */

export type IdTema = 'leve' | 'medio' | 'pesado';

/** A forma da paleta. Todo tema preenche todas as chaves. */
export type Paleta = {
  fundo: string;
  superficie: string;
  linha: string;
  acento: string;
  acentoFundo: string;
  acentoLinha: string;
  acentoTexto: string;
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
  /** `dark` no leve invertido? Não: o leve é claro, e a barra de status segue. */
  barraStatus: 'light' | 'dark';
};

/**
 * TEMA LEVE — papel claro, acento tinta azul.
 *
 * O verde-lima não sobrevive a fundo claro: sobre branco ele tem contraste de
 * 1.5:1 e desaparece. O acento virou um azul de tinta (#2b4bd8), que dá 6.9:1
 * sobre o papel e mantém a leitura de "isto é ação".
 */
const leve: Paleta = {
  fundo: '#f6f5f1',
  superficie: '#ffffff',
  linha: '#dcdad3',
  acento: '#2b4bd8',
  acentoFundo: '#eef1fe',
  acentoLinha: '#c3ccf7',
  acentoTexto: '#5f6ca8',
  textoForte: '#16171a',
  texto: '#3a3d44',
  textoFraco: '#5d626c',
  legenda: '#82868f',
  desativado: '#b0b4bb',
  desativado2: '#cbced4',
  erro: '#c1352f',
  erroFundo: '#fdeceb',
  erroLinha: '#f0c8c6',
  ok: '#16794a',
  atencao: '#a86a00',
  nivel1: '#16794a',
  nivel2: '#2b4bd8',
  nivel3: '#c1352f',
  varredura: 'rgba(43,75,216,0.35)',
  barraStatus: 'dark'
};

/**
 * TEMA MÉDIO — grafite suave, acento ciano.
 *
 * Para quem acha o preto absoluto duro à noite mas não quer tela branca. O
 * fundo sobe de #08090b para #15171c e o acento ciano é menos vibrante que o
 * lima, o que reduz o halo em OLED.
 */
const medio: Paleta = {
  fundo: '#15171c',
  superficie: '#1d2027',
  linha: '#2b2f38',
  acento: '#5ad2c4',
  acentoFundo: '#0f1c1a',
  acentoLinha: '#254541',
  acentoTexto: '#6f9a95',
  textoForte: '#eceef2',
  texto: '#c0c6d0',
  textoFraco: '#969ca8',
  legenda: '#757c88',
  desativado: '#565d69',
  desativado2: '#3a4048',
  erro: '#f08b8b',
  erroFundo: '#1d1214',
  erroLinha: '#4b2a2c',
  ok: '#5fd6a4',
  atencao: '#f0c25c',
  nivel1: '#5fd6a4',
  nivel2: '#5ad2c4',
  nivel3: '#f08b8b',
  varredura: 'rgba(90,210,196,0.35)',
  barraStatus: 'light'
};

/** TEMA PESADO — a identidade Terminal como está hoje. */
const pesado: Paleta = {
  fundo: '#08090b',
  superficie: '#0f1115',
  linha: '#1e2128',
  acento: '#c7f74e',
  acentoFundo: '#0d1006',
  acentoLinha: '#2b3417',
  acentoTexto: '#7e8a5c',
  textoForte: '#f2f4f7',
  texto: '#c3c9d2',
  textoFraco: '#9aa1ad',
  legenda: '#6f7683',
  desativado: '#4a505b',
  desativado2: '#31363f',
  erro: '#f87171',
  erroFundo: '#170b0b',
  erroLinha: '#4a2020',
  ok: '#34d399',
  atencao: '#fbbf24',
  nivel1: '#34d399',
  nivel2: '#c7f74e',
  nivel3: '#f87171',
  varredura: 'rgba(199,247,78,0.35)',
  barraStatus: 'light'
};

export const temas: Record<IdTema, Paleta> = { leve, medio, pesado };

/** Nome e nota de cada tema, para a lista em Configurações. */
export const fichasTema: { id: IdTema; nome: string; nota: string }[] = [
  { id: 'leve', nome: 'Leve', nota: 'papel claro, acento tinta azul' },
  { id: 'medio', nome: 'Médio', nota: 'grafite suave, acento ciano' },
  { id: 'pesado', nome: 'Pesado', nota: 'preto absoluto, acento verde-lima' }
];

export const temaPadrao: IdTema = 'pesado';

/** O tema que o sistema pede, quando "seguir o sistema" está ligado. */
export function temaDoSistema(esquema: 'light' | 'dark' | null | undefined): IdTema {
  return esquema === 'light' ? 'leve' : 'pesado';
}

/** Sem uso no runtime; existe para o Platform não ficar importado à toa. */
export const plataforma = Platform.OS;
