import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

import { cores, espaco, tamanhos, tipo } from '@/tema';
import type { Paleta } from '@/tema/temas';
import { useCores } from '@/dados/TemaContexto';
import { Cursor } from './basicos';

/**
 * BOTÃO — a peça mais importante do app.
 *
 * No redesign ele é um **retângulo cheio, sem raio e sem sombra**. A camada
 * sólida deslocada que ele tinha antes foi embora junto com os cantos
 * arredondados: aqui o destaque vem do acento contra o preto, não do relevo.
 *
 * O que ficou no lugar do peso: o **cursor ▌ piscando** ao lado do rótulo.
 * Botão habilitado tem cursor, botão desabilitado não — é a diferença mais
 * visível entre os dois estados, junto com o fundo.
 *
 * Feedback de toque é opacidade, e só. Escurecer o acento no toque criaria uma
 * segunda cor de acento que não existe na paleta.
 */

export type VarianteBotao = 'primario' | 'secundario' | 'secundarioForte' | 'discreto' | 'erro';

type Props = {
  rotulo: string;
  aoTocar: () => void;
  variante?: VarianteBotao;
  desabilitado?: boolean;
  /** Sobrepõe a altura da variante. O painel de feedback usa 56. */
  altura?: number;
  /** Sobrepõe a cor de fundo. Só o painel de feedback precisa. */
  cor?: string;
  /**
   * Sobrepõe o tema corrente — só para o seletor de tema em Configurações,
   * que precisa mostrar a cor de uma paleta diferente da que está ativa.
   * Sem isto o botão já usa `useCores()` sozinho.
   */
  paleta?: Paleta;
  /** Ícone antes do rótulo — hoje só o "G" da Google. */
  icone?: ReactNode;
  estilo?: ViewStyle;
};

type Aparencia = {
  caixa: ViewStyle;
  texto: string;
  estiloTexto: TextStyle;
  altura: number;
  /** Só o primário e o de erro têm cursor: são os que continuam o fluxo. */
  cursor: boolean;
};

/**
 * Fundo e texto saem da paleta (muda com o tema); altura, borda e tipografia
 * são geometria e ficam fixos — a mesma régua em qualquer tema.
 */
function aparenciaPara(c: typeof cores | Paleta): Record<VarianteBotao, Aparencia> {
  return {
    primario: {
      caixa: { backgroundColor: c.acento },
      texto: c.acentoFundo,
      estiloTexto: tipo.botao,
      altura: tamanhos.botao,
      cursor: true
    },
    secundario: {
      caixa: { borderWidth: tamanhos.linha, borderColor: c.linha },
      texto: c.textoFraco,
      estiloTexto: tipo.botaoSecundario,
      altura: tamanhos.botaoSecundario,
      cursor: false
    },
    /** Como o secundário, mas com borda e texto que se leem contra o fundo —
        para ações de mesmo peso que a primária, como "Continuar com Google". */
    secundarioForte: {
      caixa: { borderWidth: tamanhos.linha, borderColor: c.texto },
      texto: c.textoForte,
      estiloTexto: tipo.botaoSecundario,
      altura: tamanhos.botaoSecundario,
      cursor: false
    },
    discreto: {
      caixa: { borderWidth: tamanhos.linha, borderColor: c.linha },
      texto: c.legenda,
      estiloTexto: tipo.botaoDiscreto,
      altura: tamanhos.campo,
      cursor: false
    },
    erro: {
      caixa: { backgroundColor: c.erro },
      texto: c.erroFundo,
      estiloTexto: tipo.botaoMenor,
      altura: 56,
      cursor: true
    }
  };
}

function desabilitadoPara(c: typeof cores | Paleta): Pick<Aparencia, 'caixa' | 'texto'> {
  return {
    caixa: { backgroundColor: c.linha },
    texto: c.desativado
  };
}

export function Botao({
  rotulo,
  aoTocar,
  variante = 'primario',
  desabilitado = false,
  altura,
  cor,
  paleta,
  icone,
  estilo
}: Props) {
  const temaAtual = useCores();
  const paletaAtiva = paleta ?? temaAtual;
  const aparencia = aparenciaPara(paletaAtiva)[variante];
  const desabilitadoAparencia = desabilitadoPara(paletaAtiva);

  const caixa = desabilitado
    ? desabilitadoAparencia.caixa
    : cor
      ? { ...aparencia.caixa, backgroundColor: cor }
      : aparencia.caixa;

  const corTexto = desabilitado ? desabilitadoAparencia.texto : aparencia.texto;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      style={({ pressed }) => [pressed && !desabilitado && estilos.pressionado, estilo]}
    >
      <View style={[estilos.caixa, caixa, { minHeight: altura ?? aparencia.altura }]}>
        {icone && <View style={desabilitado && estilos.iconeDesabilitado}>{icone}</View>}
        <Text numberOfLines={1} style={[aparencia.estiloTexto, { color: corTexto }]}>
          {rotulo}
        </Text>
        {aparencia.cursor && !desabilitado && <Cursor cor={corTexto} />}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.sm,
    paddingHorizontal: espaco.lg
  },
  pressionado: { opacity: 0.75 },
  iconeDesabilitado: { opacity: 0.4 }
});
