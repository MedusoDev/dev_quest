import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
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
import { LogoGoogle } from "@/componentes/icones/LogoGoogle";
import { Regua } from "@/componentes/basicos";
import {
    suavizar,
    useMovimentoReduzido,
    usePop,
} from "@/componentes/movimento";
import { useConta } from "@/dados/ContaContexto";
import { useCores } from "@/dados/TemaContexto";
import {
    entrarComoAdminTemporario,
    googleConfigurado,
    recuperarSenha,
    traduzirErro,
} from "@/dados/conta";
import {
    SENHA_MIN,
    validarEmail,
    validarNome,
    validarSenha,
} from "@/nucleo/perfil";
import {
    animacao,
    curva,
    espaco,
    margemTela,
    rodapeFixo,
    tamanhos,
    tipo,
    topoConteudo,
} from "@/tema";

/**
 * ENTRAR OU CRIAR CONTA — a rota de entrada do app.
 *
 * Abre sempre em "entrar". As duas telas são **um arquivo só**, trocadas pelo
 * link embaixo do formulário — não por abas no topo, que faziam parecer que a
 * tela inteira ia para o lado. Separá-las em duas rotas faria a marca e o
 * título saltarem a cada troca; aqui só o bloco do formulário faz um *pop* e
 * o cabeçalho fica parado.
 *
 * ── A BORDA É A VALIDAÇÃO ─────────────────────────────────────────────────
 *
 * Nenhum campo tem mensagem própria. A borda diz o estado: neutra vazia, no
 * acento quando o valor serve, em vermelho quando não serve. A mensagem só
 * aparece uma vez, embaixo, **e só depois de tentar enviar** — corrigir alguém
 * no meio da digitação é a forma mais rápida de irritar quem está criando uma
 * conta.
 */

type Modo = "entrar" | "cadastrar";

export default function Entrar() {
  const cores = useCores();
  const router = useRouter();
  const reduzido = useMovimentoReduzido();
  const { usuario } = useConta();

  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cadastrando = modo === "cadastrar";

  // Escondido até `app.json` → `extra` ter as duas chaves do OAuth do Google
  // preenchidas — ver o comentário de `credenciaisGoogle` em `dados/conta.ts`.
  const temGoogle = googleConfigurado();

  // Login/cadastro temporariamente desativados: qualquer botão entra com a
  // sessão convidada fixa "admin" — ver `entrarComoAdminTemporario`.
  function comGoogle() {
    setErro(null);
    setAviso(null);
    setOcupado(true);
    entrarComoAdminTemporario()
      .catch((e) => setErro(traduzirErro(e)))
      .finally(() => setOcupado(false));
  }

  // O *pop* do bloco do formulário a cada troca de modo. A chave é o modo:
  // trocar remonta a animação, digitar não.
  const pop = usePop(true, animacao.feedback, reduzido);

  // A saída: a tela inteira sobe 40 dp e apaga antes de as abas montarem.
  const saida = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!usuario) return;

    if (reduzido) {
      saida.setValue(1);
      return;
    }

    Animated.timing(saida, {
      toValue: 1,
      duration: animacao.auth,
      easing: suavizar(curva.saida),
      useNativeDriver: true,
    }).start();
  }, [usuario, reduzido, saida]);

  const problemaNome = cadastrando ? validarNome(nome) : null;
  const problemaEmail = validarEmail(email);
  const problemaSenha = validarSenha(senha);

  // Login/cadastro temporariamente desativados (ver `comGoogle` acima): o
  // formulário não bloqueia mais o envio por validação de campo.
  const podeEnviar = !ocupado;

  function trocarModo(novo: Modo) {
    if (novo === modo) return;
    setModo(novo);
    setErro(null);
    setAviso(null);
  }

  async function enviar() {
    setErro(null);
    setAviso(null);

    setOcupado(true);
    try {
      await entrarComoAdminTemporario();
      // Não navego daqui: o portão da raiz (`Portao`, em `_layout.tsx`) percebe
      // a sessão nova e decide sozinho para onde ir — onboarding ou introdução.
      // Um `replace` explícito aqui competia com o dele e piscava a tela em
      // branco no meio da troca.
    } catch (e) {
      setErro(traduzirErro(e));
    } finally {
      setOcupado(false);
    }
  }

  async function esqueci() {
    setErro(null);
    setAviso(null);

    if (problemaEmail)
      return setErro("Escreva seu e-mail acima para eu enviar o link.");

    try {
      await recuperarSenha(email);
      setAviso("Link enviado. Olhe sua caixa de entrada.");
    } catch (e) {
      setErro(traduzirErro(e));
    }
  }

  return (
    <Animated.View
      style={[
        estilos.tela,
        { backgroundColor: cores.fundo },
        {
          opacity: saida.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
          transform: [
            {
              translateY: saida.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -40],
              }),
            },
          ],
        },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={estilos.flex}
      >
        <ScrollView
          contentContainerStyle={estilos.conteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── marca ─────────────────────────────────────────── */}
          <View style={estilos.marca}>
            <Anel tamanho={38} corFundo={cores.fundo} />
            <Text style={[estilos.nomeMarca, { color: cores.acento }]}>DEVQUEST</Text>
          </View>

          <Text style={[estilos.titulo, { color: cores.textoForte }]}>
            {cadastrando ? "Comece o seu ciclo" : "De volta ao ciclo"}
          </Text>
          <Text style={[estilos.subtitulo, { color: cores.legenda }]}>
            {cadastrando
              ? "Uma sessão curta por dia. O resto o agendamento resolve."
              : "Sua sequência está esperando desde ontem."}
          </Text>

          <Animated.View key={modo} style={[estilos.formulario, pop]}>
            {cadastrando && (
              <Campo
                rotulo="CODINOME"
                valor={nome}
                aoMudar={setNome}
                placeholder="rafa.dev"
                estado={estadoDoCampo(nome, problemaNome)}
                autoComplete="name"
              />
            )}

            <Campo
              rotulo="E-MAIL"
              valor={email}
              aoMudar={setEmail}
              placeholder="voce@email.com"
              estado={estadoDoCampo(email, problemaEmail)}
              teclado="email-address"
              autoComplete="email"
            />

            <Campo
              rotulo="SENHA"
              valor={senha}
              aoMudar={setSenha}
              placeholder="••••••••"
              estado={estadoDoCampo(senha, problemaSenha)}
              secreto={!verSenha}
              autoComplete={cadastrando ? "new-password" : "current-password"}
              acao={{
                rotulo: verSenha ? "ocultar" : "mostrar",
                aoTocar: () => setVerSenha((v) => !v),
              }}
            >
              {cadastrando && <ForcaDaSenha senha={senha} />}
            </Campo>

            {cadastrando && (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: aceitouTermos }}
                onPress={() => setAceitouTermos((v) => !v)}
                style={estilos.linhaTermos}
              >
                <View
                  style={[
                    estilos.caixaTermos,
                    { borderColor: cores.linha },
                    aceitouTermos && {
                      backgroundColor: cores.acento,
                      borderColor: cores.acento,
                    },
                  ]}
                >
                  {aceitouTermos && (
                    <Text style={[estilos.marcaTermos, { color: cores.acentoFundo }]}>✓</Text>
                  )}
                </View>
                <Text style={[estilos.textoTermos, { color: cores.legenda }]}>
                  Li e concordo com os{" "}
                  <Text
                    style={{ color: cores.acento }}
                    onPress={() => router.push("/termos" as never)}
                  >
                    Termos e a Política de Privacidade
                  </Text>
                  .
                </Text>
              </Pressable>
            )}

            {erro && (
              <Aviso texto={erro} cor={cores.erro} fundo={cores.erroFundo} />
            )}
            {aviso && (
              <Aviso
                texto={aviso}
                cor={cores.acento}
                fundo={cores.acentoFundo}
              />
            )}

            <Botao
              rotulo={
                ocupado
                  ? "Um instante…"
                  : cadastrando
                    ? "Criar conta"
                    : "Entrar"
              }
              desabilitado={!podeEnviar}
              aoTocar={enviar}
            />

            {cadastrando && (
              <Text style={[estilos.termos, { color: cores.desativado }]}>
                A sequência começa no dia em que você fizer a primeira sessão.
              </Text>
            )}

            {temGoogle && (
              <>
                <View style={estilos.divisor}>
                  <Regua estilo={estilos.divisorRegua} />
                  <Text style={[estilos.ou, { color: cores.desativado }]}>OU</Text>
                  <Regua estilo={estilos.divisorRegua} />
                </View>

                <Botao
                  rotulo="Continuar com Google"
                  variante="secundarioForte"
                  icone={<LogoGoogle />}
                  desabilitado={ocupado}
                  aoTocar={comGoogle}
                />
                {cadastrando && (
                  <Text style={[estilos.termosConvidado, { color: cores.desativado }]}>
                    Ao continuar, você concorda com os{" "}
                    <Text
                      style={{ color: cores.acento }}
                      onPress={() => router.push("/termos" as never)}
                    >
                      Termos e a Política de Privacidade
                    </Text>
                    .
                  </Text>
                )}
              </>
            )}

            {!cadastrando && (
              <>
                {!temGoogle && (
                  <View style={estilos.divisor}>
                    <Regua estilo={estilos.divisorRegua} />
                    <Text style={[estilos.ou, { color: cores.desativado }]}>OU</Text>
                    <Regua estilo={estilos.divisorRegua} />
                  </View>
                )}

                <Botao
                  rotulo="Criar conta"
                  variante="secundario"
                  desabilitado={ocupado}
                  aoTocar={() => trocarModo("cadastrar")}
                />

                <Pressable accessibilityRole="button" onPress={esqueci}>
                  <Text style={[estilos.esqueci, { color: cores.desativado }]}>esqueci a senha</Text>
                </Pressable>
              </>
            )}

            {cadastrando && (
              <Pressable
                accessibilityRole="button"
                onPress={() => trocarModo("entrar")}
                style={estilos.trocarModo}
              >
                <Text style={[estilos.trocarModoTexto, { color: cores.legenda }]}>
                  Já tem conta?{" "}
                  <Text style={{ color: cores.acento }}>Entrar</Text>
                </Text>
              </Pressable>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

/* ───────────────────────── as peças ─────────────────────────────── */

type EstadoCampo = "vazio" | "valido" | "invalido";

/** A borda comunica a validação; não há mensagem por campo. */
function estadoDoCampo(valor: string, problema: string | null): EstadoCampo {
  if (valor.length === 0) return "vazio";
  return problema ? "invalido" : "valido";
}

function bordaDoEstado(cores: ReturnType<typeof useCores>, estado: EstadoCampo): string {
  const mapa: Record<EstadoCampo, string> = {
    vazio: cores.linha,
    valido: cores.acentoLinha,
    invalido: cores.erroLinha,
  };
  return mapa[estado];
}

function Campo({
  rotulo,
  valor,
  aoMudar,
  placeholder,
  estado,
  secreto = false,
  teclado = "default",
  autoComplete,
  acao,
  children,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  placeholder: string;
  estado: EstadoCampo;
  secreto?: boolean;
  teclado?: "default" | "email-address";
  autoComplete?: "name" | "email" | "new-password" | "current-password";
  acao?: { rotulo: string; aoTocar: () => void };
  children?: React.ReactNode;
}) {
  const cores = useCores();

  return (
    <View>
      <View style={estilos.rotuloLinha}>
        <Text style={[tipo.rotuloCampo, { color: cores.legenda }]}>
          {rotulo}
        </Text>
        {acao && (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={acao.aoTocar}
          >
            <Text style={[tipo.rotuloFino, { color: cores.acento }]}>
              {acao.rotulo}
            </Text>
          </Pressable>
        )}
      </View>

      <TextInput
        style={[
          estilos.entrada,
          {
            borderColor: bordaDoEstado(cores, estado),
            backgroundColor: cores.superficie,
            color: cores.textoForte,
          },
        ]}
        value={valor}
        onChangeText={aoMudar}
        placeholder={placeholder}
        placeholderTextColor={cores.desativado}
        secureTextEntry={secreto}
        keyboardType={teclado}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={autoComplete}
      />

      {children}
    </View>
  );
}

/**
 * O medidor de força: um ponto por critério atendido.
 *
 * Três critérios, e eles são os três que de fato mudam alguma coisa contra um
 * ataque de dicionário. Não peço maiúscula: é a regra que mais gera senha
 * ruim decorada com um `A` na frente.
 */
function ForcaDaSenha({ senha }: { senha: string }) {
  const cores = useCores();
  const criterios = [
    senha.length >= SENHA_MIN,
    /\d/.test(senha),
    /[^\w\s]/.test(senha),
  ];
  const pontos = criterios.filter(Boolean).length;

  const escala: { cor: string; rotulo: string }[] = [
    { cor: cores.desativado, rotulo: `mín. ${SENHA_MIN}` },
    { cor: cores.erro, rotulo: "fraca" },
    { cor: cores.atencao, rotulo: "ok" },
    { cor: cores.acento, rotulo: "forte" },
  ];

  const { cor, rotulo } = escala[senha.length === 0 ? 0 : pontos]!;

  return (
    <View style={estilos.forca}>
      <View style={estilos.forcaBarras}>
        {[0, 1, 2].map((indice) => (
          <View
            key={indice}
            style={[
              estilos.forcaSegmento,
              {
                backgroundColor:
                  senha.length > 0 && indice < pontos ? cor : cores.linha,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[tipo.rotuloCelula, { color: cor, letterSpacing: 0 }]}>
        {rotulo}
      </Text>
    </View>
  );
}

/** Bloco de mensagem: barra de 2 px à esquerda e fundo da própria cor. */
function Aviso({
  texto,
  cor,
  fundo,
}: {
  texto: string;
  cor: string;
  fundo: string;
}) {
  return (
    <View
      style={[estilos.aviso, { borderLeftColor: cor, backgroundColor: fundo }]}
    >
      <Text style={[estilos.avisoTexto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  tela: { flex: 1 },
  conteudo: {
    flexGrow: 1,
    paddingHorizontal: margemTela,
    paddingTop: topoConteudo,
    paddingBottom: rodapeFixo,
  },

  marca: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.md,
    paddingTop: 30,
  },
  nomeMarca: { ...tipo.rotuloSecao },

  titulo: {
    ...tipo.tituloGrande,
    marginTop: espaco.xl,
  },
  subtitulo: { ...tipo.notaMono, marginTop: 12 },

  formulario: { marginTop: 24, gap: 18 },

  rotuloLinha: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  entrada: {
    marginTop: espaco.sm,
    minHeight: tamanhos.campo,
    borderWidth: tamanhos.linha,
    paddingHorizontal: 15,
    ...tipo.campo,
  },

  forca: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
  },
  forcaBarras: { flex: 1, flexDirection: "row", gap: 3 },
  forcaSegmento: { flex: 1, height: 3 },

  aviso: {
    borderLeftWidth: tamanhos.trilho,
    paddingVertical: 12,
    paddingHorizontal: espaco.md,
  },
  avisoTexto: { ...tipo.metricaMonoMedia, lineHeight: 19 },

  linhaTermos: { flexDirection: "row", alignItems: "flex-start", gap: espaco.sm },
  caixaTermos: {
    width: 18,
    height: 18,
    marginTop: 2,
    borderWidth: tamanhos.linha,
    alignItems: "center",
    justifyContent: "center",
  },
  marcaTermos: { ...tipo.rotuloFino, fontSize: 12 },
  textoTermos: { ...tipo.notaMonoMenor, flex: 1, lineHeight: 18 },
  termosConvidado: {
    ...tipo.notaMonoMenor,
    textAlign: "center",
    lineHeight: 17,
  },

  divisor: { flexDirection: "row", alignItems: "center", gap: 12 },
  divisorRegua: { flex: 1 },
  ou: { ...tipo.rotuloCelula },

  esqueci: {
    ...tipo.metricaMono,
    textAlign: "center",
  },
  termos: { ...tipo.notaMonoMenor, lineHeight: 19 },

  trocarModo: { marginTop: espaco.sm },
  trocarModoTexto: {
    ...tipo.notaMono,
    textAlign: "center",
  },
});
