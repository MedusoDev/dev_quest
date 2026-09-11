import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { animacao, curva } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { suavizar, useMovimentoReduzido } from './movimento';

/**
 * O ANEL — Óros, o mascote.
 *
 * Não é um personagem com cara: é um sigilo. Um círculo com uma quebra e uma
 * cabeça, e o estado mora inteiro no tamanho da fenda — `strokeDasharray`.
 *
 * A volta completa mede `2 · π · 34 ≈ 213.6`, então um traço de 196 desenha
 * quase tudo e deixa a fenda de ~330°.
 *
 * ── ONDE ELE APARECE NO REDESIGN ──────────────────────────────────────────
 *
 * Em três lugares, e só neles: a marca da tela de entrada (38 dp, com cabeça e
 * olho), o ícone da aba HOJE (17 dp, traço grosso, sem cabeça) e o medidor de
 * progresso do cartão da diária (52 dp, com trilho atrás). Espalhá-lo de novo
 * pelo app desfaria o que o redesign fez: o anel voltou a ser assinatura em vez
 * de enfeite.
 *
 * Nunca desenhe uma serpente ilustrada aqui. A decisão registrada é que
 * ilustração, se um dia entrar, é contratada — vetor feito às pressas envelhece
 * o app mais rápido que a ausência dele.
 */

const RAIO = 34;
const VOLTA = 2 * Math.PI * RAIO;
/** O arco de ~330° do estado de repouso. */
const TRACO_ABERTO = 196;

const CirculoAnimado = Animated.createAnimatedComponent(Circle);

type Props = {
  /** Diâmetro em dp. O desenho se ajusta sozinho. */
  tamanho?: number;
  cor?: string;
  /** Espessura no sistema de coordenadas de 100×100 do SVG. */
  espessura?: number;
  /**
   * Fração de 0 a 1. Quando presente, o anel vira medidor: ganha um trilho
   * atrás e o traço cresce animado. Sem ela, fica no arco aberto de repouso.
   */
  progresso?: number;
  /** Cor do trilho atrás do preenchimento. */
  corTrilho?: string;
  /** A cabeça — e, com ela, o olho. O ícone de aba não usa. */
  cabeca?: boolean;
  /** Cor do fundo em que o anel está, para recortar o olho. */
  corFundo?: string;
};

export function Anel({
  tamanho = 44,
  cor,
  espessura = 9,
  progresso,
  corTrilho,
  cabeca = true,
  corFundo
}: Props) {
  const cores = useCores();
  const corFinal = cor ?? cores.acento;
  const corTrilhoFinal = corTrilho ?? cores.acentoLinha;
  const corFundoFinal = corFundo ?? cores.fundo;
  const reduzido = useMovimentoReduzido();
  const medidor = progresso != null;

  const fracao = Math.min(Math.max(progresso ?? 0, 0), 1);
  const animado = useRef(new Animated.Value(reduzido ? fracao : 0)).current;

  useEffect(() => {
    if (!medidor) return;

    if (reduzido) {
      animado.setValue(fracao);
      return;
    }

    Animated.timing(animado, {
      toValue: fracao,
      duration: animacao.anel,
      easing: suavizar(curva.anel),
      // `strokeDashoffset` não é transform nem opacity: a driver nativa não
      // sabe animá-lo. É uma das duas exceções do app — ver `useLargura`.
      useNativeDriver: false
    }).start();
  }, [medidor, fracao, reduzido, animado]);

  const recuo = animado.interpolate({ inputRange: [0, 1], outputRange: [VOLTA, 0] });

  // A cabeça some em tamanhos pequenos: vira um borrão em vez de detalhe.
  const desenharCabeca = cabeca && tamanho >= 28;
  const desenharOlho = desenharCabeca && tamanho >= 36;

  return (
    <View style={{ width: tamanho, height: tamanho }}>
      <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100">
        {medidor ? (
          <>
            <Circle cx={50} cy={50} r={RAIO} fill="none" stroke={corTrilhoFinal} strokeWidth={espessura} />
            <CirculoAnimado
              cx={50}
              cy={50}
              r={RAIO}
              fill="none"
              stroke={corFinal}
              strokeWidth={espessura}
              strokeLinecap="round"
              strokeDasharray={VOLTA}
              strokeDashoffset={recuo}
              transform="rotate(-90 50 50)"
            />
          </>
        ) : (
          /* `rotate(-96)` põe o começo do traço debaixo da cabeça, para a
             fenda cair sempre ali. Sem girar, ela aparece à direita e o
             desenho perde o sentido. */
          <Circle
            cx={50}
            cy={50}
            r={RAIO}
            fill="none"
            stroke={corFinal}
            strokeWidth={espessura}
            strokeLinecap="round"
            strokeDasharray={`${TRACO_ABERTO} ${VOLTA - TRACO_ABERTO}`}
            transform="rotate(-96 50 50)"
          />
        )}

        {desenharCabeca && <Circle cx={50} cy={50 - RAIO} r={espessura} fill={corFinal} />}

        {/* O olho é o único detalhe que faz o círculo virar bicho. */}
        {desenharOlho && <Circle cx={53} cy={50 - RAIO - 2.5} r={2.4} fill={corFundoFinal} />}
      </Svg>
    </View>
  );
}
