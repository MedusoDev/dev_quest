import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { useRouter } from 'expo-router';

import { animacao, curva, espaco, margemTela, tamanhos, tipo, topoConteudo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { useProgresso } from '@/dados/ProgressoContexto';
import { glossarioCompleto } from '@/nucleo/conteudo';
import { BlocoCodigo } from '@/componentes/BlocoCodigo';
import { Botao } from '@/componentes/Botao';
import { Regua, Rotulo, Vazio } from '@/componentes/basicos';
import { suavizar, useMovimentoReduzido } from '@/componentes/movimento';

/**
 * GLOSSÁRIO — a colinha.
 *
 * Todos os termos das lições com definição e exemplo, buscáveis, fora da
 * sessão. É a tela que se abre do lado enquanto se programa de verdade — e por
 * isso ela não é prova: mostra a resposta inteira, sem esconder nada.
 *
 * ── POR QUE SOBE DO RODAPÉ ────────────────────────────────────────────────
 *
 * É uma consulta, não um destino: sobe por cima de tudo, **inclusive da barra
 * de abas**, e desce de volta para o lugar de onde veio. Se fosse uma aba, o
 * app teria seis lugares e a colinha viraria conteúdo — que é o oposto do que
 * ela é.
 */
export default function Glossario() {
  const cores = useCores();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const reduzido = useMovimentoReduzido();

  const { licoesConcluidas } = useProgresso();
  const [busca, setBusca] = useState('');

  // Sobe uma vez ao montar e desce ao fechar. A altura da tela é o percurso.
  const subida = useRef(new Animated.Value(reduzido ? 1 : 0)).current;

  useEffect(() => {
    if (reduzido) return;

    Animated.timing(subida, {
      toValue: 1,
      duration: animacao.feedback,
      easing: suavizar(curva.saida),
      useNativeDriver: true
    }).start();
  }, [reduzido, subida]);

  function fechar() {
    if (reduzido) return router.back();

    Animated.timing(subida, {
      toValue: 0,
      duration: animacao.feedback,
      easing: suavizar(curva.saida),
      useNativeDriver: true
    }).start(() => router.back());
  }

  const grupos = useMemo(() => glossarioCompleto(), []);

  const filtrados = useMemo(() => {
    const alvo = busca.trim().toLowerCase();
    if (!alvo) return grupos;

    return grupos
      .map((grupo) => ({
        ...grupo,
        termos: grupo.termos.filter(
          (t) => t.termo.toLowerCase().includes(alvo) || t.definicao.toLowerCase().includes(alvo)
        )
      }))
      .filter((grupo) => grupo.termos.length > 0);
  }, [grupos, busca]);

  return (
    <Animated.View
      style={[
        estilos.tela,
        { backgroundColor: cores.fundo },
        {
          transform: [
            { translateY: subida.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }
          ]
        }
      ]}
    >
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.cabecalho}>
          <Rotulo cor={cores.acento}>glossário</Rotulo>
          <Pressable accessibilityLabel="Fechar" accessibilityRole="button" hitSlop={12} onPress={fechar}>
            <Text style={[estilos.fechar, { color: cores.legenda }]}>✕</Text>
          </Pressable>
        </View>

        <Text style={[estilos.titulo, { color: cores.textoForte }]}>A colinha</Text>

        <TextInput
          style={[
            estilos.busca,
            { backgroundColor: cores.superficie, borderColor: cores.linha, color: cores.textoForte }
          ]}
          value={busca}
          onChangeText={setBusca}
          placeholder="buscar termo ou definição…"
          placeholderTextColor={cores.desativado}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {filtrados.length === 0 && (
          <View style={estilos.vazio}>
            <Vazio titulo="Nada encontrado" texto={`Nenhum termo combina com "${busca}".`}>
              <Botao rotulo="Limpar busca" variante="secundario" aoTocar={() => setBusca('')} />
            </Vazio>
          </View>
        )}

        <View style={estilos.lista}>
          {filtrados.flatMap(({ linguagem, termos }) =>
            termos.map((entrada) => {
              const estudado = licoesConcluidas.has(entrada.licaoId);

              return (
                <View key={`${entrada.licaoId}-${entrada.termo}`} style={estilos.termo}>
                  <Regua />

                  <View style={estilos.termoTopo}>
                    <Text style={[estilos.nome, { color: cores.acento }]}>{entrada.termo}</Text>
                    <Text
                      style={[
                        estilos.tag,
                        { color: cores.acento },
                        !estudado && { color: cores.desativado }
                      ]}
                    >
                      {linguagem.id === 'csharp' ? 'C#' : 'JS'}
                    </Text>
                  </View>

                  <Text style={[estilos.definicao, { color: cores.textoFraco }]}>
                    {entrada.definicao}
                  </Text>

                  {entrada.exemplo && (
                    <BlocoCodigo codigo={entrada.exemplo} linguagem={entrada.linguagem} />
                  )}
                </View>
              );
            })
          )}
          <Regua />
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    paddingHorizontal: margemTela,
    paddingTop: topoConteudo,
    paddingBottom: espaco.xxl
  },

  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fechar: { ...tipo.fechar },
  titulo: { ...tipo.titulo, marginTop: espaco.sm },

  busca: {
    marginTop: espaco.lg,
    minHeight: tamanhos.campo,
    borderWidth: tamanhos.linha,
    paddingHorizontal: 15,
    ...tipo.campo
  },

  vazio: { marginTop: espaco.xl },
  lista: { marginTop: 24 },
  termo: { paddingBottom: 16, gap: espaco.sm },
  termoTopo: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 16 },
  nome: { ...tipo.monoForte },
  tag: { ...tipo.rotuloFino },
  definicao: { ...tipo.corpoMenor, lineHeight: 22 }
});
