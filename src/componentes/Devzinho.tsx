import { useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, type ViewStyle } from 'react-native';
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
 *      carrega. Um PNG por expressão pesaria e destoaria.
 *   2. **Evolução.** O nível do Devzinho acompanha o rank da pessoa: a aura
 *      muda de cor e ele ganha óculos (Full Stack) e coroa (Dev Master/Lenda).
 *   3. **Animação.** Ele flutua, pisca sozinho, pula no acerto e treme no erro.
 *      Com "reduzir movimento" ligado no sistema, fica parado — só a
 *      expressão muda.
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
  /** Flutua devagar, em laço. Desligue em listas longas. */
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
const BORDA_ROSTO = '#0E3E9E';
const ROSTO = '#0A1433';
const MANTO = '#142A66';
const OURO = '#FFC107';
const OURO_ESCURO = '#E09A00';
const CIANO = '#4DD0FF';
const BRANCO = '#FFFFFF';

const LARGURA = 200;
const ALTURA = 220;

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

  const piscando = usePiscadela(!reduzido && !bloqueado && olhosAbertos(expressao));
  const flutuacao = useFlutuacao(flutuar && !reduzido && !bloqueado);
  const { pulo, tremor } = useReacao(reacao, reduzido);
  const brilho = useBrilhoEstrela(item === 'varinha' && !reduzido && !bloqueado);

  const corAura = CORES_NIVEL[nivel];
  const expressaoVisivel: ExpressaoDevzinho | 'piscando' = piscando ? 'piscando' : expressao;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { width: tamanho, height: altura, opacity: bloqueado ? 0.32 : 1 },
        { transform: [{ translateY: Animated.add(flutuacao, pulo) }, { translateX: tremor }] },
        estilo
      ]}
    >
      <Svg width={tamanho} height={altura} viewBox={`0 0 ${LARGURA} ${ALTURA}`}>
        <Defs>
          <RadialGradient id={`aura${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={corAura} stopOpacity={0.55} />
            <Stop offset="1" stopColor={corAura} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`capuz${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={bloqueado ? '#5A6886' : AZUL_CLARO} />
            <Stop offset="0.45" stopColor={bloqueado ? '#46557A' : AZUL} />
            <Stop offset="1" stopColor={bloqueado ? '#36446A' : AZUL_ESCURO} />
          </LinearGradient>
          <LinearGradient id={`capa${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={bloqueado ? '#46557A' : AZUL} />
            <Stop offset="1" stopColor={bloqueado ? '#2C3A5E' : '#0E4FB8'} />
          </LinearGradient>
        </Defs>

        {aura && !bloqueado && <Ellipse cx={100} cy={118} rx={98} ry={100} fill={`url(#aura${id})`} />}

        {/* sombra no chão */}
        <Ellipse cx={100} cy={212} rx={52} ry={6} fill="#000000" opacity={0.25} />

        {/* capa, atrás de tudo */}
        <Path d="M74 140 Q42 160 30 206 Q56 198 84 204 Z" fill={`url(#capa${id})`} />
        <Path d="M126 140 Q156 162 168 204 Q142 198 118 204 Z" fill={`url(#capa${id})`} />

        {/* manto com acabamento dourado */}
        <Path d="M72 146 Q100 136 128 146 L140 198 Q100 208 60 198 Z" fill={MANTO} />
        <Path d="M60 198 Q100 208 140 198" stroke={OURO} strokeWidth={4} fill="none" />
        <Path d="M86 146 L100 166 L114 146" stroke={OURO} strokeWidth={4} fill="none" strokeLinejoin="round" />
        <Path d="M100 166 L100 202" stroke={OURO} strokeWidth={3} opacity={0.7} />

        {/* botas */}
        <Path d="M70 196 Q66 206 50 211 L82 211 Q86 204 84 196 Z" fill={OURO} />
        <Path d="M116 196 Q114 204 118 211 L150 211 Q134 206 130 196 Z" fill={OURO} />
        <Path d="M52 210 L82 210" stroke={OURO_ESCURO} strokeWidth={2} />
        <Path d="M118 210 L148 210" stroke={OURO_ESCURO} strokeWidth={2} />

        {/* o capuz e o rosto */}
        <Path
          d="M42 144 C22 118 22 70 52 44 Q50 22 34 6 Q70 6 96 22 C142 20 176 52 172 98 C170 122 162 138 152 148 Q100 158 42 144 Z"
          fill={`url(#capuz${id})`}
        />
        <Path d="M48 104 Q46 66 70 42" stroke="#9FD0FF" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.55} />
        <Ellipse cx={104} cy={100} rx={49} ry={44} fill={bloqueado ? '#2C3A5E' : BORDA_ROSTO} />
        <Ellipse cx={105} cy={102} rx={44} ry={39} fill={ROSTO} />

        {!bloqueado && <Olhos expressao={expressaoVisivel} />}
        {!bloqueado && <Boca expressao={expressao} />}
        {bloqueado && (
          <Path d="M96 92 Q96 82 105 82 Q114 82 114 92 Q114 98 106 101 L106 108" stroke="#5A6886" strokeWidth={6} fill="none" strokeLinecap="round" />
        )}

        {/* braços e o que ele segura — na frente do capuz */}
        <Bracos item={item} />

        {/* acessórios da evolução */}
        {nivel === 4 && !bloqueado && <Oculos />}
        {nivel >= 5 && <Coroa />}
      </Svg>

      {/* a estrela da varinha fica fora do SVG para poder girar e pulsar */}
      {item === 'varinha' && (
        <Animated.View
          style={[
            estilos.estrela,
            {
              left: (150 / LARGURA) * tamanho,
              top: (56 / ALTURA) * altura,
              width: (38 / LARGURA) * tamanho,
              height: (38 / LARGURA) * tamanho
            },
            brilho
          ]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 38 38">
            <Path
              d="M19 2 L24 14 L37 15 L27 23 L31 36 L19 29 L7 36 L11 23 L1 15 L14 14 Z"
              fill={bloqueado ? '#5A6886' : OURO}
              stroke={bloqueado ? '#5A6886' : '#FFE082'}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      )}

      {/* balõezinhos de humor */}
      {!bloqueado && expressao === 'pensando' && (
        <Simbolo texto="?" cor={CIANO} tamanho={tamanho} x={150} y={6} reduzido={reduzido} />
      )}
      {!bloqueado && expressao === 'bravo' && (
        <Simbolo texto="✱" cor="#FF4D6D" tamanho={tamanho} x={150} y={20} reduzido={reduzido} />
      )}
      {!bloqueado && (expressao === 'animado' || expressao === 'feliz') && (
        <Simbolo texto="✦" cor={OURO} tamanho={tamanho} x={156} y={18} reduzido={reduzido} />
      )}
    </Animated.View>
  );
}

/* ─────────────────────────────── partes ─────────────────────────────── */

function olhosAbertos(expressao: ExpressaoDevzinho) {
  return expressao !== 'feliz' && expressao !== 'animado';
}

function Olhos({ expressao }: { expressao: ExpressaoDevzinho | 'piscando' }) {
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
          <Circle cx={87} cy={99} r={5} fill={ROSTO} />
          <Circle cx={121} cy={99} r={5} fill={ROSTO} />
        </G>
      );
    case 'triste':
      return (
        <G>
          <Path d="M74 93 Q86 99 98 92 Q99 106 87 109 Q75 108 74 93 Z" fill={BRANCO} />
          <Path d="M134 93 Q122 99 110 92 Q109 106 121 109 Q133 108 134 93 Z" fill={BRANCO} />
          <Circle cx={88} cy={102} r={4} fill={ROSTO} />
          <Circle cx={120} cy={102} r={4} fill={ROSTO} />
          <Path d="M78 110 Q74 118 78 122 Q83 118 78 110 Z" fill={CIANO} />
        </G>
      );
    case 'pensando':
      return (
        <G>
          <Path d="M74 92 Q86 84 98 92 Q99 106 87 109 Q75 108 74 92 Z" fill={BRANCO} />
          <Circle cx={91} cy={95} r={4} fill={ROSTO} />
          <Path d="M112 98 Q122 94 132 98" stroke={BRANCO} strokeWidth={6} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'bravo':
      return (
        <G>
          <Path d="M72 84 L99 96 Q100 108 89 110 Q75 110 72 98 Z" fill={BRANCO} />
          <Path d="M136 84 L109 96 Q108 108 119 110 Q133 110 136 98 Z" fill={BRANCO} />
          <Circle cx={91} cy={102} r={4} fill={ROSTO} />
          <Circle cx={117} cy={102} r={4} fill={ROSTO} />
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
          <Circle cx={91} cy={102} r={4.2} fill={ROSTO} />
          <Circle cx={117} cy={102} r={4.2} fill={ROSTO} />
        </G>
      );
  }
}

function Boca({ expressao }: { expressao: ExpressaoDevzinho }) {
  switch (expressao) {
    case 'feliz':
    case 'animado':
      return <Path d="M93 115 Q104 131 115 115 Z" fill={BRANCO} />;
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

function Bracos({ item }: { item: ItemDevzinho }) {
  if (item === 'notebook') {
    return (
      <G>
        <Path d="M76 150 Q62 162 70 176" stroke={AZUL} strokeWidth={13} fill="none" strokeLinecap="round" />
        <Path d="M124 150 Q138 162 130 176" stroke={AZUL} strokeWidth={13} fill="none" strokeLinecap="round" />
        <G transform="rotate(-6, 100, 172)">
          <Rect x={70} y={152} width={60} height={40} rx={6} fill="#0A1A3E" stroke={AZUL_CLARO} strokeWidth={3} />
          <Path d="M90 164 L83 172 L90 180" stroke={CIANO} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M104 162 L96 182" stroke={CIANO} strokeWidth={3} strokeLinecap="round" />
          <Path d="M110 164 L117 172 L110 180" stroke={CIANO} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </G>
        <Circle cx={70} cy={176} r={8} fill={AZUL} />
        <Circle cx={130} cy={176} r={8} fill={AZUL} />
      </G>
    );
  }

  if (item === 'varinha') {
    return (
      <G>
        <Path d="M78 150 Q66 166 76 180" stroke={AZUL} strokeWidth={13} fill="none" strokeLinecap="round" />
        <Circle cx={77} cy={180} r={8} fill={AZUL} />
        <Path d="M124 150 Q144 140 152 120" stroke={AZUL} strokeWidth={13} fill="none" strokeLinecap="round" />
        <Path d="M154 120 L166 84" stroke={OURO_ESCURO} strokeWidth={4} strokeLinecap="round" />
        <Circle cx={153} cy={119} r={9} fill={AZUL} />
      </G>
    );
  }

  return (
    <G>
      <Path d="M76 150 Q64 166 72 182" stroke={AZUL} strokeWidth={13} fill="none" strokeLinecap="round" />
      <Path d="M124 150 Q136 166 128 182" stroke={AZUL} strokeWidth={13} fill="none" strokeLinecap="round" />
      <Circle cx={72} cy={182} r={8} fill={AZUL} />
      <Circle cx={128} cy={182} r={8} fill={AZUL} />
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

function Coroa() {
  return (
    <G>
      <Path
        d="M78 34 L84 10 L96 26 L106 4 L116 26 L128 10 L132 34 Q105 42 78 34 Z"
        fill={OURO}
        stroke="#FFE082"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={106} cy={26} r={3.5} fill="#FF4D6D" />
    </G>
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
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzido) return;
    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(valor, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    );
    laco.start();
    return () => laco.stop();
  }, [reduzido, valor]);

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
            { translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [0, -6 * escala] }) },
            { rotate: valor.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] }) }
          ]
        }
      ]}
    >
      {texto}
    </Animated.Text>
  );
}

/* ───────────────────────────── movimento ───────────────────────────── */

/** Pisca a cada 3–5 s, por 130 ms. */
function usePiscadela(ativo: boolean) {
  const [piscando, setPiscando] = useState(false);

  useEffect(() => {
    if (!ativo) {
      setPiscando(false);
      return;
    }

    let fechar: ReturnType<typeof setTimeout>;
    let proxima: ReturnType<typeof setTimeout>;

    const agendar = () => {
      proxima = setTimeout(() => {
        setPiscando(true);
        fechar = setTimeout(() => {
          setPiscando(false);
          agendar();
        }, 130);
      }, 3000 + Math.random() * 2000);
    };

    agendar();

    return () => {
      clearTimeout(fechar);
      clearTimeout(proxima);
    };
  }, [ativo]);

  return piscando;
}

/** Sobe e desce 5 dp, devagar, para sempre. */
function useFlutuacao(ativo: boolean) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ativo) {
      valor.setValue(0);
      return;
    }

    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: -5, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(valor, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    );
    laco.start();
    return () => laco.stop();
  }, [ativo, valor]);

  return valor;
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

/** A estrela da varinha gira um pouco e pulsa. */
function useBrilhoEstrela(ativo: boolean) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ativo) {
      valor.setValue(0);
      return;
    }

    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(valor, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    );
    laco.start();
    return () => laco.stop();
  }, [ativo, valor]);

  return {
    transform: [
      { scale: valor.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) },
      { rotate: valor.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] }) }
    ]
  };
}

const estilos = StyleSheet.create({
  estrela: { position: 'absolute' },
  simbolo: { position: 'absolute', fontFamily: fontes.forte }
});
