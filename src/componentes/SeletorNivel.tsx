import { Pressable, StyleSheet, Text, View } from "react-native";

import { NIVEIS_CONHECIMENTO, type NivelConhecimento } from "@/nucleo/perfil";
import { espaco, tamanhos, tipo } from "@/tema";
import { useCores } from "@/dados/TemaContexto";

/**
 * A lista de rádio "iniciante / intermediário / avançado" — usada no
 * onboarding e em `app/teste-nivel.tsx`, tanto pra escolher na mão quanto pra
 * trocar a recomendação do `TesteDeNivel`.
 */
export function SeletorNivel({
  nivel,
  aoEscolher,
}: {
  nivel: NivelConhecimento | null;
  aoEscolher: (nivel: NivelConhecimento) => void;
}) {
  const cores = useCores();

  return (
    <View>
      {NIVEIS_CONHECIMENTO.map((opcao, indice) => {
        const escolhida = nivel === opcao.id;

        return (
          <Pressable
            key={opcao.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: escolhida }}
            onPress={() => aoEscolher(opcao.id)}
            style={({ pressed }) => [
              estilos.linha,
              { borderTopColor: cores.linha },
              indice === NIVEIS_CONHECIMENTO.length - 1 && [
                estilos.linhaFinal,
                { borderBottomColor: cores.linha },
              ],
              pressed && estilos.pressionado,
            ]}
          >
            <View
              style={[
                estilos.marcador,
                { borderColor: cores.linha },
                escolhida && { backgroundColor: cores.acento, borderColor: cores.acento },
              ]}
            />
            <View style={estilos.flex}>
              <Text
                style={[
                  estilos.tituloItem,
                  { color: cores.textoForte },
                  !escolhida && { color: cores.desativado },
                ]}
              >
                {opcao.nome}
              </Text>
              <Text style={[estilos.notaItem, { color: cores.legenda }]}>{opcao.descricao}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: espaco.md,
    borderTopWidth: tamanhos.linha,
  },
  linhaFinal: {
    borderBottomWidth: tamanhos.linha,
  },
  marcador: {
    width: 8,
    height: 8,
    borderWidth: tamanhos.linha,
  },
  tituloItem: { ...tipo.tituloItemMenor },
  notaItem: { ...tipo.metricaMono, marginTop: 3, lineHeight: 15 },
  pressionado: { opacity: 0.75 },
});
