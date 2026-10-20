import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Flame, GearSix, Lightning, LockSimple, Star, Target, Trophy } from "phosphor-react-native";

import { Avatar } from "@/componentes/Avatar";
import { Calendario } from "@/componentes/Calendario";
import { TelaAba } from "@/componentes/abas";
import { Trilho } from "@/componentes/basicos";
import { escurecer, tingir } from "@/componentes/Botao";
import { CORES_NIVEL, Devzinho, nivelDoRank, type NivelDevzinho } from "@/componentes/Devzinho";
import { Gradiente } from "@/componentes/Gradiente";
import { useCores } from "@/dados/TemaContexto";
import { useConta } from "@/dados/ContaContexto";
import { useProgresso } from "@/dados/ProgressoContexto";
import { CONQUISTAS, RANKS, rankPara } from "@/nucleo/gamificacao";
import { obterLinguagem } from "@/nucleo/conteudo";
import { diaDaSemana, hoje, somarDias } from "@/nucleo/datas";
import { idadeDe, NIVEIS_CONHECIMENTO } from "@/nucleo/perfil";
import { estaDominado } from "@/nucleo/revisao";
import { espaco, fontes, margemTela, raio, tamanhos, tipo } from "@/tema";

/**
 * PERFIL — compacto.
 *
 * Redesign do handoff `redesign-de-layout-do-projeto`: sai o título de
 * abertura (era meia tela), entra uma barra de 52 dp igual à de Trilhas —
 * nome da tela à esquerda, atalho para Configurações à direita. Da
 * identidade até conquistas cabe sem rolar em 844 dp; a busca por espaço é o
 * que também tirou a seção de bordas do avatar daqui (ela não tinha lugar no
 * desenho compacto) e moveu "ritmo da diária" para Configurações, junto com
 * o resto do que hoje é "editar".
 *
 * O topo é do Devzinho: ele aparece no nível atual da pessoa (aura, óculos,
 * coroa) e a "escada" virou a **Evolução do Devzinho** — os seis níveis lado a
 * lado, os alcançados coloridos, os próximos como silhueta.
 */

const QUANTAS_CONQUISTAS_VISIVEIS = 3;

export default function Perfil() {
  const cores = useCores();
  const router = useRouter();
  const { progresso, revisoes } = useProgresso();
  const { perfil } = useConta();
  const [mostrarTodasConquistas, setMostrarTodasConquistas] = useState(false);

  const rank = rankPara(progresso.xp);
  const posicaoRank = RANKS.findIndex((r) => r.nome === rank.atual.nome) + 1;
  const nivel = nivelDoRank(posicaoRank - 1);
  const corNivel = CORES_NIVEL[nivel];
  const desbloqueadas = new Set(progresso.conquistas);
  const dominados = [...revisoes.values()].filter(estaDominado).length;
  const idade = idadeDe(perfil?.dataNascimento ?? null);

  const acerto =
    progresso.cardsRespondidos > 0
      ? Math.round((progresso.cardsAcertados / progresso.cardsRespondidos) * 100)
      : 0;

  const conquistasMostradas = mostrarTodasConquistas
    ? CONQUISTAS
    : CONQUISTAS.slice(0, QUANTAS_CONQUISTAS_VISIVEIS);

  // A mesma janela de 5 semanas que o `Calendario` desenha — a contagem ao
  // lado do rótulo precisa bater com o que a grade mostra, não com o
  // histórico inteiro (que guarda até 120 dias).
  const fimJanela = somarDias(hoje(), 6 - diaDaSemana(hoje()));
  const inicioJanela = somarDias(fimJanela, -(5 * 7 - 1));
  const diasNaJanela = progresso.historico.filter(
    (dia) => dia >= inicioJanela && dia <= fimJanela
  ).length;

  return (
    <TelaAba paleta={cores}>
      <View style={[estilos.barra, { borderBottomColor: cores.linha }]}>
        <Text style={[tipo.tituloLinha, { color: cores.textoForte }]}>Perfil</Text>
        <Pressable
          accessibilityLabel="Configurações"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.push("/configuracoes" as never)}
          style={estilos.configuracoes}
        >
          <GearSix size={24} color={cores.textoForte} weight="regular" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        {/* ── o Devzinho no nível da pessoa ─────────────────────── */}
        <View style={[estilos.heroi, { borderColor: corNivel }]}>
          <Gradiente de={cores.superficie} para={tingir(corNivel, cores, 0.6)} />
          <Devzinho tamanho={112} nivel={nivel} item="varinha" expressao="feliz" />
          <View style={estilos.flex}>
            <View style={estilos.identidade}>
              <Avatar
                nome={perfil?.nome ?? "Você"}
                foto={perfil?.foto}
                bordaId={perfil?.borda}
                tamanho={36}
                paleta={cores}
              />
              <Text numberOfLines={1} style={[estilos.nome, estilos.flex, { color: cores.textoForte }]}>
                {perfil?.nome ?? "Sem nome"}
              </Text>
            </View>
            <View style={[estilos.chipNivel, { backgroundColor: cores.fundo, borderColor: corNivel }]}>
              <Text style={[estilos.chipNivelTexto, { color: corNivel }]}>{`NÍVEL ${nivel}`}</Text>
              <Text style={[estilos.chipNivelRank, { color: cores.textoForte }]}>{rank.atual.nome}</Text>
            </View>
            <Trilho fracao={rank.progresso} cor={corNivel} altura={10} estilo={estilos.barraNivel} />
            <Text style={[tipo.metricaMono, { color: cores.texto, marginTop: 6 }]}>
              {rank.proximo ? `faltam ${rank.faltam} XP p/ ${rank.proximo.nome}` : "nível máximo!"}
            </Text>
          </View>
        </View>

        {/* ── métricas ─────────────────────────────────────────── */}
        <View style={estilos.grade}>
          <Celula icone={<Lightning size={18} weight="fill" color={cores.ouro} />} valor={String(progresso.xp)} rotulo="XP" cores={cores} />
          <Celula icone={<Flame size={18} weight="fill" color={cores.ouro} />} valor={String(progresso.sequencia)} rotulo="SEQ" cores={cores} />
          <Celula icone={<Star size={18} weight="fill" color={cores.acentoSecundario} />} valor={String(dominados)} rotulo="MADUROS" cores={cores} />
          <Celula icone={<Target size={18} weight="bold" color={cores.ok} />} valor={`${acerto}%`} rotulo="ACERTO" cores={cores} />
        </View>

        {/* ── sobre você ───────────────────────────────────────── */}
        {perfil?.onboardingCompleto && (
          <View style={[estilos.cartao, { backgroundColor: cores.superficie }]}>
            <Text style={[tipo.rotuloSecao, estilos.rotuloSecaoCartao, { color: cores.legenda }]}>
              sobre você
            </Text>
            <View>
              {perfil.nomeCompleto && (
                <ReguaSobre rotulo="NOME" valor={perfil.nomeCompleto} cores={cores} />
              )}
              {idade !== null && (
                <ReguaSobre rotulo="IDADE" valor={`${idade} anos`} cores={cores} />
              )}
              {perfil.foco.length > 0 && (
                <ReguaSobre
                  rotulo="FOCO · NÍVEL"
                  valor={`${perfil.foco.map((id) => obterLinguagem(id)?.nome ?? id).join(", ")}${
                    perfil.nivel
                      ? ` · ${NIVEIS_CONHECIMENTO.find((n) => n.id === perfil.nivel)?.nome ?? perfil.nivel}`
                      : ""
                  }`}
                  cores={cores}
                />
              )}
            </View>
          </View>
        )}

        {/* ── evolução do Devzinho ─────────────────────────────── */}
        <View style={[estilos.cartao, { backgroundColor: cores.superficie }]}>
          <View style={estilos.cabecalhoSecaoCartao}>
            <Text style={[tipo.rotuloSecao, { color: cores.legenda }]}>evolução do devzinho</Text>
            <Text style={[tipo.metricaMono, { color: cores.legenda }]}>
              {posicaoRank} de {RANKS.length}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.evolucao}>
            {RANKS.map((r, indice) => {
              const nivelDoCartao = nivelDoRank(indice) as NivelDevzinho;
              const cor = CORES_NIVEL[nivelDoCartao];
              const alcancado = progresso.xp >= r.xp;
              const atual = r.nome === rank.atual.nome;

              return (
                <View
                  key={r.nome}
                  style={[
                    estilos.cartaoNivel,
                    {
                      backgroundColor: alcancado ? tingir(cor, cores, 0.72) : cores.fundo,
                      borderColor: atual ? cor : alcancado ? escurecer(cor, 0.4) : cores.linha
                    },
                    atual && estilos.cartaoNivelAtual
                  ]}
                >
                  {atual && (
                    <View style={[estilos.voce, { backgroundColor: cor }]}>
                      <Text style={[estilos.voceTexto, { color: cores.fundo }]}>VOCÊ</Text>
                    </View>
                  )}
                  <Devzinho
                    tamanho={64}
                    nivel={nivelDoCartao}
                    item="notebook"
                    flutuar={atual}
                    bloqueado={!alcancado}
                    expressao={atual ? "feliz" : "determinado"}
                  />
                  <View style={[estilos.pilulaNivel, { backgroundColor: alcancado ? cor : cores.linha }]}>
                    <Text style={[estilos.pilulaNivelTexto, { color: alcancado ? cores.fundo : cores.desativado }]}>
                      {`Nível ${indice + 1}`}
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={[estilos.nomeNivel, { color: alcancado ? cores.textoForte : cores.desativado }]}>
                    {r.nome}
                  </Text>
                  <Text style={[estilos.xpNivel, { color: cores.legenda }]}>
                    {alcancado ? "alcançado" : `${r.xp} XP`}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ── últimas 5 semanas ────────────────────────────────── */}
        <View style={[estilos.cartao, { backgroundColor: cores.superficie }]}>
          <View style={estilos.cabecalhoSecaoCartao}>
            <Text style={[tipo.rotuloSecao, { color: cores.legenda }]}>últimas 5 semanas</Text>
            <Text style={[tipo.metricaMono, { color: cores.legenda }]}>
              {diasNaJanela} dias
            </Text>
          </View>
          <Calendario historico={progresso.historico} paleta={cores} />
        </View>

        {/* ── conquistas ───────────────────────────────────────── */}
        <View style={[estilos.cartao, { backgroundColor: cores.superficie }]}>
          <View style={estilos.cabecalhoSecaoCartao}>
            <Text style={[tipo.rotuloSecao, { color: cores.legenda }]}>
              {`conquistas ${desbloqueadas.size}/${CONQUISTAS.length}`}
            </Text>
            {CONQUISTAS.length > QUANTAS_CONQUISTAS_VISIVEIS && (
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => setMostrarTodasConquistas((v) => !v)}
              >
                <Text style={[tipo.metricaMono, { color: cores.legenda }]}>
                  {mostrarTodasConquistas ? "ver menos" : "ver tudo"}
                </Text>
              </Pressable>
            )}
          </View>
          <View>
            {conquistasMostradas.map((c, indice) => {
              const tem = desbloqueadas.has(c.id);

              return (
                <View
                  key={c.id}
                  style={[
                    estilos.linhaConquista,
                    indice > 0 && { borderTopWidth: tamanhos.linha, borderTopColor: cores.linha }
                  ]}
                >
                  <View
                    style={[
                      estilos.marcaConquista,
                      tem
                        ? { backgroundColor: cores.ouroFundo, borderColor: cores.ouro }
                        : { borderColor: cores.linha }
                    ]}
                  >
                    {tem ? (
                      <Trophy size={16} weight="fill" color={cores.ouro} />
                    ) : (
                      <LockSimple size={14} weight="bold" color={cores.desativado} />
                    )}
                  </View>
                  <Text
                    style={[
                      tipo.botaoDiscreto,
                      estilos.flex,
                      { color: tem ? cores.textoForte : cores.desativado }
                    ]}
                  >
                    {c.nome}
                  </Text>
                  <Text style={[tipo.metricaMono, { color: cores.legenda }]}>
                    {tem ? "feita" : c.descricao}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </TelaAba>
  );
}

/** Uma régua de "sobre você": rótulo mono à esquerda, valor à direita. */
function ReguaSobre({
  rotulo,
  valor,
  cores
}: {
  rotulo: string;
  valor: string;
  cores: ReturnType<typeof useCores>;
}) {
  return (
    <View style={[estilos.linhaSobre, { borderTopColor: cores.linha }]}>
      <Text style={[tipo.rotuloCelula, { color: cores.legenda }]}>{rotulo}</Text>
      <Text style={[tipo.metricaMono, { color: cores.textoForte }]}>{valor}</Text>
    </View>
  );
}

/** Uma célula da grade 1×4: ícone, número e rótulo mono, num cartãozinho. */
function Celula({
  icone,
  valor,
  rotulo,
  cores
}: {
  icone: ReactNode;
  valor: string;
  rotulo: string;
  cores: ReturnType<typeof useCores>;
}) {
  return (
    <View style={[estilos.celula, { backgroundColor: cores.superficie, borderColor: cores.linha }]}>
      {icone}
      <Text style={[estilos.celulaValor, { color: cores.textoForte }]}>{valor}</Text>
      <Text style={[tipo.rotuloCelula, estilos.celulaRotulo, { color: cores.legenda }]}>{rotulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },

  barra: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    marginTop: 46,
    paddingHorizontal: margemTela,
    borderBottomWidth: tamanhos.linha
  },
  configuracoes: { minHeight: tamanhos.alvoMin, justifyContent: "center" },

  conteudo: { paddingBottom: espaco.xl, paddingHorizontal: margemTela, gap: espaco.sm },

  cartao: { borderRadius: raio.lg, padding: espaco.md, marginTop: espaco.sm },

  heroi: {
    marginTop: espaco.md,
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
    padding: espaco.md,
    paddingLeft: espaco.sm,
    borderRadius: raio.lg,
    borderWidth: 2,
    overflow: "hidden"
  },
  identidade: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm
  },
  nome: { ...tipo.tituloPerfil, fontSize: 21, lineHeight: 25, letterSpacing: -0.4 },
  chipNivel: {
    marginTop: espaco.sm,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: raio.pill,
    borderWidth: 1.5
  },
  chipNivelTexto: { ...tipo.rotuloCampo, letterSpacing: 1 },
  chipNivelRank: { ...tipo.tituloItemMenor, fontSize: 13, lineHeight: 16 },
  barraNivel: { marginTop: espaco.sm },

  grade: { flexDirection: "row", gap: espaco.sm, marginTop: espaco.sm },
  celula: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: raio.md,
    borderWidth: 1.5,
    gap: 4
  },
  celulaValor: { ...tipo.metrica, fontSize: 20, lineHeight: 22, letterSpacing: -0.5 },
  celulaRotulo: { fontSize: 9 },

  cabecalhoSecaoCartao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: espaco.sm
  },
  rotuloSecaoCartao: { textTransform: "uppercase", marginBottom: espaco.xs },

  linhaSobre: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: tamanhos.linha
  },

  evolucao: { gap: espaco.sm, paddingTop: 10, paddingBottom: 2 },
  cartaoNivel: {
    width: 104,
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: raio.md,
    borderWidth: 1.5
  },
  cartaoNivelAtual: { borderWidth: 2.5 },
  voce: {
    position: "absolute",
    top: -9,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: raio.pill,
    zIndex: 2
  },
  voceTexto: { fontFamily: fontes.forte, fontSize: 10, letterSpacing: 1 },
  pilulaNivel: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: raio.pill },
  pilulaNivelTexto: { fontFamily: fontes.forte, fontSize: 11 },
  nomeNivel: { ...tipo.tituloItemMenor, fontSize: 14, marginTop: 6 },
  xpNivel: { fontFamily: fontes.mono, fontSize: 10, marginTop: 2 },

  linhaConquista: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9
  },
  marcaConquista: {
    width: 30,
    height: 30,
    borderRadius: raio.pill,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center"
  }
});
