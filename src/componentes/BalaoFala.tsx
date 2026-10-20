import { useEffect, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { fontes, raio } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { useMovimentoReduzido, usePop } from './movimento';
import {
  Devzinho,
  type ExpressaoDevzinho,
  type ItemDevzinho,
  type NivelDevzinho
} from './Devzinho';

/**
 * O BALÃO DE FALA do Devzinho.
 *
 * Nasce com o "pop" do app e escreve o texto letra por letra, como se ele
 * estivesse digitando. Tocar o texto não pula nada — ele é curto de propósito.
 * Com "reduzir movimento", aparece inteiro de uma vez.
 *
 * `ponta` diz para onde o bico aponta: `esquerda` quando o Devzinho está à
 * esquerda do balão, `baixo` quando ele está embaixo.
 */
type PropsBalao = {
  texto: string;
  ponta?: 'esquerda' | 'baixo' | 'direita';
  digitar?: boolean;
  /** Um pedaço extra embaixo do texto: botão, contagem... */
  children?: ReactNode;
  estilo?: ViewStyle;
};

export function BalaoFala({ texto, ponta = 'esquerda', digitar = true, children, estilo }: PropsBalao) {
  const cores = useCores();
  const reduzido = useMovimentoReduzido();
  const pop = usePop(true, 480, reduzido);
  const visivel = useDigitacao(texto, digitar && !reduzido);

  return (
    <Animated.View
      style={[
        estilos.balao,
        { backgroundColor: cores.superficie, borderColor: cores.acentoLinha },
        pop,
        estilo
      ]}
    >
      {/* o bico: um quadrado girado 45°, com a mesma borda */}
      <View
        style={[
          estilos.bico,
          ponta === 'esquerda' && estilos.bicoEsquerda,
          ponta === 'direita' && estilos.bicoDireita,
          ponta === 'baixo' && estilos.bicoBaixo,
          { backgroundColor: cores.superficie, borderColor: cores.acentoLinha }
        ]}
      />
      {/* O texto inteiro, invisível, reserva a altura final — assim o balão
          não cresce aos solavancos enquanto digita. */}
      <View>
        <Text style={[estilos.texto, { color: 'transparent' }]}>{texto}</Text>
        <Text style={[estilos.texto, estilos.sobreposto, { color: cores.textoForte }]}>{visivel}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

/**
 * O Devzinho com um balão do lado. É o "narrador" das telas.
 */
type PropsFala = {
  texto: string;
  expressao?: ExpressaoDevzinho;
  item?: ItemDevzinho;
  nivel?: NivelDevzinho;
  tamanho?: number;
  reacao?: { tipo: 'pulo' | 'tremor'; chave: number | string } | null;
  children?: ReactNode;
  estilo?: ViewStyle;
};

export function DevzinhoFala({
  texto,
  expressao = 'feliz',
  item = 'varinha',
  nivel,
  tamanho = 96,
  reacao,
  children,
  estilo
}: PropsFala) {
  return (
    <View style={[estilos.linha, estilo]}>
      <Devzinho tamanho={tamanho} expressao={expressao} item={item} nivel={nivel} reacao={reacao} />
      <BalaoFala key={texto} texto={texto} ponta="esquerda" estilo={estilos.balaoFlex}>
        {children}
      </BalaoFala>
    </View>
  );
}

function useDigitacao(texto: string, ativo: boolean) {
  const [quantos, setQuantos] = useState(ativo ? 0 : texto.length);

  useEffect(() => {
    if (!ativo) {
      setQuantos(texto.length);
      return;
    }

    setQuantos(0);
    const passo = setInterval(() => {
      setQuantos((n) => {
        if (n >= texto.length) {
          clearInterval(passo);
          return n;
        }
        return n + 1;
      });
    }, 24);

    return () => clearInterval(passo);
  }, [texto, ativo]);

  return texto.slice(0, quantos);
}

const TAMANHO_BICO = 12;

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balaoFlex: { flex: 1 },
  balao: {
    borderWidth: 1.5,
    borderRadius: raio.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10
  },
  texto: { fontFamily: fontes.semi, fontSize: 15, lineHeight: 21 },
  sobreposto: { position: 'absolute', left: 0, top: 0, right: 0 },
  bico: {
    position: 'absolute',
    width: TAMANHO_BICO,
    height: TAMANHO_BICO,
    borderWidth: 1.5,
    transform: [{ rotate: '45deg' }]
  },
  bicoEsquerda: {
    left: -TAMANHO_BICO / 2 - 1,
    top: '50%',
    marginTop: -TAMANHO_BICO / 2,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent'
  },
  bicoDireita: {
    right: -TAMANHO_BICO / 2 - 1,
    top: '50%',
    marginTop: -TAMANHO_BICO / 2,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent'
  },
  bicoBaixo: {
    bottom: -TAMANHO_BICO / 2 - 1,
    left: '50%',
    marginLeft: -TAMANHO_BICO / 2,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent'
  }
});
