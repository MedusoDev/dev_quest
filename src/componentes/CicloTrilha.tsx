import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import { animacao, espaco, tamanhos, tipo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { Cursor } from '@/componentes/basicos';
import { useMovimentoReduzido } from '@/componentes/movimento';

/**
 * O CICLO — a tela de trilhas desenhada como o corpo do Ouroboros.
 *
 * Toda a linguagem é uma circunferência de pontos, um por lição, na ordem em
 * que elas abrem. O corpo da cobra cobre **só o caminho já andado**: cada lição
 * concluída estende o traço em 360/total graus e a cabeça anda para o ponto
 * seguinte. Quando a última fecha, a cabeça encontra a cauda.
 *
 * Por que substituiu a Timeline vertical: a timeline mostrava três lições por
 * tela e não dizia onde elas terminavam. O anel mostra a linguagem inteira de
 * uma vez, com o progresso como forma e não como número — e é a marca do app
 * (o mesmo desenho do `Anel.tsx`) fazendo trabalho de navegação.
 *
 * Geometria, em unidades de viewBox (100x100), para não depender de densidade:
 *   raio 34 · traço 10 · cabeça r 5.6 · olho r 1.5 · ponto 4.6 quadrado
 * O ponto e o corpo compartilham o raio, então o traço passa por cima dos
 * pontos já vencidos — é isso que dá a leitura de "ganhou forma".
 *
 * Cor vem de `useCores()`: este componente só existe dentro da tela de
 * Trilhas, já migrada para o tema trocável — ver a nota em `tema/temas.ts`.
 */

const RAIO = 34;
const VOLTA = 2 * Math.PI * RAIO;
const LADO = 280;

export type PontoCiclo = {
  id: string;
  concluida: boolean;
  atual: boolean;
  aoTocar: () => void;
};

export function CicloTrilha({
  pontos,
  rotulo,
  titulo,
  nota,
  acao,
  aoTocarCentro,
  legenda
}: {
  pontos: PontoCiclo[];
  rotulo: string;
  titulo: string;
  nota: string;
  acao: string;
  aoTocarCentro: () => void;
  legenda: string;
}) {
  const cores = useCores();
  const reduzido = useMovimentoReduzido();
  const total = pontos.length || 1;
  const feitas = pontos.filter((p) => p.concluida).length;

  // Uma progressão só (0..1) move corpo, cabeça e olho juntos — se cada um
  // animasse por conta, a cabeça descolaria da ponta do traço no meio do
  // caminho. useNativeDriver fica de fora: stroke-dasharray é layout no SVG.
  const progresso = useRef(new Animated.Value(feitas / total)).current;

  useEffect(() => {
    const destino = feitas / total;
    if (reduzido) {
      progresso.setValue(destino);
      return;
    }
    Animated.timing(progresso, {
      toValue: destino,
      duration: animacao.rank,
      easing: Easing.bezier(...animacao.curva.barra),
      useNativeDriver: false
    }).start();
  }, [feitas, total, reduzido, progresso]);

  const anguloCabeca = (feitas / total) * Math.PI * 2;
  const cx = 50 + RAIO * Math.sin(anguloCabeca);
  const cy = 50 - RAIO * Math.cos(anguloCabeca);
  // O olho fica adiantado na direção da marcha e deslocado para fora do anel.
  const olhoX = cx + 1.6 * Math.cos(anguloCabeca) + 1.8 * Math.sin(anguloCabeca);
  const olhoY = cy + 1.6 * Math.sin(anguloCabeca) - 1.8 * Math.cos(anguloCabeca);

  return (
    <View>
      <View style={estilos.palco}>
        <Svg width={LADO} height={LADO} viewBox="0 0 100 100">
          {/* O caminho que falta: pontilhado fino, nunca uma segunda cor. */}
          <Circle
            cx={50}
            cy={50}
            r={RAIO}
            fill="none"
            stroke={cores.linha}
            strokeWidth={1}
            strokeDasharray="1.6 3.2"
          />

          {pontos.map((ponto, indice) => {
            const angulo = (indice / total) * Math.PI * 2;
            const px = 50 + RAIO * Math.sin(angulo);
            const py = 50 - RAIO * Math.cos(angulo);

            return (
              <Rect
                key={ponto.id}
                x={px - 2.3}
                y={py - 2.3}
                width={4.6}
                height={4.6}
                fill={ponto.concluida ? cores.acento : ponto.atual ? 'none' : cores.linha}
                stroke={ponto.atual ? cores.acento : 'none'}
                strokeWidth={1.2}
                onPress={ponto.aoTocar}
              />
            );
          })}

          {/* O corpo. rotate(-90) põe a cauda às 12h; o dash cresce daí. */}
          <Circle
            cx={50}
            cy={50}
            r={RAIO}
            fill="none"
            stroke={cores.acento}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${(VOLTA * feitas) / total} ${VOLTA}`}
            transform="rotate(-90 50 50)"
          />

          <Circle cx={cx} cy={cy} r={5.6} fill={cores.acento} />
          <Circle cx={olhoX} cy={olhoY} r={1.5} fill={cores.fundo} />
        </Svg>

        <View style={estilos.centro} pointerEvents="box-none">
          <Text style={[tipo.rotuloSecao, estilos.centroRotulo, { color: cores.acento }]}>
            {rotulo}
          </Text>
          <Text style={[estilos.centroTitulo, { color: cores.textoForte }]}>{titulo}</Text>
          <Text style={[estilos.centroNota, { color: cores.legenda }]}>{nota}</Text>

          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={aoTocarCentro}
            style={estilos.centroAcao}
          >
            <Text style={[estilos.centroAcaoTexto, { color: cores.acento }]}>{acao}</Text>
            <Cursor cor={cores.acento} />
          </Pressable>
        </View>
      </View>

      <Text style={[estilos.legenda, { color: cores.desativado }]}>{legenda}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  palco: { width: LADO, height: LADO, alignSelf: 'center' },

  centro: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 62
  },
  centroRotulo: { textTransform: 'uppercase' },
  centroTitulo: {
    ...tipo.tituloItem,
    marginTop: espaco.sm,
    textAlign: 'center'
  },
  centroNota: {
    ...tipo.notaMonoMenor,
    marginTop: 6,
    textAlign: 'center'
  },
  centroAcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: espaco.sm,
    minHeight: tamanhos.alvoMin,
    paddingHorizontal: espaco.sm
  },
  centroAcaoTexto: { ...tipo.botaoDiscreto },

  legenda: {
    ...tipo.metricaMono,
    textAlign: 'center',
    marginTop: espaco.xs
  }
});
