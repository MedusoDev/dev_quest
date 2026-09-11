import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { cores, espaco, tamanhos, tipo } from '@/tema';
import type { Paleta } from '@/tema/temas';
import { useCores } from '@/dados/TemaContexto';
import { Anel } from './Anel';
import { useEntradaAba, useMovimentoReduzido } from './movimento';

/**
 * A BARRA DE CINCO ABAS.
 *
 * O app deixou de ser uma pilha de telas e virou cinco lugares fixos. Isso muda
 * o que o app *é*: antes cada tela era um destino que você abria e fechava;
 * agora Hoje, Trilhas, Relâmpago, Liga e Perfil estão sempre a um toque, e a
 * pessoa navega sem nunca sentir que "entrou" em nada.
 *
 * ── A TRANSIÇÃO SEGUE O DEDO ──────────────────────────────────────────────
 *
 * A tela de destino entra deslizando **na direção do toque**: 46 dp a partir do
 * lado da aba clicada. Tocar numa aba à direita traz a tela da direita. É a
 * diferença entre uma troca que tem espaço e uma que só pisca.
 *
 * A direção é calculada aqui, na barra, e entregue às telas por contexto —
 * `expo-router` não conta para a tela de onde o toque veio.
 *
 * ── OS ÍCONES SÃO FORMAS ──────────────────────────────────────────────────
 *
 * Nenhuma biblioteca de ícones. Cinco formas desenhadas com View e o anel em
 * SVG. Uma família de ícones de terceiro traria cantos arredondados e traços de
 * outra espessura para dentro de um app que não tem nem uma coisa nem outra.
 */

type ValorAbas = { direcao: number; anunciarDirecao: (direcao: number) => void };

const Contexto = createContext<ValorAbas>({ direcao: 0, anunciarDirecao: () => {} });

export function ProvedorAbas({ children }: { children: ReactNode }) {
  const [direcao, setDirecao] = useState(0);

  const valor = useMemo<ValorAbas>(
    () => ({ direcao, anunciarDirecao: setDirecao }),
    [direcao]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useAbas = () => useContext(Contexto);

/**
 * O invólucro de toda tela de aba.
 *
 * Anima a entrada na direção do toque a cada vez que a tela ganha foco — e não
 * só na montagem, senão a segunda visita entraria seca.
 */
export function TelaAba({
  children,
  estilo,
  paleta
}: {
  children: ReactNode;
  estilo?: ViewStyle;
  /** Sobrepõe o tema corrente. Sem isto a tela já usa `useCores()` sozinha. */
  paleta?: Paleta;
}) {
  const { direcao } = useAbas();
  const reduzido = useMovimentoReduzido();
  const temaAtual = useCores();
  const paletaAtiva = paleta ?? temaAtual;

  const [gatilho, setGatilho] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setGatilho((valor) => valor + 1);
    }, [])
  );

  const entrada = useEntradaAba(gatilho, direcao, reduzido);

  return (
    <Animated.View
      style={[estilos.tela, { backgroundColor: paletaAtiva.fundo }, entrada, estilo]}
    >
      {children}
    </Animated.View>
  );
}

/* ─────────────────────────── os ícones ─────────────────────────── */

function IconeHoje({ cor }: { cor: string }) {
  return <Anel tamanho={17} cor={cor} espessura={14} cabeca={false} />;
}

function IconeTrilhas({ cor }: { cor: string }) {
  return (
    <View style={estilos.barras}>
      {[17, 11, 17].map((largura, indice) => (
        <View key={indice} style={{ width: largura, height: 3, backgroundColor: cor }} />
      ))}
    </View>
  );
}

function IconeRelampago({ cor }: { cor: string }) {
  return <View style={[estilos.losango, { backgroundColor: cor }]} />;
}

function IconeLiga({ cor }: { cor: string }) {
  return <View style={[estilos.quadrado, { borderColor: cor }]} />;
}

function IconePerfil({ cor }: { cor: string }) {
  return <View style={[estilos.quadrado, estilos.redondo, { borderColor: cor }]} />;
}

/** Três barras crescentes — o ícone do painel de métricas, não do jogo. */
function IconePainel({ cor }: { cor: string }) {
  return (
    <View style={estilos.barrasPainel}>
      {[7, 12, 17].map((altura, indice) => (
        <View key={indice} style={{ width: 3, height: altura, backgroundColor: cor }} />
      ))}
    </View>
  );
}

const ICONES: Record<string, (props: { cor: string }) => ReactNode> = {
  index: IconeHoje,
  trilhas: IconeTrilhas,
  relampago: IconeRelampago,
  liga: IconeLiga,
  perfil: IconePerfil,
  painel: IconePainel
};

const ROTULOS: Record<string, string> = {
  index: 'HOJE',
  trilhas: 'TRILHAS',
  relampago: 'RELÂMP',
  liga: 'LIGA',
  perfil: 'PERFIL',
  painel: 'PAINEL'
};

/* ──────────────────────────── a barra ──────────────────────────── */

export function BarraAbas({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { anunciarDirecao } = useAbas();
  const paleta = useCores();

  return (
    <View style={[estilos.barra, { paddingBottom: insets.bottom, backgroundColor: paleta.fundo, borderTopColor: paleta.linha }]}>
      {state.routes.map((rota, indice) => {
        const ativa = state.index === indice;
        const cor = ativa ? paleta.acento : paleta.desativado;
        const Icone = ICONES[rota.name];

        function tocar() {
          if (ativa) return;

          // O sinal diz de que lado a tela nova está: positivo quando a aba
          // tocada fica à direita da atual.
          anunciarDirecao(Math.sign(indice - state.index));
          navigation.navigate(rota.name);
        }

        return (
          <Pressable
            key={rota.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativa }}
            accessibilityLabel={ROTULOS[rota.name]}
            onPress={tocar}
            style={[estilos.item, ativa && { borderTopColor: paleta.acento }]}
          >
            {Icone ? <Icone cor={cor} /> : null}
            <Text style={[tipo.rotuloAba, { color: cor }]}>{ROTULOS[rota.name] ?? rota.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },

  barra: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: tamanhos.linha
  },
  item: {
    flex: 1,
    minHeight: tamanhos.abas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    // A borda de 2 px da aba ativa sobrepõe a régua da barra em vez de somar
    // altura a ela: sem o -1, a linha do topo engrossaria só naquela coluna.
    borderTopWidth: tamanhos.trilho,
    borderTopColor: 'transparent',
    marginTop: -tamanhos.linha
  },
  itemAtivo: {},

  barras: { gap: 3, alignItems: 'flex-start' },
  barrasPainel: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  losango: { width: 13, height: 13, transform: [{ rotate: '45deg' }] },
  quadrado: { width: 15, height: 15, borderWidth: 3 },
  redondo: { borderRadius: 999 },

  espacador: { width: espaco.xs }
});
