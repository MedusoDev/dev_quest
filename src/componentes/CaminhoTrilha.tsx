import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';
import { Check, LockSimple } from 'phosphor-react-native';

import { tipo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import type { Licao } from '@/nucleo/conteudo';

/**
 * O CAMINHO DE HEXÁGONOS.
 *
 * Cada lição é um hexágono num zigue-zague vertical, ligados por uma linha
 * pontilhada — a mesma ideia de trilha sinuosa de apps de curso gamificados.
 * As três cores continuam sendo as regras de sempre (ver `trilhas.tsx`):
 * concluída = hexágono cheio no acento + check; atual = contorno grosso no
 * acento + número; travada = contorno fino em `linha` + cadeado.
 */

export type ItemCaminho = {
  licao: Licao;
  /** Posição 1-based na fila inteira da linguagem — mostrada dentro do nó atual. */
  numero: number;
  concluida: boolean;
  liberada: boolean;
  ehAtual: boolean;
};

type Props = {
  itens: ItemCaminho[];
  aoTocar: (item: ItemCaminho) => void;
};

const TAMANHO_NO = 56;
const RAIO_NO = TAMANHO_NO / 2;
const ESPACO_VERTICAL = 84;
const MARGEM = 24;
/** O zigue-zague: 0 = centro, positivo = direita, negativo = esquerda. */
const PADRAO_OFFSET = [0, 46, 74, 46, 0, -46, -74, -46];

function pontosHexagono(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, indice) => {
    const angulo = (Math.PI / 180) * (60 * indice - 90);
    return `${cx + r * Math.cos(angulo)},${cy + r * Math.sin(angulo)}`;
  }).join(' ');
}

export function CaminhoTrilha({ itens, aoTocar }: Props) {
  const cores = useCores();

  const amplitude = Math.max(...PADRAO_OFFSET.map(Math.abs));
  const largura = amplitude * 2 + TAMANHO_NO + MARGEM * 2;
  const altura = itens.length > 0 ? (itens.length - 1) * ESPACO_VERTICAL + TAMANHO_NO + MARGEM * 2 : 0;
  const centroX = largura / 2;

  const centros = itens.map((_, indice) => ({
    x: centroX + PADRAO_OFFSET[indice % PADRAO_OFFSET.length]!,
    y: MARGEM + RAIO_NO + indice * ESPACO_VERTICAL
  }));

  if (itens.length === 0) return null;

  return (
    <View style={{ width: largura, height: altura, alignSelf: 'center' }}>
      <Svg width={largura} height={altura} style={StyleSheet.absoluteFill}>
        {centros.slice(1).map((centro, indice) => {
          const anterior = centros[indice]!;
          return (
            <Line
              key={itens[indice + 1]!.licao.id}
              x1={anterior.x}
              y1={anterior.y}
              x2={centro.x}
              y2={centro.y}
              stroke={cores.linha}
              strokeWidth={3}
              strokeDasharray="2,10"
              strokeLinecap="round"
            />
          );
        })}

        {itens.map((item, indice) => {
          const centro = centros[indice]!;
          const corBorda = item.concluida || item.ehAtual ? cores.acento : cores.linha;

          return (
            <Polygon
              key={item.licao.id}
              points={pontosHexagono(centro.x, centro.y, RAIO_NO)}
              fill={item.concluida ? cores.acento : cores.superficie}
              stroke={corBorda}
              strokeWidth={item.ehAtual ? 3 : 2}
            />
          );
        })}
      </Svg>

      {itens.map((item, indice) => {
        const centro = centros[indice]!;

        return (
          <Pressable
            key={item.licao.id}
            disabled={!item.liberada}
            accessibilityRole="button"
            accessibilityLabel={item.licao.titulo}
            accessibilityState={{ disabled: !item.liberada }}
            onPress={() => aoTocar(item)}
            style={[
              estilos.alvo,
              {
                left: centro.x - RAIO_NO,
                top: centro.y - RAIO_NO,
                width: TAMANHO_NO,
                height: TAMANHO_NO
              }
            ]}
          >
            {item.concluida ? (
              <Check size={22} color={cores.acentoFundo} weight="bold" />
            ) : item.liberada ? (
              <Text style={[tipo.metrica, { fontSize: 20, color: cores.acento }]}>
                {item.numero}
              </Text>
            ) : (
              <LockSimple size={20} color={cores.desativado} weight="bold" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  alvo: { position: 'absolute', alignItems: 'center', justifyContent: 'center' }
});
