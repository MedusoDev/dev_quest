import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Vazio } from "@/componentes/basicos";
import { Botao } from "@/componentes/Botao";
import { Conceito } from "@/componentes/Conceito";
import { Resumo } from "@/componentes/Resumo";
import { Sessao } from "@/componentes/Sessao";
import { useCores } from "@/dados/TemaContexto";
import { useProgresso, type FechoDeSessao } from "@/dados/ProgressoContexto";
import { obterLicao } from "@/nucleo/conteudo";
import { hoje, somarDias } from "@/nucleo/datas";
import { revisoesEm } from "@/nucleo/diaria";
import type { Sessao as EstadoSessao, Resultado } from "@/nucleo/sessao";
import { espaco, margemTela } from "@/tema";

/**
 * UMA LIÇÃO: conceito, exercícios, resumo.
 *
 * A tela de conceito vem sempre primeiro. Ela é a diferença entre ensinar e
 * apenas testar — sem ela o app seria um quiz.
 */
export default function TelaLicao() {
  const cores = useCores();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { progresso, revisoes, registrarSessao } = useProgresso();

  const [fase, setFase] = useState<"conceito" | "sessao">("conceito");
  const [fim, setFim] = useState<{
    resultado: Resultado;
    fecho: FechoDeSessao;
  } | null>(null);

  const licao = obterLicao(id ?? "");

  if (!licao) {
    return (
      <View style={[estilos.centro, { backgroundColor: cores.fundo }]}>
        <Vazio titulo="Lição não encontrada" texto="Esse conteúdo não existe.">
          <Botao
            rotulo="Voltar"
            variante="secundario"
            aoTocar={() => router.back()}
          />
        </Vazio>
      </View>
    );
  }

  async function aoTerminar(sessao: EstadoSessao, resultado: Resultado) {
    // A lição só conta como concluída aqui, no fim — sair no meio não marca nada.
    const fecho = await registrarSessao({
      sessao,
      resultado,
      licaoId: licao!.id,
      contaComoDiaria: true,
    });
    setFim({ resultado, fecho });
  }

  if (fim) {
    return (
      <Resumo
        resultado={fim.resultado}
        fecho={fim.fecho}
        xpTotal={progresso.xp}
        voltamAmanha={revisoesEm(revisoes, somarDias(hoje(), 1))}
        rotuloBotao="Voltar à trilha"
        aoConcluir={() => router.back()}
      />
    );
  }

  if (fase === "conceito") {
    return (
      <Conceito
        licao={licao}
        rotuloBotao={`Começar os ${licao.cards.length} cards`}
        aoContinuar={() => setFase("sessao")}
        aoVoltar={() => router.back()}
      />
    );
  }

  return (
    <Sessao
      cards={licao.cards}
      aoTerminar={aoTerminar}
      aoSair={() => router.back()}
    />
  );
}

const estilos = StyleSheet.create({
  centro: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: margemTela,
    paddingVertical: espaco.xl,
  },
});
