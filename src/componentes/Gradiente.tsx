import { useId } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Um degradê que preenche o pai inteiro, atrás do conteúdo.
 *
 * React Native não tem `linear-gradient` de CSS; isto é um SVG esticado. O pai
 * precisa de `overflow: 'hidden'` para o degradê respeitar o raio dele.
 */
export function Gradiente({
  de,
  para,
  angulo = 'diagonal',
  estilo
}: {
  de: string;
  para: string;
  angulo?: 'diagonal' | 'vertical' | 'horizontal';
  estilo?: ViewStyle;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const fim =
    angulo === 'vertical' ? { x2: '0', y2: '1' } : angulo === 'horizontal' ? { x2: '1', y2: '0' } : { x2: '1', y2: '1' };

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, estilo]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={`g${id}`} x1="0" y1="0" {...fim}>
            <Stop offset="0" stopColor={de} />
            <Stop offset="1" stopColor={para} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#g${id})`} />
      </Svg>
    </View>
  );
}
