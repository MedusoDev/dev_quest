import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { espaco, tamanhos, tipo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { destacarSintaxe, type Linguagem } from '@/nucleo/destacarSintaxe';

/**
 * BLOCO DE CÓDIGO.
 *
 * No redesign é uma **barra de 2 px no acento à esquerda** e fundo
 * `acentoFundo` — sem borda em volta, sem raio. A barra é o que diz "isto é
 * código" sem precisar de moldura.
 *
 * Duas regras que não são estética, são funcionalidade:
 *
 *   1. **Nunca quebra linha.** Rola na horizontal. Se quebrasse, a indentação
 *      se desalinharia e o card de "ache o erro" ficaria impossível — a pessoa
 *      passaria a procurar um erro que o layout inventou.
 *
 *   2. **Monoespaçada sempre**, 14 / 26. É o que mantém as colunas alinhadas.
 *
 * A paleta de sintaxe está reduzida a três cores (ver `coresCodigo`): acento
 * para o que importa, `textoFraco` para o resto, `legenda` para comentário. Um
 * bloco colorido demais competiria com a pergunta acima dele.
 *
 * Quando `aoTocarLinha` é passado, cada linha vira um alvo tocável. É assim que
 * o card "ache o erro" funciona, sem precisar de um segundo componente de
 * código que sairia do lugar com o tempo.
 */

type Props = {
  codigo: string;
  linguagem: Linguagem;
  /** Numera as linhas. O card "ache o erro" precisa; os outros não. */
  numerado?: boolean;
  /** Altura máxima antes de rolar na vertical. O card `estrutura` usa ~232. */
  alturaMaxima?: number;
  aoTocarLinha?: (indice: number) => void;
  linhaSelecionada?: number | null;
  linhaCerta?: number | null;
  revelado?: boolean;
};

export function BlocoCodigo({
  codigo,
  linguagem,
  numerado = false,
  alturaMaxima,
  aoTocarLinha,
  linhaSelecionada = null,
  linhaCerta = null,
  revelado = false
}: Props) {
  const cores = useCores();
  const coresCodigo = {
    palavraChave: cores.acento,
    texto: cores.acentoTexto,
    numero: cores.acento,
    comentario: cores.legenda,
    tipo: cores.acento,
    identificador: cores.textoFraco,
    pontuacao: cores.legenda
  };
  const linhas = codigo.split('\n');
  const tocavel = Boolean(aoTocarLinha);

  // Largura fixa da coluna de números, calculada pela linha mais alta. Sem
  // isso o código dança para a direita quando a numeração passa de 9 para 10.
  const larguraNumero = Math.max(18, String(linhas.length).length * 10);

  const corpo = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.conteudoHorizontal}
    >
      <View style={estilos.pilha}>
        {linhas.map((linha, indice) => {
          const tokens = destacarSintaxe(linha, linguagem);
          const vazia = linha.trim() === '';

          const realce = !revelado
            ? linhaSelecionada === indice && [estilos.escolhida, { borderLeftColor: cores.acento }]
            : indice === linhaCerta
              ? [estilos.certa, { borderLeftColor: cores.acento }]
              : indice === linhaSelecionada
                ? [estilos.errada, { borderLeftColor: cores.erro }]
                : null;

          const conteudo = (
            <>
              {numerado && (
                <Text style={[estilos.numero, { minWidth: larguraNumero, color: cores.desativado }]}>
                  {indice + 1}
                </Text>
              )}
              <Text numberOfLines={1} style={[estilos.linha, { color: coresCodigo.identificador }]}>
                {/* Linha em branco vira um espaço: sem conteúdo o <Text> teria
                    altura zero e o bloco engoliria a linha vazia entre métodos. */}
                {tokens.length === 0
                  ? ' '
                  : tokens.map((token, posicao) => (
                      <Text key={posicao} style={{ color: coresCodigo[token.tipo] }}>
                        {token.texto}
                      </Text>
                    ))}
              </Text>
            </>
          );

          // Linha em branco não é alvo: não faz sentido apontá-la como o erro.
          if (tocavel && !vazia) {
            return (
              <Pressable
                key={indice}
                accessibilityRole="button"
                disabled={revelado}
                onPress={() => aoTocarLinha!(indice)}
                style={({ pressed }) => [
                  estilos.fileira,
                  realce,
                  pressed && !revelado && estilos.pressionada
                ]}
              >
                {conteudo}
              </Pressable>
            );
          }

          return (
            <View key={indice} style={[estilos.fileira, realce]}>
              {conteudo}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <View
      style={[
        estilos.caixa,
        { backgroundColor: cores.acentoFundo, borderLeftColor: cores.acento },
        alturaMaxima != null && { maxHeight: alturaMaxima }
      ]}
    >
      {alturaMaxima != null ? (
        <ScrollView showsVerticalScrollIndicator={false}>{corpo}</ScrollView>
      ) : (
        corpo
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    borderLeftWidth: tamanhos.trilho,
    paddingVertical: espaco.md + 2,
    overflow: 'hidden'
  },

  /** `flexGrow` é o que deixa o conteúdo transbordar em vez de encolher. */
  conteudoHorizontal: { flexGrow: 1 },
  pilha: { minWidth: '100%' },

  fileira: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingHorizontal: 18,
    // Espaço para o realce da linha não colar no texto.
    borderLeftWidth: tamanhos.trilho,
    borderLeftColor: 'transparent'
  },
  pressionada: { backgroundColor: 'rgba(199,247,78,0.06)' },
  escolhida: { backgroundColor: 'rgba(199,247,78,0.10)' },
  certa: { backgroundColor: 'rgba(199,247,78,0.14)' },
  errada: { backgroundColor: 'rgba(248,113,113,0.14)' },

  linha: { ...tipo.codigo },
  numero: { ...tipo.codigo, textAlign: 'right' }
});
