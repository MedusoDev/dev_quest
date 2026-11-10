import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop
} from 'react-native-svg';

import { fontes } from '@/tema';
import { useMovimentoReduzido } from './movimento';

/**
 * O DEVZINHO — o mago programador que acompanha a pessoa no app inteiro.
 *
 * Desenhado em SVG (e não em PNG) por três motivos:
 *
 *   1. **Expressões.** O rosto é só olhos e boca trocáveis — o mesmo boneco
 *      fica feliz quando a pessoa acerta, triste quando erra, pensando quando
 *      carrega.
 *   2. **Evolução.** O nível do Devzinho acompanha o rank da pessoa: a aura
 *      muda de cor e ele ganha óculos (Full Stack) e coroa (Dev Master/Lenda).
 *   3. **Animação de verdade.** Ele é montado em CAMADAS, cada uma num SVG
 *      próprio por cima da outra, para cada parte mexer sozinha:
 *
 *        sombra   — encolhe quando ele sobe
 *        aura     — pulsa devagar
 *        capa     — balança com atraso, como pano
 *        corpo    — respira (estica e encolhe a partir dos pés)
 *        cabeça   — inclina para os lados e acompanha a respiração;
 *                   os olhos piscam e olham em volta de vez em quando
 *        braço    — a varinha acena; de tempos em tempos ele dá um floreio
 *                   e a estrela solta brilho. Com o notebook, o cursor pisca
 *                   na tela enquanto ele "digita"
 *        pixels   — quadradinhos azuis sobem em volta dele (como na marca)
 *
 *      Com "reduzir movimento" ligado, fica tudo parado — só a expressão muda.
 *      `flutuar={false}` desliga o movimento ocioso (bom para listas), mas ele
 *      continua piscando.
 *
 * Tudo é desenhado num quadro de 200×220; `tamanho` é a largura final.
 */

export type ExpressaoDevzinho =
  | 'determinado'
  | 'feliz'
  | 'animado'
  | 'surpreso'
  | 'triste'
  | 'pensando'
  | 'bravo';

export type ItemDevzinho = 'notebook' | 'varinha' | 'nenhum';

/** 1 Iniciante · 2 Aprendiz · 3 Dev · 4 Full Stack · 5 Dev Master · 6 Lenda. */
export type NivelDevzinho = 1 | 2 | 3 | 4 | 5 | 6;

/** A cor da aura de cada nível — a mesma da "Evolução do Devzinho". */
export const CORES_NIVEL: Record<NivelDevzinho, string> = {
  1: '#8A94A8',
  2: '#1E90FF',
  3: '#2ED47A',
  4: '#9B5CFF',
  5: '#FFC107',
  6: '#4DD0FF'
};

/** Converte a posição no `RANKS` (0-based) para o nível do Devzinho. */
export function nivelDoRank(indiceRank: number): NivelDevzinho {
  return Math.min(6, Math.max(1, indiceRank + 1)) as NivelDevzinho;
}

type Props = {
  /** Largura final em dp. A altura é 1.1× isso. */
  tamanho?: number;
  expressao?: ExpressaoDevzinho;
  item?: ItemDevzinho;
  nivel?: NivelDevzinho;
  /** A auréola colorida atrás dele. */
  aura?: boolean;
  /** Movimento ocioso (respirar, balançar, acenar). Desligue em listas longas. */
  flutuar?: boolean;
  /**
   * Muda este valor para disparar uma reação única: `pulo` (acerto, festa) ou
   * `tremor` (erro). Ex.: `reacao={{ tipo: 'pulo', chave: contador }}`.
   */
  reacao?: { tipo: 'pulo' | 'tremor'; chave: number | string } | null;
  /** Mostra-o apagado, como silhueta de nível ainda não alcançado. */
  bloqueado?: boolean;
  estilo?: ViewStyle;
};

/* ─────────────────────────── a paleta dele ─────────────────────────── */

const AZUL = '#1E90FF';
const AZUL_ESCURO = '#1460D6';
const AZUL_CLARO = '#5DB2FF';
const AZUL_FUNDO = '#0E4FB8';
const BORDA_ROSTO = '#0E3E9E';
const ROSTO = '#0A1433';
const MANTO = '#142A66';
const MANTO_SOMBRA = '#0F1F4D';
const OURO = '#FFC107';
const OURO_ESCURO = '#E09A00';
const OURO_CLARO = '#FFE082';
const CIANO = '#4DD0FF';
const BRANCO = '#FFFFFF';

const CINZA_1 = '#5A6886';
const CINZA_2 = '#46557A';
const CINZA_3 = '#36446A';
const CINZA_4 = '#2C3A5E';

const LARGURA = 200;
const ALTURA = 220;

/** Pontos de giro (no quadro 200×220). */
const PESCOCO = { x: 102, y: 146 };
const PES = { x: 100, y: 211 };
const OMBROS = { x: 100, y: 142 };
const OMBRO_DIREITO = { x: 126, y: 150 };

export function Devzinho({
  tamanho = 120,
  expressao = 'determinado',
  item = 'notebook',
  nivel = 2,
  aura = true,
  flutuar = true,
  reacao = null,
  bloqueado = false,
  estilo
}: Props) {
  const reduzido = useMovimentoReduzido();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const altura = (tamanho * ALTURA) / LARGURA;
  const k = tamanho / LARGURA;

  const vivo = !reduzido && !bloqueado;
  const ocioso = vivo && flutuar;

  const piscando = usePiscadela(vivo && olhosAbertos(expressao));
  const olhar = useOlhar(ocioso && olhosAbertos(expressao));
  const ciclo = useLaco(ocioso, 2800);
  const aceno = useLaco(ocioso && item === 'varinha', 1900);
  const floreio = useFloreio(ocioso && item === 'varinha');
  const cursor = usePiscaCursor(ocioso && item === 'notebook');
  const { pulo, tremor } = useReacao(reacao, reduzido);

  const corAura = CORES_NIVEL[nivel];
  const expressaoVisivel: ExpressaoDevzinho | 'piscando' = piscando ? 'piscando' : expressao;

  // ── os movimentos, todos derivados de um ciclo de 0→1 em laço ──────────
  // "seno" aproximado por cinco pontos: 0 → 1 → 0 → -1 → 0.
  const seno = (amp: number, fase = 0) =>
    ciclo.interpolate({
      inputRange: [0, 0.25, 0.5, 0.75, 1],
      outputRange: deslocar([0, amp, 0, -amp, 0], fase)
    });

  const subida = ciclo.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -3.5, -6, -3.5, 0].map((v) => v * k)
  });
  const respiracao = ciclo.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 1.012, 1.025, 1.012, 1]
  });
  const sombraEscala = ciclo.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.82, 1]
  });
  const auraEscala = ciclo.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.94, 1.04, 0.94]
  });
  const inclinacao = seno(3.2, 1).interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] });
  const balancoCapa = seno(2.6, 2).interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] });
  const cabecaBob = ciclo.interpolate({
    inputRange: [0, 0.3, 0.55, 0.8, 1],
    outputRange: [0, -1.2, -2.2, -1.2, 0].map((v) => v * k)
  });

  const anguloBraco = Animated.add(
    aceno.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 7, 0, -5, 0] }),
    floreio.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [0, -22, 10, 0] })
  ).interpolate({ inputRange: [-90, 90], outputRange: ['-90deg', '90deg'] });

  const girar = (pivo: { x: number; y: number }, angulo: Animated.AnimatedInterpolation<string>) => {
    const dx = (pivo.x - LARGURA / 2) * k;
    const dy = (pivo.y - ALTURA / 2) * k;
    return [{ translateX: dx }, { translateY: dy }, { rotate: angulo }, { translateX: -dx }, { translateY: -dy }];
  };
  const esticarDe = (pivo: { x: number; y: number }, escala: Animated.AnimatedInterpolation<number>) => {
    const dy = (pivo.y - ALTURA / 2) * k;
    return [{ translateY: dy }, { scaleY: escala }, { translateY: -dy }];
  };

  const cores = bloqueado
    ? { capuz: [CINZA_1, CINZA_2, CINZA_3], capa: [CINZA_2, CINZA_4], manto: CINZA_4, ouro: CINZA_1, braco: CINZA_2, borda: CINZA_4 }
    : { capuz: [AZUL_CLARO, AZUL, AZUL_ESCURO], capa: [AZUL, AZUL_FUNDO], manto: MANTO, ouro: OURO, braco: AZUL, borda: BORDA_ROSTO };

  const quadro = { width: tamanho, height: altura };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        quadro,
        { opacity: bloqueado ? 0.32 : 1 },
        { transform: [{ translateX: tremor }] },
        estilo
      ]}
    >
      {/* aura (pulsa) */}
      {aura && !bloqueado && (
        <Camada quadro={quadro} estilo={{ transform: [{ scale: auraEscala }] }}>
          <Defs>
            <RadialGradient id={`aura${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={corAura} stopOpacity={0.55} />
              <Stop offset="0.6" stopColor={corAura} stopOpacity={0.18} />
              <Stop offset="1" stopColor={corAura} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={100} cy={118} rx={98} ry={100} fill={`url(#aura${id})`} />
        </Camada>
      )}

      {/* sombra no chão (encolhe quando ele sobe) */}
      <Camada quadro={quadro} estilo={{ transform: esticarDeX(PES, sombraEscala, k) }}>
        <Ellipse cx={100} cy={213} rx={50} ry={6} fill="#000000" opacity={0.28} />
      </Camada>

      {/* o boneco inteiro sobe e desce junto */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: Animated.add(subida, pulo) }] }]}>
        {/* capa, balançando atrás */}
        <Camada quadro={quadro} estilo={{ transform: girar(OMBROS, balancoCapa) }}>
          <Defs>
            <LinearGradient id={`capa${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={cores.capa[0]} />
              <Stop offset="1" stopColor={cores.capa[1]} />
            </LinearGradient>
          </Defs>
          <Path d="M74 140 Q40 162 28 208 Q56 198 84 204 Z" fill={`url(#capa${id})`} />
          <Path d="M126 140 Q158 162 170 206 Q142 198 118 204 Z" fill={`url(#capa${id})`} />
          {/* forro mais escuro aparecendo na barra */}
          <Path d="M28 208 Q56 198 84 204 Q58 206 40 212 Z" fill={bloqueado ? CINZA_4 : '#0A3A8C'} />
          <Path d="M170 206 Q142 198 118 204 Q144 206 160 212 Z" fill={bloqueado ? CINZA_4 : '#0A3A8C'} />
        </Camada>

        {/* corpo, respirando */}
        <Camada quadro={quadro} estilo={{ transform: esticarDe(PES, respiracao) }}>
          <Path d="M72 146 Q100 136 128 146 L140 198 Q100 208 60 198 Z" fill={cores.manto} />
          {/* dobra/sombra lateral do manto */}
          <Path d="M72 146 L60 198 Q70 201 80 202 L84 150 Z" fill={bloqueado ? CINZA_3 : MANTO_SOMBRA} />
          <Path d="M60 198 Q100 208 140 198" stroke={cores.ouro} strokeWidth={4} fill="none" />
          <Path d="M86 146 L100 166 L114 146" stroke={cores.ouro} strokeWidth={4} fill="none" strokeLinejoin="round" />
          <Path d="M100 166 L100 202" stroke={cores.ouro} strokeWidth={3} opacity={0.7} />
          {/* cinto com fivela </> */}
          <Path d="M67 176 Q100 184 133 176" stroke={bloqueado ? CINZA_1 : OURO_ESCURO} strokeWidth={4} fill="none" />
          <Rect x={92} y={174} width={16} height={11} rx={2.5} fill={cores.ouro} />
          {!bloqueado && (
            <Path d="M97 177 L95 179.5 L97 182 M103 177 L105 179.5 L103 182" stroke={MANTO} strokeWidth={1.4} fill="none" strokeLinecap="round" />
          )}
          {/* botas */}
          <Path d="M70 196 Q66 206 50 211 L82 211 Q86 204 84 196 Z" fill={cores.ouro} />
          <Path d="M116 196 Q114 204 118 211 L150 211 Q134 206 130 196 Z" fill={cores.ouro} />
          <Path d="M52 210 L82 210" stroke={bloqueado ? CINZA_2 : OURO_ESCURO} strokeWidth={2} />
          <Path d="M118 210 L148 210" stroke={bloqueado ? CINZA_2 : OURO_ESCURO} strokeWidth={2} />
          <Path d="M60 204 Q66 202 72 199" stroke={bloqueado ? CINZA_2 : OURO_CLARO} strokeWidth={1.6} fill="none" opacity={0.8} />
          {/* braço esquerdo (o que não acena) */}
          <BracoEsquerdo item={item} cor={cores.braco} manga={cores.ouro} />
        </Camada>

        {/* cabeça: inclina, acompanha a respiração; os olhos vivem aqui */}
        <Camada
          quadro={quadro}
          estilo={{ transform: [{ translateY: cabecaBob }, ...girar(PESCOCO, inclinacao)] }}
        >
          <Defs>
            <LinearGradient id={`capuz${id}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={cores.capuz[0]} />
              <Stop offset="0.45" stopColor={cores.capuz[1]} />
              <Stop offset="1" stopColor={cores.capuz[2]} />
            </LinearGradient>
          </Defs>
          <Path
            d="M42 144 C22 118 22 70 52 44 Q50 22 34 6 Q70 6 96 22 C142 20 176 52 172 98 C170 122 162 138 152 148 Q100 158 42 144 Z"
            fill={`url(#capuz${id})`}
          />
          {/* brilho e dobras do capuz */}
          <Path d="M48 104 Q46 66 70 42" stroke="#9FD0FF" strokeWidth={5} fill="none" strokeLinecap="round" opacity={bloqueado ? 0.2 : 0.55} />
          <Path d="M40 12 Q62 16 78 30" stroke="#9FD0FF" strokeWidth={3} fill="none" strokeLinecap="round" opacity={bloqueado ? 0.15 : 0.45} />
          <Path d="M158 70 Q166 92 160 120" stroke={bloqueado ? CINZA_3 : AZUL_FUNDO} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.6} />
          <Ellipse cx={104} cy={100} rx={49} ry={44} fill={cores.borda} />
          <Ellipse cx={105} cy={102} rx={44} ry={39} fill={ROSTO} />
          {/* um reflexo sutil no topo do rosto */}
          <Path d="M78 74 Q104 62 132 74" stroke="#1A2A5C" strokeWidth={4} fill="none" strokeLinecap="round" />

          {!bloqueado && <Bochechas expressao={expressao} />}
          {!bloqueado && <Olhos expressao={expressaoVisivel} olhar={olhar} />}
          {!bloqueado && <Boca expressao={expressao} />}
          {bloqueado && (
            <Path d="M96 92 Q96 82 105 82 Q114 82 114 92 Q114 98 106 101 L106 108" stroke={CINZA_1} strokeWidth={6} fill="none" strokeLinecap="round" />
          )}

          {nivel === 4 && !bloqueado && <Oculos />}
          {nivel >= 5 && <Coroa cinza={bloqueado} />}
        </Camada>

        {/* braço direito + o que ele segura (acena) */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            item === 'varinha' ? { transform: girar(OMBRO_DIREITO, anguloBraco) } : null
          ]}
        >
          <Svg width={tamanho} height={altura} viewBox={`0 0 ${LARGURA} ${ALTURA}`}>
            <BracoDireito item={item} cor={cores.braco} manga={cores.ouro} cursor={cursor} bloqueado={bloqueado} />
          </Svg>

          {item === 'varinha' && (
            <Estrela
              k={k}
              ativa={ocioso}
              floreio={floreio}
              cinza={bloqueado}
            />
          )}
        </Animated.View>
      </Animated.View>

      {/* pixels da marca subindo em volta */}
      {ocioso && tamanho >= 72 && <Pixels k={k} cor={corAura} />}

      {/* balõezinhos de humor */}
      {!bloqueado && expressao === 'pensando' && (
        <Simbolo texto="?" cor={CIANO} tamanho={tamanho} x={150} y={6} reduzido={reduzido} />
      )}
      {!bloqueado && expressao === 'bravo' && (
        <Simbolo texto="✱" cor="#FF4D6D" tamanho={tamanho} x={150} y={20} reduzido={reduzido} />
      )}
      {!bloqueado && (expressao === 'animado' || expressao === 'feliz') && item !== 'varinha' && (
        <Simbolo texto="✦" cor={OURO} tamanho={tamanho} x={156} y={18} reduzido={reduzido} />
      )}
    </Animated.View>
  );
}

/**
 * O Devzinho como AVATAR: só a cabeça, num quadrado arredondado com o
 * degradê da cor do nível — o mesmo desenho do ícone do app. Fica bonito
 * pequeno (32–64 dp), onde o boneco de corpo inteiro vira um borrão.
 */
export function DevzinhoAvatar({
  tamanho = 48,
  nivel = 2,
  expressao = 'determinado'
}: {
  tamanho?: number;
  nivel?: NivelDevzinho;
  expressao?: ExpressaoDevzinho;
}) {
  const reduzido = useMovimentoReduzido();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const piscando = usePiscadela(!reduzido && olhosAbertos(expressao));
  const cor = CORES_NIVEL[nivel];

  return (
    <View style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.28, overflow: 'hidden' }}>
      <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={`fundo${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={cor} />
            <Stop offset="1" stopColor="#0B1630" />
          </LinearGradient>
          <LinearGradient id={`capuz${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={AZUL_CLARO} />
            <Stop offset="0.45" stopColor={AZUL} />
            <Stop offset="1" stopColor={AZUL_ESCURO} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill={`url(#fundo${id})`} />
        {/* a cabeça do quadro 200×220, recortada e centralizada */}
        <G transform="translate(-11 8) scale(0.62)">
          <Path
            d="M42 144 C22 118 22 70 52 44 Q50 22 34 6 Q70 6 96 22 C142 20 176 52 172 98 C170 122 162 138 152 148 Q100 158 42 144 Z"
            fill={`url(#capuz${id})`}
          />
          <Path d="M48 104 Q46 66 70 42" stroke="#9FD0FF" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.55} />
          <Ellipse cx={104} cy={100} rx={49} ry={44} fill={BORDA_ROSTO} />
          <Ellipse cx={105} cy={102} rx={44} ry={39} fill={ROSTO} />
          <Bochechas expressao={expressao} />
          <Olhos expressao={piscando ? 'piscando' : expressao} olhar={0} />
          <Boca expressao={expressao} />
          {nivel === 4 && <Oculos />}
          {nivel >= 5 && <Coroa cinza={false} />}
        </G>
        {/* pixels da marca no canto */}
        <Rect x={80} y={10} width={6} height={6} fill={CIANO} opacity={0.9} />
        <Rect x={88} y={4} width={4} height={4} fill={BRANCO} opacity={0.7} />
      </Svg>
    </View>
  );
}

/* ─────────────────────────────── partes ─────────────────────────────── */

/** Um SVG do tamanho do boneco, por cima dos outros, que pode se mexer sozinho. */
function Camada({
  quadro,
  estilo,
  children
}: {
  quadro: { width: number; height: number };
  estilo?: object;
  children: ReactNode;
}) {
  return (
    <Animated.View style={[StyleSheet.absoluteFill, estilo]}>
      <Svg width={quadro.width} height={quadro.height} viewBox={`0 0 ${LARGURA} ${ALTURA}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

function deslocar(valores: number[], fase: number) {
  // Gira a "onda" para começar em outro ponto — capa e cabeça ficam fora de
  // sincronia com o corpo, o que dá a sensação de peso.
  const miolo = valores.slice(0, 4);
  const girado = miolo.slice(fase % 4).concat(miolo.slice(0, fase % 4));
  return [...girado, girado[0]!];
}

function esticarDeX(
  pivo: { x: number; y: number },
  escala: Animated.AnimatedInterpolation<number>,
  k: number
) {
  const dy = (pivo.y - ALTURA / 2) * k;
  return [{ translateY: dy }, { scaleX: escala }, { translateY: -dy }];
}

function olhosAbertos(expressao: ExpressaoDevzinho) {
  return expressao !== 'feliz' && expressao !== 'animado';
}

function Bochechas({ expressao }: { expressao: ExpressaoDevzinho }) {
  if (expressao !== 'feliz' && expressao !== 'animado') return null;
  return (
    <G opacity={0.55}>
      <Ellipse cx={76} cy={114} rx={7} ry={4} fill="#3D7BFF" />
      <Ellipse cx={134} cy={114} rx={7} ry={4} fill="#3D7BFF" />
    </G>
  );
}

/** Pupila com brilhinho — `olhar` desloca as pupilas (-1 esquerda, 1 direita). */
function Pupila({ cx, cy, r, olhar }: { cx: number; cy: number; r: number; olhar: number }) {
  const x = cx + olhar * 3;
  return (
    <G>
      <Circle cx={x} cy={cy} r={r} fill={ROSTO} />
      <Circle cx={x + r * 0.35} cy={cy - r * 0.4} r={r * 0.35} fill={BRANCO} />
    </G>
  );
}

function Olhos({ expressao, olhar }: { expressao: ExpressaoDevzinho | 'piscando'; olhar: number }) {
  switch (expressao) {
    case 'feliz':
      return (
        <G>
          <Path d="M75 101 Q86 86 97 101" stroke={BRANCO} strokeWidth={7} fill="none" strokeLinecap="round" />
          <Path d="M111 101 Q122 86 133 101" stroke={BRANCO} strokeWidth={7} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'animado':
      return (
        <G>
          <Path d="M78 88 L95 98 L78 108" stroke={BRANCO} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M130 88 L113 98 L130 108" stroke={BRANCO} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </G>
      );
    case 'surpreso':
      return (
        <G>
          <Ellipse cx={86} cy={97} rx={11} ry={14} fill={BRANCO} />
          <Ellipse cx={122} cy={97} rx={11} ry={14} fill={BRANCO} />
          <Pupila cx={87} cy={99} r={5} olhar={olhar} />
          <Pupila cx={121} cy={99} r={5} olhar={olhar} />
        </G>
      );
    case 'triste':
      return (
        <G>
          <Path d="M74 93 Q86 99 98 92 Q99 106 87 109 Q75 108 74 93 Z" fill={BRANCO} />
          <Path d="M134 93 Q122 99 110 92 Q109 106 121 109 Q133 108 134 93 Z" fill={BRANCO} />
          <Pupila cx={88} cy={102} r={4} olhar={olhar} />
          <Pupila cx={120} cy={102} r={4} olhar={olhar} />
          <Path d="M78 110 Q74 118 78 122 Q83 118 78 110 Z" fill={CIANO} />
        </G>
      );
    case 'pensando':
      return (
        <G>
          <Path d="M74 92 Q86 84 98 92 Q99 106 87 109 Q75 108 74 92 Z" fill={BRANCO} />
          <Pupila cx={91} cy={95} r={4} olhar={olhar} />
          <Path d="M112 98 Q122 94 132 98" stroke={BRANCO} strokeWidth={6} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'bravo':
      return (
        <G>
          <Path d="M72 84 L99 96 Q100 108 89 110 Q75 110 72 98 Z" fill={BRANCO} />
          <Path d="M136 84 L109 96 Q108 108 119 110 Q133 110 136 98 Z" fill={BRANCO} />
          <Pupila cx={91} cy={102} r={4} olhar={olhar} />
          <Pupila cx={117} cy={102} r={4} olhar={olhar} />
        </G>
      );
    case 'piscando':
      return (
        <G>
          <Path d="M76 101 Q86 105 97 101" stroke={BRANCO} strokeWidth={6} fill="none" strokeLinecap="round" />
          <Path d="M111 101 Q122 105 132 101" stroke={BRANCO} strokeWidth={6} fill="none" strokeLinecap="round" />
        </G>
      );
    default:
      return (
        <G>
          <Path d="M73 87 L98 95 Q100 107 89 110 Q75 111 73 99 Z" fill={BRANCO} />
          <Path d="M135 87 L110 95 Q108 107 119 110 Q133 111 135 99 Z" fill={BRANCO} />
          <Pupila cx={90} cy={102} r={4.4} olhar={olhar} />
          <Pupila cx={117} cy={102} r={4.4} olhar={olhar} />
        </G>
      );
  }
}

function Boca({ expressao }: { expressao: ExpressaoDevzinho }) {
  switch (expressao) {
    case 'feliz':
    case 'animado':
      return (
        <G>
          <Path d="M93 115 Q104 131 115 115 Z" fill={BRANCO} />
          <Path d="M98 122 Q104 127 110 122 Q104 125 98 122 Z" fill="#FF7A9A" />
        </G>
      );
    case 'surpreso':
      return <Ellipse cx={104} cy={122} rx={5} ry={6} fill="none" stroke={BRANCO} strokeWidth={3} />;
    case 'triste':
    case 'bravo':
      return <Path d="M96 124 Q104 117 112 124" stroke={BRANCO} strokeWidth={3} fill="none" strokeLinecap="round" />;
    case 'pensando':
      return <Path d="M98 121 L111 118" stroke={BRANCO} strokeWidth={3} fill="none" strokeLinecap="round" />;
    default:
      return <Path d="M96 117 Q104 124 112 117" stroke={BRANCO} strokeWidth={3} fill="none" strokeLinecap="round" />;
  }
}

function BracoEsquerdo({ item, cor, manga }: { item: ItemDevzinho; cor: string; manga: string }) {
  if (item === 'notebook') {
    return (
      <G>
        <Path d="M76 150 Q62 162 70 176" stroke={cor} strokeWidth={13} fill="none" strokeLinecap="round" />
        <Path d="M64 168 L76 172" stroke={manga} strokeWidth={3} strokeLinecap="round" />
      </G>
    );
  }
  if (item === 'varinha') {
    return (
      <G>
        <Path d="M78 150 Q66 166 76 180" stroke={cor} strokeWidth={13} fill="none" strokeLinecap="round" />
        <Path d="M69 172 L81 175" stroke={manga} strokeWidth={3} strokeLinecap="round" />
        <Circle cx={77} cy={180} r={8} fill={cor} />
      </G>
    );
  }
  return (
    <G>
      <Path d="M76 150 Q64 166 72 182" stroke={cor} strokeWidth={13} fill="none" strokeLinecap="round" />
      <Path d="M65 174 L77 177" stroke={manga} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={72} cy={182} r={8} fill={cor} />
    </G>
  );
}

function BracoDireito({
  item,
  cor,
  manga,
  cursor,
  bloqueado
}: {
  item: ItemDevzinho;
  cor: string;
  manga: string;
  cursor: boolean;
  bloqueado: boolean;
}) {
  if (item === 'notebook') {
    return (
      <G>
        <Path d="M124 150 Q138 162 130 176" stroke={cor} strokeWidth={13} fill="none" strokeLinecap="round" />
        <Path d="M124 172 L136 168" stroke={manga} strokeWidth={3} strokeLinecap="round" />
        <G transform="rotate(-6, 100, 172)">
          <Rect x={70} y={152} width={60} height={40} rx={6} fill="#0A1A3E" stroke={bloqueado ? CINZA_1 : AZUL_CLARO} strokeWidth={3} />
          {!bloqueado && (
            <G>
              <Path d="M88 164 L81 172 L88 180" stroke={CIANO} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M101 162 L94 182" stroke={CIANO} strokeWidth={3} strokeLinecap="round" />
              <Path d="M107 164 L114 172 L107 180" stroke={CIANO} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {cursor && <Rect x={118} y={176} width={6} height={3} fill={BRANCO} />}
            </G>
          )}
        </G>
        <Circle cx={70} cy={176} r={8} fill={cor} />
        <Circle cx={130} cy={176} r={8} fill={cor} />
      </G>
    );
  }

  if (item === 'varinha') {
    return (
      <G>
        <Path d="M124 150 Q144 140 152 120" stroke={cor} strokeWidth={13} fill="none" strokeLinecap="round" />
        <Path d="M140 140 L148 130" stroke={manga} strokeWidth={3} strokeLinecap="round" />
        <Path d="M154 120 L166 84" stroke={bloqueado ? CINZA_1 : OURO_ESCURO} strokeWidth={4} strokeLinecap="round" />
        <Path d="M155 116 L164 89" stroke={bloqueado ? CINZA_2 : OURO_CLARO} strokeWidth={1.2} strokeLinecap="round" opacity={0.8} />
        <Circle cx={153} cy={119} r={9} fill={cor} />
      </G>
    );
  }

  return (
    <G>
      <Path d="M124 150 Q136 166 128 182" stroke={cor} strokeWidth={13} fill="none" strokeLinecap="round" />
      <Path d="M123 177 L135 174" stroke={manga} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={128} cy={182} r={8} fill={cor} />
    </G>
  );
}

function Oculos() {
  return (
    <G>
      <Path d="M70 90 H101 V97 Q101 111 86 111 Q70 111 70 97 Z" fill="#141B3A" stroke={CIANO} strokeWidth={2.5} />
      <Path d="M107 90 H138 V97 Q138 111 122 111 Q107 111 107 97 Z" fill="#141B3A" stroke={CIANO} strokeWidth={2.5} />
      <Path d="M101 93 H107" stroke={CIANO} strokeWidth={3} />
      <Path d="M76 95 L84 95" stroke={BRANCO} strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
      <Path d="M113 95 L121 95" stroke={BRANCO} strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
    </G>
  );
}

function Coroa({ cinza }: { cinza: boolean }) {
  return (
    <G>
      <Path
        d="M78 34 L84 10 L96 26 L106 4 L116 26 L128 10 L132 34 Q105 42 78 34 Z"
        fill={cinza ? CINZA_1 : OURO}
        stroke={cinza ? CINZA_1 : OURO_CLARO}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={106} cy={26} r={3.5} fill={cinza ? CINZA_2 : '#FF4D6D'} />
      <Circle cx={88} cy={30} r={2} fill={cinza ? CINZA_2 : CIANO} />
      <Circle cx={124} cy={30} r={2} fill={cinza ? CINZA_2 : CIANO} />
    </G>
  );
}

/** A estrela na ponta da varinha: gira, pulsa e, no floreio, solta brilho. */
function Estrela({
  k,
  ativa,
  floreio,
  cinza
}: {
  k: number;
  ativa: boolean;
  floreio: Animated.Value;
  cinza: boolean;
}) {
  const pulso = useLaco(ativa, 1400);
  const lado = 38 * k;

  const escala = Animated.add(
    pulso.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 1.12, 0.9] }),
    floreio.interpolate({ inputRange: [0, 0.4, 0.7, 1], outputRange: [0, 0.35, 0.1, 0] })
  );
  const giro = Animated.add(
    pulso.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-12, 12, -12] }),
    floreio.interpolate({ inputRange: [0, 1], outputRange: [0, 360] })
  ).interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });
  const brilho = floreio.interpolate({ inputRange: [0, 0.35, 0.8, 1], outputRange: [0, 1, 0.3, 0] });
  const raioBrilho = floreio.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.9] });

  return (
    <View style={[estilos.estrela, { left: 149 * k, top: 56 * k, width: lado, height: lado }]}>
      {/* o "estouro" de brilho atrás da estrela */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: brilho, transform: [{ scale: raioBrilho }] }
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 38 38">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <Path
              key={a}
              d="M19 1 L19 7"
              stroke={OURO_CLARO}
              strokeWidth={2.4}
              strokeLinecap="round"
              transform={`rotate(${a}, 19, 19)`}
            />
          ))}
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: escala }, { rotate: giro }] }]}>
        <Svg width="100%" height="100%" viewBox="0 0 38 38">
          <Path
            d="M19 2 L24 14 L37 15 L27 23 L31 36 L19 29 L7 36 L11 23 L1 15 L14 14 Z"
            fill={cinza ? CINZA_1 : OURO}
            stroke={cinza ? CINZA_1 : OURO_CLARO}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {!cinza && <Path d="M14 15 L19 6 L21 13 Z" fill={BRANCO} opacity={0.55} />}
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Quadradinhos da marca que sobem e somem em volta dele, em tempos diferentes. */
function Pixels({ k, cor }: { k: number; cor: string }) {
  const lista = [
    { x: 22, y: 120, lado: 7, atraso: 0, dur: 2600, c: AZUL },
    { x: 172, y: 140, lado: 6, atraso: 900, dur: 2900, c: CIANO },
    { x: 34, y: 60, lado: 5, atraso: 1600, dur: 2400, c: cor },
    { x: 182, y: 70, lado: 8, atraso: 400, dur: 3100, c: AZUL }
  ];
  return (
    <>
      {lista.map((p, i) => (
        <Pixel key={i} {...p} k={k} />
      ))}
    </>
  );
}

function Pixel({
  x,
  y,
  lado,
  atraso,
  dur,
  c,
  k
}: {
  x: number;
  y: number;
  lado: number;
  atraso: number;
  dur: number;
  c: string;
  k: number;
}) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const laco = Animated.loop(
      Animated.sequence([
        Animated.delay(atraso),
        Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    );
    laco.start();
    return () => laco.stop();
  }, [atraso, dur, v]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x * k,
        top: y * k,
        width: Math.max(3, lado * k),
        height: Math.max(3, lado * k),
        backgroundColor: c,
        opacity: v.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 0.9, 0.6, 0] }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -34 * k] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) }
        ]
      }}
    />
  );
}

/** Um "?" / "✦" que boia perto da cabeça. */
function Simbolo({
  texto,
  cor,
  tamanho,
  x,
  y,
  reduzido
}: {
  texto: string;
  cor: string;
  tamanho: number;
  x: number;
  y: number;
  reduzido: boolean;
}) {
  const valor = useLaco(!reduzido, 1800);
  const escala = tamanho / LARGURA;

  return (
    <Animated.Text
      style={[
        estilos.simbolo,
        {
          left: x * escala,
          top: y * escala,
          color: cor,
          fontSize: Math.max(12, 34 * escala),
          lineHeight: Math.max(14, 38 * escala),
          transform: [
            { translateY: valor.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -6 * escala, 0] }) },
            { rotate: valor.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-8deg', '8deg', '-8deg'] }) }
          ]
        }
      ]}
    >
      {texto}
    </Animated.Text>
  );
}

/* ───────────────────────────── movimento ───────────────────────────── */

/** Um valor que vai de 0 a 1 em laço, linear. Parado em 0 quando inativo. */
function useLaco(ativo: boolean, duracao: number) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ativo) {
      valor.setValue(0);
      return;
    }
    const laco = Animated.loop(
      Animated.timing(valor, { toValue: 1, duration: duracao, easing: Easing.linear, useNativeDriver: true })
    );
    laco.start();
    return () => laco.stop();
  }, [ativo, duracao, valor]);

  return valor;
}

/** Pisca a cada 3–5 s, por 130 ms (às vezes duas vezes seguidas). */
function usePiscadela(ativo: boolean) {
  const [piscando, setPiscando] = useState(false);

  useEffect(() => {
    if (!ativo) {
      setPiscando(false);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const piscar = (depois: () => void) => {
      setPiscando(true);
      timers.push(
        setTimeout(() => {
          setPiscando(false);
          depois();
        }, 130)
      );
    };
    const agendar = () => {
      timers.push(
        setTimeout(() => {
          const dupla = Math.random() < 0.25;
          piscar(() => {
            if (dupla) timers.push(setTimeout(() => piscar(agendar), 160));
            else agendar();
          });
        }, 2800 + Math.random() * 2400)
      );
    };

    agendar();
    return () => timers.forEach(clearTimeout);
  }, [ativo]);

  return piscando;
}

/** De vez em quando os olhos dão uma olhadinha para um lado e voltam. */
function useOlhar(ativo: boolean) {
  const [olhar, setOlhar] = useState(0);

  useEffect(() => {
    if (!ativo) {
      setOlhar(0);
      return;
    }
    let voltar: ReturnType<typeof setTimeout>;
    const intervalo = setInterval(() => {
      setOlhar(Math.random() < 0.5 ? -1 : 1);
      voltar = setTimeout(() => setOlhar(0), 900);
    }, 4200);
    return () => {
      clearInterval(intervalo);
      clearTimeout(voltar);
    };
  }, [ativo]);

  return olhar;
}

/** A cada ~6 s ele dá um floreio com a varinha (0→1 rápido, depois para). */
function useFloreio(ativo: boolean) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ativo) {
      valor.setValue(0);
      return;
    }
    const laco = Animated.loop(
      Animated.sequence([
        Animated.delay(5200),
        Animated.timing(valor, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(valor, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    );
    laco.start();
    return () => laco.stop();
  }, [ativo, valor]);

  return valor;
}

/** O cursor da tela do notebook pisca como num editor. */
function usePiscaCursor(ativo: boolean) {
  const [aceso, setAceso] = useState(true);

  useEffect(() => {
    if (!ativo) {
      setAceso(true);
      return;
    }
    const t = setInterval(() => setAceso((a) => !a), 530);
    return () => clearInterval(t);
  }, [ativo]);

  return aceso;
}

/** Pulo (acerto) ou tremor (erro), uma vez a cada `chave` nova. */
function useReacao(reacao: Props['reacao'], reduzido: boolean) {
  const pulo = useRef(new Animated.Value(0)).current;
  const tremor = useRef(new Animated.Value(0)).current;
  const tipo = reacao?.tipo;
  const chave = reacao?.chave;

  useEffect(() => {
    if (!tipo || reduzido) return;

    if (tipo === 'pulo') {
      pulo.setValue(0);
      Animated.sequence([
        Animated.timing(pulo, { toValue: -22, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulo, { toValue: 0, duration: 220, easing: Easing.bounce, useNativeDriver: true }),
        Animated.timing(pulo, { toValue: -10, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulo, { toValue: 0, duration: 160, easing: Easing.bounce, useNativeDriver: true })
      ]).start();
    } else {
      tremor.setValue(0);
      Animated.sequence(
        [-8, 7, -5, 4, -2, 0].map((x) =>
          Animated.timing(tremor, { toValue: x, duration: 60, useNativeDriver: true })
        )
      ).start();
    }
  }, [tipo, chave, reduzido, pulo, tremor]);

  return { pulo, tremor };
}

const estilos = StyleSheet.create({
  estrela: { position: 'absolute' },
  simbolo: { position: 'absolute', fontFamily: fontes.forte }
});
