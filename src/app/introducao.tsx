import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Anel } from "@/componentes/Anel";
import { Rotulo } from "@/componentes/basicos";
import { Botao } from "@/componentes/Botao";
import { marcarIntroducaoVista } from "@/dados/apresentacao";
import { useConta } from "@/dados/ContaContexto";
import { useCores } from "@/dados/TemaContexto";
import {
  espaco,
  margemTela,
  tamanhos,
  tipo,
  topoConteudo,
} from "@/tema";

/**
 * INTRODUÇÃO — um tour, não um texto.
 *
 * Em vez de descrever o app em três frases, mostramos uma réplica em miniatura
 * da tela Hoje e de um card de exercício, com um balão por vez apontando pra
 * cada pedaço. **É um placebo**: nada aqui responde a toque de verdade além de
 * avançar o balão — os mockups (`MockHoje`, `MockCardExercicio`) são só View
 * e Text imitando o desenho real, sem estado, sem navegação.
 *
 * A navegação — pontinhos, "Continuar", "pular" no canto pra quem já sacou o
 * jeito — é a única tela de apresentação do app: não existe mais nenhum
 * carrossel antes do login.
 */

type Destaque = "cabecalho" | "cartao" | "sequencia" | "trilhas" | "abas";

type Passo = {
  destaque: Destaque | "card" | "logo";
  titulo: string;
  texto: string;
  balaoEmbaixo: boolean;
};

const PASSOS: Passo[] = [
  {
    destaque: "logo",
    titulo: "o que é Ouroboros",
    texto: "Ouroboros é a cobra que morde o próprio rabo — um símbolo antigo de algo que nunca para de girar. Aqui é o nome do seu ciclo de estudo: você aprende um pouco, revisa o que já viu, e volta sempre um pouco mais forte. Vem ver como funciona.",
    balaoEmbaixo: true,
  },
  {
    destaque: "cabecalho",
    titulo: "seu progresso",
    texto: "Cada exercício certo dá pontos de experiência, o XP. Ao acumular XP você sobe de nível — uma escada de níveis que começa no Ovo e termina no Ouroboros, o nível mais alto.",
    balaoEmbaixo: true,
  },
  {
    destaque: "cartao",
    titulo: "sua prática de hoje",
    texto: "Todo dia existe uma lista curta de exercícios te esperando — chamamos isso de diária. Este cartão mostra quantos faltam. Toque em Começar e é só seguir em frente.",
    balaoEmbaixo: true,
  },
  {
    destaque: "sequencia",
    titulo: "sua sequência de dias",
    texto: "Cada dia em que você termina a diária, um quadrado desta fileira acende sozinho — é a contagem de dias seguidos estudando. Não precisa tocar em nada: basta terminar os exercícios do dia.",
    balaoEmbaixo: false,
  },
  {
    destaque: "trilhas",
    titulo: "trilhas",
    texto: "Cada linguagem tem uma trilha: uma sequência de lições, da mais fácil à mais difícil. Todo dia o app já separa os exercícios certos pra você, na ordem certa — assim você não perde tempo decidindo o que estudar. Quiser escolher por conta própria, dá pra explorar a trilha inteira aqui.",
    balaoEmbaixo: false,
  },
  {
    destaque: "abas",
    titulo: "os cinco lugares do app",
    texto: "Hoje é onde você começa todo dia. Trilhas mostra o mapa completo de cada linguagem. Relâmpago é um desafio de 60 segundos pra praticar por diversão — não conta pra sua sequência nem pro seu progresso, é livre, faça quando quiser. Liga é um ranking com amigos. Perfil mostra tudo que você já conquistou.",
    balaoEmbaixo: false,
  },
  {
    destaque: "card",
    titulo: "como se responde",
    texto: "Toque numa alternativa para escolher, depois confirme. Errou? Sem problema, o exercício volta mais tarde pra você tentar de novo. Travou de vez? Dá pra pular até 5 vezes por sessão.",
    balaoEmbaixo: true,
  },
];

export default function Introducao() {
  const cores = useCores();
  const router = useRouter();
  const { usuario } = useConta();
  const [indice, setIndice] = useState(0);
  const [ocupado, setOcupado] = useState(false);

  const passo = PASSOS[indice]!;
  const ultimo = indice === PASSOS.length - 1;

  async function concluir() {
    if (!usuario || ocupado) return;
    setOcupado(true);
    await marcarIntroducaoVista(usuario.uid);
    router.replace("/");
  }

  function avancar() {
    if (ultimo) return concluir();
    setIndice((i) => i + 1);
  }

  return (
    <View style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      {/* ── topo ──────────────────────────────────────────────── */}
      <View style={estilos.topo}>
        <View style={estilos.marca}>
          <Anel tamanho={30} corFundo={cores.fundo} />
          <Text style={[estilos.nomeMarca, { color: cores.acento }]}>DEVQUEST</Text>
        </View>

        <Pressable accessibilityRole="button" hitSlop={12} onPress={concluir}>
          <Text style={[estilos.pular, { color: cores.desativado }]}>pular</Text>
        </Pressable>
      </View>

      {/* ── o mockup ──────────────────────────────────────────── */}
      <View style={estilos.palco}>
        {!passo.balaoEmbaixo && (
          <Balao titulo={passo.titulo} texto={passo.texto} seta="baixo" />
        )}

        <View style={[estilos.moldura, { borderColor: cores.linha, backgroundColor: cores.fundo }]}>
          {passo.destaque === "card" ? (
            <MockCardExercicio />
          ) : passo.destaque === "logo" ? (
            <MockLogo />
          ) : (
            <MockHoje destaque={passo.destaque} />
          )}
        </View>

        {passo.balaoEmbaixo && (
          <Balao titulo={passo.titulo} texto={passo.texto} seta="cima" />
        )}
      </View>

      {/* ── rodapé ────────────────────────────────────────────── */}
      <View style={estilos.rodape}>
        <View style={estilos.pontos}>
          {PASSOS.map((_, i) => (
            <View
              key={i}
              style={[
                estilos.ponto,
                { backgroundColor: cores.linha },
                i === indice && { backgroundColor: cores.acento },
              ]}
            />
          ))}
        </View>

        <Botao
          rotulo={
            ocupado ? "Um instante…" : ultimo ? "Vamos começar" : "Continuar"
          }
          desabilitado={ocupado || !usuario}
          aoTocar={avancar}
        />
      </View>
    </View>
  );
}

/* ─────────────────────────── o balão ────────────────────────────── */

function Balao({
  titulo,
  texto,
  seta,
}: {
  titulo: string;
  texto: string;
  seta: "cima" | "baixo";
}) {
  const cores = useCores();

  return (
    <View style={estilos.balaoBloco}>
      {seta === "cima" && <Text style={[estilos.seta, { color: cores.acento }]}>▲</Text>}
      <View
        style={[
          estilos.balao,
          { borderColor: cores.acentoLinha, backgroundColor: cores.acentoFundo },
        ]}
      >
        <Rotulo cor={cores.acento}>{titulo}</Rotulo>
        <Text style={[estilos.balaoTexto, { color: cores.texto }]}>{texto}</Text>
      </View>
      {seta === "baixo" && <Text style={[estilos.seta, { color: cores.acento }]}>▼</Text>}
    </View>
  );
}

/* ───────────────────────── mockup: a logo ───────────────────────── */

function MockLogo() {
  const cores = useCores();

  return (
    <View style={estilos.mockLogo}>
      <Anel tamanho={84} corFundo={cores.fundo} />
    </View>
  );
}

/* ─────────────────────── mockup: tela Hoje ──────────────────────── */

/** Nada aqui é real: números fixos, sem toque, só pra ilustrar o balão da vez. */
function MockHoje({ destaque }: { destaque: Destaque }) {
  const cores = useCores();
  const apagado = (bloco: Destaque) => destaque !== bloco && estilos.mockApagado;

  return (
    <View style={estilos.mockTela}>
      <View style={[estilos.mockCabecalho, apagado("cabecalho")]}>
        <View style={estilos.mockFlex}>
          <Text style={[estilos.mockRank, { color: cores.textoForte }]}>SERPENTE</Text>
          <View style={[estilos.mockTrilhoXp, { backgroundColor: cores.linha }]}>
            <View style={[estilos.mockTrilhoXpPreenchido, { backgroundColor: cores.acento }]} />
          </View>
        </View>
        <View
          style={[
            estilos.mockAvatar,
            { borderColor: cores.linha, backgroundColor: cores.superficie },
          ]}
        />
      </View>

      <View
        style={[
          estilos.mockCartao,
          { borderColor: cores.acento, backgroundColor: cores.acentoFundo },
          apagado("cartao"),
        ]}
      >
        <Text style={[estilos.mockRotuloCartao, { color: cores.acento }]}>sessão diária</Text>
        <View style={estilos.mockCartaoCorpo}>
          <Text style={[estilos.mockNumero, { color: cores.textoForte }]}>8</Text>
          <Text style={[estilos.mockCards, { color: cores.textoForte }]}>cards</Text>
        </View>
        <View style={[estilos.mockBotaoCartao, { backgroundColor: cores.acento }]}>
          <Text style={[estilos.mockBotaoCartaoTexto, { color: cores.acentoFundo }]}>Começar</Text>
        </View>
      </View>

      <View style={[estilos.mockSecao, apagado("sequencia")]}>
        <Text style={[estilos.mockSequenciaNumero, { color: cores.acento }]}>12</Text>
        <View style={estilos.mockSemana}>
          {[1, 1, 1, 1, 0, 0, 0].map((feito, i) => (
            <View
              key={i}
              style={[
                estilos.mockCelula,
                { backgroundColor: cores.linha },
                feito ? { backgroundColor: cores.acento } : null,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={[estilos.mockSecao, apagado("trilhas")]}>
        {["C#", "js"].map((sigla) => (
          <View key={sigla} style={estilos.mockLinhaTrilha}>
            <Text style={[estilos.mockSigla, { color: cores.legenda }]}>{sigla}</Text>
            <View style={[estilos.mockBarraTrilha, { backgroundColor: cores.linha }]}>
              <View style={[estilos.mockBarraTrilhaPreenchida, { backgroundColor: cores.acento }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={[estilos.mockAbas, { borderTopColor: cores.linha }, apagado("abas")]}>
        {["hoje", "trilhas", "raio", "liga", "perfil"].map((rotulo, i) => (
          <View key={rotulo} style={estilos.mockAba}>
            <View
              style={[
                estilos.mockIconeAba,
                { backgroundColor: cores.desativado },
                i === 0 && { backgroundColor: cores.acento },
              ]}
            />
            <Text
              style={[
                estilos.mockRotuloAba,
                { color: cores.desativado },
                i === 0 && { color: cores.acento },
              ]}
            >
              {rotulo}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ─────────────────── mockup: card de exercício ──────────────────── */

function MockCardExercicio() {
  const cores = useCores();

  return (
    <View style={estilos.mockTela}>
      <View style={estilos.mockTopoCard}>
        <Text style={[estilos.mockFechar, { color: cores.legenda }]}>✕</Text>
        <View style={[estilos.mockTrilhoSessao, { backgroundColor: cores.linha }]}>
          <View style={[estilos.mockTrilhoSessaoPreenchido, { backgroundColor: cores.acento }]} />
        </View>
        <Text style={[estilos.mockContador, { color: cores.legenda }]}>3/8</Text>
      </View>

      <Text style={[estilos.mockPergunta, { color: cores.textoForte }]}>
        Qual destas é uma palavra-chave?
      </Text>

      <View style={estilos.mockAlternativas}>
        {["const", "banana", "titulo"].map((texto, i) => (
          <View
            key={texto}
            style={[
              estilos.mockAlternativa,
              { borderColor: cores.linha, backgroundColor: cores.superficie },
              i === 0 && { borderColor: cores.acento },
            ]}
          >
            <Text style={[estilos.mockLetra, { color: cores.legenda }]}>
              {String.fromCharCode(65 + i)}
            </Text>
            <Text style={[estilos.mockAlternativaTexto, { color: cores.texto }]}>{texto}</Text>
          </View>
        ))}
      </View>

      <View style={estilos.mockLinhaAcoes}>
        <View style={[estilos.mockBotaoMetade, { borderColor: cores.linha }]}>
          <Text style={[estilos.mockBotaoSecundarioTexto, { color: cores.legenda }]}>
            Pular (5)
          </Text>
        </View>
        <View
          style={[
            estilos.mockBotaoMetade,
            { borderColor: cores.acento, backgroundColor: cores.acento },
          ]}
        >
          <Text style={[estilos.mockBotaoPrimarioTexto, { color: cores.acentoFundo }]}>
            Verificar
          </Text>
        </View>
      </View>
    </View>
  );
}

const LARGURA_MOCK = 236;

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    paddingHorizontal: margemTela,
    paddingTop: topoConteudo,
    paddingBottom: 30,
  },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  marca: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  nomeMarca: { ...tipo.rotuloSecao },
  pular: { ...tipo.metricaMono },

  palco: { flex: 1, alignItems: "center", justifyContent: "center", gap: espaco.lg },

  moldura: {
    width: LARGURA_MOCK,
    borderWidth: tamanhos.linha,
    padding: espaco.sm,
    overflow: "hidden",
  },

  balaoBloco: { width: "100%", alignItems: "center", gap: 2 },
  seta: { fontSize: 12, lineHeight: 12 },
  balao: {
    width: "100%",
    borderWidth: tamanhos.linha,
    padding: espaco.md,
    gap: espaco.xs,
  },
  balaoTexto: { ...tipo.corpoMenor, lineHeight: 20 },

  rodape: { gap: espaco.lg },
  pontos: { flexDirection: "row", gap: espaco.sm, justifyContent: "center" },
  ponto: { width: 22, height: tamanhos.trilho },

  mockLogo: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── réplica da tela Hoje, em miniatura ─────────────────────── */
  mockTela: { gap: espaco.sm },
  mockApagado: { opacity: 0.3 },
  mockFlex: { flex: 1 },

  mockCabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
    padding: espaco.xs,
  },
  mockRank: { ...tipo.rotuloCelula },
  mockTrilhoXp: {
    height: 4,
    width: 70,
    marginTop: 4,
  },
  mockTrilhoXpPreenchido: { width: "60%", height: "100%" },
  mockAvatar: {
    width: 22,
    height: 22,
    borderWidth: tamanhos.linha,
  },

  mockCartao: {
    borderWidth: tamanhos.linha,
    padding: espaco.sm,
    gap: 6,
  },
  mockRotuloCartao: { ...tipo.rotuloCelula },
  mockCartaoCorpo: { flexDirection: "row", alignItems: "flex-end", gap: 5 },
  mockNumero: { ...tipo.metrica, fontSize: 26 },
  mockCards: { ...tipo.rotuloCelula, paddingBottom: 3 },
  mockBotaoCartao: {
    marginTop: 2,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  mockBotaoCartaoTexto: { ...tipo.rotuloCelula },

  mockSecao: { padding: espaco.xs, gap: espaco.xs },
  mockSequenciaNumero: { ...tipo.metrica, fontSize: 22 },
  mockSemana: { flexDirection: "row", gap: 3 },
  mockCelula: { flex: 1, height: 10 },

  mockLinhaTrilha: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  mockSigla: { ...tipo.rotuloCelula, width: 20 },
  mockBarraTrilha: { flex: 1, height: 4 },
  mockBarraTrilhaPreenchida: { width: "45%", height: "100%" },

  mockAbas: {
    flexDirection: "row",
    borderTopWidth: tamanhos.linha,
    paddingTop: espaco.xs,
  },
  mockAba: { flex: 1, alignItems: "center", gap: 3 },
  mockIconeAba: { width: 8, height: 8 },
  mockRotuloAba: { fontSize: 6.5, fontFamily: tipo.rotuloAba.fontFamily },

  /* ── réplica do card de exercício, em miniatura ─────────────── */
  mockTopoCard: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  mockFechar: { fontSize: 14 },
  mockTrilhoSessao: { flex: 1, height: 3 },
  mockTrilhoSessaoPreenchido: { width: "35%", height: "100%" },
  mockContador: { ...tipo.rotuloCelula },

  mockPergunta: { ...tipo.tituloItemMenor, marginTop: espaco.xs },

  mockAlternativas: { gap: espaco.xs },
  mockAlternativa: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
    borderWidth: tamanhos.linha,
    paddingVertical: espaco.xs,
    paddingHorizontal: espaco.sm,
  },
  mockLetra: { ...tipo.rotuloCelula, width: 14 },
  mockAlternativaTexto: { ...tipo.rotuloCelula, letterSpacing: 0, fontSize: 11 },

  mockLinhaAcoes: { flexDirection: "row", gap: espaco.xs, marginTop: espaco.xs },
  mockBotaoMetade: {
    flex: 1,
    height: 26,
    borderWidth: tamanhos.linha,
    alignItems: "center",
    justifyContent: "center",
  },
  mockBotaoSecundarioTexto: { ...tipo.rotuloCelula, letterSpacing: 0 },
  mockBotaoPrimarioTexto: { ...tipo.rotuloCelula, letterSpacing: 0 },
});
