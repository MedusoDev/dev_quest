import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path, Polygon } from 'react-native-svg';
import { Check, LockSimple, Star, Trophy } from 'phosphor-react-native';

import { fontes, raio, tipo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import type { Licao } from '@/nucleo/conteudo';
import { escurecer } from './Botao';
import { Devzinho, type NivelDevzinho } from './Devzinho';
import { useMovimentoReduzido } from './movimento';

/**
 * O CAMINHO DA TRILHA.
 *
 * Cada lição é um hexágono ligado ao próximo por uma ESTRADA curva e grossa.
 * O trecho já percorrido fica na cor da linguagem; o resto, apagado. Um
 * brilho corre pela estrada até a lição atual, mostrando para onde ir.
 *
 *   concluída — hexágono dourado + check (recompensa)
 *   atual     — hexágono na cor da linguagem, pulsando, com o balão
 *               "VOCÊ ESTÁ AQUI" e o Devzinho do lado
 *   travada   — hexágono apagado + cadeado
 *
 * Cada linguagem tem o seu DESENHO de caminho (`padrao`): a serpente suave do
 * Python, o zigue-zague do JavaScript, a escada do PHP... A seção termina num
 * troféu que acende quando todas as lições dela estão feitas.
 *
 * Os hexágonos entram um a um com um "pop" quando a seção aparece.
 */

export type ItemCaminho = {
  licao: Licao;
  /** Posição 1-based na fila inteira da linguagem. */
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
  /** A cor da linguagem — estrada percorrida e lição atual. */
  cor?: string;
  /** O zigue-zague: deslocamentos horizontais que se repetem. */
  padrao?: number[];
};

const TAMANHO_NO = 60;
const RAIO_NO = TAMANHO_NO / 2;
const ESPACO_VERTICAL = 92;
const MARGEM = 24;
/** Espaço de cada lado para o Devzinho caber ao lado do caminho. */
const LATERAL = 76;
/** A espessura do degrau embaixo do hexágono. */
const DEGRAU = 6;
const TAMANHO_TROFEU = 50;

/** Desenhos de caminho por linguagem (ver `trilhas.tsx`). */
export const PADROES_CAMINHO: Record<string, number[]> = {
  csharp: [0, 46, 74, 46, 0, -46, -74, -46],
  java: [0, -62, 0, 62],
  javascript: [-52, 52],
  python: [0, 32, 60, 32, 0, -32, -60, -32],
  php: [-70, -24, 24, 70, 24, -24]
};

function pontosHexagono(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, indice) => {
    const angulo = (Math.PI / 180) * (60 * indice - 90);
    return `${cx + r * Math.cos(angulo)},${cy + r * Math.sin(angulo)}`;
  }).join(' ');
}

/** Curva suave entre dois pontos — a "estrada" entre duas lições. */
function curva(a: { x: number; y: number }, b: { x: number; y: number }) {
  const meio = (b.y - a.y) / 2;
  return `M ${a.x} ${a.y} C ${a.x} ${a.y + meio}, ${b.x} ${b.y - meio}, ${b.x} ${b.y}`;
}

export function CaminhoTrilha({ itens, aoTocar, nivel = 2, cor, padrao = PADROES_CAMINHO.csharp! }: Props) {
  const cores = useCores();
  const corLinguagem = cor ?? cores.acento;

  const amplitude = Math.max(...padrao.map(Math.abs), 46);
  const largura = amplitude * 2 + TAMANHO_NO + MARGEM * 2 + LATERAL * 2;
  // O balão "VOCÊ ESTÁ AQUI" sobe acima do hexágono: se a lição atual é a
  // primeira da seção, abre espaço para ele.
  const topoExtra = itens[0]?.ehAtual ? 44 : 0;
  const centroX = largura / 2;

  const centros = itens.map((_, indice) => ({
    x: centroX + padrao[indice % padrao.length]!,
    y: MARGEM + topoExtra + RAIO_NO + indice * ESPACO_VERTICAL
  }));
  const trofeu = {
    x: centroX,
    y: (centros[centros.length - 1]?.y ?? 0) + ESPACO_VERTICAL
  };
  const altura = trofeu.y + TAMANHO_TROFEU / 2 + MARGEM;
  const secaoCompleta = itens.length > 0 && itens.every((i) => i.concluida);

  const indiceAtual = itens.findIndex((i) => i.ehAtual);

  if (itens.length === 0) return null;

  const pontos = [...centros, trofeu];

  return (
    <View style={{ width: largura, height: altura, alignSelf: 'center' }}>
      <Svg width={largura} height={altura} style={StyleSheet.absoluteFill}>
        {/* a estrada: base apagada, trecho percorrido na cor da linguagem */}
        {pontos.slice(1).map((ponto, indice) => {
          const anterior = pontos[indice]!;
          const percorrido = itens[indice]!.concluida;
          return (
            <G key={`estrada-${indice}`}>
              <Path
                d={curva(anterior, ponto)}
                stroke={percorrido ? escurecer(corLinguagem, 0.35) : cores.linha}
                strokeWidth={14}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d={curva(anterior, ponto)}
                stroke={percorrido ? corLinguagem : cores.superficie}
                strokeWidth={8}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d={curva(anterior, ponto)}
                stroke={percorrido ? '#FFFFFF' : cores.linha}
                strokeOpacity={percorrido ? 0.45 : 0.9}
                strokeWidth={2}
                strokeDasharray="4,9"
                strokeLinecap="round"
                fill="none"
              />
            </G>
          );
        })}

        {/* os degraus dos hexágonos (os hexágonos em si são Views, para animar) */}
        {itens.map((item, indice) => {
          const centro = centros[indice]!;
          const preenchimento = corDoNo(item, corLinguagem, cores);
          const degrau = item.liberada || item.concluida ? escurecer(preenchimento, 0.4) : cores.linha;
          return (
            <Polygon
              key={`degrau-${item.licao.id}`}
              points={pontosHexagono(centro.x, centro.y + DEGRAU, RAIO_NO)}
              fill={degrau}
            />
          );
        })}
      </Svg>

      {/* o brilho que corre pela estrada até a lição atual */}
      {indiceAtual > 0 && (
        <Cometa de={centros[indiceAtual - 1]!} para={centros[indiceAtual]!} cor={corLinguagem} />
      )}

      {/* o troféu do fim da seção */}
      <View
        style={[
          estilos.trofeu,
          {
            left: trofeu.x - TAMANHO_TROFEU / 2,
            top: trofeu.y - TAMANHO_TROFEU / 2,
            backgroundColor: secaoCompleta ? cores.ouroFundo : cores.superficie,
            borderColor: secaoCompleta ? cores.ouro : cores.linha
          }
        ]}
      >
        <Trophy size={24} weight={secaoCompleta ? 'fill' : 'bold'} color={secaoCompleta ? cores.ouro : cores.desativado} />
      </View>

      {itens.map((item, indice) => {
        const centro = centros[indice]!;
        const deslocamento = padrao[indice % padrao.length]!;

        return (
          <View key={item.licao.id} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            {item.ehAtual && <Pulso x={centro.x} y={centro.y} cor={corLinguagem} />}

            <No
              item={item}
              x={centro.x}
              y={centro.y}
              indice={indice}
              cor={corDoNo(item, corLinguagem, cores)}
              corLinguagem={corLinguagem}
              aoTocar={() => aoTocar(item)}
            />

            {item.ehAtual && (
              <>
                <BalaoAqui x={centro.x} y={centro.y} cor={corLinguagem} />
                {/* O Devzinho fica do lado oposto à curva do caminho. */}
                <View
                  pointerEvents="none"
                  style={[
                    estilos.devzinho,
                    {
                      left: deslocamento > 0 ? centro.x - RAIO_NO - 112 : centro.x + RAIO_NO + 16,
                      top: centro.y - 34
                    }
                  ]}
                >
                  <Devzinho tamanho={96} expressao="determinado" item="varinha" nivel={nivel} />
                </View>
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}

function corDoNo(
  item: ItemCaminho,
  corLinguagem: string,
  cores: ReturnType<typeof useCores>
): string {
  if (item.concluida) return cores.ouro;
  if (item.ehAtual || item.liberada) return corLinguagem;
  return cores.superficie;
}

/** Um hexágono tocável que entra com "pop" (em sequência, pelo índice). */
function No({
  item,
  x,
  y,
  indice,
  cor,
  corLinguagem,
  aoTocar
}: {
  item: ItemCaminho;
  x: number;
  y: number;
  indice: number;
  cor: string;
  corLinguagem: string;
  aoTocar: () => void;
}) {
  const cores = useCores();
  const reduzido = useMovimentoReduzido();
  const entrada = useRef(new Animated.Value(reduzido ? 1 : 0)).current;

  useEffect(() => {
    if (reduzido) return;
    Animated.spring(entrada, {
      toValue: 1,
      delay: 80 * indice,
      friction: 5,
      tension: 120,
      useNativeDriver: true
    }).start();
  }, [entrada, indice, reduzido]);

  const travada = !item.liberada && !item.concluida;

  return (
    <Animated.View
      style={[
        estilos.no,
        { left: x - RAIO_NO, top: y - RAIO_NO },
        { opacity: entrada, transform: [{ scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }
      ]}
    >
      <Pressable
        disabled={!item.liberada}
        accessibilityRole="button"
        accessibilityLabel={`${item.licao.titulo}${item.concluida ? ', concluída' : travada ? ', travada' : ''}`}
        accessibilityState={{ disabled: !item.liberada }}
        onPress={aoTocar}
        style={StyleSheet.absoluteFill}
      >
        {({ pressed }) => (
          <View style={[StyleSheet.absoluteFill, { transform: [{ translateY: pressed ? DEGRAU / 2 : 0 }] }]}>
            <Svg width={TAMANHO_NO} height={TAMANHO_NO} style={StyleSheet.absoluteFill}>
              <Polygon
                points={pontosHexagono(RAIO_NO, RAIO_NO, RAIO_NO - 1)}
                fill={cor}
                stroke={travada ? cores.linha : item.concluida ? '#FFE082' : escurecer(corLinguagem, 0.15)}
                strokeWidth={2}
              />
              {!travada && (
                <Polygon
                  points={pontosHexagono(RAIO_NO, RAIO_NO - 4, RAIO_NO * 0.6)}
                  fill="#FFFFFF"
                  opacity={0.14}
                />
              )}
            </Svg>
            <View style={estilos.icone}>
              {item.concluida ? (
                <Check size={28} color={escurecer(cores.ouro, 0.6)} weight="bold" />
              ) : item.ehAtual ? (
                <Star size={28} color="#FFFFFF" weight="fill" />
              ) : item.liberada ? (
                <Text style={[tipo.metrica, { fontSize: 20, color: '#FFFFFF' }]}>{item.numero}</Text>
              ) : (
                <LockSimple size={20} color={cores.desativado} weight="bold" />
              )}
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
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
          transform: [{ scale: valor.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }]
        }
      ]}
    />
  );
}

/** Um brilho que viaja da lição anterior até a atual, sem parar. */
function Cometa({
  de,
  para,
  cor
}: {
  de: { x: number; y: number };
  para: { x: number; y: number };
  cor: string;
}) {
  const reduzido = useMovimentoReduzido();
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzido) return;
    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(500),
        Animated.timing(valor, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    );
    laco.start();
    return () => laco.stop();
  }, [reduzido, valor]);

  if (reduzido) return null;

  // Segue a mesma curva da estrada (aproximada por 5 pontos).
  const pontosCurva = [0, 0.25, 0.5, 0.75, 1].map((t) => pontoNaCurva(de, para, t));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        estilos.cometa,
        {
          backgroundColor: '#FFFFFF',
          shadowColor: cor,
          left: -7,
          top: -7,
          opacity: valor.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateX: valor.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: pontosCurva.map((p) => p.x) }) },
            { translateY: valor.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: pontosCurva.map((p) => p.y) }) }
          ]
        }
      ]}
    />
  );
}

function pontoNaCurva(a: { x: number; y: number }, b: { x: number; y: number }, t: number) {
  const meio = (b.y - a.y) / 2;
  const p1 = { x: a.x, y: a.y + meio };
  const p2 = { x: b.x, y: b.y - meio };
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * b.y
  };
}

/** O balão "VOCÊ ESTÁ AQUI" que quica em cima da lição atual. */
function BalaoAqui({ x, y, cor }: { x: number; y: number; cor: string }) {
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
          left: x - LARGURA_BALAO / 2,
          top: y - RAIO_NO - 46,
          backgroundColor: cores.superficie,
          borderColor: cor,
          transform: [{ translateY: valor }]
        }
      ]}
    >
      <Text style={[estilos.balaoTexto, { color: cor }]}>VOCÊ ESTÁ AQUI</Text>
      <View style={[estilos.balaoBico, { backgroundColor: cores.superficie, borderColor: cor }]} />
    </Animated.View>
  );
}

const LARGURA_BALAO = 136;

const estilos = StyleSheet.create({
  no: { position: 'absolute', width: TAMANHO_NO, height: TAMANHO_NO },
  icone: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  devzinho: { position: 'absolute' },
  trofeu: {
    position: 'absolute',
    width: TAMANHO_TROFEU,
    height: TAMANHO_TROFEU,
    borderRadius: TAMANHO_TROFEU / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pulso: {
    position: 'absolute',
    width: TAMANHO_NO + 8,
    height: TAMANHO_NO + 8,
    borderRadius: raio.pill,
    borderWidth: 3
  },
  cometa: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4
  },
  balao: {
    position: 'absolute',
    width: LARGURA_BALAO,
    height: 34,
    borderRadius: raio.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  balaoTexto: { fontFamily: fontes.forte, fontSize: 13, letterSpacing: 0.8 },
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
