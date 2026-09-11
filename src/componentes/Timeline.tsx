import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { espaco, tamanhos, tipo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import type { Licao } from '@/nucleo/conteudo';
import { usePop, useMovimentoReduzido } from './movimento';

/**
 * A TRILHA, agora em LINHA DO TEMPO VERTICAL.
 *
 * Substituiu a serpentina em SVG. A serpentina era bonita e era o próprio
 * mascote — mas cada lição ficava num lugar diferente da largura da tela, o que
 * obriga o olho a caçar a próxima e deixa pouquíssimo espaço para o título.
 * Aqui tudo alinha numa coluna: dá para ler cinco lições sem mover a cabeça, e
 * cada uma cabe com uma nota embaixo.
 *
 * ── A PERNA CONTA A HISTÓRIA ──────────────────────────────────────────────
 *
 * A coluna de 2 px à esquerda de cada linha é a perna. Ela acende no acento até
 * a lição atual e fica em `linha` depois disso — é o progresso da trilha inteira
 * dito sem nenhum número. A última linha não tem perna: o caminho acaba ali.
 *
 * Três estados de nó, e só três:
 *
 *   concluído  quadrado cheio no acento, com `✓`
 *   atual      vazado, borda de 2 px no acento, o número dentro
 *   bloqueado  só uma borda de 1 px, vazio
 */

export type EstadoNo = { concluida: boolean; liberada: boolean };

type Props = {
  licoes: Licao[];
  estadoDe: (licao: Licao) => EstadoNo;
  /** Nota de cada lição. Sem ela, usa o resumo da própria lição. */
  notaDe?: (licao: Licao) => string;
  aoTocar: (licao: Licao) => void;
};

export function Timeline({ licoes, estadoDe, notaDe, aoTocar }: Props) {
  if (licoes.length === 0) return null;

  return (
    <View>
      {licoes.map((licao, indice) => (
        <Linha
          key={licao.id}
          licao={licao}
          numero={indice + 1}
          estado={estadoDe(licao)}
          nota={notaDe?.(licao) ?? `${licao.resumo} · ${licao.cards.length} cards`}
          ultima={indice === licoes.length - 1}
          aoTocar={() => aoTocar(licao)}
        />
      ))}
    </View>
  );
}

function Linha({
  licao,
  numero,
  estado,
  nota,
  ultima,
  aoTocar
}: {
  licao: Licao;
  numero: number;
  estado: EstadoNo;
  nota: string;
  ultima: boolean;
  aoTocar: () => void;
}) {
  const cores = useCores();
  const reduzido = useMovimentoReduzido();
  const atual = estado.liberada && !estado.concluida;

  // O nó da lição recém-fechada estoura na tela quando a pessoa volta do
  // resumo. É o único movimento desta lista.
  const pop = usePop(estado.concluida, undefined, reduzido);

  const corPerna = ultima ? 'transparent' : estado.liberada ? cores.acento : cores.linha;
  const corTexto = estado.liberada ? cores.textoForte : cores.desativado;

  const noEstado = estado.concluida
    ? { backgroundColor: cores.acento, borderColor: cores.acento }
    : atual
      ? { borderWidth: tamanhos.trilho, borderColor: cores.acento }
      : !estado.liberada
        ? { borderColor: cores.linha }
        : null;

  const conteudo = (
    <View style={estilos.linha}>
      <View style={[estilos.perna, { backgroundColor: corPerna }]} />

      <View style={[estilos.corpo, ultima && estilos.corpoFinal]}>
        <View style={estilos.cabeca}>
          <Animated.View style={[estilos.no, { borderColor: cores.linha }, noEstado, estado.concluida && pop]}>
            {estado.concluida && <Text style={[estilos.marca, { color: cores.acentoFundo }]}>✓</Text>}
            {atual && <Text style={[estilos.numero, { color: cores.acento }]}>{numero}</Text>}
          </Animated.View>

          <Text style={[estilos.titulo, { color: corTexto }]}>{licao.titulo}</Text>
        </View>

        <Text
          style={[
            estilos.nota,
            { color: cores.legenda },
            !estado.liberada && { color: cores.desativado }
          ]}
        >
          {nota}
        </Text>
      </View>
    </View>
  );

  if (!estado.liberada) {
    return (
      <View accessibilityLabel={`${licao.titulo}, ainda bloqueada`} accessible>
        {conteudo}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={`Lição ${numero}: ${licao.titulo}`}
      accessibilityRole="button"
      onPress={aoTocar}
      style={({ pressed }) => (pressed ? estilos.pressionada : undefined)}
    >
      {conteudo}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 16 },
  pressionada: { opacity: 0.75 },

  perna: { width: tamanhos.trilho },
  corpo: { flex: 1, paddingBottom: espaco.xl },
  corpoFinal: { paddingBottom: 0 },

  cabeca: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  no: {
    width: tamanhos.no,
    height: tamanhos.no,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: tamanhos.linha
  },

  marca: { ...tipo.metricaPequena, fontSize: 13 },
  numero: { ...tipo.metricaPequena, fontSize: 13 },

  titulo: { ...tipo.tituloItem, flex: 1 },
  // O recuo de 36 alinha a nota com o título, não com o nó.
  nota: { ...tipo.notaMonoMenor, marginTop: 7, paddingLeft: 36 }
});
