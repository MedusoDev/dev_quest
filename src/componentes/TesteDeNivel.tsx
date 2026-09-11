import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Alternativa } from "@/componentes/Alternativa";
import { BlocoCodigo } from "@/componentes/BlocoCodigo";
import { TextoRico, Trilho } from "@/componentes/basicos";
import { embaralhar } from "@/nucleo/aleatorio";
import { comoTexto, linguagens, type Card, type LinguagemId } from "@/nucleo/conteudo";
import { montarTesteDeNivel } from "@/nucleo/diaria";
import { recomendarNivel, type NivelConhecimento } from "@/nucleo/perfil";
import { espaco, tamanhos, tipo } from "@/tema";
import { useCores } from "@/dados/TemaContexto";

/**
 * TESTE DE NÍVEL — 5 perguntas do primeiro módulo pra calibrar iniciante,
 * intermediário ou avançado.
 *
 * Usado em dois lugares: dentro do onboarding (conta nova) e em
 * `app/teste-nivel.tsx` (conta antiga, convite único — ver o comentário de
 * `nivelTestado` em `nucleo/perfil.ts`). O componente só cuida de "qual
 * linguagem, 5 perguntas, resultado" — quem chama decide o que fazer com o
 * resultado (aplicar direto, deixar trocar manualmente, etc.).
 */

type Props = {
  foco: LinguagemId[];
  aoConcluir: (resultado: {
    recomendacao: NivelConhecimento;
    acertos: number;
    total: number;
  }) => void;
  aoCancelar: () => void;
};

export function TesteDeNivel({ foco, aoConcluir, aoCancelar }: Props) {
  const cores = useCores();
  // Uma linguagem só marcada? Já entra direto nela. Mais de uma? Espera a
  // escolha antes de montar os cards.
  const [linguagem, setLinguagem] = useState<LinguagemId | null>(
    foco.length === 1 ? foco[0]! : null,
  );
  const [cards, setCards] = useState<Card[]>(() =>
    linguagem ? montarTesteDeNivel(linguagem) : [],
  );
  const [indice, setIndice] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [escolhido, setEscolhido] = useState<number | null>(null);

  const card = cards[indice] ?? null;
  const ordemAlternativas = useMemo(
    () => (card ? embaralhar((card.alternativas ?? []).map((_, i) => i)) : []),
    [card],
  );

  function escolherLinguagem(id: LinguagemId) {
    setLinguagem(id);
    setCards(montarTesteDeNivel(id));
    setIndice(0);
    setAcertos(0);
    setEscolhido(null);
  }

  function responder(alternativa: number) {
    if (!card || escolhido !== null) return;

    setEscolhido(alternativa);
    const acertou = alternativa === card.correta;

    // Meio segundo pro olho registrar o acento ou o vermelho antes de trocar
    // de card — mesma pausa do Relâmpago.
    setTimeout(() => {
      const acertosNovos = acertos + (acertou ? 1 : 0);
      const proximo = indice + 1;

      if (proximo >= cards.length) {
        aoConcluir({
          recomendacao: recomendarNivel(acertosNovos),
          acertos: acertosNovos,
          total: cards.length,
        });
      } else {
        setAcertos(acertosNovos);
        setIndice(proximo);
        setEscolhido(null);
      }
    }, 500);
  }

  if (!linguagem) {
    return (
      <View style={estilos.bloco}>
        <Text style={[estilos.texto, { color: cores.legenda }]}>Testar em qual?</Text>
        <View style={estilos.opcoes}>
          {foco.map((id) => {
            const dados = linguagens.find((l) => l.id === id);
            if (!dados) return null;

            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                onPress={() => escolherLinguagem(id)}
                style={({ pressed }) => [
                  estilos.opcaoLinguagem,
                  { borderColor: cores.linha },
                  pressed && estilos.pressionado,
                ]}
              >
                <View style={[estilos.marcaLinguagem, { backgroundColor: dados.cor }]} />
                <Text style={[estilos.nomeLinguagem, { color: cores.textoForte }]}>{dados.nome}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable accessibilityRole="button" onPress={aoCancelar} hitSlop={8}>
          <Text style={[estilos.linkDiscreto, { color: cores.desativado }]}>‹ voltar</Text>
        </Pressable>
      </View>
    );
  }

  if (!card) return null;

  return (
    <View style={estilos.bloco}>
      <View style={estilos.topo}>
        <Text style={[estilos.progresso, { color: cores.legenda }]}>{`${indice + 1} de ${cards.length}`}</Text>
        <Trilho
          fracao={(indice + (escolhido !== null ? 1 : 0)) / cards.length}
          altura={tamanhos.trilho}
          cor={cores.acento}
          duracao={300}
          estilo={estilos.trilho}
        />
      </View>

      <TextoRico
        texto={card.enunciado}
        estilo={tipo.pergunta}
        cor={cores.textoForte}
        estiloCodigo={tipo.codigoNoTexto21}
      />

      {card.codigo && (
        <BlocoCodigo codigo={comoTexto(card.codigo)} linguagem={card.linguagem} />
      )}

      {card.pergunta && (
        <TextoRico texto={card.pergunta} estilo={tipo.alternativa} cor={cores.textoFraco} />
      )}

      <View style={estilos.alternativas} key={card.id}>
        {ordemAlternativas.map((original, posicao) => (
          <Alternativa
            key={original}
            indice={posicao}
            texto={card.alternativas![original]!}
            mono={card.tipo === "saida"}
            escolhida={escolhido === original}
            revelado={escolhido !== null}
            correta={original === card.correta}
            aoTocar={() => responder(original)}
          />
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={aoCancelar} hitSlop={8}>
        <Text style={[estilos.linkDiscreto, { color: cores.desativado }]}>cancelar teste</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: { gap: espaco.lg },
  texto: { ...tipo.notaMono, lineHeight: 20 },

  opcoes: { flexDirection: "row", flexWrap: "wrap", gap: espaco.sm },
  opcaoLinguagem: {
    flexGrow: 1,
    flexBasis: 130,
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
    borderWidth: tamanhos.linha,
    paddingVertical: espaco.md,
    paddingHorizontal: espaco.md,
  },
  marcaLinguagem: { width: 10, height: 10 },
  nomeLinguagem: { ...tipo.tituloItemMenor },
  pressionado: { opacity: 0.75 },

  topo: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  progresso: { ...tipo.metricaMono },
  trilho: { flex: 1 },
  alternativas: { gap: espaco.sm },

  linkDiscreto: { ...tipo.metricaMono },
});
