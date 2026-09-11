import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/componentes/Avatar";
import { Calendario } from "@/componentes/Calendario";
import { TelaAba } from "@/componentes/abas";
import { useCores } from "@/dados/TemaContexto";
import { useConta } from "@/dados/ContaContexto";
import { useProgresso } from "@/dados/ProgressoContexto";
import { CONQUISTAS, RANKS, rankPara } from "@/nucleo/gamificacao";
import { obterLinguagem } from "@/nucleo/conteudo";
import { diaDaSemana, hoje, somarDias } from "@/nucleo/datas";
import { idadeDe, NIVEIS_CONHECIMENTO } from "@/nucleo/perfil";
import { estaDominado } from "@/nucleo/revisao";
import { espaco, fontes, margemTela, tamanhos, tipo } from "@/tema";

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
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.push("/configuracoes" as never)}
          style={estilos.configuracoes}
        >
          <Text style={[tipo.metricaMono, { color: cores.legenda }]}>configurações</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        {/* ── identidade ───────────────────────────────────────── */}
        <View style={estilos.identidade}>
          <Avatar
            nome={perfil?.nome ?? "Você"}
            foto={perfil?.foto}
            bordaId={perfil?.borda}
            tamanho={tamanhos.avatar}
            paleta={cores}
          />
          <View style={estilos.flex}>
            <Text style={[estilos.nome, { color: cores.textoForte }]}>
              {perfil?.nome ?? "Sem nome"}
            </Text>
            <Text style={[tipo.metricaMono, { color: cores.acento, marginTop: 4 }]}>
              {rank.proximo
                ? `RANK ${String(posicaoRank).padStart(2, "0")} · ${rank.atual.nome.toUpperCase()} · faltam ${rank.faltam} XP`
                : `RANK ${String(posicaoRank).padStart(2, "0")} · ${rank.atual.nome.toUpperCase()}`}
            </Text>
          </View>
        </View>

        {/* ── métricas ─────────────────────────────────────────── */}
        <View style={[estilos.grade, { borderTopColor: cores.linha }]}>
          <Celula valor={String(progresso.xp)} rotulo="XP" cores={cores} />
          <Celula valor={String(progresso.sequencia)} rotulo="SEQ" acento cores={cores} />
          <Celula valor={String(dominados)} rotulo="MADUROS" cores={cores} />
          <Celula valor={`${acerto}%`} rotulo="ACERTO" ultima cores={cores} />
        </View>

        {/* ── sobre você ───────────────────────────────────────── */}
        {perfil?.onboardingCompleto && (
          <>
            <View style={estilos.cabecalhoSecao}>
              <Text style={[tipo.rotuloSecao, estilos.rotuloSecao, { color: cores.legenda }]}>
                sobre você
              </Text>
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => router.push("/configuracoes" as never)}
              >
                <Text style={[tipo.metricaMono, { color: cores.legenda }]}>editar</Text>
              </Pressable>
            </View>
            <View>
              {perfil.nomeCompleto && (
                <ReguaSobre rotulo="NOME" valor={perfil.nomeCompleto} cores={cores} />
              )}
              {idade !== null && <ReguaSobre rotulo="IDADE" valor={`${idade} anos`} cores={cores} />}
              {perfil.foco.length > 0 && (
                <ReguaSobre
                  rotulo="FOCO · NÍVEL"
                  valor={`${perfil.foco.map((id) => obterLinguagem(id)?.nome ?? id).join(", ")}${
                    perfil.nivel
                      ? ` · ${NIVEIS_CONHECIMENTO.find((n) => n.id === perfil.nivel)?.nome ?? perfil.nivel}`
                      : ""
                  }`}
                  ultima
                  cores={cores}
                />
              )}
            </View>
          </>
        )}

        {/* ── a escada ─────────────────────────────────────────── */}
        <View style={estilos.cabecalhoSecao}>
          <Text style={[tipo.rotuloSecao, estilos.rotuloSecao, { color: cores.legenda }]}>
            a escada
          </Text>
          <Text style={[tipo.metricaMono, { color: cores.legenda }]}>
            {posicaoRank} de {RANKS.length}
          </Text>
        </View>
        <View style={estilos.escada}>
          {RANKS.map((r) => {
            const alcancado = progresso.xp >= r.xp;
            const atual = r.nome === rank.atual.nome;

            return (
              <View key={r.nome} style={estilos.degrau}>
                <View
                  style={[
                    estilos.barraDegrau,
                    { backgroundColor: alcancado ? cores.acento : cores.linha }
                  ]}
                />
                <Text
                  style={[
                    estilos.nomeDegrau,
                    { color: atual ? cores.acento : cores.desativado }
                  ]}
                >
                  {r.nome}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── últimas 5 semanas ────────────────────────────────── */}
        <View style={estilos.cabecalhoSecao}>
          <Text style={[tipo.rotuloSecao, estilos.rotuloSecao, { color: cores.legenda }]}>
            últimas 5 semanas
          </Text>
          <Text style={[tipo.metricaMono, { color: cores.legenda }]}>
            {diasNaJanela} dias
          </Text>
        </View>
        <Calendario historico={progresso.historico} paleta={cores} />

        {/* ── conquistas ───────────────────────────────────────── */}
        <View style={estilos.cabecalhoSecao}>
          <Text style={[tipo.rotuloSecao, estilos.rotuloSecao, { color: cores.legenda }]}>
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
                  { borderTopColor: cores.linha },
                  indice === conquistasMostradas.length - 1 && {
                    borderBottomWidth: tamanhos.linha,
                    borderBottomColor: cores.linha
                  }
                ]}
              >
                <View
                  style={[
                    estilos.marcaConquista,
                    tem
                      ? { backgroundColor: cores.acento }
                      : { borderWidth: tamanhos.linha, borderColor: cores.linha }
                  ]}
                />
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
      </ScrollView>
    </TelaAba>
  );
}

/** Uma régua de "sobre você": rótulo mono à esquerda, valor à direita. */
function ReguaSobre({
  rotulo,
  valor,
  ultima = false,
  cores
}: {
  rotulo: string;
  valor: string;
  ultima?: boolean;
  cores: ReturnType<typeof useCores>;
}) {
  return (
    <View
      style={[
        estilos.linhaSobre,
        { borderTopColor: cores.linha },
        ultima && { borderBottomWidth: tamanhos.linha, borderBottomColor: cores.linha }
      ]}
    >
      <Text style={[tipo.rotuloCelula, { color: cores.legenda }]}>{rotulo}</Text>
      <Text style={[tipo.metricaMono, { color: cores.textoForte }]}>{valor}</Text>
    </View>
  );
}

/** Uma célula da grade 1×4: número em cima, rótulo mono embaixo. */
function Celula({
  valor,
  rotulo,
  acento = false,
  ultima = false,
  cores
}: {
  valor: string;
  rotulo: string;
  acento?: boolean;
  ultima?: boolean;
  cores: ReturnType<typeof useCores>;
}) {
  return (
    <View
      style={[
        estilos.celula,
        { borderColor: cores.linha },
        !ultima && { borderRightWidth: tamanhos.linha, borderRightColor: cores.linha }
      ]}
    >
      <Text style={[estilos.celulaValor, { color: acento ? cores.acento : cores.textoForte }]}>
        {valor}
      </Text>
      <Text style={[tipo.rotuloCelula, estilos.celulaRotulo, { color: cores.legenda }]}>
        {rotulo}
      </Text>
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

  conteudo: { paddingBottom: espaco.xl },

  identidade: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.md,
    paddingHorizontal: margemTela,
    paddingVertical: 14
  },
  nome: { ...tipo.tituloPerfil, fontSize: 20, lineHeight: 22, letterSpacing: -0.7 },

  grade: {
    flexDirection: "row",
    borderTopWidth: tamanhos.linha,
    borderBottomWidth: tamanhos.linha
  },
  celula: { flex: 1, paddingVertical: 11, paddingHorizontal: 10 },
  celulaValor: { ...tipo.metrica, fontSize: 22, lineHeight: 22, letterSpacing: -1 },
  celulaRotulo: { marginTop: 5 },

  cabecalhoSecao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: margemTela,
    paddingTop: 11,
    paddingBottom: 8
  },
  rotuloSecao: { textTransform: "uppercase" },

  linhaSobre: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: margemTela,
    paddingVertical: 8,
    borderTopWidth: tamanhos.linha
  },

  escada: { flexDirection: "row", gap: 4, paddingHorizontal: margemTela },
  degrau: { flex: 1 },
  barraDegrau: { height: 4 },
  nomeDegrau: { fontFamily: fontes.mono, fontSize: 9.5, lineHeight: 12, marginTop: 6 },

  linhaConquista: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: margemTela,
    paddingVertical: 9,
    borderTopWidth: tamanhos.linha
  },
  marcaConquista: { width: 8, height: 8 }
});
