import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

import { cores, espaco, raio, tamanhos, tipo } from '@/tema';
import type { Paleta } from '@/tema/temas';
import { useCores } from '@/dados/TemaContexto';
import { Cursor } from './basicos';

/**
 * BOTÃO — a peça mais importante do app.
 *
 * Cantos arredondados (`raio.md`) e, nas variantes de fundo cheio (primário e
 * erro), uma sombra colorida na própria cor de fundo — dá relevo e dinamismo
 * sem introduzir uma segunda cor de acento.
 *
 * O que ficou do redesign anterior: o **cursor ▌ piscando** ao lado do
 * rótulo. Botão habilitado tem cursor, botão desabilitado não — é a diferença
 * mais visível entre os dois estados, junto com o fundo.
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
  /** Fundo cheio ganha sombra colorida na própria cor; borda, não. */
  sombra: boolean;
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
      cursor: true,
      sombra: true
    },
    secundario: {
      caixa: { borderWidth: tamanhos.linha, borderColor: c.linha },
      texto: c.textoFraco,
      estiloTexto: tipo.botaoSecundario,
      altura: tamanhos.botaoSecundario,
      cursor: false,
      sombra: false
    },
    /** Como o secundário, mas com borda e texto que se leem contra o fundo —
        para ações de mesmo peso que a primária, como "Continuar com Google". */
    secundarioForte: {
      caixa: { borderWidth: tamanhos.linha, borderColor: c.texto },
      texto: c.textoForte,
      estiloTexto: tipo.botaoSecundario,
      altura: tamanhos.botaoSecundario,
      cursor: false,
      sombra: false
    },
    discreto: {
      caixa: { borderWidth: tamanhos.linha, borderColor: c.linha },
      texto: c.legenda,
      estiloTexto: tipo.botaoDiscreto,
      altura: tamanhos.campo,
      cursor: false,
      sombra: false
    },
    erro: {
      caixa: { backgroundColor: c.erro },
      texto: c.erroFundo,
      estiloTexto: tipo.botaoMenor,
      altura: 56,
      cursor: true,
      sombra: true
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

  const sombra =
    aparencia.sombra && !desabilitado
      ? sombraPara((caixa as ViewStyle).backgroundColor as string)
      : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      style={({ pressed }) => [pressed && !desabilitado && estilos.pressionado, sombra, estilo]}
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

/** Sombra colorida na própria cor de fundo do botão — dá relevo sem 2ª cor de acento. */
function sombraPara(cor: string): ViewStyle {
  return {
    borderRadius: raio.md,
    shadowColor: cor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6
  };
}

const estilos = StyleSheet.create({
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.sm,
    paddingHorizontal: espaco.lg,
    borderRadius: raio.md
  },
  pressionado: { opacity: 0.75 },
  iconeDesabilitado: { opacity: 0.4 }
});
