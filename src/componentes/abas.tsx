import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { House, Lightning, MapTrifold, Trophy, UserCircle, type IconWeight } from 'phosphor-react-native';

import { cores, raio, tamanhos } from '@/tema';
import type { Paleta } from '@/tema/temas';
import { useCores } from '@/dados/TemaContexto';
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
 * ── OS ÍCONES DIZEM O NOME SOZINHOS ───────────────────────────────────────
 *
 * Cinco ícones Phosphor no peso `fill`, sem rótulo de texto embaixo — cada
 * forma já é reconhecível o bastante (casa, mapa, raio, troféu, perfil) para
 * não precisar de "HOJE"/"TRILHAS" escrito.
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

const TAMANHO_ICONE = 25;

const ICONES: Record<string, (props: { cor: string; peso: IconWeight }) => ReactNode> = {
  index: ({ cor, peso }) => <House size={TAMANHO_ICONE} color={cor} weight={peso} />,
  trilhas: ({ cor, peso }) => <MapTrifold size={TAMANHO_ICONE} color={cor} weight={peso} />,
  relampago: ({ cor, peso }) => <Lightning size={TAMANHO_ICONE} color={cor} weight={peso} />,
  liga: ({ cor, peso }) => <Trophy size={TAMANHO_ICONE} color={cor} weight={peso} />,
  perfil: ({ cor, peso }) => <UserCircle size={TAMANHO_ICONE} color={cor} weight={peso} />
};

/** Só para leitor de tela — não aparece mais como texto na barra. */
const ROTULOS: Record<string, string> = {
  index: 'Hoje',
  trilhas: 'Trilhas',
  relampago: 'Relâmpago',
  liga: 'Liga',
  perfil: 'Perfil'
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
            accessibilityLabel={ROTULOS[rota.name] ?? rota.name}
            onPress={tocar}
            style={[estilos.item, ativa && { borderTopColor: paleta.acento }]}
          >
            {Icone ? <Icone cor={cor} peso={ativa ? 'fill' : 'regular'} /> : null}
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
    borderTopWidth: tamanhos.linha,
    borderTopLeftRadius: raio.lg,
    borderTopRightRadius: raio.lg
  },
  item: {
    flex: 1,
    minHeight: tamanhos.abas,
    alignItems: 'center',
    justifyContent: 'center',
    // A borda de 2 px da aba ativa sobrepõe a régua da barra em vez de somar
    // altura a ela: sem o -1, a linha do topo engrossaria só naquela coluna.
    borderTopWidth: tamanhos.trilho,
    borderTopColor: 'transparent',
    marginTop: -tamanhos.linha
  }
});
