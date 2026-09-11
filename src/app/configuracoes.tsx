import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Avatar } from "@/componentes/Avatar";
import { Botao } from "@/componentes/Botao";
import { useConta } from "@/dados/ContaContexto";
import { definirNotificacoes, lerNotificacoesAtivadas } from "@/dados/lembretes";
import { useProgresso } from "@/dados/ProgressoContexto";
import { useTema } from "@/dados/TemaContexto";
import { linguagens, type LinguagemId } from "@/nucleo/conteudo";
import type { Dia } from "@/nucleo/datas";
import { METAS, metaPara } from "@/nucleo/gamificacao";
import {
    NIVEIS_CONHECIMENTO,
    ORDEM_NIVEL,
    validarDataNascimento,
    validarNome,
    validarNomeCompleto,
    type NivelConhecimento,
} from "@/nucleo/perfil";
import {
    espaco,
    fontes,
    margemTela,
    rodapeFixo,
    tamanhos,
    tipo,
} from "@/tema";
import { fichasTema, temas } from "@/tema/temas";

/**
 * CONFIGURAÇÕES — nova.
 *
 * Antes esta tela era só "Sobre você". No redesign do handoff
 * `redesign-de-layout-do-projeto` ela vira configurações de verdade: tema,
 * notificação, ritmo da diária (que morava em Perfil), sobre você (o form que
 * já existia, compactado) e conta e dados (que morava espalhado em Perfil —
 * sair e excluir conta agora vivem aqui).
 *
 * Duas features novas de verdade, não só visuais:
 *   - **Tema trocável**: os três cartões chamam `useTema()` de verdade —
 *     escolher um muda a paleta do app nas telas já migradas (Trilhas,
 *     Perfil, esta). "Seguir o sistema" ignora a escolha manual.
 *   - **Notificação**: um interruptor só, desligado por padrão. Ligado, o
 *     aparelho lembra a cada 2h enquanto a diária de hoje não fecha, e para
 *     assim que ela fecha — via `@/dados/lembretes` e o efeito em
 *     `ProgressoContexto`. Nada acontece sem o toque explícito no interruptor
 *     (ver o comentário lá sobre não pedir permissão de graça).
 *
 * "Baixar meus dados" não entrou nesta leva — decisão do usuário, não uma
 * omissão do handoff.
 */

const VERSAO_VISUAL = "1.0.4";

function textoVersao(): string {
  if (Updates.isEmbeddedLaunch || !Updates.createdAt) return `v${VERSAO_VISUAL}`;

  const quando = Updates.createdAt.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `v${VERSAO_VISUAL} · atualizado ${quando}`;
}

export default function Configuracoes() {
  const router = useRouter();
  const { usuario, perfil, atualizarPerfil, sair, excluirConta } = useConta();
  const { progresso, definirMeta, fezDiariaHoje } = useProgresso();
  const { idTema, cores, seguirSistema, definirTema, definirSeguirSistema } = useTema();

  const [codinome, setCodinome] = useState(perfil?.nome ?? "");
  const [nomeCompleto, setNomeCompleto] = useState(perfil?.nomeCompleto ?? "");
  const [diaTexto, setDiaTexto] = useState(perfil?.dataNascimento?.slice(8, 10) ?? "");
  const [mesTexto, setMesTexto] = useState(perfil?.dataNascimento?.slice(5, 7) ?? "");
  const [anoTexto, setAnoTexto] = useState(perfil?.dataNascimento?.slice(0, 4) ?? "");
  const [foco, setFoco] = useState<LinguagemId[]>(perfil?.foco ?? []);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [trocandoFoto, setTrocandoFoto] = useState(false);
  const [regredindoNivel, setRegredindoNivel] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [notificacoesAtivadas, setNotificacoesAtivadas] = useState<boolean | null>(null);
  const [ocupadoNotificacao, setOcupadoNotificacao] = useState(false);

  useEffect(() => {
    let vivo = true;
    lerNotificacoesAtivadas().then((ativado) => {
      if (vivo) setNotificacoesAtivadas(ativado);
    });
    return () => {
      vivo = false;
    };
  }, []);

  async function alternarNotificacoes(ligar: boolean) {
    setNotificacoesAtivadas(ligar);
    setOcupadoNotificacao(true);

    const ficou = await definirNotificacoes(ligar, fezDiariaHoje);

    setNotificacoesAtivadas(ficou);
    setOcupadoNotificacao(false);

    if (ligar && !ficou) {
      Alert.alert(
        "Sem permissão",
        "Para lembrar você, preciso de permissão para enviar notificações. Ative em Ajustes do aparelho."
      );
    }
  }

  const dataNascimento: Dia | null =
    diaTexto.length === 2 && mesTexto.length === 2 && anoTexto.length === 4
      ? `${anoTexto}-${mesTexto}-${diaTexto}`
      : null;

  function alternarFoco(id: LinguagemId) {
    setFoco((atual) =>
      atual.includes(id) ? atual.filter((f) => f !== id) : [...atual, id]
    );
  }

  const niveisMaisBaixos = perfil?.nivel
    ? NIVEIS_CONHECIMENTO.filter(
        (opcao) => ORDEM_NIVEL[opcao.id] < ORDEM_NIVEL[perfil.nivel!]
      )
    : [];
  const podeRegredirNivel =
    (perfil?.podeRegredirNivel ?? true) && niveisMaisBaixos.length > 0;

  function confirmarRegressao(novoNivel: NivelConhecimento) {
    const nome = NIVEIS_CONHECIMENTO.find((n) => n.id === novoNivel)?.nome ?? novoNivel;

    Alert.alert(
      "Regredir nível",
      `Mudar para ${nome}? Depois disso você não vai mais poder trocar o nível na mão — só receber sugestão automática pra subir de novo.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", style: "destructive", onPress: () => regredirNivel(novoNivel) },
      ]
    );
  }

  async function regredirNivel(novoNivel: NivelConhecimento) {
    setRegredindoNivel(true);
    try {
      await atualizarPerfil({ nivel: novoNivel, podeRegredirNivel: false });
    } finally {
      setRegredindoNivel(false);
    }
  }

  async function trocarFoto() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Sem permissão", "Preciso de acesso às suas fotos para trocar o avatar.");
      return;
    }

    const escolha = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (escolha.canceled || !escolha.assets[0]) return;

    setTrocandoFoto(true);
    try {
      const reduzida = await manipulateAsync(
        escolha.assets[0].uri,
        [{ resize: { width: 256, height: 256 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );

      if (reduzida.base64) await atualizarPerfil({ foto: reduzida.base64 });
    } catch {
      Alert.alert("Não deu", "Não consegui preparar essa imagem. Tente outra.");
    } finally {
      setTrocandoFoto(false);
    }
  }

  async function salvar() {
    setErro(null);

    const problema =
      validarNome(codinome) ??
      (nomeCompleto.trim().length > 0 ? validarNomeCompleto(nomeCompleto) : null) ??
      validarDataNascimento(dataNascimento);

    if (problema) {
      setErro(problema);
      return;
    }

    setOcupado(true);
    try {
      await atualizarPerfil({
        nome: codinome.trim(),
        nomeCompleto: nomeCompleto.trim(),
        dataNascimento,
        foco,
      });
      router.back();
    } catch {
      setErro("Não deu para salvar. Tente de novo.");
      setOcupado(false);
    }
  }

  function confirmarSaida() {
    Alert.alert("Sair da conta", "Seu progresso continua salvo neste aparelho.", [
      { text: "Ficar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => sair() },
    ]);
  }

  function confirmarExclusao() {
    Alert.alert(
      "Excluir conta",
      "Isso apaga seu perfil, progresso e histórico de sessões para sempre. Não tem como desfazer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir tudo",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Tem certeza?",
              "Última confirmação: sua conta será excluída agora.",
              [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: excluirDeVerdade },
              ]
            ),
        },
      ]
    );
  }

  async function excluirDeVerdade() {
    setExcluindo(true);
    try {
      await excluirConta();
    } catch (e) {
      setExcluindo(false);
      const codigo = (e as { code?: string })?.code;
      if (codigo === "auth/requires-recent-login") {
        Alert.alert(
          "Precisa entrar de novo",
          "Por segurança, saia da conta e entre de novo antes de excluir."
        );
      } else {
        Alert.alert("Não deu", "Não consegui excluir agora. Tente de novo.");
      }
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[estilos.flex, { backgroundColor: cores.fundo }]}
    >
      <View style={[estilos.topo, { borderBottomColor: cores.linha }]}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.back()}
          style={estilos.voltarLinha}
        >
          <Text style={[tipo.metricaMono, { color: cores.legenda }]}>‹ perfil</Text>
          <Text style={[tipo.tituloLinha, { color: cores.textoForte, marginLeft: 10 }]}>
            Configurações
          </Text>
        </Pressable>
        <Text style={[tipo.metricaMono, { color: cores.desativado }]}>{textoVersao()}</Text>
      </View>

      <ScrollView
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── tema ─────────────────────────────────────────────── */}
        <Text style={[tipo.rotuloSecao, estilos.rotuloTopo, { color: cores.acento }]}>tema</Text>
        <View style={estilos.cartoesTema}>
          {fichasTema.map((ficha) => {
            const paleta = temas[ficha.id];
            const ativo = !seguirSistema && idTema === ficha.id;

            return (
              <Pressable
                key={ficha.id}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                onPress={() => {
                  definirSeguirSistema(false);
                  definirTema(ficha.id);
                }}
                style={[
                  estilos.cartaoTema,
                  { borderColor: cores.linha },
                  ativo && { borderColor: cores.acento, backgroundColor: cores.acentoFundo },
                ]}
              >
                <View style={estilos.amostras}>
                  <View style={[estilos.amostra, { backgroundColor: paleta.fundo }]} />
                  <View style={[estilos.amostra, { backgroundColor: paleta.linha }]} />
                  <View style={[estilos.amostra, { backgroundColor: paleta.acento }]} />
                </View>
                <Text
                  style={[
                    estilos.nomeTema,
                    { color: ativo ? cores.acento : cores.textoForte },
                  ]}
                >
                  {ficha.nome}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={[estilos.linhaInterruptor, { borderTopColor: cores.linha }]}>
          <Text style={[tipo.metricaMono, { color: cores.legenda }]}>seguir o sistema</Text>
          <Interruptor
            ligado={seguirSistema}
            aoMudar={definirSeguirSistema}
            cores={cores}
          />
        </View>

        {/* ── notificações ─────────────────────────────────────── */}
        <Text style={[tipo.rotuloSecao, estilos.rotulo, { color: cores.legenda }]}>
          notificações
        </Text>
        <View
          style={[
            estilos.linhaLembrete,
            { borderTopColor: cores.linha, borderBottomWidth: tamanhos.linha, borderBottomColor: cores.linha },
          ]}
        >
          <View style={estilos.flex}>
            <Text style={{ fontFamily: fontes.semi, fontSize: 14, lineHeight: 17, color: cores.textoForte }}>
              Lembrete da diária
            </Text>
            <Text
              style={{
                fontFamily: fontes.mono,
                fontSize: 11,
                lineHeight: 16,
                color: cores.legenda,
                marginTop: 4,
              }}
            >
              {"a cada 2h enquanto a diária não fecha · para assim que fechar"}
            </Text>
          </View>
          <Interruptor
            ligado={notificacoesAtivadas ?? false}
            ocupado={ocupadoNotificacao || notificacoesAtivadas === null}
            aoMudar={alternarNotificacoes}
            cores={cores}
          />
        </View>

        {/* ── ritmo da diária ──────────────────────────────────── */}
        <Text style={[tipo.rotuloSecao, estilos.rotulo, { color: cores.legenda }]}>
          ritmo da diária
        </Text>
        <View style={estilos.cartoesRitmo}>
          {METAS.map((opcao) => {
            const escolhida = opcao.minutos === metaPara(progresso.metaDiariaMin).minutos;

            return (
              <Pressable
                key={opcao.minutos}
                accessibilityRole="radio"
                accessibilityState={{ checked: escolhida }}
                onPress={() => definirMeta(opcao.minutos)}
                style={[
                  estilos.cartaoRitmo,
                  { borderColor: cores.linha },
                  escolhida && { borderColor: cores.acento, backgroundColor: cores.acentoFundo },
                ]}
              >
                <Text
                  style={[
                    { fontFamily: fontes.semi, fontSize: 13, lineHeight: 16 },
                    { color: escolhida ? cores.acento : cores.textoForte },
                  ]}
                >
                  {opcao.rotulo}
                </Text>
                <Text
                  style={[
                    { fontFamily: fontes.mono, fontSize: 10.5, lineHeight: 14, marginTop: 3 },
                    { color: escolhida ? cores.acentoTexto : cores.legenda },
                  ]}
                >
                  {opcao.minutos} min · {opcao.cards}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── sobre você ───────────────────────────────────────── */}
        <Text style={[tipo.rotuloSecao, estilos.rotulo, { color: cores.legenda }]}>
          sobre você
        </Text>

        <Pressable
          accessibilityRole="button"
          disabled={trocandoFoto}
          onPress={trocarFoto}
          style={[estilos.avatarLinha, { borderTopColor: cores.linha }]}
        >
          <Avatar
            nome={codinome || "Você"}
            foto={perfil?.foto}
            bordaId={perfil?.borda}
            tamanho={30}
            paleta={cores}
          />
          <Text
            style={[
              { fontFamily: fontes.semi, fontSize: 14, lineHeight: 17 },
              estilos.flex,
              { color: cores.textoForte },
            ]}
          >
            {codinome || "Você"}
          </Text>
          <Text style={[tipo.metricaMono, { color: cores.acento }]}>
            {trocandoFoto ? "enviando…" : "trocar foto"}
          </Text>
        </Pressable>

        <View style={estilos.campo}>
          <Text style={[tipo.rotuloCampo, { color: cores.legenda }]}>CODINOME</Text>
          <TextInput
            style={[
              estilos.entrada,
              tipo.campo,
              { backgroundColor: cores.superficie, borderColor: cores.linha, color: cores.textoForte },
            ]}
            value={codinome}
            onChangeText={setCodinome}
            placeholder="rafa.dev"
            placeholderTextColor={cores.desativado}
            maxLength={20}
          />
        </View>

        <View style={estilos.campo}>
          <Text style={[tipo.rotuloCampo, { color: cores.legenda }]}>NOME COMPLETO</Text>
          <TextInput
            style={[
              estilos.entrada,
              tipo.campo,
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
          <Text style={[tipo.rotuloCampo, { color: cores.legenda }]}>DATA DE NASCIMENTO</Text>
          <View style={estilos.linhaData}>
            <TextInput
              style={[
                estilos.entrada,
                estilos.entradaData,
                tipo.campo,
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
                tipo.campo,
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
                tipo.campo,
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

        <Text style={[tipo.rotuloSecao, estilos.rotulo, { color: cores.legenda }]}>
          foco de estudo
        </Text>
        <View style={estilos.opcoes}>
          {linguagens.map((l) => {
            const escolhida = foco.includes(l.id);
            return (
              <Pressable
                key={l.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: escolhida }}
                onPress={() => alternarFoco(l.id)}
                style={[
                  estilos.chipFoco,
                  { borderColor: cores.linha },
                  escolhida && { borderColor: l.cor, backgroundColor: cores.superficie },
                ]}
              >
                <View style={[estilos.marcaLinguagem, { backgroundColor: l.cor }]} />
                <Text
                  style={[
                    tipo.tituloItemMenor,
                    { color: escolhida ? cores.textoForte : cores.desativado },
                  ]}
                >
                  {l.nome}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {foco.length > 1 && (
          <Text style={[tipo.notaMonoMenor, estilos.avisoFoco, { color: cores.legenda }]}>
            Mais de uma linguagem mistura conceitos diferentes na mesma diária. Desmarque até
            sobrar uma para focar só nela.
          </Text>
        )}
        {foco.length === 0 && (
          <Text style={[tipo.notaMonoMenor, estilos.avisoFoco, { color: cores.legenda }]}>
            Sem foco escolhido, a diária mistura todas as linguagens.
          </Text>
        )}

        {perfil?.nivel && (
          <>
            <Text style={[tipo.rotuloSecao, estilos.rotulo, { color: cores.legenda }]}>
              nível de conhecimento
            </Text>
            <Text style={[tipo.tituloItem, { color: cores.textoForte }]}>
              {NIVEIS_CONHECIMENTO.find((n) => n.id === perfil.nivel)?.nome ?? perfil.nivel}
            </Text>

            {podeRegredirNivel ? (
              <>
                <Text style={[tipo.notaMonoMenor, estilos.avisoFoco, { color: cores.legenda }]}>
                  Ficou fácil ou difícil demais? Pode regredir uma vez — depois disso, só o app
                  sugere subir de novo, sozinho.
                </Text>
                <View style={estilos.opcoesNivel}>
                  {niveisMaisBaixos.map((opcao) => (
                    <Pressable
                      key={opcao.id}
                      accessibilityRole="button"
                      disabled={regredindoNivel}
                      onPress={() => confirmarRegressao(opcao.id)}
                      style={[estilos.opcaoNivel, { borderColor: cores.linha }]}
                    >
                      <Text style={[tipo.tituloItemMenor, { color: cores.textoForte }]}>
                        {regredindoNivel ? "Um instante…" : `Mudar para ${opcao.nome}`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              perfil.podeRegredirNivel === false && (
                <Text style={[tipo.notaMonoMenor, estilos.avisoFoco, { color: cores.legenda }]}>
                  Você já usou sua troca manual de nível.
                </Text>
              )
            )}
          </>
        )}

        {erro && (
          <View style={[estilos.aviso, { borderLeftColor: cores.erro, backgroundColor: cores.erroFundo }]}>
            <Text style={{ fontFamily: fontes.mono, fontSize: 12, color: cores.erro, lineHeight: 19 }}>
              {erro}
            </Text>
          </View>
        )}

        <Botao
          estilo={estilos.botaoSalvar}
          rotulo={ocupado ? "Salvando…" : "Salvar"}
          desabilitado={ocupado}
          aoTocar={salvar}
          paleta={cores}
        />

        {/* ── conta e dados ────────────────────────────────────── */}
        <Text style={[tipo.rotuloSecao, estilos.rotulo, { color: cores.legenda }]}>
          conta e dados
        </Text>
        <View style={[estilos.linhaConta, { borderTopColor: cores.linha }]}>
          <Text
            style={{ fontFamily: fontes.semi, fontSize: 14, lineHeight: 17, color: cores.textoForte }}
          >
            {usuario?.isAnonymous ? "sessão de convidado" : (usuario?.email ?? "")}
          </Text>
          <Text style={[tipo.metricaMono, { color: cores.legenda }]}>plano free</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/termos" as never)}
          style={[estilos.linhaConta, { borderTopColor: cores.linha }]}
        >
          <Text
            style={[
              { fontFamily: fontes.semi, fontSize: 14, lineHeight: 17 },
              estilos.flex,
              { color: cores.textoForte },
            ]}
          >
            Termos e privacidade
          </Text>
          <Text style={[tipo.metricaMono, { color: cores.legenda }]}>›</Text>
        </Pressable>

        <Botao
          estilo={estilos.botaoConta}
          rotulo="Sair da conta"
          variante="discreto"
          aoTocar={confirmarSaida}
          paleta={cores}
        />
        <Botao
          estilo={estilos.botaoConta}
          rotulo={excluindo ? "Excluindo…" : "Excluir conta"}
          variante="erro"
          desabilitado={excluindo}
          aoTocar={confirmarExclusao}
          paleta={cores}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** O interruptor de 34×18 do redesign — um quadrado de 14 dp dentro de um trilho, raio zero. */
function Interruptor({
  ligado,
  aoMudar,
  cores,
  ocupado = false,
}: {
  ligado: boolean;
  aoMudar: (valor: boolean) => void;
  cores: ReturnType<typeof useTema>["cores"];
  ocupado?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: ligado, disabled: ocupado }}
      disabled={ocupado}
      hitSlop={8}
      onPress={() => aoMudar(!ligado)}
      style={[
        estilos.interruptor,
        { backgroundColor: ligado ? cores.acento : cores.linha },
        ligado ? { justifyContent: "flex-end" } : { justifyContent: "flex-start" },
        ocupado && { opacity: 0.6 },
      ]}
    >
      <View
        style={[
          estilos.bolinha,
          { backgroundColor: ligado ? cores.acentoFundo : cores.desativado },
        ]}
      />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    paddingHorizontal: margemTela,
    marginTop: 46,
    borderBottomWidth: tamanhos.linha,
  },
  voltarLinha: { flexDirection: "row", alignItems: "center" },

  conteudo: {
    paddingHorizontal: margemTela,
    paddingTop: espaco.md,
    paddingBottom: rodapeFixo,
  },

  rotuloTopo: { textTransform: "uppercase", marginBottom: 7 },
  rotulo: { textTransform: "uppercase", marginTop: 11, marginBottom: 6 },

  cartoesTema: { flexDirection: "row", gap: 6 },
  cartaoTema: { flex: 1, borderWidth: tamanhos.linha, padding: 8 },
  amostras: { flexDirection: "row", gap: 3 },
  amostra: { width: 12, height: 12 },
  nomeTema: { fontFamily: fontes.semi, fontSize: 13, lineHeight: 16, marginTop: 7 },

  linhaInterruptor: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: tamanhos.linha,
  },

  linhaLembrete: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: tamanhos.linha,
  },

  cartoesRitmo: { flexDirection: "row", gap: 6 },
  cartaoRitmo: { flex: 1, borderWidth: tamanhos.linha, paddingVertical: 8, paddingHorizontal: 10 },

  avatarLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.md,
    paddingVertical: 11,
    borderTopWidth: tamanhos.linha,
  },

  campo: { marginTop: espaco.md },
  entrada: {
    marginTop: espaco.sm,
    minHeight: tamanhos.campo,
    borderWidth: tamanhos.linha,
    paddingHorizontal: 15,
  },
  linhaData: { flexDirection: "row", gap: espaco.sm },
  entradaData: { flex: 1, textAlign: "center" },
  entradaAno: { flex: 1.6, textAlign: "center" },

  opcoes: { flexDirection: "row", flexWrap: "wrap", gap: espaco.sm },
  chipFoco: {
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
  avisoFoco: { marginTop: espaco.sm, lineHeight: 17 },

  opcoesNivel: { marginTop: espaco.md, gap: espaco.sm },
  opcaoNivel: {
    borderWidth: tamanhos.linha,
    paddingVertical: espaco.md,
    paddingHorizontal: espaco.md,
    alignItems: "center",
  },

  aviso: { marginTop: espaco.xl, borderLeftWidth: tamanhos.trilho, paddingVertical: 12, paddingHorizontal: espaco.md },

  botaoSalvar: { marginTop: espaco.xl },
  botaoConta: { marginTop: espaco.sm },

  linhaConta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 7,
    borderTopWidth: tamanhos.linha,
  },

  interruptor: {
    width: 34,
    height: 18,
    flexDirection: "row",
    alignItems: "center",
    padding: 2,
  },
  bolinha: { width: 14, height: 14 },
});
