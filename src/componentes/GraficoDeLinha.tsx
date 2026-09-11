import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { tipo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';

/**
 * GRÁFICO DE LINHA — tendência ao longo do tempo, sem biblioteca de gráfico.
 *
 * Companheiro do `GraficoDeBarras` do painel de métricas: barra é para
 * comparar categorias (quanto em cada dia/hora), linha é para ver se algo
 * está subindo ou descendo. Um traço fino no acento, um risco de base na cor
 * de linha do app, e só — nada de grade, eixo numerado ou preenchimento.
 *
 * `valor: null` num ponto vira um buraco na linha (sem dado naquele dia), não
 * um vale — a diferença importa quando "sem sessão" e "0% de acerto"
 * significam coisas bem diferentes.
 */
export function GraficoDeLinha({
  pontos,
  altura = 90,
  cor
}: {
  pontos: { rotulo: string; valor: number | null }[];
  altura?: number;
  cor?: string;
}) {
  const cores = useCores();
  const corFinal = cor ?? cores.acento;
  const validos = pontos.filter((p): p is { rotulo: string; valor: number } => p.valor !== null);

  if (validos.length === 0) {
    return <Text style={[estilos.semDado, { color: cores.desativado }]}>Sem dado suficiente ainda.</Text>;
  }

  const larguraViewBox = 100;
  const passoX = pontos.length > 1 ? larguraViewBox / (pontos.length - 1) : 0;
  const maximo = Math.max(...validos.map((p) => p.valor));
  const minimo = Math.min(0, ...validos.map((p) => p.valor));
  const faixa = maximo - minimo || 1;

  function coordenada(indice: number, valor: number) {
    const x = indice * passoX;
    const y = altura - ((valor - minimo) / faixa) * (altura - 6) - 3;
    return { x, y };
  }

  // Pontos sem dado quebram a linha em vez de virar zero — daí os segmentos
  // separados em vez de um `Polyline` só.
  const segmentos: { x: number; y: number }[][] = [];
  let atual: { x: number; y: number }[] = [];
  pontos.forEach((ponto, indice) => {
    if (ponto.valor === null) {
      if (atual.length) segmentos.push(atual);
      atual = [];
      return;
    }
    atual.push(coordenada(indice, ponto.valor));
  });
  if (atual.length) segmentos.push(atual);

  return (
    <View>
      <Svg width="100%" height={altura} viewBox={`0 0 ${larguraViewBox} ${altura}`} preserveAspectRatio="none">
        <Line x1={0} y1={altura - 1} x2={larguraViewBox} y2={altura - 1} stroke={cores.linha} strokeWidth={0.6} />
        {segmentos.map((segmento, indice) => (
          <Polyline
            key={indice}
            points={segmento.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={corFinal}
            strokeWidth={1.6}
          />
        ))}
        {validos.map((ponto) => {
          const indiceReal = pontos.indexOf(ponto);
          const { x, y } = coordenada(indiceReal, ponto.valor);
          return <Circle key={indiceReal} cx={x} cy={y} r={1.4} fill={corFinal} />;
        })}
      </Svg>
      <View style={estilos.legenda}>
        <Text style={[estilos.rotulo, { color: cores.legenda }]}>{pontos[0]?.rotulo}</Text>
        <Text style={[estilos.rotulo, { color: cores.legenda }]}>{pontos[pontos.length - 1]?.rotulo}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  legenda: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  rotulo: { ...tipo.rotuloCelula, fontSize: 9, letterSpacing: 0 },
  semDado: { ...tipo.notaMonoMenor }
});
