import { Animated, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { animacao, espaco, tamanhos, tipo } from '@/tema';
import type { Paleta } from '@/tema/temas';
import { useCores } from '@/dados/TemaContexto';
import { NIVEIS, type Nivel } from '@/nucleo/dificuldade';
import { useLargura, useMovimentoReduzido, usePiscar } from './movimento';

/**
 * As peças pequenas que aparecem em quase toda tela.
 *
 * Ficam juntas de propósito: cada uma tem dez linhas, e um arquivo por peça
 * daria mais tempo procurando do que lendo.
 *
 * Note o que **não** está mais aqui: `Cartao`, `Chip`, `Pilula`, `Selo`. O
 * redesign não tem cartão nem pílula — o que separa dois blocos é uma régua de
 * 1 px, e o que rotula uma seção é a `Rotulo` mono em caixa alta. Peça com
 * fundo e canto arredondado hoje é ruído.
 */

/**
 * O rótulo mono em caixa alta com `letterSpacing` 2.6 — a assinatura da
 * identidade Terminal.
 *
 * Aparece **uma vez por seção**: no acento quando a seção é o foco da tela,
 * em `legenda` quando é apoio. Duas seções em acento na mesma tela e o acento
 * deixa de significar "olhe aqui".
 */
export function Rotulo({
  children,
  cor,
  estilo
}: {
  children: string;
  cor?: string;
  estilo?: StyleProp<TextStyle>;
}) {
  const cores = useCores();
  const corFinal = cor ?? cores.legenda;

  return (
    <Text style={[tipo.rotuloSecao, { color: corFinal, textTransform: 'uppercase' }, estilo]}>
      {children}
    </Text>
  );
}

/** A régua de 1 px. O único divisor do app. */
export function Regua({ cor, estilo }: { cor?: string; estilo?: ViewStyle }) {
  const cores = useCores();
  const corFinal = cor ?? cores.linha;

  return <View style={[{ height: tamanhos.linha, backgroundColor: corFinal }, estilo]} />;
}

/**
 * Barra de progresso: um trilho na cor `linha` e o preenchimento no acento.
 *
 * Três espessuras no app inteiro — 2 para trilha e XP do topo, 3 para a sessão
 * e o rank. Nada de raio: é um retângulo.
 */
export function Trilho({
  fracao,
  cor,
  altura = tamanhos.trilho,
  duracao = animacao.barra as number,
  estilo
}: {
  fracao: number;
  cor?: string;
  altura?: number;
  duracao?: number;
  estilo?: ViewStyle;
}) {
  const cores = useCores();
  const corFinal = cor ?? cores.acento;
  const reduzido = useMovimentoReduzido();
  const largura = useLargura(fracao, duracao, reduzido);

  return (
    <View style={[{ height: altura, backgroundColor: cores.linha }, estilo]}>
      <Animated.View style={{ width: largura, height: '100%', backgroundColor: corFinal }} />
    </View>
  );
}

/**
 * O cursor ▌ que pisca ao lado do rótulo de um botão habilitado.
 *
 * É o detalhe que faz o botão parecer um prompt de terminal esperando o
 * comando. Botão desabilitado não tem cursor — nada está esperando.
 */
export function Cursor({ cor }: { cor?: string }) {
  const cores = useCores();
  const corFinal = cor ?? cores.acentoFundo;
  const reduzido = useMovimentoReduzido();
  const piscar = usePiscar(reduzido);

  return (
    <Animated.Text style={[tipo.cursor, { color: corFinal }, piscar]} accessibilityElementsHidden>
      ▌
    </Animated.Text>
  );
}

/**
 * Texto com trechos de código.
 *
 * O conteúdo em JSON marca código no meio da frase com crase e ênfase com
 * asteriscos. Aqui a crase vira mono no acento e **o marcador nunca aparece na
 * tela** — mostrar a crase é o bug mais fácil de deixar passar e o mais feio
 * de ver num card.
 *
 * Sem biblioteca de markdown: são dois marcadores, não um documento.
 */
export function TextoRico({
  texto,
  estilo,
  cor,
  estiloCodigo = tipo.codigoNoTexto14,
  corCodigo
}: {
  texto: string;
  estilo: StyleProp<TextStyle>;
  cor?: string;
  estiloCodigo?: StyleProp<TextStyle>;
  corCodigo?: string;
}) {
  const cores = useCores();
  const corFinal = cor ?? cores.texto;
  const corCodigoFinal = corCodigo ?? cores.acento;
  const pedacos = texto.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);

  return (
    <Text style={[estilo, { color: corFinal }]}>
      {pedacos.map((pedaco, indice) => {
        if (pedaco.startsWith('`') && pedaco.endsWith('`')) {
          return (
            <Text key={indice} style={[estiloCodigo, { color: corCodigoFinal }]}>
              {pedaco.slice(1, -1)}
            </Text>
          );
        }
        if (pedaco.startsWith('**') && pedaco.endsWith('**')) {
          return (
            <Text key={indice} style={{ color: cores.textoForte }}>
              {pedaco.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={indice}>{pedaco}</Text>;
      })}
    </Text>
  );
}

function corNivelDe(cores: Paleta): Record<Nivel, string> {
  return { 1: cores.nivel1, 2: cores.nivel2, 3: cores.nivel3 };
}

/** A cor de um nível de dificuldade, para quem só precisa da cor. */
export function corDoNivel(nivel: Nivel, cores: Paleta): string {
  return corNivelDe(cores)[nivel];
}

/**
 * A contagem por dificuldade da tela de trilhas: número na cor do nível,
 * palavra em mono `legenda`.
 */
export function ContagemNiveis({ contagem }: { contagem: Record<Nivel, number> }) {
  const cores = useCores();
  const corNivel = corNivelDe(cores);
  const palavras: Record<Nivel, string> = { 1: 'leves', 2: 'médios', 3: 'difíceis' };

  return (
    <View style={estilos.niveis}>
      {([1, 2, 3] as Nivel[]).map((nivel) => (
        <View key={nivel} style={estilos.nivel}>
          <Text style={[tipo.metricaPequena, { color: corNivel[nivel] }]}>{contagem[nivel]}</Text>
          <Text style={[tipo.metricaMono, { color: cores.legenda }]}>{palavras[nivel]}</Text>
        </View>
      ))}
    </View>
  );
}

/** O nome do nível, em mono, na cor do nível. Vai na faixa do exercício. */
export function rotuloDoNivel(nivel: Nivel): string {
  return NIVEIS[nivel].nome.toLowerCase();
}

/**
 * Uma régua de estatística: rótulo mono à esquerda, valor à direita.
 *
 * É o padrão de lista do redesign inteiro — relâmpago, resumo, liga. A régua
 * fica em cima; quem for o último da lista pede `ultima` para fechar embaixo.
 */
export function ReguaMetrica({
  rotulo,
  valor,
  corValor,
  ultima = false
}: {
  rotulo: string;
  valor: string;
  corValor?: string;
  ultima?: boolean;
}) {
  const cores = useCores();
  const corValorFinal = corValor ?? cores.textoForte;

  return (
    <View
      style={[
        estilos.reguaMetrica,
        { borderTopColor: cores.linha },
        ultima && estilos.reguaFinal,
        ultima && { borderBottomColor: cores.linha }
      ]}
    >
      <Text style={[tipo.reguaMono, { color: cores.legenda }]}>{rotulo}</Text>
      <Text style={[tipo.metricaPequena, { color: corValorFinal }]}>{valor}</Text>
    </View>
  );
}

/**
 * Estado vazio.
 *
 * Nunca é texto solto no meio da tela: traz o rótulo da seção, uma frase que
 * explica por que está vazio, e **sempre uma saída** — senão a tela vira beco.
 *
 * No redesign perdeu a caixa tracejada: é só texto alinhado à esquerda, como
 * todo o resto.
 */
export function Vazio({
  titulo,
  texto,
  children
}: {
  titulo: string;
  texto: string;
  children?: React.ReactNode;
}) {
  const cores = useCores();

  return (
    <View style={estilos.vazio}>
      <Rotulo>sem nada aqui</Rotulo>
      <Text style={[tipo.titulo, { color: cores.textoForte }]}>{titulo}</Text>
      <Text style={[tipo.notaMono, { color: cores.legenda }]}>{texto}</Text>
      {children ? <View style={estilos.vazioAcao}>{children}</View> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  niveis: { flexDirection: 'row', gap: 16 },
  nivel: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },

  reguaMetrica: {
    borderTopWidth: tamanhos.linha,
    paddingVertical: espaco.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco.md
  },
  reguaFinal: { borderBottomWidth: tamanhos.linha },

  vazio: { gap: espaco.md },
  vazioAcao: { marginTop: espaco.sm }
});
