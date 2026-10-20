import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Polygon } from 'react-native-svg';
import { Check, LockSimple, Star } from 'phosphor-react-native';

import { fontes, raio, tipo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import type { Licao } from '@/nucleo/conteudo';
import { escurecer } from './Botao';
import { Devzinho, type NivelDevzinho } from './Devzinho';
import { useMovimentoReduzido } from './movimento';

/**
 * O CAMINHO DE HEXÁGONOS.
 *
 * Cada lição é um hexágono num zigue-zague vertical, ligados por uma linha
 * pontilhada — a mesma ideia de trilha sinuosa de apps de curso gamificados.
 * As três cores continuam sendo as regras de sempre (ver `trilhas.tsx`):
 * concluída = hexágono **dourado** + check; atual = hexágono cheio no acento,
 * pulsando, com o balão "COMEÇAR" e o Devzinho ao lado; travada = contorno
 * fino em `linha` + cadeado. Todo hexágono tem um "degrau" mais escuro
 * embaixo, como os botões — dá a sensação de peça de tabuleiro.
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
  /** O nível do Devzinho que acompanha a lição atual. */
  nivel?: NivelDevzinho;
};

const TAMANHO_NO = 56;
const RAIO_NO = TAMANHO_NO / 2;
const ESPACO_VERTICAL = 84;
const MARGEM = 24;
/** Espaço de cada lado para o Devzinho caber ao lado do caminho. */
const LATERAL = 70;
/** A espessura do degrau embaixo do hexágono. */
const DEGRAU = 5;
/** O zigue-zague: 0 = centro, positivo = direita, negativo = esquerda. */
const PADRAO_OFFSET = [0, 46, 74, 46, 0, -46, -74, -46];

function pontosHexagono(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, indice) => {
    const angulo = (Math.PI / 180) * (60 * indice - 90);
    return `${cx + r * Math.cos(angulo)},${cy + r * Math.sin(angulo)}`;
  }).join(' ');
}

export function CaminhoTrilha({ itens, aoTocar, nivel = 2 }: Props) {
  const cores = useCores();

  const amplitude = Math.max(...PADRAO_OFFSET.map(Math.abs));
  const largura = amplitude * 2 + TAMANHO_NO + MARGEM * 2 + LATERAL * 2;
  // O balão "COMEÇAR" sobe acima do hexágono: se a lição atual é a primeira
  // da seção, abre espaço para ele não cobrir a cápsula do título.
  const topoExtra = itens[0]?.ehAtual ? 40 : 0;
  const altura =
    itens.length > 0
      ? (itens.length - 1) * ESPACO_VERTICAL + TAMANHO_NO + MARGEM * 2 + DEGRAU + topoExtra
      : 0;
  const centroX = largura / 2;

  const centros = itens.map((_, indice) => ({
    x: centroX + PADRAO_OFFSET[indice % PADRAO_OFFSET.length]!,
    y: MARGEM + topoExtra + RAIO_NO + indice * ESPACO_VERTICAL
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
              stroke={itens[indice]!.concluida ? cores.ouro : cores.linha}
              strokeWidth={4}
              strokeDasharray="2,10"
              strokeLinecap="round"
            />
          );
        })}

        {itens.map((item, indice) => {
          const centro = centros[indice]!;
          const preenchimento = item.concluida
            ? cores.ouro
            : item.ehAtual
              ? cores.acento
              : cores.superficie;
          const corBorda = item.concluida ? cores.ouro : item.ehAtual ? cores.acento : cores.linha;
          const degrau = item.liberada ? escurecer(preenchimento, 0.38) : cores.linha;

          return (
            <G key={item.licao.id}>
              <Polygon points={pontosHexagono(centro.x, centro.y + DEGRAU, RAIO_NO)} fill={degrau} />
              <Polygon
                points={pontosHexagono(centro.x, centro.y, RAIO_NO)}
                fill={preenchimento}
                stroke={corBorda}
                strokeWidth={2}
              />
              {item.liberada && (
                <Polygon
                  points={pontosHexagono(centro.x, centro.y - 3, RAIO_NO * 0.62)}
                  fill="#FFFFFF"
                  opacity={0.12}
                />
              )}
            </G>
          );
        })}
      </Svg>

      {itens.map((item, indice) => {
        const centro = centros[indice]!;
        const deslocamento = PADRAO_OFFSET[indice % PADRAO_OFFSET.length]!;

        return (
          <View key={item.licao.id} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            {item.ehAtual && (
              <>
                <Pulso x={centro.x} y={centro.y} cor={cores.acento} />
                <BalaoComecar x={centro.x} y={centro.y} />
                {/* O Devzinho fica do lado oposto à curva do caminho. */}
                <View
                  pointerEvents="none"
                  style={[
                    estilos.devzinho,
                    {
                      left: deslocamento > 0 ? centro.x - 150 : centro.x + 46,
                      top: centro.y - 42
                    }
                  ]}
                >
                  <Devzinho tamanho={84} expressao="determinado" item="varinha" nivel={nivel} />
                </View>
              </>
            )}

            <Pressable
              disabled={!item.liberada}
              accessibilityRole="button"
              accessibilityLabel={item.licao.titulo}
              accessibilityState={{ disabled: !item.liberada }}
              onPress={() => aoTocar(item)}
              style={({ pressed }) => [
                estilos.alvo,
                {
                  left: centro.x - RAIO_NO,
                  top: centro.y - RAIO_NO + (pressed ? DEGRAU / 2 : 0),
                  width: TAMANHO_NO,
                  height: TAMANHO_NO
                }
              ]}
            >
              {item.concluida ? (
                <Check size={26} color={escurecer(cores.ouro, 0.6)} weight="bold" />
              ) : item.ehAtual ? (
                <Star size={26} color="#FFFFFF" weight="fill" />
              ) : item.liberada ? (
                <Text style={[tipo.metrica, { fontSize: 20, color: cores.acento }]}>
                  {item.numero}
                </Text>
              ) : (
                <LockSimple size={20} color={cores.desativado} weight="bold" />
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/** Um anel que cresce e some em volta da lição atual, em laço. */
function Pulso({ x, y, cor }: { x: number; y: number; cor: string }) {
  const reduzido = useMovimentoReduzido();
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzido) return;
    const laco = Animated.loop(
      Animated.timing(valor, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true })
    );
    laco.start();
    return () => laco.stop();
  }, [reduzido, valor]);

  if (reduzido) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        estilos.pulso,
        {
          left: x - RAIO_NO - 4,
          top: y - RAIO_NO - 4,
          borderColor: cor,
          opacity: valor.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
          transform: [{ scale: valor.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }]
        }
      ]}
    />
  );
}

/** O balão "COMEÇAR" que quica em cima da lição atual. */
function BalaoComecar({ x, y }: { x: number; y: number }) {
  const cores = useCores();
  const reduzido = useMovimentoReduzido();
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzido) return;
    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: -6, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(valor, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    );
    laco.start();
    return () => laco.stop();
  }, [reduzido, valor]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        estilos.balao,
        {
          left: x - 52,
          top: y - RAIO_NO - 44,
          backgroundColor: cores.superficie,
          borderColor: cores.acento,
          transform: [{ translateY: valor }]
        }
      ]}
    >
      <Text style={[estilos.balaoTexto, { color: cores.acento }]}>COMEÇAR</Text>
      <View style={[estilos.balaoBico, { backgroundColor: cores.superficie, borderColor: cores.acento }]} />
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  alvo: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  devzinho: { position: 'absolute' },
  pulso: {
    position: 'absolute',
    width: TAMANHO_NO + 8,
    height: TAMANHO_NO + 8,
    borderRadius: raio.pill,
    borderWidth: 3
  },
  balao: {
    position: 'absolute',
    width: 104,
    height: 34,
    borderRadius: raio.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  balaoTexto: { fontFamily: fontes.forte, fontSize: 14, letterSpacing: 1 },
  balaoBico: {
    position: 'absolute',
    bottom: -7,
    width: 12,
    height: 12,
    borderWidth: 2,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '45deg' }]
  }
});
