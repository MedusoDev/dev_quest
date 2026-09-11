import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

import { animacao, curva, deslocamentoAba, passosTremor } from '@/tema';

/**
 * As animações do app, num lugar só.
 *
 * Duas regras valem para todas:
 *
 *   1. `useNativeDriver: true` em tudo que for `transform` ou `opacity` — roda
 *      na thread de UI e não engasga enquanto a JS monta o próximo exercício.
 *   2. Com "reduzir movimento" ligado no sistema, **laços não rodam** e
 *      transições viram corte seco. O feedback de acerto e erro continua
 *      acontecendo; só o movimento decorativo some.
 */

/** Lê a preferência do sistema e acompanha se ela mudar com o app aberto. */
export function useMovimentoReduzido(): boolean {
  const [reduzido, setReduzido] = useState(false);

  useEffect(() => {
    let vivo = true;

    AccessibilityInfo.isReduceMotionEnabled().then((valor) => {
      if (vivo) setReduzido(valor);
    });

    const inscricao = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzido);

    return () => {
      vivo = false;
      inscricao.remove();
    };
  }, []);

  return reduzido;
}

type Bezier = readonly [number, number, number, number];

export const suavizar = (b: Bezier) => Easing.bezier(b[0], b[1], b[2], b[3]);

/**
 * Entrada de tela de aba: desliza **na direção do toque**.
 *
 * `direcao` é +1 quando a aba nova está à direita da anterior, -1 quando está à
 * esquerda, 0 na primeira montagem. O deslocamento sai de `deslocamentoAba`.
 */
export function useEntradaAba(chave: unknown, direcao: number, reduzido = false) {
  const valor = useRef(new Animated.Value(reduzido ? 1 : 0)).current;

  useEffect(() => {
    if (reduzido) {
      valor.setValue(1);
      return;
    }

    valor.setValue(0);
    Animated.timing(valor, {
      toValue: 1,
      duration: animacao.aba,
      easing: suavizar(curva.saida),
      useNativeDriver: true
    }).start();
  }, [chave, direcao, reduzido, valor]);

  return {
    opacity: valor,
    transform: [
      {
        translateX: valor.interpolate({
          inputRange: [0, 1],
          outputRange: [direcao * deslocamentoAba, 0]
        })
      }
    ]
  };
}

/**
 * O "pop" do redesign: nasce em 0.62, passa de 1.16 e assenta em 1.
 *
 * O excesso é bem maior que o do desenho antigo (1.04) — é ele que faz o nó
 * desbloqueando e o XP do resumo parecerem estourar na tela em vez de crescer.
 */
export function usePop(ativo: boolean, duracao: number = animacao.pop, reduzido = false) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ativo) return;

    if (reduzido) {
      valor.setValue(1);
      return;
    }

    valor.setValue(0);
    Animated.timing(valor, {
      toValue: 1,
      duration: duracao,
      easing: suavizar(curva.barra),
      useNativeDriver: true
    }).start();
  }, [ativo, duracao, reduzido, valor]);

  return {
    opacity: valor.interpolate({ inputRange: [0, 0.62, 1], outputRange: [0, 1, 1] }),
    transform: [
      {
        scale: valor.interpolate({
          inputRange: [0, 0.62, 1],
          outputRange: [0.62, 1.16, 1]
        })
      }
    ]
  };
}

/**
 * A batida da sequência ao fechar o dia: cresce girando, recua e assenta.
 *
 * Só acontece quando o dia é contado de verdade — rever a sessão não bate. Ver
 * a regra do `licaoFeita` em `ProgressoContexto`.
 */
export function useBatida(ativo: boolean, reduzido = false) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ativo || reduzido) return;

    valor.setValue(0);
    Animated.timing(valor, {
      toValue: 1,
      duration: animacao.beat,
      easing: Easing.linear,
      useNativeDriver: true
    }).start(() => valor.setValue(0));
  }, [ativo, reduzido, valor]);

  const passos = [0, 0.2, 0.44, 0.68, 1];

  return {
    transform: [
      { scale: valor.interpolate({ inputRange: passos, outputRange: [1, 1.55, 0.92, 1.16, 1] }) },
      {
        rotate: valor.interpolate({
          inputRange: passos,
          outputRange: ['0deg', '-6deg', '0deg', '0deg', '0deg']
        })
      }
    ]
  };
}

/**
 * O tremor do erro: cinco paradas em 420 ms.
 *
 * Some por completo com movimento reduzido — é o único caso em que a
 * informação já está na cor e no texto, então o movimento é só ênfase.
 */
export function useTremor(ativo: boolean, reduzido = false) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ativo || reduzido) return;

    const trecho = animacao.tremor / (passosTremor.length - 1);

    Animated.sequence(
      passosTremor.slice(1).map((_, indice) =>
        Animated.timing(valor, {
          toValue: indice + 1,
          duration: trecho,
          easing: suavizar(curva.tremor),
          useNativeDriver: true
        })
      )
    ).start(() => valor.setValue(0));
  }, [ativo, reduzido, valor]);

  return {
    transform: [
      {
        translateX: valor.interpolate({
          inputRange: passosTremor.map((_, i) => i),
          outputRange: [...passosTremor]
        })
      }
    ]
  };
}

/**
 * O cursor ▌ piscando ao lado do rótulo do botão.
 *
 * `steps(1)` no CSS vira aqui uma interpolação com degrau: o valor salta de 1
 * para 0 na metade do ciclo, sem passar pelo meio. Uma interpolação linear
 * daria um *fade*, que é outra coisa — o cursor de terminal não desvanece.
 */
export function usePiscar(reduzido = false) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzido) {
      valor.setValue(0);
      return;
    }

    const laco = Animated.loop(
      Animated.timing(valor, {
        toValue: 1,
        duration: animacao.cursor,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );

    laco.start();
    return () => laco.stop();
  }, [reduzido, valor]);

  return {
    opacity: valor.interpolate({
      inputRange: [0, 0.489, 0.49, 1],
      outputRange: [1, 1, 0, 0]
    })
  };
}

/**
 * A linha de varredura que desce sem parar pelo cartão da diária.
 *
 * Vai de -100% a 900% da própria altura, o que com 1 dp de altura significa
 * atravessar os ~10 dp que o cartão precisa. A altura real entra por
 * `percurso`: a View pai mede e passa.
 */
export function useVarredura(percurso: number, reduzido = false) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzido || percurso <= 0) return;

    const laco = Animated.loop(
      Animated.timing(valor, {
        toValue: 1,
        duration: animacao.varredura,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );

    laco.start();
    return () => laco.stop();
  }, [percurso, reduzido, valor]);

  return {
    transform: [
      { translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [0, percurso] }) }
    ]
  };
}

/**
 * Painel que sobe do rodapé: `translateY` da própria altura até 0.
 *
 * A altura vem de fora porque o painel só a conhece depois do primeiro
 * `onLayout` — antes disso ele fica invisível, senão apareceria no lugar por
 * um quadro.
 */
export function useSubida(altura: number, reduzido = false, duracao: number = animacao.feedback) {
  const valor = useRef(new Animated.Value(0)).current;
  const medido = altura > 0;

  useEffect(() => {
    if (!medido) return;

    if (reduzido) {
      valor.setValue(1);
      return;
    }

    Animated.timing(valor, {
      toValue: 1,
      duration: duracao,
      easing: suavizar(curva.saida),
      useNativeDriver: true
    }).start();
  }, [medido, duracao, reduzido, valor]);

  return {
    opacity: medido ? 1 : 0,
    transform: [
      { translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [altura, 0] }) }
    ]
  };
}

/** A sessão abrindo em cima de Hoje: escala 0.9 → 1 com opacidade. */
export function useAbertura(reduzido = false) {
  const valor = useRef(new Animated.Value(reduzido ? 1 : 0)).current;

  useEffect(() => {
    if (reduzido) {
      valor.setValue(1);
      return;
    }

    Animated.timing(valor, {
      toValue: 1,
      duration: animacao.sessao,
      easing: suavizar(curva.saida),
      useNativeDriver: true
    }).start();
  }, [reduzido, valor]);

  return {
    opacity: valor,
    transform: [{ scale: valor.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }]
  };
}

/**
 * Uma peça de confete caindo.
 *
 * Roda **uma vez**, não em laço: confete que não para vira ruído de fundo e a
 * pessoa deixa de ler o número que ele estava comemorando.
 */
export function useQueda(duracao: number, atraso: number, reduzido = false) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzido) return;

    Animated.timing(valor, {
      toValue: 1,
      duration: duracao,
      delay: atraso,
      easing: Easing.linear,
      useNativeDriver: true
    }).start();
  }, [duracao, atraso, reduzido, valor]);

  return {
    opacity: valor.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] }),
    transform: [
      { translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [-50, 760] }) },
      { rotate: valor.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] }) }
    ]
  };
}

/**
 * Uma barra de progresso animando de largura.
 *
 * Largura é layout, então aqui `useNativeDriver` é `false` — é a exceção da
 * regra do topo do arquivo, e a única. A alternativa (`scaleX` de uma View de
 * largura fixa) esticaria a borda junto em qualquer barra que tivesse uma.
 */
export function useLargura(fracao: number, duracao: number = animacao.barra, reduzido = false) {
  const alvo = Math.min(Math.max(fracao, 0), 1);
  const valor = useRef(new Animated.Value(alvo)).current;

  useEffect(() => {
    if (reduzido) {
      valor.setValue(alvo);
      return;
    }

    Animated.timing(valor, {
      toValue: alvo,
      duration: duracao,
      easing: suavizar(curva.barra),
      useNativeDriver: false
    }).start();
  }, [alvo, duracao, reduzido, valor]);

  return valor.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
}
