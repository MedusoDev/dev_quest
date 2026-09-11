import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Anel } from "@/componentes/Anel";
import { Botao } from "@/componentes/Botao";
import { SeletorNivel } from "@/componentes/SeletorNivel";
import { TesteDeNivel } from "@/componentes/TesteDeNivel";
import { Rotulo } from "@/componentes/basicos";
import { useConta } from "@/dados/ContaContexto";
import { useCores } from "@/dados/TemaContexto";
import { linguagens, type LinguagemId } from "@/nucleo/conteudo";
import {
  NIVEIS_CONHECIMENTO,
  validarDataNascimento,
  validarNomeCompleto,
  type NivelConhecimento,
} from "@/nucleo/perfil";
import type { Dia } from "@/nucleo/datas";
import {
  espaco,
  margemTela,
  rodapeFixo,
  tamanhos,
  tipo,
  topoConteudo,
} from "@/tema";

/**
 * ONBOARDING — nome, data de nascimento, foco de estudo e nível.
 *
 * Fica entre criar a conta e a introdução: `Portao`, em `_layout.tsx`, manda
 * pra cá sempre que `perfil.onboardingCompleto` é falso e devolve o controle
 * assim que o envio grava `onboardingCompleto: true` — esta tela não navega
 * sozinha, só espera o portão perceber a mudança.
 */
export default function Onboarding() {
  const cores = useCores();
  const { perfil, atualizarPerfil } = useConta();

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [diaTexto, setDiaTexto] = useState("");
  const [mesTexto, setMesTexto] = useState("");
  const [anoTexto, setAnoTexto] = useState("");
  const [foco, setFoco] = useState<LinguagemId[]>([]);
  const [nivel, setNivel] = useState<NivelConhecimento | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // `inicial` mostra o botão; `teste` entra no componente `TesteDeNivel`;
  // `concluido` mostra a recomendação dele (com o seletor manual embaixo,
  // pra trocar); `manual` pula o teste direto pro seletor, sem recomendação.
  const [faseNivel, setFaseNivel] = useState<
    "inicial" | "teste" | "concluido" | "manual"
  >("inicial");
  // Guardado à parte de `nivel`: a recomendação não pode mudar quando a
  // pessoa troca de ideia no seletor manual embaixo dela — só o `nivel`
  // muda, o texto "recomendamos X" tem que continuar dizendo o que o teste
  // de fato recomendou.
  const [resultadoTeste, setResultadoTeste] = useState<{
    recomendacao: NivelConhecimento;
    acertos: number;
    total: number;
  } | null>(null);

  // `null` enquanto os três campos não estiverem preenchidos — a validação
  // real (calendário, idade mínima/máxima) só roda em `validarDataNascimento`.
  const dataNascimento: Dia | null =
    diaTexto.length === 2 && mesTexto.length === 2 && anoTexto.length === 4
      ? `${anoTexto}-${mesTexto}-${diaTexto}`
      : null;

  function alternarFoco(id: LinguagemId) {
    setFoco((atual) =>
      atual.includes(id) ? atual.filter((f) => f !== id) : [...atual, id],
    );
  }

  async function enviar() {
    setErro(null);

    const problema =
      validarNomeCompleto(nomeCompleto) ??
      validarDataNascimento(dataNascimento) ??
      (foco.length === 0 ? "Escolha em qual linguagem quer focar." : null) ??
      (!nivel ? "Escolha seu nível atual." : null);

    if (problema) {
      setErro(problema);
      return;
    }

    setOcupado(true);
    try {
      await atualizarPerfil({
        nomeCompleto: nomeCompleto.trim(),
        dataNascimento,
        foco,
        nivel,
        onboardingCompleto: true,
        // O teste de nível já faz parte deste fluxo — sem isto, `Portao`
        // levaria essa conta recém-criada direto para `/teste-nivel` de novo
        // assim que o onboarding terminasse.
        nivelTestado: true,
      });
      // Sem navegação aqui: `Portao` vê `onboardingCompleto` virar `true` e
      // manda para a introdução sozinho.
    } catch {
      setErro("Não deu para salvar. Tente de novo.");
      setOcupado(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[estilos.flex, { backgroundColor: cores.fundo }]}
    >
      <ScrollView
        contentContainerStyle={[estilos.conteudo, { backgroundColor: cores.fundo }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.marca}>
          <Anel tamanho={38} corFundo={cores.fundo} />
          <Text style={[estilos.nomeMarca, { color: cores.acento }]}>OUROBOROS</Text>
        </View>

        <Text style={[estilos.titulo, { color: cores.textoForte }]}>Antes de começar</Text>
        <Text style={[estilos.subtitulo, { color: cores.legenda }]}>
          {perfil?.nome
            ? `${perfil.nome}, me conta um pouco sobre você.`
            : "Me conta um pouco sobre você."}
        </Text>

        <View style={estilos.campo}>
          <Text style={[estilos.rotuloCampo, { color: cores.legenda }]}>SEU NOME</Text>
          <TextInput
            style={[
              estilos.entrada,
              { backgroundColor: cores.superficie, borderColor: cores.linha, color: cores.textoForte },
            ]}
            value={nomeCompleto}
            onChangeText={setNomeCompleto}
            placeholder="Como podemos te chamar"
            placeholderTextColor={cores.desativado}
            autoComplete="name"
            maxLength={40}
          />
        </View>

        <View style={estilos.campo}>
          <Text style={[estilos.rotuloCampo, { color: cores.legenda }]}>DATA DE NASCIMENTO</Text>
          <View style={estilos.linhaData}>
            <TextInput
              style={[
                estilos.entrada,
                estilos.entradaData,
                { backgroundColor: cores.superficie, borderColor: cores.linha, color: cores.textoForte },
              ]}
              value={diaTexto}
              onChangeText={(v) => setDiaTexto(v.replace(/[^0-9]/g, "").slice(0, 2))}
              placeholder="DD"
              placeholderTextColor={cores.desativado}
              keyboardType="number-pad"
              maxLength={2}
            />
            <TextInput
              style={[
                estilos.entrada,
                estilos.entradaData,
                { backgroundColor: cores.superficie, borderColor: cores.linha, color: cores.textoForte },
              ]}
              value={mesTexto}
              onChangeText={(v) => setMesTexto(v.replace(/[^0-9]/g, "").slice(0, 2))}
              placeholder="MM"
              placeholderTextColor={cores.desativado}
              keyboardType="number-pad"
              maxLength={2}
            />
            <TextInput
              style={[
                estilos.entrada,
                estilos.entradaAno,
                { backgroundColor: cores.superficie, borderColor: cores.linha, color: cores.textoForte },
              ]}
              value={anoTexto}
              onChangeText={(v) => setAnoTexto(v.replace(/[^0-9]/g, "").slice(0, 4))}
              placeholder="AAAA"
              placeholderTextColor={cores.desativado}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
        </View>

        <Rotulo estilo={estilos.rotuloSecao}>foco de estudo</Rotulo>
        <View style={estilos.opcoes}>
          {linguagens.map((l) => {
            const escolhida = foco.includes(l.id);
            return (
              <Pressable
                key={l.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: escolhida }}
                onPress={() => alternarFoco(l.id)}
                style={({ pressed }) => [
                  estilos.opcaoLinguagem,
                  { borderColor: cores.linha },
                  escolhida && {
                    borderColor: l.cor,
                    backgroundColor: cores.superficie,
                  },
                  pressed && estilos.pressionado,
                ]}
              >
                <View style={[estilos.marcaLinguagem, { backgroundColor: l.cor }]} />
                <Text
                  style={[
                    estilos.nomeLinguagem,
                    { color: cores.textoForte },
                    !escolhida && { color: cores.desativado },
                  ]}
                >
                  {l.nome}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {foco.length > 1 && (
          <Text style={[estilos.avisoFoco, { color: cores.legenda }]}>
            Focar em mais de uma linguagem mistura conceitos diferentes na
            mesma diária — alguns parecidos, outros não. Dá para focar numa só
            depois, no perfil.
          </Text>
        )}

        <Rotulo estilo={estilos.rotuloSecao}>nível atual</Rotulo>

        {faseNivel === "inicial" && (
          <View style={estilos.testeInicial}>
            <Text style={[estilos.testeTexto, { color: cores.legenda }]}>
              5 perguntas rápidas do primeiro módulo, pra saber por onde
              começar.
            </Text>
            <Botao
              rotulo="Testar conhecimento"
              variante="secundarioForte"
              desabilitado={foco.length === 0}
              aoTocar={() => setFaseNivel("teste")}
            />
            {foco.length === 0 && (
              <Text style={[estilos.testeAviso, { color: cores.desativado }]}>
                Escolha o foco de estudo acima primeiro.
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => setFaseNivel("manual")}
              hitSlop={8}
            >
              <Text style={[estilos.linkDiscreto, { color: cores.desativado }]}>
                prefiro escolher eu mesmo
              </Text>
            </Pressable>
          </View>
        )}

        {faseNivel === "teste" && (
          <TesteDeNivel
            foco={foco}
            aoCancelar={() => setFaseNivel("inicial")}
            aoConcluir={({ recomendacao, acertos, total }) => {
              setNivel(recomendacao);
              setResultadoTeste({ recomendacao, acertos, total });
              setFaseNivel("concluido");
            }}
          />
        )}

        {(faseNivel === "concluido" || faseNivel === "manual") && (
          <View>
            {faseNivel === "concluido" && resultadoTeste && (
              <View
                style={[
                  estilos.recomendacao,
                  { borderLeftColor: cores.acento, backgroundColor: cores.acentoFundo },
                ]}
              >
                <Text style={[estilos.recomendacaoTexto, { color: cores.acentoTexto }]}>
                  {`Você acertou ${resultadoTeste.acertos} de ${resultadoTeste.total}. Recomendamos `}
                  <Text style={{ color: cores.acento }}>
                    {NIVEIS_CONHECIMENTO.find(
                      (n) => n.id === resultadoTeste.recomendacao,
                    )?.nome ?? resultadoTeste.recomendacao}
                  </Text>
                  {" — mas pode trocar abaixo se preferir."}
                </Text>
              </View>
            )}

            <SeletorNivel nivel={nivel} aoEscolher={setNivel} />
          </View>
        )}

        {erro && (
          <View
            style={[
              estilos.aviso,
              { borderLeftColor: cores.erro, backgroundColor: cores.erroFundo },
            ]}
          >
            <Text style={[estilos.avisoTexto, { color: cores.erro }]}>{erro}</Text>
          </View>
        )}

        <Botao
          estilo={estilos.botao}
          rotulo={ocupado ? "Um instante…" : "Continuar"}
          desabilitado={ocupado}
          aoTocar={enviar}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: {
    flexGrow: 1,
    paddingHorizontal: margemTela,
    paddingTop: topoConteudo,
    paddingBottom: rodapeFixo,
  },

  marca: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  nomeMarca: { ...tipo.rotuloSecao },

  titulo: { ...tipo.tituloGrande, marginTop: espaco.xl },
  subtitulo: { ...tipo.notaMono, marginTop: 12 },

  campo: { marginTop: espaco.xl },
  rotuloCampo: { ...tipo.rotuloCampo },
  entrada: {
    marginTop: espaco.sm,
    minHeight: tamanhos.campo,
    borderWidth: tamanhos.linha,
    paddingHorizontal: 15,
    ...tipo.campo,
  },
  linhaData: { flexDirection: "row", gap: espaco.sm },
  entradaData: { flex: 1, textAlign: "center" },
  entradaAno: { flex: 1.6, textAlign: "center" },

  rotuloSecao: { marginTop: espaco.xl, marginBottom: espaco.md },

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
  avisoFoco: {
    ...tipo.notaMonoMenor,
    marginTop: espaco.sm,
    lineHeight: 17,
  },

  testeInicial: { gap: espaco.md },
  testeTexto: { ...tipo.notaMono, lineHeight: 20 },
  testeAviso: { ...tipo.notaMonoMenor },
  linkDiscreto: {
    ...tipo.metricaMono,
    marginTop: espaco.sm,
  },

  recomendacao: {
    borderLeftWidth: tamanhos.trilho,
    paddingVertical: 12,
    paddingHorizontal: espaco.md,
    marginBottom: espaco.md,
  },
  recomendacaoTexto: { ...tipo.notaMono, lineHeight: 20 },

  pressionado: { opacity: 0.75 },

  aviso: {
    marginTop: espaco.xl,
    borderLeftWidth: tamanhos.trilho,
    paddingVertical: 12,
    paddingHorizontal: espaco.md,
  },
  avisoTexto: { ...tipo.metricaMonoMedia, lineHeight: 19 },

  botao: { marginTop: espaco.xl },
});
