import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { espaco, margemTela, tamanhos, tipo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { Botao } from './Botao';
import { TextoRico } from './basicos';
import { useMovimentoReduzido, useSubida } from './movimento';

/**
 * PAINEL DE FEEDBACK.
 *
 * Sobe do rodapé em 300 ms e ocupa a base da tela — **sem overlay**: o
 * exercício continua visível atrás, porque a pessoa precisa comparar a
 * explicação com a alternativa que ela marcou.
 *
 * A borda superior de 2 px é o veredito inteiro: acento ou vermelho. Não há
 * ícone, não há anel, não há emoji.
 *
 * ── O QUE ELE DIZ, E POR QUÊ ──────────────────────────────────────────────
 *
 * O texto não é decoração, é a regra do app aparecendo:
 *
 *   acertou de primeira  → "Certo"        +10 XP      botão: "Seguir"
 *   acertou depois errar → "Agora sim"    +4 XP       botão: "Seguir"
 *   errou                → "Não é essa"   volta pra fila
 *
 * "Volta pra fila" e não "Tente de novo": o card volta ao fim da fila e vai
 * reaparecer hoje mesmo. O rótulo conta o que o sistema **fez**, em vez de dar
 * uma ordem — é isso que faz errar não custar nada.
 *
 * E acertar de primeira é diferente de acertar depois de errar. O app sabe, e
 * dizer isso em voz alta é metade da razão de a pessoa voltar amanhã.
 *
 * ── QUEM TREME ────────────────────────────────────────────────────────────
 *
 * O tremor do erro é da **pergunta**, não deste painel: ver `Sessao.tsx`. Se o
 * painel tremesse, o texto ficaria ilegível justo no momento em que ela mais
 * precisa lê-lo.
 */

type Props = {
  acertou: boolean;
  /** Falso quando o card já tinha sido errado antes nesta sessão. */
  dePrimeira: boolean;
  explicacao: string;
  /**
   * A resposta certa em texto. Só aparece no erro, e só nos tipos em que a
   * tela não a mostra sozinha — escrever, montar e preencher. Em múltipla
   * escolha a alternativa certa já está acesa ali em cima.
   */
  respostaCerta?: string;
  /** Quanto de XP este acerto valeu. Vira o `+N XP` ao lado do título. */
  xpGanho: number;
  /** No último card o botão fecha a sessão em vez de seguir. */
  ultimo?: boolean;
  aoContinuar: () => void;
};

export function PainelFeedback({
  acertou,
  dePrimeira,
  explicacao,
  respostaCerta,
  xpGanho,
  ultimo = false,
  aoContinuar
}: Props) {
  const cores = useCores();
  const insets = useSafeAreaInsets();
  const reduzido = useMovimentoReduzido();

  // O painel precisa da própria altura para saber de quanto subir. Antes da
  // medição fica invisível — senão apareceria no lugar por um quadro.
  const [altura, setAltura] = useState(0);
  const subida = useSubida(altura, reduzido);

  const titulo = acertou ? (dePrimeira ? 'Certo' : 'Agora sim') : 'Não é essa';
  const delta = acertou ? `+${xpGanho} XP` : 'volta pra fila';
  const cor = acertou ? cores.acento : cores.erro;
  const fundo = acertou ? cores.acentoFundo : cores.erroFundo;

  const rotuloBotao = ultimo ? 'Fechar sessão' : acertou ? 'Seguir' : 'Volta pra fila';

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      onLayout={(e) => setAltura(e.nativeEvent.layout.height)}
      style={[
        estilos.painel,
        {
          backgroundColor: fundo,
          borderTopColor: cor,
          paddingBottom: 30 + insets.bottom
        },
        subida
      ]}
    >
      <View style={estilos.cabecalho}>
        <Text style={[estilos.titulo, { color: cor }]}>{titulo}</Text>
        <Text style={[estilos.delta, { color: cor }]}>{delta}</Text>
      </View>

      <TextoRico texto={explicacao} estilo={estilos.explicacao} cor={cores.texto} />

      {!acertou && respostaCerta && (
        <View style={[estilos.resposta, { borderLeftColor: cores.erro }]}>
          <Text style={[estilos.rotuloResposta, { color: cores.erro }]}>ERA</Text>
          <Text style={[estilos.respostaTexto, { color: cores.textoForte }]}>{respostaCerta}</Text>
        </View>
      )}

      <Botao
        rotulo={rotuloBotao}
        variante={acertou ? 'primario' : 'erro'}
        altura={56}
        estilo={estilos.botao}
        aoTocar={aoContinuar}
      />
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  painel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: tamanhos.trilho,
    paddingHorizontal: margemTela,
    paddingTop: margemTela
  },

  cabecalho: { flexDirection: 'row', alignItems: 'baseline', gap: 11 },
  titulo: { ...tipo.tituloFeedback },
  delta: { ...tipo.metricaMono },

  explicacao: { ...tipo.corpo, marginTop: 11 },

  resposta: {
    marginTop: espaco.md,
    borderLeftWidth: tamanhos.trilho,
    paddingLeft: espaco.md,
    gap: 5
  },
  rotuloResposta: { ...tipo.rotuloCelula },
  respostaTexto: { ...tipo.codigo, lineHeight: 22 },

  botao: { marginTop: 20 }
});
