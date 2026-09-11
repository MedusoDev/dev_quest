import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { cores, espaco, margemTela, rodapeFixo, tamanhos, tipo } from '@/tema';
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Linguagem: ${nome}. Toque para trocar.`}
      onPress={aoTocar}
      style={estilos.gatilho}
    >
      <Text style={estilos.gatilhoNome}>{nome}</Text>
      <Text style={estilos.gatilhoContagem}>{contagem}</Text>
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
  return (
    <Modal visible={aberto} transparent animationType="slide" onRequestClose={aoFechar}>
      <Pressable style={estilos.fundo} onPress={aoFechar}>
        <Pressable style={estilos.folha} onPress={() => {}}>
          <View style={estilos.cabecalho}>
            <Text style={[tipo.rotuloSecao, estilos.cabecalhoRotulo]}>linguagem</Text>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={aoFechar}>
              <Text style={estilos.fechar}>✕</Text>
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
                  style={estilos.item}
                >
                  <View style={[estilos.marca, ativa ? estilos.marcaAtiva : estilos.marcaVazia]} />

                  <View style={estilos.itemTexto}>
                    <Text
                      style={[
                        tipo.tituloItemMenor,
                        { color: ativa ? cores.acento : cores.textoForte }
                      ]}
                    >
                      {linguagem.nome}
                    </Text>
                    <Text style={estilos.itemNota} numberOfLines={1}>
                      {linguagem.descricao}
                    </Text>
                  </View>

                  <View style={estilos.itemProgresso}>
                    <Trilho
                      fracao={linguagem.total ? linguagem.feitas / linguagem.total : 0}
                      cor={ativa ? cores.acento : cores.legenda}
                      altura={tamanhos.trilhoGrosso}
                    />
                    <Text style={estilos.itemContagem}>
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
    borderWidth: tamanhos.linha,
    borderColor: cores.acentoLinha,
    backgroundColor: cores.acentoFundo
  },
  gatilhoNome: { ...tipo.tituloLinha, color: cores.textoForte },
  gatilhoContagem: { ...tipo.metricaMono, color: cores.acentoTexto },

  fundo: { flex: 1, backgroundColor: 'rgba(4,5,6,0.72)', justifyContent: 'flex-end' },
  folha: {
    backgroundColor: cores.fundo,
    borderTopWidth: tamanhos.linha,
    borderTopColor: cores.linha,
    paddingHorizontal: margemTela,
    paddingTop: 18,
    paddingBottom: rodapeFixo
  },

  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cabecalhoRotulo: { color: cores.acento, textTransform: 'uppercase' },
  fechar: { ...tipo.fechar, color: cores.legenda },

  lista: { marginTop: espaco.md, maxHeight: 340 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: tamanhos.alvoMin,
    paddingVertical: 11,
    borderTopWidth: tamanhos.linha,
    borderTopColor: cores.linha
  },
  marca: { width: 10, height: 10 },
  marcaAtiva: { backgroundColor: cores.acento },
  marcaVazia: { borderWidth: tamanhos.linha, borderColor: cores.linha },

  itemTexto: { flex: 1 },
  itemNota: { ...tipo.metricaMono, color: cores.legenda, marginTop: 3 },

  itemProgresso: { width: 52 },
  itemContagem: {
    ...tipo.rotuloCelula,
    color: cores.legenda,
    marginTop: 5,
    textAlign: 'right'
  }
});
