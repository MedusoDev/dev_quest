import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { espaco, margemTela, rodapeFixo, tamanhos, tipo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { Trilho } from '@/componentes/basicos';

/**
 * O SELETOR DE LINGUAGEM.
 *
 * Antes as linguagens eram chips sempre visíveis no topo — dois cabiam, oito
 * não cabem. Aqui o nome da linguagem **é** o título do cabeçalho e abre uma
 * folha do rodapé com a lista. A lista rola, então o número de linguagens
 * deixa de ser um problema de layout.
 *
 * A folha é `Modal` e não uma View absoluta: precisa cobrir a barra de abas,
 * e o botão voltar do Android tem que fechá-la.
 */

export type ItemLinguagem = {
  id: string;
  nome: string;
  descricao: string;
  feitas: number;
  total: number;
};

/** O gatilho: caixa com borda, 44 dp de alvo, chevron em SVG. */
export function BotaoLinguagem({
  nome,
  contagem,
  aoTocar
}: {
  nome: string;
  contagem: string;
  aoTocar: () => void;
}) {
  const cores = useCores();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Linguagem: ${nome}. Toque para trocar.`}
      onPress={aoTocar}
      style={[
        estilos.gatilho,
        { borderColor: cores.acentoLinha, backgroundColor: cores.acentoFundo }
      ]}
    >
      <Text style={[estilos.gatilhoNome, { color: cores.textoForte }]}>{nome}</Text>
      <Text style={[estilos.gatilhoContagem, { color: cores.acentoTexto }]}>{contagem}</Text>
      <Svg width={10} height={7} viewBox="0 0 10 7">
        <Path
          d="M1 1.4 5 5.6 9 1.4"
          fill="none"
          stroke={cores.acento}
          strokeWidth={1.6}
          strokeLinecap="square"
        />
      </Svg>
    </Pressable>
  );
}

export function SeletorLinguagem({
  aberto,
  linguagens,
  selecionada,
  aoEscolher,
  aoFechar
}: {
  aberto: boolean;
  linguagens: ItemLinguagem[];
  selecionada: string;
  aoEscolher: (id: string) => void;
  aoFechar: () => void;
}) {
  const cores = useCores();

  return (
    <Modal visible={aberto} transparent animationType="slide" onRequestClose={aoFechar}>
      <Pressable style={estilos.fundo} onPress={aoFechar}>
        <Pressable
          style={[estilos.folha, { backgroundColor: cores.fundo, borderTopColor: cores.linha }]}
          onPress={() => {}}
        >
          <View style={estilos.cabecalho}>
            <Text style={[tipo.rotuloSecao, estilos.cabecalhoRotulo, { color: cores.acento }]}>
              linguagem
            </Text>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={aoFechar}>
              <Text style={[estilos.fechar, { color: cores.legenda }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={estilos.lista} showsVerticalScrollIndicator={false}>
            {linguagens.map((linguagem) => {
              const ativa = linguagem.id === selecionada;

              return (
                <Pressable
                  key={linguagem.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativa }}
                  onPress={() => aoEscolher(linguagem.id)}
                  style={[estilos.item, { borderTopColor: cores.linha }]}
                >
                  <View
                    style={[
                      estilos.marca,
                      ativa
                        ? { backgroundColor: cores.acento }
                        : { borderWidth: tamanhos.linha, borderColor: cores.linha }
                    ]}
                  />

                  <View style={estilos.itemTexto}>
                    <Text
                      style={[
                        tipo.tituloItemMenor,
                        { color: ativa ? cores.acento : cores.textoForte }
                      ]}
                    >
                      {linguagem.nome}
                    </Text>
                    <Text style={[estilos.itemNota, { color: cores.legenda }]} numberOfLines={1}>
                      {linguagem.descricao}
                    </Text>
                  </View>

                  <View style={estilos.itemProgresso}>
                    <Trilho
                      fracao={linguagem.total ? linguagem.feitas / linguagem.total : 0}
                      cor={ativa ? cores.acento : cores.legenda}
                      altura={tamanhos.trilhoGrosso}
                    />
                    <Text style={[estilos.itemContagem, { color: cores.legenda }]}>
                      {linguagem.feitas}/{linguagem.total}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  gatilho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    minHeight: tamanhos.alvoMin,
    marginLeft: -11,
    paddingHorizontal: 11,
    borderWidth: tamanhos.linha
  },
  gatilhoNome: { ...tipo.tituloLinha },
  gatilhoContagem: { ...tipo.metricaMono },

  fundo: { flex: 1, backgroundColor: 'rgba(4,5,6,0.72)', justifyContent: 'flex-end' },
  folha: {
    borderTopWidth: tamanhos.linha,
    paddingHorizontal: margemTela,
    paddingTop: 18,
    paddingBottom: rodapeFixo
  },

  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cabecalhoRotulo: { textTransform: 'uppercase' },
  fechar: { ...tipo.fechar },

  lista: { marginTop: espaco.md, maxHeight: 340 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: tamanhos.alvoMin,
    paddingVertical: 11,
    borderTopWidth: tamanhos.linha
  },
  marca: { width: 10, height: 10 },

  itemTexto: { flex: 1 },
  itemNota: { ...tipo.metricaMono, marginTop: 3 },

  itemProgresso: { width: 52 },
  itemContagem: {
    ...tipo.rotuloCelula,
    marginTop: 5,
    textAlign: 'right'
  }
});
