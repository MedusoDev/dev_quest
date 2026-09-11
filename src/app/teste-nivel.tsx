import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Anel } from "@/componentes/Anel";
import { Botao } from "@/componentes/Botao";
import { SeletorNivel } from "@/componentes/SeletorNivel";
import { TesteDeNivel } from "@/componentes/TesteDeNivel";
import { useConta } from "@/dados/ContaContexto";
import { useCores } from "@/dados/TemaContexto";
import { NIVEIS_CONHECIMENTO, type NivelConhecimento } from "@/nucleo/perfil";
import {
  espaco,
  margemTela,
  rodapeFixo,
  tamanhos,
  tipo,
  topoConteudo,
} from "@/tema";

/**
 * TESTE DE NÍVEL — convite único pra quem já tinha conta antes deste recurso
 * existir.
 *
 * `Portao`, em `_layout.tsx`, manda pra cá quando `onboardingCompleto` já é
 * `true` mas `nivelTestado` ainda é `false` — só acontece com conta antiga:
 * o onboarding novo já grava `nivelTestado: true` junto (ver o comentário em
 * `app/onboarding.tsx`), então quem passa por ele nunca cai aqui.
 *
 * Aparece uma vez só: tanto fazer o teste quanto recusar grava
 * `nivelTestado: true`, e a pessoa nunca mais vê esta tela.
 */
export default function TesteNivel() {
  const cores = useCores();
  const { perfil, atualizarPerfil } = useConta();
  const [fase, setFase] = useState<"convite" | "teste" | "resultado">(
    "convite",
  );
  const [nivel, setNivel] = useState<NivelConhecimento | null>(
    perfil?.nivel ?? null,
  );
  // Guardado à parte de `nivel`: a recomendação não pode mudar quando a
  // pessoa troca de ideia no seletor manual embaixo dela.
  const [resultado, setResultado] = useState<{
    recomendacao: NivelConhecimento;
    acertos: number;
    total: number;
  } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const foco = perfil?.foco ?? [];

  async function manterAtual() {
    if (ocupado) return;
    setOcupado(true);
    await atualizarPerfil({ nivelTestado: true });
    // Sem navegação aqui: `Portao` vê `nivelTestado` virar `true` e volta
    // pro app sozinho.
  }

  async function salvar() {
    if (ocupado) return;
    setOcupado(true);
    await atualizarPerfil({ nivel, nivelTestado: true });
  }

  return (
    <ScrollView
      contentContainerStyle={[estilos.conteudo, { backgroundColor: cores.fundo }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={estilos.marca}>
        <Anel tamanho={38} corFundo={cores.fundo} />
        <Text style={[estilos.nomeMarca, { color: cores.acento }]}>OUROBOROS</Text>
      </View>

      {fase === "convite" && (
        <>
          <Text style={[estilos.titulo, { color: cores.textoForte }]}>
            Novidade: teste de nível
          </Text>
          <Text style={[estilos.subtitulo, { color: cores.legenda }]}>
            Adicionamos um teste rápido — 5 perguntas do primeiro módulo — pra
            calibrar se você é iniciante, intermediário ou avançado. Leva um
            minuto, e só aparece esta vez.
          </Text>

          <Botao
            estilo={estilos.botao}
            rotulo="Testar conhecimento"
            desabilitado={foco.length === 0 || ocupado}
            aoTocar={() => setFase("teste")}
          />
          {foco.length === 0 && (
            <Text style={[estilos.aviso, { color: cores.desativado }]}>
              Escolha um foco de estudo no Perfil antes de fazer o teste.
            </Text>
          )}

          <Botao
            estilo={estilos.botao}
            variante="secundario"
            rotulo={ocupado ? "Um instante…" : "Manter meu nível atual"}
            desabilitado={ocupado}
            aoTocar={manterAtual}
          />
        </>
      )}

      {fase === "teste" && (
        <TesteDeNivel
          foco={foco}
          aoCancelar={() => setFase("convite")}
          aoConcluir={({ recomendacao, acertos, total }) => {
            setNivel(recomendacao);
            setResultado({ recomendacao, acertos, total });
            setFase("resultado");
          }}
        />
      )}

      {fase === "resultado" && resultado && (
        <>
          <View
            style={[
              estilos.recomendacao,
              { borderLeftColor: cores.acento, backgroundColor: cores.acentoFundo },
            ]}
          >
            <Text style={[estilos.recomendacaoTexto, { color: cores.acentoTexto }]}>
              {`Você acertou ${resultado.acertos} de ${resultado.total}. Recomendamos `}
              <Text style={{ color: cores.acento }}>
                {NIVEIS_CONHECIMENTO.find(
                  (n) => n.id === resultado.recomendacao,
                )?.nome ?? resultado.recomendacao}
              </Text>
              {" — mas pode trocar abaixo se preferir."}
            </Text>
          </View>

          <SeletorNivel nivel={nivel} aoEscolher={setNivel} />

          <Botao
            estilo={estilos.botao}
            rotulo={ocupado ? "Um instante…" : "Salvar"}
            desabilitado={ocupado}
            aoTocar={salvar}
          />
        </>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    flexGrow: 1,
    paddingHorizontal: margemTela,
    paddingTop: topoConteudo,
    paddingBottom: rodapeFixo,
  },

  marca: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  nomeMarca: { ...tipo.rotuloSecao },

  titulo: {
    ...tipo.tituloGrande,
    marginTop: espaco.xl,
  },
  subtitulo: {
    ...tipo.notaMono,
    marginTop: 12,
    lineHeight: 20,
  },

  aviso: {
    ...tipo.notaMonoMenor,
    marginTop: espaco.sm,
  },

  recomendacao: {
    borderLeftWidth: tamanhos.trilho,
    paddingVertical: 12,
    paddingHorizontal: espaco.md,
    marginBottom: espaco.md,
  },
  recomendacaoTexto: {
    ...tipo.notaMono,
    lineHeight: 20,
  },

  botao: { marginTop: espaco.xl },
});
