import { ScrollView, StyleSheet, Text, View } from "react-native";

import { comoTexto, type Licao } from "@/nucleo/conteudo";
import {
    espaco,
    margemTela,
    siglaLinguagem,
    tipo,
    topoConteudo,
} from "@/tema";
import { useCores } from "@/dados/TemaContexto";
import { BlocoCodigo } from "./BlocoCodigo";
import { Botao } from "./Botao";
import { Rotulo, TextoRico } from "./basicos";

/**
 * A tela que ensina antes de testar.
 *
 * Serve à lição e à diária: quando a diária puxa cards de uma lição que a
 * pessoa nunca abriu, o conceito aparece antes — senão o app estaria cobrando
 * algo que nunca explicou.
 *
 * O texto do JSON usa crase para marcar código no meio da frase e asterisco
 * duplo para ênfase. Isso vira mono no acento e texto forte, sem biblioteca de
 * markdown e sem nunca mostrar o marcador. Ver `TextoRico`.
 */

type Props = {
  licao: Licao;
  rotuloBotao: string;
  aoContinuar: () => void;
  aoVoltar?: () => void;
  passo?: string;
};

export function Conceito({
  licao,
  rotuloBotao,
  aoContinuar,
  aoVoltar,
  passo,
}: Props) {
  const cores = useCores();

  return (
    <View style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <Rotulo cor={cores.acento}>
          {passo ?? `${siglaLinguagem[licao.linguagem]} · conceito`}
        </Rotulo>

        <Text style={[estilos.titulo, { color: cores.textoForte }]}>{licao.titulo}</Text>
        <Text style={[estilos.resumo, { color: cores.legenda }]}>{licao.resumo}</Text>

        <View style={estilos.texto}>
          {licao.conceito.texto.map((paragrafo, indice) => (
            <TextoRico
              key={indice}
              texto={paragrafo}
              estilo={estilos.paragrafo}
              cor={cores.texto}
            />
          ))}

          {licao.conceito.exemplo && (
            <BlocoCodigo
              codigo={comoTexto(licao.conceito.exemplo)}
              linguagem={licao.linguagem}
            />
          )}
        </View>
      </ScrollView>

      <View style={estilos.rodape}>
        {aoVoltar && (
          <Botao rotulo="Voltar" variante="secundario" aoTocar={aoVoltar} />
        )}
        <Botao rotulo={rotuloBotao} aoTocar={aoContinuar} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    paddingHorizontal: margemTela,
    paddingTop: topoConteudo,
    paddingBottom: espaco.xl,
  },

  titulo: { ...tipo.titulo, marginTop: espaco.sm },
  resumo: { ...tipo.notaMono, marginTop: 12 },

  texto: { marginTop: espaco.xl, gap: 18 },
  paragrafo: { ...tipo.corpo, fontSize: 15, lineHeight: 25 },

  rodape: {
    paddingHorizontal: margemTela,
    paddingBottom: 30,
    paddingTop: espaco.md,
    gap: espaco.sm,
  },
});
