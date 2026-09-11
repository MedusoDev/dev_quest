import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TelaAba } from '@/componentes/abas';
import { useConta } from '@/dados/ContaContexto';
import { useCores } from '@/dados/TemaContexto';
import { lerEventosSessao, lerTodosPerfis } from '@/dados/nuvem';
import {
  distribuicaoPorHora,
  frequenciaPorDia,
  taxaDeAcertoPorDia,
  type EventoSessao
} from '@/nucleo/eventos';
import {
  crescimentoAcumulado,
  distribuicaoPorRank,
  evolucaoPorUso,
  visaoGeral
} from '@/nucleo/metricas';
import type { PerfilPublico } from '@/nucleo/perfil';
import { Rotulo, Vazio } from '@/componentes/basicos';
import { GraficoDeLinha } from '@/componentes/GraficoDeLinha';
import { espaco, margemTela, tamanhos, tipo, topoConteudo } from '@/tema';

/**
 * PAINEL DE MÉTRICAS — uso pessoal, não é tela de jogo.
 *
 * Só existe para quem tem `perfil.admin === true` (campo gravado à mão no
 * console do Firebase — nunca pelo app; ver `docs/firestore.rules`). Conta
 * admin nem chega a ver o app de jogador: o portão em `_layout.tsx` manda
 * direto pra `/admin/painel` assim que detecta `admin: true`.
 *
 * Duas fontes: `perfis` (agregado, já existia para o ranking) e
 * `eventosSessao` (um registro por sessão concluída, com data e hora — só
 * para este painel; ver `nucleo/eventos.ts`). O agregado responde "quanto"; o
 * evento responde "quando".
 *
 * Ainda não existe versão institucional (por escola/turma) — é só a visão
 * geral do dono do app. Ver `feat/ideia.md`, fase 0/1, para o que falta antes
 * de abrir isso para uma instituição de ensino de verdade.
 */
export default function Painel() {
  const cores = useCores();
  const { perfil, carregando: carregandoConta } = useConta();

  const [perfis, setPerfis] = useState<PerfilPublico[] | null>(null);
  const [eventos, setEventos] = useState<EventoSessao[] | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  async function carregar() {
    setAtualizando(true);
    const [p, e] = await Promise.all([lerTodosPerfis(), lerEventosSessao()]);
    setPerfis(p);
    setEventos(e);
    setAtualizando(false);
  }

  useEffect(() => {
    if (perfil?.admin) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só precisa disparar quando o admin é confirmado
  }, [perfil?.admin]);

  if (carregandoConta) return null;

  if (!perfil?.admin) {
    return (
      <View style={[estilos.centro, { backgroundColor: cores.fundo }]}>
        <Vazio titulo="Sem acesso" texto="Esta tela não é para você." />
      </View>
    );
  }

  return (
    <TelaAba>
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={carregar} tintColor={cores.acento} />
        }
      >
        <Rotulo cor={cores.acento}>painel de métricas</Rotulo>
        <Text style={[estilos.titulo, { color: cores.textoForte }]}>Como anda o uso</Text>
        <Text style={[estilos.nota, { color: cores.legenda }]}>
          Nenhum dado nominal de aluno aparece aqui além do que já é público no ranking.
        </Text>

        {perfis === null || eventos === null || perfis.length === 0 ? (
          <Text style={[estilos.carregando, { color: cores.legenda }]}>
            {atualizando ? 'carregando…' : 'nenhum perfil encontrado'}
          </Text>
        ) : (
          <Conteudo perfis={perfis} eventos={eventos} />
        )}
      </ScrollView>
    </TelaAba>
  );
}

function Conteudo({ perfis, eventos }: { perfis: PerfilPublico[]; eventos: EventoSessao[] }) {
  const cores = useCores();
  const geral = visaoGeral(perfis);
  const porRank = distribuicaoPorRank(perfis);
  const porUso = evolucaoPorUso(perfis);
  const porDia = frequenciaPorDia(eventos, 14);
  const porHora = distribuicaoPorHora(eventos);
  const taxaPorDia = taxaDeAcertoPorDia(eventos, 14);
  const crescimento = crescimentoAcumulado(perfis, 30);

  const semSessao = eventos.length === 0;

  const recentes = [...eventos].sort((a, b) => b.quando.localeCompare(a.quando)).slice(0, 15);

  return (
    <>
      {/* ── visão geral ──────────────────────────────────────── */}
      <View style={estilos.grade}>
        <Celula valor={String(geral.totalUsuarios)} rotulo="USUÁRIOS" />
        <Celula valor={String(geral.ativosHoje)} rotulo="ATIVOS HOJE" acento />
        <Celula valor={String(geral.ativos7Dias)} rotulo="ATIVOS 7 DIAS" />
        <Celula valor={String(geral.diariasTotais)} rotulo="DIÁRIAS FEITAS" />
        <Celula valor={`${Math.round(geral.taxaDeAcertoGeral * 100)}%`} rotulo="ACERTO GERAL" />
        <Celula valor={geral.mediaSequencia.toFixed(1)} rotulo="SEQUÊNCIA MÉDIA" />
      </View>

      {/* ── crescimento de contas ────────────────────────────── */}
      <Rotulo estilo={estilos.rotuloSecao}>crescimento — últimos 30 dias</Rotulo>
      <Text style={[estilos.notaSecao, { color: cores.legenda }]}>Total acumulado de contas criadas.</Text>
      <GraficoDeLinha pontos={crescimento.map((p) => ({ rotulo: p.dia.slice(8, 10), valor: p.total }))} />

      {/* ── frequência de uso ────────────────────────────────── */}
      <Rotulo estilo={estilos.rotuloSecao}>frequência — últimos 14 dias</Rotulo>
      <Text style={[estilos.notaSecao, { color: cores.legenda }]}>Quantas sessões foram concluídas em cada dia.</Text>
      {semSessao ? (
        <Text style={[estilos.semDado, { color: cores.desativado }]}>Nenhuma sessão registrada ainda.</Text>
      ) : (
        <GraficoDeBarras
          pontos={porDia.map((p) => ({ rotulo: p.dia.slice(8, 10), valor: p.quantidade }))}
        />
      )}

      {/* ── acerto ao longo do tempo ─────────────────────────── */}
      <Rotulo estilo={estilos.rotuloSecao}>acerto — últimos 14 dias</Rotulo>
      <Text style={[estilos.notaSecao, { color: cores.legenda }]}>
        Taxa de acerto média por dia. Buraco na linha é dia sem sessão nenhuma, não 0% de acerto.
      </Text>
      <GraficoDeLinha
        pontos={taxaPorDia.map((p) => ({
          rotulo: p.dia.slice(8, 10),
          valor: p.taxa === null ? null : p.taxa * 100
        }))}
      />

      {/* ── horário dos cards ────────────────────────────────── */}
      <Rotulo estilo={estilos.rotuloSecao}>horário de estudo</Rotulo>
      <Text style={[estilos.notaSecao, { color: cores.legenda }]}>
        Sessões concluídas por hora do dia (0–23h, seu horário local).
      </Text>
      {semSessao ? (
        <Text style={[estilos.semDado, { color: cores.desativado }]}>Nenhuma sessão registrada ainda.</Text>
      ) : (
        <GraficoDeBarras
          pontos={porHora.map((p) => ({
            rotulo: p.hora % 6 === 0 ? String(p.hora) : '',
            valor: p.quantidade
          }))}
          fino
        />
      )}

      {/* ── sessões recentes ─────────────────────────────────── */}
      <Rotulo estilo={estilos.rotuloSecao}>sessões recentes</Rotulo>
      {recentes.length === 0 ? (
        <Text style={[estilos.semDado, { color: cores.desativado }]}>Nenhuma sessão registrada ainda.</Text>
      ) : (
        <View style={estilos.tabela}>
          <View style={[estilos.linhaTabela, { borderTopColor: cores.linha }]}>
            <Text style={[estilos.cabecalhoTabela, estilos.colQuando, { color: cores.legenda }]}>QUANDO</Text>
            <Text style={[estilos.cabecalhoTabela, estilos.colNumero, { color: cores.legenda }]}>ACERTOS</Text>
            <Text style={[estilos.cabecalhoTabela, estilos.colNumero, { color: cores.legenda }]}>ERROS</Text>
            <Text style={[estilos.cabecalhoTabela, estilos.colNumero, { color: cores.legenda }]}>XP</Text>
          </View>
          {recentes.map((evento, indice) => (
            <View
              key={`${evento.uid}-${evento.quando}-${indice}`}
              style={[
                estilos.linhaTabela,
                { borderTopColor: cores.linha },
                indice === recentes.length - 1 && {
                  borderBottomWidth: tamanhos.linha,
                  borderBottomColor: cores.linha
                }
              ]}
            >
              <Text style={[estilos.celulaTabela, estilos.colQuando, { color: cores.textoForte }]}>
                {formatarQuando(evento.quando)}
              </Text>
              <Text style={[estilos.celulaTabela, estilos.colNumero, { color: cores.acento }]}>
                {evento.acertos}
              </Text>
              <Text style={[estilos.celulaTabela, estilos.colNumero, { color: cores.erro }]}>
                {evento.erros}
              </Text>
              <Text style={[estilos.celulaTabela, estilos.colNumero, { color: cores.textoForte }]}>
                {evento.xpGanho}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* ── evolução por uso ─────────────────────────────────── */}
      <Rotulo estilo={estilos.rotuloSecao}>melhora conforme o uso</Rotulo>
      <Text style={[estilos.notaSecao, { color: cores.legenda }]}>
        Taxa de acerto média de quem já fez cada quantidade de diárias. Faixas mais altas com
        acerto maior é sinal de que o app está ensinando de verdade.
      </Text>
      <View>
        {porUso.map((faixa, indice) => (
          <View
            key={faixa.rotulo}
            style={[
              estilos.linha,
              { borderTopColor: cores.linha },
              indice === porUso.length - 1 && {
                borderBottomWidth: tamanhos.linha,
                borderBottomColor: cores.linha
              }
            ]}
          >
            <Text style={[estilos.tituloItem, estilos.flex, { color: cores.textoForte }]}>{faixa.rotulo}</Text>
            <Text style={[estilos.notaItem, { color: cores.legenda }]}>{`${faixa.quantidade} pessoa(s)`}</Text>
            <Text style={[estilos.valorFaixa, { color: cores.acento }]}>
              {faixa.taxaDeAcertoMedia === null
                ? '—'
                : `${Math.round(faixa.taxaDeAcertoMedia * 100)}%`}
            </Text>
          </View>
        ))}
      </View>

      {/* ── distribuição por rank ────────────────────────────── */}
      <Rotulo estilo={estilos.rotuloSecao}>distribuição por rank</Rotulo>
      <View>
        {porRank.map((faixa, indice) => (
          <View
            key={faixa.rank}
            style={[
              estilos.linha,
              { borderTopColor: cores.linha },
              indice === porRank.length - 1 && {
                borderBottomWidth: tamanhos.linha,
                borderBottomColor: cores.linha
              }
            ]}
          >
            <Text style={[estilos.tituloItem, estilos.flex, { color: cores.textoForte }]}>{faixa.rank}</Text>
            <Text style={[estilos.valorFaixa, { color: cores.acento }]}>{faixa.quantidade}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function formatarQuando(iso: string): string {
  const data = new Date(iso);
  const dia = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;
  const hora = `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
  return `${dia} ${hora}`;
}

function Celula({ valor, rotulo, acento = false }: { valor: string; rotulo: string; acento?: boolean }) {
  const cores = useCores();

  return (
    <View style={[estilos.celula, { borderColor: cores.linha }]}>
      <Text style={[estilos.celulaValor, { color: acento ? cores.acento : cores.textoForte }]}>{valor}</Text>
      <Text style={[estilos.celulaRotulo, { color: cores.legenda }]}>{rotulo}</Text>
    </View>
  );
}

/**
 * Gráfico de barras verticais — para comparar categorias (dia a dia, hora a
 * hora). O companheiro `GraficoDeLinha` (`componentes/GraficoDeLinha.tsx`) é
 * para tendência. Sem raio, sem eixo desenhado, sem biblioteca: cada barra é
 * uma `View` cuja altura é a fração do máximo do conjunto.
 */
function GraficoDeBarras({
  pontos,
  fino = false
}: {
  pontos: { rotulo: string; valor: number }[];
  fino?: boolean;
}) {
  const cores = useCores();
  const maximo = Math.max(1, ...pontos.map((p) => p.valor));

  return (
    <View style={[estilos.grafico, { borderBottomColor: cores.linha }]}>
      {pontos.map((ponto, indice) => (
        <View key={indice} style={estilos.colunaGrafico}>
          <View style={estilos.trilhoGrafico}>
            <View
              style={[
                estilos.barraGrafico,
                { backgroundColor: fino ? cores.legenda : cores.acento },
                { height: `${Math.max(2, (ponto.valor / maximo) * 100)}%` }
              ]}
            />
          </View>
          <Text style={[estilos.rotuloGrafico, { color: cores.legenda }]}>{ponto.rotulo}</Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: margemTela,
    paddingVertical: espaco.xl
  },

  conteudo: { paddingHorizontal: margemTela, paddingTop: topoConteudo, paddingBottom: espaco.xl },

  titulo: { ...tipo.titulo, marginTop: espaco.sm },
  nota: { ...tipo.notaMono, marginTop: 12 },
  carregando: { ...tipo.notaMono, marginTop: espaco.xl },
  semDado: { ...tipo.notaMonoMenor, marginTop: espaco.sm },

  flex: { flex: 1 },

  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: espaco.xl,
    borderTopWidth: tamanhos.linha,
    borderLeftWidth: tamanhos.linha
  },
  celula: {
    width: '50%',
    borderRightWidth: tamanhos.linha,
    borderBottomWidth: tamanhos.linha,
    paddingVertical: 16,
    paddingHorizontal: espaco.md
  },
  celulaValor: { ...tipo.metrica },
  celulaRotulo: { ...tipo.rotuloCelula, marginTop: 6 },

  rotuloSecao: { marginTop: espaco.xl, marginBottom: espaco.sm },
  notaSecao: { ...tipo.notaMonoMenor, marginBottom: espaco.md, lineHeight: 18 },

  grafico: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 110,
    gap: 3,
    borderBottomWidth: tamanhos.linha,
    paddingBottom: espaco.sm
  },
  colunaGrafico: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6 },
  trilhoGrafico: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  barraGrafico: { width: '100%', minHeight: 2 },
  rotuloGrafico: { ...tipo.rotuloCelula, fontSize: 8, letterSpacing: 0 },

  tabela: { marginTop: 2 },
  linhaTabela: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: espaco.sm,
    borderTopWidth: tamanhos.linha
  },
  cabecalhoTabela: { ...tipo.rotuloCelula, letterSpacing: 0.6 },
  celulaTabela: { ...tipo.metricaMono },
  colQuando: { flex: 1.3 },
  colNumero: { flex: 1, textAlign: 'right' },

  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: espaco.md,
    borderTopWidth: tamanhos.linha
  },
  tituloItem: { ...tipo.tituloItemMenor },
  notaItem: { ...tipo.metricaMono },
  valorFaixa: { ...tipo.metricaPequena, minWidth: 40, textAlign: 'right' }
});
