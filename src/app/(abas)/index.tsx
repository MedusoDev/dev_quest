import { useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  animacao,
  espaco,
  margemTela,
  siglaLinguagem,
  tamanhos,
  tipo,
  topoConteudo
} from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { useProgresso } from '@/dados/ProgressoContexto';
import { useConta } from '@/dados/ContaContexto';
import { linguagens, obterLinguagem, obterLicao, type Licao } from '@/nucleo/conteudo';
import {
  AMOSTRA_MINIMA_NIVEL,
  contarVencidos,
  desempenhoNosDificeis,
  pontosFracos,
  sugestaoDeNivel
} from '@/nucleo/diaria';
import { metaPara, rankPara, RANKS, recordeSequencia, reguaDaSemana } from '@/nucleo/gamificacao';
import { NIVEIS_CONHECIMENTO } from '@/nucleo/perfil';
import { Anel } from '@/componentes/Anel';
import { Avatar } from '@/componentes/Avatar';
import { Cursor, Regua, Rotulo, Trilho } from '@/componentes/basicos';
import { TelaAba } from '@/componentes/abas';
import { useMovimentoReduzido, useVarredura } from '@/componentes/movimento';

/**
 * HOJE.
 *
 * A tela responde uma pergunta só: **a sessão de hoje vai acontecer?** Por isso
 * o número de cards que faltam é o maior objeto da tela, e o cartão da diária é
 * o único lugar do app com borda no acento. Se a pessoa abrir e só tocar ali,
 * ela fez a coisa certa.
 *
 * Tudo abaixo — sequência, trilhas, pontos fracos — é apoio, e é apoio em
 * réguas de 1 px justamente para não disputar com o cartão.
 */
export default function Hoje() {
  const cores = useCores();
  const coresLinguagem = {
    csharp: cores.acento,
    javascript: cores.legenda,
    python: cores.legenda,
    java: cores.legenda,
    php: cores.legenda
  };
  const router = useRouter();
  const reduzido = useMovimentoReduzido();

  const { progresso, revisoes, licoesConcluidas, carregando, fezDiariaHoje, dispensarSugestaoNivel } =
    useProgresso();
  const { usuario, perfil, carregando: carregandoConta, atualizarPerfil } = useConta();

  // A linha de varredura precisa saber a altura do cartão para atravessá-lo.
  const [alturaCartao, setAlturaCartao] = useState(0);
  const scan = useVarredura(alturaCartao, reduzido);

  // Quem decide se esta tela pode aparecer é o Portao, em `app/_layout.tsx`.
  // Aqui só seguramos o anel enquanto ele carrega ou redireciona — devolver
  // `null` deixaria um quadro de tela preta no caminho.
  if (carregando || carregandoConta || !usuario) {
    return (
      <TelaAba estilo={estilos.centro}>
        <Anel tamanho={72} />
      </TelaAba>
    );
  }

  const meta = metaPara(progresso.metaDiariaMin);
  const rank = rankPara(progresso.xp);
  const posicaoRank = RANKS.findIndex((r) => r.nome === rank.atual.nome) + 1;

  const vencidos = contarVencidos(revisoes);
  const fracos = pontosFracos(revisoes, 3);
  const semana = reguaDaSemana(progresso.historico);

  // A sugestão só insiste depois de mais `AMOSTRA_MINIMA_NIVEL` cards
  // médio/difícil desde a última recusa — ver `dispensarSugestaoNivel`.
  const sugestaoNivel = sugestaoDeNivel(revisoes, perfil?.nivel ?? null);
  const desempenho = desempenhoNosDificeis(revisoes);
  const recusouRecente =
    progresso.sugestaoNivelRecusadaEm !== null &&
    desempenho.total - progresso.sugestaoNivelRecusadaEm < AMOSTRA_MINIMA_NIVEL;
  const mostrarSugestaoNivel = Boolean(sugestaoNivel) && !recusouRecente;

  function aceitarSugestaoNivel() {
    if (sugestaoNivel) atualizarPerfil({ nivel: sugestaoNivel });
  }

  function recusarSugestaoNivel() {
    dispensarSugestaoNivel(desempenho.total);
  }
  const recorde = recordeSequencia(progresso.historico);

  // Sem contagem parcial no banco, "restam" é tudo ou nada: a diária de hoje
  // ainda não foi feita, ou já foi. Preferi isso a inventar um número que o
  // app não sabe — o cartão mentiria assim que alguém saísse no meio.
  // Uma linha por **trilha**, não por linguagem: a sigla à esquerda já diz a
  // linguagem, e repetir "C#" no título deixaria a linha dizendo a mesma coisa
  // duas vezes. O que a pessoa quer ler ali é onde ela parou — "Fundamentos".
  const trilhas = linguagens.flatMap((linguagem) =>
    linguagem.trilhas
      .filter((trilha) => !trilha.emBreve)
      .map((trilha) => {
        const licoes = trilha.licoes.map(obterLicao).filter((l): l is Licao => l !== null);

        return {
          chave: `${linguagem.id}-${trilha.id}`,
          sigla: siglaLinguagem[linguagem.id],
          cor: coresLinguagem[linguagem.id],
          titulo: trilha.titulo,
          total: licoes.length,
          feitas: licoes.filter((l) => licoesConcluidas.has(l.id)).length
        };
      })
  );

  const focoMultiplo = (perfil?.foco.length ?? 0) > 1;
  const restam = fezDiariaHoje ? 0 : meta.cards;
  const nota = fezDiariaHoje
    ? `${meta.cards} de ${meta.cards} feitos`
    : vencidos > 0
      ? `${vencidos} voltando do ciclo`
      : 'tudo em dia';

  return (
    <TelaAba>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        {/* ── cabeçalho ─────────────────────────────────────────── */}
        <View style={estilos.cabecalho}>
          <View style={estilos.flex}>
            <Rotulo cor={cores.acento}>
              {`rank ${String(posicaoRank).padStart(2, '0')} / ${String(RANKS.length).padStart(2, '0')}`}
            </Rotulo>
            <Text style={[estilos.rank, { color: cores.textoForte }]}>{rank.atual.nome}</Text>

            <View style={estilos.linhaXp}>
              <Trilho
                fracao={rank.progresso}
                altura={tamanhos.trilhoGrosso}
                duracao={animacao.rank}
                estilo={estilos.barraRank}
              />
              <Text style={[estilos.xp, { color: cores.legenda }]}>
                {rank.proximo ? `${progresso.xp} / ${rank.proximo.xp} XP` : `${progresso.xp} XP`}
              </Text>
            </View>
          </View>

          <Pressable accessibilityLabel="Perfil" accessibilityRole="button" onPress={() => router.push('/perfil')}>
            <Avatar nome={perfil?.nome ?? 'Você'} foto={perfil?.foto} bordaId={perfil?.borda} />
          </Pressable>
        </View>

        {/* ── o cartão da diária ────────────────────────────────── */}
        <View
          style={[estilos.cartao, { borderColor: cores.acento, backgroundColor: cores.acentoFundo }]}
          onLayout={(e) => setAlturaCartao(e.nativeEvent.layout.height)}
        >
          <Animated.View
            pointerEvents="none"
            style={[estilos.varredura, { backgroundColor: cores.varredura }, scan]}
          />

          <View style={estilos.cartaoTopo}>
            <Rotulo cor={cores.acento}>
              {focoMultiplo ? 'sessão diária · mista' : 'sessão diária'}
            </Rotulo>
            <Text style={[estilos.duracao, { color: cores.acentoTexto }]}>{`0${meta.minutos}:00`.slice(-5)}</Text>
          </View>

          <View style={estilos.cartaoCorpo}>
            <Text style={[estilos.numero, { color: cores.textoForte }]}>{restam}</Text>
            <View style={estilos.cartaoDizeres}>
              <Text style={[estilos.cards, { color: cores.textoForte }]}>cards</Text>
              <Text style={[estilos.notaDiaria, { color: cores.acentoTexto }]}>{nota}</Text>
            </View>
            <View style={estilos.flex} />
            <Anel
              tamanho={52}
              progresso={fezDiariaHoje ? 1 : 0}
              corFundo={cores.acentoFundo}
            />
          </View>

          <Regua cor={cores.acentoLinha} estilo={estilos.cartaoRegua} />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/sessao')}
            style={({ pressed }) => [
              estilos.botaoDiaria,
              { backgroundColor: cores.acento },
              pressed && estilos.pressionado
            ]}
          >
            <Text style={[estilos.rotuloBotao, { color: cores.acentoFundo }]}>
              {fezDiariaHoje ? 'Rever a sessão' : 'Começar'}
            </Text>
            <Cursor />
          </Pressable>
        </View>

        {/* ── sugestão de subir de nível ─────────────────────────── */}
        {/* Só aparece quando a taxa de acerto nos médio/difícil já vistos é
            alta o bastante — ver `sugestaoDeNivel` em `nucleo/diaria.ts`. A
            pessoa decide: aceitar sobe o nível na hora, recusar só adia a
            pergunta até responder mais cards difíceis. */}
        {mostrarSugestaoNivel && sugestaoNivel && (
          <View
            style={[
              estilos.sugestaoNivel,
              { borderLeftColor: cores.acento, backgroundColor: cores.acentoFundo }
            ]}
          >
            <Text style={[estilos.sugestaoNivelTexto, { color: cores.acentoTexto }]}>
              {'Você está mandando bem nos cards difíceis. Quer tentar o nível '}
              <Text style={{ color: cores.acento }}>
                {NIVEIS_CONHECIMENTO.find((n) => n.id === sugestaoNivel)?.nome ?? sugestaoNivel}
              </Text>
              ?
            </Text>
            <View style={estilos.sugestaoNivelAcoes}>
              <Pressable accessibilityRole="button" onPress={recusarSugestaoNivel} hitSlop={8}>
                <Text style={[estilos.sugestaoNivelRecusar, { color: cores.desativado }]}>
                  agora não
                </Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={aceitarSugestaoNivel} hitSlop={8}>
                <Text style={[estilos.sugestaoNivelAceitar, { color: cores.acento }]}>
                  sim, subir
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── diárias por linguagem ─────────────────────────────── */}
        {/* Só aparece com mais de um foco escolhido: com zero ou um, o cartão
            acima já é exatamente essa única opção. Uma vez feita qualquer
            diária do dia, as outras contam XP mas não a sequência de novo —
            ver `contaComoDiaria` em `app/sessao.tsx`. */}
        {focoMultiplo && (
          <View style={estilos.secao}>
            <Rotulo cor={cores.acento}>
              {fezDiariaHoje ? 'ou só uma linguagem · bônus' : 'ou só uma linguagem'}
            </Rotulo>

            <View style={estilos.diariasFoco}>
              {perfil?.foco.map((id) => {
                const linguagem = obterLinguagem(id);
                if (!linguagem) return null;

                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/sessao', params: { linguagem: id } })}
                    style={({ pressed }) => [
                      estilos.cartaoFoco,
                      { borderColor: coresLinguagem[id], backgroundColor: cores.superficie },
                      pressed && estilos.pressionado
                    ]}
                  >
                    <Text style={[estilos.siglaFoco, { color: coresLinguagem[id] }]}>
                      {siglaLinguagem[id]}
                    </Text>
                    <Text style={[estilos.tituloFoco, { color: cores.textoForte }]}>
                      {linguagem.nome}
                    </Text>
                    <View style={estilos.flex} />
                    <Text style={[estilos.setaFoco, { color: coresLinguagem[id] }]}>→</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ── sequência ─────────────────────────────────────────── */}
        <View style={estilos.secao}>
          <View style={estilos.secaoTopo}>
            <Rotulo>sequência</Rotulo>
            <Text style={[estilos.notaSecao, { color: cores.legenda }]}>{`recorde ${recorde}`}</Text>
          </View>

          <View style={estilos.linhaSequencia}>
            <Text style={[estilos.sequencia, { color: cores.acento }]}>{progresso.sequencia}</Text>
            <Text style={[estilos.notaSequencia, { color: cores.legenda }]}>
              {'dias seguidos\n'}
              {fezDiariaHoje ? 'feita hoje' : 'não quebre hoje'}
            </Text>
          </View>

          <View style={estilos.semana}>
            {semana.map(({ dia, feito, ehHoje }) => (
              <View
                key={dia}
                style={[
                  estilos.celula,
                  { backgroundColor: cores.linha },
                  feito && { backgroundColor: cores.acento },
                  !feito && ehHoje && { backgroundColor: 'transparent', borderColor: cores.acento }
                ]}
              />
            ))}
          </View>

          <View style={estilos.legendas}>
            {semana.map(({ dia, rotulo }) => (
              <Text key={dia} style={[estilos.legenda, { color: cores.desativado }]}>
                {rotulo}
              </Text>
            ))}
          </View>
        </View>

        {/* ── trilhas ───────────────────────────────────────────── */}
        <View style={estilos.secao}>
          <Rotulo estilo={estilos.rotuloTrilhas}>trilhas</Rotulo>

          {trilhas.map((trilha) => (
            <Pressable
              key={trilha.chave}
              accessibilityRole="button"
              onPress={() => router.push('/trilhas')}
              style={({ pressed }) => [
                estilos.linha,
                { borderTopColor: cores.linha },
                pressed && estilos.pressionado
              ]}
            >
              <Text style={[estilos.sigla, { color: trilha.cor }]}>{trilha.sigla}</Text>

              <View style={estilos.flex}>
                <Text style={[estilos.tituloLinha, { color: cores.textoForte }]}>
                  {trilha.titulo}
                </Text>
                <Trilho
                  fracao={trilha.total ? trilha.feitas / trilha.total : 0}
                  cor={trilha.cor}
                  duracao={animacao.rank}
                  estilo={estilos.barraTrilha}
                />
              </View>

              <Text style={[estilos.contagem, { color: cores.legenda }]}>
                {`${trilha.feitas}/${trilha.total}`}
              </Text>
            </Pressable>
          ))}

          {fracos.length > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/fracos')}
              style={({ pressed }) => [
                estilos.linha,
                estilos.linhaFinal,
                { borderTopColor: cores.linha, borderBottomColor: cores.linha },
                pressed && estilos.pressionado
              ]}
            >
              <Text style={[estilos.sigla, { color: cores.erro }]}>!</Text>

              <View style={estilos.flex}>
                <Text style={[estilos.tituloLinha, { color: cores.textoForte }]}>
                  {`${fracos.length} ponto${fracos.length > 1 ? 's' : ''} fraco${fracos.length > 1 ? 's' : ''}`}
                </Text>
                <Text style={[estilos.notaLinha, { color: cores.legenda }]} numberOfLines={1}>
                  {fracos.map((f) => f.card.licaoTitulo).join(' · ')}
                </Text>
              </View>

              <Text style={[estilos.seta, { color: cores.legenda }]}>→</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </TelaAba>
  );
}

const estilos = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  conteudo: { paddingTop: topoConteudo, paddingBottom: espaco.xl },
  pressionado: { opacity: 0.75 },

  // ── cabeçalho ────────────────────────────────────────────────
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: espaco.md,
    paddingHorizontal: margemTela
  },
  rank: { ...tipo.tituloGrande, letterSpacing: -1.4, marginTop: 7 },
  linhaXp: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, marginTop: 10 },
  barraRank: { width: 98 },
  xp: { ...tipo.metricaMono },

  // ── cartão da diária ─────────────────────────────────────────
  cartao: {
    marginTop: espaco.lg,
    marginHorizontal: margemTela,
    borderWidth: tamanhos.linha,
    overflow: 'hidden'
  },
  varredura: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: tamanhos.linha
  },
  cartaoTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20
  },
  duracao: { ...tipo.metricaMono },

  cartaoCorpo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: espaco.md
  },
  numero: { ...tipo.heroi },
  cartaoDizeres: { paddingBottom: espaco.sm },
  cards: { ...tipo.tituloLinha, fontFamily: tipo.botao.fontFamily },
  notaDiaria: { ...tipo.notaMonoCurta },

  cartaoRegua: { marginTop: 18 },
  botaoDiaria: {
    minHeight: tamanhos.botao,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.sm
  },
  rotuloBotao: { ...tipo.botao },

  // ── sugestão de subir de nível ─────────────────────────────────
  sugestaoNivel: {
    marginTop: espaco.md,
    marginHorizontal: margemTela,
    borderLeftWidth: tamanhos.trilho,
    padding: espaco.md,
    gap: espaco.sm
  },
  sugestaoNivelTexto: { ...tipo.notaMono, lineHeight: 20 },
  sugestaoNivelAcoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: espaco.lg
  },
  sugestaoNivelRecusar: { ...tipo.metricaMono },
  sugestaoNivelAceitar: { ...tipo.metricaMono },

  // ── seções em régua ──────────────────────────────────────────
  secao: { marginTop: espaco.lg, marginHorizontal: margemTela },
  secaoTopo: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  notaSecao: { ...tipo.metricaMono },

  linhaSequencia: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 11 },
  sequencia: { ...tipo.metricaGrande },
  notaSequencia: { ...tipo.notaMonoCurta, paddingBottom: 5 },

  semana: { flexDirection: 'row', gap: espaco.xs, marginTop: 11 },
  celula: {
    flex: 1,
    height: tamanhos.celulaSemana,
    borderWidth: tamanhos.linha,
    borderColor: 'transparent'
  },

  legendas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: espaco.sm },
  legenda: { ...tipo.rotuloCelula, letterSpacing: 0 },

  diariasFoco: { marginTop: 11, gap: espaco.sm },
  cartaoFoco: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: tamanhos.botaoSecundario + 6,
    paddingHorizontal: espaco.md + 2,
    borderWidth: tamanhos.linha
  },
  siglaFoco: { ...tipo.tituloItem, fontFamily: tipo.metricaMonoMedia.fontFamily, minWidth: 30 },
  tituloFoco: { ...tipo.tituloItem },
  setaFoco: { ...tipo.tituloItem },
  rotuloTrilhas: { marginBottom: 12 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingVertical: 15,
    borderTopWidth: tamanhos.linha
  },
  linhaFinal: { borderBottomWidth: tamanhos.linha },
  sigla: { ...tipo.metricaMonoMedia, fontSize: 13, minWidth: 26 },
  tituloLinha: { ...tipo.tituloLinha },
  barraTrilha: { marginTop: 6 },
  notaLinha: { ...tipo.notaMonoMenor, marginTop: 4 },
  contagem: { ...tipo.metricaMonoMedia },
  seta: { ...tipo.metricaMonoMedia, fontSize: 14 }
});
