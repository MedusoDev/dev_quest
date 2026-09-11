import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { animacao, espaco, tamanhos, tipo } from '@/tema';
import type { Paleta } from '@/tema/temas';
import { useCores } from '@/dados/TemaContexto';
import { TextoRico } from './basicos';
import { useMovimentoReduzido } from './movimento';

/**
 * ALTERNATIVA DE MÚLTIPLA ESCOLHA.
 *
 * Uma régua: a letra numa coluna de 22 dp e o texto ao lado. Sem raio, sem
 * relevo, sem selo colorido — fundo `superficie` e uma borda de 1 px.
 *
 * ── UM TOQUE SÓ ───────────────────────────────────────────────────────────
 *
 * A partir da primeira escolha as alternativas ficam inertes. Não há botão de
 * "verificar": tocar **é** responder. Isso tira uma decisão do caminho e é o
 * que faz a sessão ter ritmo de teclado em vez de ritmo de formulário.
 *
 * ── DEPOIS DE RESPONDER ───────────────────────────────────────────────────
 *
 * As alternativas **não somem e não embaralham**. A certa acende no acento, a
 * escolhida errada fica vermelha, e as outras apagam. A pessoa precisa comparar
 * o que escolheu com o que era certo, lado a lado, sem a tela se reorganizar
 * embaixo dela.
 *
 * ── O ESTADO NÃO NASCE AQUI ───────────────────────────────────────────────
 *
 * O componente é burro de propósito: recebe `escolhida` e `revelado` de fora e
 * só desenha. Quem sabe a resposta certa é a sessão. Componente que guarda a
 * própria verdade é componente que mente quando o card muda.
 */

type Props = {
  /** 0 = A, 1 = B, 2 = C, 3 = D. */
  indice: number;
  texto: string;
  escolhida: boolean;
  /** Já respondeu — agora as cores contam a verdade. */
  revelado: boolean;
  correta: boolean;
  /** Alternativa que é valor de código, não frase. */
  mono?: boolean;
  aoTocar: () => void;
};

const LETRAS = ['A', 'B', 'C', 'D'] as const;

type Estado = 'repouso' | 'escolhida' | 'certa' | 'errada' | 'descartada';

type Aparencia = { fundo: string; borda: string; letra: string; texto: string };

function aparenciaDe(cores: Paleta): Record<Estado, Aparencia> {
  return {
    repouso: {
      fundo: cores.superficie,
      borda: cores.linha,
      letra: cores.legenda,
      texto: cores.texto
    },
    escolhida: {
      fundo: cores.superficie,
      borda: cores.acento,
      letra: cores.acento,
      texto: cores.textoForte
    },
    certa: {
      fundo: cores.acentoFundo,
      borda: cores.acento,
      letra: cores.acento,
      texto: cores.textoForte
    },
    errada: {
      fundo: cores.erroFundo,
      borda: cores.erro,
      letra: cores.erro,
      texto: cores.texto
    },
    descartada: {
      fundo: cores.superficie,
      borda: cores.linha,
      letra: cores.desativado2,
      texto: cores.desativado
    }
  };
}

/**
 * Os cinco casos em cinco linhas.
 *
 * A ordem das perguntas é a regra inteira: `revelado` manda em tudo. Antes
 * disso, só interessa se foi escolhida. Depois, ser a correta vence — inclusive
 * quando a pessoa **não** a escolheu, que é justo o caso em que ela mais
 * precisa ver qual era.
 */
function estadoDe({ escolhida, revelado, correta }: Pick<Props, 'escolhida' | 'revelado' | 'correta'>): Estado {
  if (!revelado) return escolhida ? 'escolhida' : 'repouso';
  if (correta) return 'certa';
  if (escolhida) return 'errada';
  return 'descartada';
}

export function Alternativa({
  indice,
  texto,
  escolhida,
  revelado,
  correta,
  mono = false,
  aoTocar
}: Props) {
  const cores = useCores();
  const reduzido = useMovimentoReduzido();

  const estado = estadoDe({ escolhida, revelado, correta });
  const aparencia = aparenciaDe(cores)[estado];

  // A transição de 180 ms é de cor, não de transform: fica fora da driver
  // nativa. É pouco quadro e acontece uma vez por card — cabe folgado.
  const transicao = useRef(new Animated.Value(0)).current;
  const anterior = useRef(aparencia);

  useEffect(() => {
    if (reduzido) {
      anterior.current = aparencia;
      transicao.setValue(0);
      return;
    }

    transicao.setValue(0);
    Animated.timing(transicao, {
      toValue: 1,
      duration: animacao.alternativa,
      useNativeDriver: false
    }).start(() => {
      anterior.current = aparencia;
    });
  }, [estado, reduzido, transicao, aparencia]);

  const misturar = (de: string, para: string) =>
    transicao.interpolate({ inputRange: [0, 1], outputRange: [de, para] });

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: escolhida, disabled: revelado }}
      // `disabled` em vez de um `if` dentro de `aoTocar`: assim o Pressable
      // também para de dar retorno visual, que sugeriria dar para mudar de ideia.
      disabled={revelado}
      onPress={aoTocar}
      style={({ pressed }) => pressed && !revelado ? estilos.pressionada : undefined}
    >
      <Animated.View
        style={[
          estilos.caixa,
          {
            backgroundColor: misturar(anterior.current.fundo, aparencia.fundo),
            borderColor: misturar(anterior.current.borda, aparencia.borda)
          }
        ]}
      >
        <Text style={[estilos.letra, { color: aparencia.letra }]}>{LETRAS[indice] ?? '?'}</Text>

        <View style={estilos.corpo}>
          {mono ? (
            <Text style={[tipo.codigo, { color: aparencia.texto }]}>{texto}</Text>
          ) : (
            <TextoRico
              texto={texto}
              estilo={tipo.alternativa}
              cor={aparencia.texto}
              corCodigo={estado === 'descartada' ? cores.desativado : cores.acento}
            />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    minHeight: tamanhos.alternativa,
    paddingVertical: 13,
    paddingHorizontal: espaco.md + 2,
    borderWidth: tamanhos.linha
  },
  pressionada: { opacity: 0.8 },

  letra: { ...tipo.metricaMonoMedia, fontFamily: tipo.rotuloSecao.fontFamily, width: 22 },
  corpo: { flex: 1 }
});
