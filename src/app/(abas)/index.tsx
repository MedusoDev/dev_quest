import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, CheckCircle, Flame, Lightning, Sword, Timer, TreasureChest } from 'phosphor-react-native';

import {
  animacao,
  coresDasLinguagens,
  espaco,
  margemTela,
  raio,
  siglaLinguagem,
  tamanhos,
  tipo,
  topoConteudo
} from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { useProgresso } from '@/dados/ProgressoContexto';
import { useConta } from '@/dados/ContaContexto';
import { licoesDaLinguagem, linguagens, obterLinguagem, obterLicao, type Licao } from '@/nucleo/conteudo';
import {
  AMOSTRA_MINIMA_NIVEL,
  contarVencidos,
  desempenhoNosDificeis,
  pontosFracos,
  sugestaoDeNivel
} from '@/nucleo/diaria';
import { metaPara, RANKS, rankPara, recordeSequencia, reguaDaSemana } from '@/nucleo/gamificacao';
import { NIVEIS_CONHECIMENTO } from '@/nucleo/perfil';
import { Cursor, Rotulo, Trilho } from '@/componentes/basicos';
import { TelaAba } from '@/componentes/abas';
import { useMovimentoReduzido, useVarredura } from '@/componentes/movimento';
import { Devzinho, DevzinhoAvatar, CORES_NIVEL, nivelDoRank, type ExpressaoDevzinho } from '@/componentes/Devzinho';
import { DevzinhoFala } from '@/componentes/BalaoFala';
import { Gradiente } from '@/componentes/Gradiente';
import { escurecer, tingir } from '@/componentes/Botao';

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
 *
 * O Devzinho abre a tela: ele cumprimenta pelo nome e diz, numa frase, o que
 * importa hoje (sequência em risco, cards voltando, diária feita). A barra do
 * topo é o "HUD" do jogo — fogo da sequência, XP e o nível dele.
 */
export default function Hoje() {
  const cores = useCores();
  const coresLinguagem = coresDasLinguagens(cores);
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
        <Devzinho tamanho={110} expressao="pensando" item="nenhum" />
        <Text style={[estilos.carregandoTexto, { color: cores.legenda }]}>carregando…</Text>
      </TelaAba>
    );
  }

  const meta = metaPara(progresso.metaDiariaMin);

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

  // Sem contagem parcial no banco, "restam" é tudo ou nada: a missão de hoje
  // ainda não foi feita, ou já foi. Preferi isso a inventar um número que o
  // app não sabe — o cartão mentiria assim que alguém saísse no meio.
  const rank = rankPara(progresso.xp);
  const indiceRank = RANKS.findIndex((r) => r.nome === rank.atual.nome);
  const nivel = nivelDoRank(indiceRank);
  const corNivel = CORES_NIVEL[nivel];
  const percentualNivel = Math.round(rank.progresso * 100);
  const fala = falaDoDevzinho({
    nome: perfil?.nome ?? 'dev',
    sequencia: progresso.sequencia,
    fezDiariaHoje,
    vencidos
  });

  const focoMultiplo = (perfil?.foco.length ?? 0) > 1;
  const restam = fezDiariaHoje ? 0 : meta.cards;
  const nota = fezDiariaHoje
    ? `${meta.cards} de ${meta.cards} feitos`
    : vencidos > 0
      ? `${vencidos} voltando do ciclo`
      : 'tudo em dia';

  // Só as linguagens que a pessoa escolheu como foco — a lista inteira de
  // trilhas de todas as linguagens era ruído. Sem foco, mostra todas.
  const idsFoco = perfil?.foco.length ? perfil.foco : linguagens.map((l) => l.id);
  const jornadas = idsFoco
    .map((id) => {
      const linguagem = obterLinguagem(id);
      if (!linguagem) return null;
      const licoes = licoesDaLinguagem(id);
      const feitas = licoes.filter((l) => licoesConcluidas.has(l.id)).length;
      return {
        id,
        nome: linguagem.nome,
        sigla: siglaLinguagem[id],
        cor: coresLinguagem[id],
        total: licoes.length,
        feitas,
        proxima: licoes.find((l) => !licoesConcluidas.has(l.id)) ?? null,
        unidades: linguagem.trilhas
          .filter((trilha) => !trilha.emBreve)
          .map((trilha) => {
            const daTrilha = trilha.licoes.map(obterLicao).filter((l): l is Licao => l !== null);
            return {
              id: trilha.id,
              titulo: trilha.titulo,
              total: daTrilha.length,
              feitas: daTrilha.filter((l) => licoesConcluidas.has(l.id)).length
            };
          })
      };
    })
    .filter((j): j is NonNullable<typeof j> => j !== null);
  const larguraJornada = jornadas.length > 1 ? 300 : undefined;

  return (
    <TelaAba>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        {/* ── HUD: sequência, XP e nível, juntos numa barra só ──── */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sequência de ${progresso.sequencia} dias, ${progresso.xp} XP, nível ${nivel} ${rank.atual.nome}. Toque para ver o perfil.`}
          onPress={() => router.push('/perfil')}
          style={({ pressed }) => [
            estilos.hud,
            { backgroundColor: cores.superficie, borderColor: cores.linha },
            pressed && estilos.pressionado
          ]}
        >
          <View style={estilos.hudItem}>
            <Chama acesa={progresso.sequencia > 0} reduzido={reduzido} />
            <Text style={[estilos.hudNumero, { color: progresso.sequencia > 0 ? cores.ouro : cores.desativado }]}>
              {progresso.sequencia}
            </Text>
          </View>
          <View style={[estilos.hudDivisor, { backgroundColor: cores.linha }]} />
          <View style={estilos.hudItem}>
            <Lightning size={20} weight="fill" color={cores.acentoSecundario} />
            <Text style={[estilos.hudNumero, { color: cores.acentoSecundario }]}>{progresso.xp}</Text>
          </View>
          <View style={[estilos.hudDivisor, { backgroundColor: cores.linha }]} />
          <View style={[estilos.hudItem, estilos.hudNivel]}>
            <DevzinhoAvatar tamanho={28} nivel={nivel} />
            <View>
              <Text style={[estilos.hudNivelRotulo, { color: corNivel }]}>{`NV ${nivel}`}</Text>
              <Text numberOfLines={1} style={[estilos.hudNivelNome, { color: cores.textoForte }]}>
                {rank.atual.nome}
              </Text>
            </View>
          </View>
        </Pressable>

        {/* ── o Devzinho fala ──────────────────────────────────── */}
        <DevzinhoFala
          texto={fala.texto}
          expressao={fala.expressao}
          nivel={nivel}
          tamanho={112}
          estilo={estilos.fala}
        />

        {/* ── sequência: a primeira coisa da tela ───────────────── */}
        <View style={[estilos.cartaoSequencia, { backgroundColor: cores.superficie, borderColor: cores.linha }]}>
          <View style={estilos.secaoTopo}>
            <Rotulo>sequência</Rotulo>
            <Text style={[estilos.notaSecao, { color: cores.legenda }]}>{`recorde ${recorde}`}</Text>
          </View>

          <View style={estilos.linhaSequencia}>
            <Text style={[estilos.sequencia, { color: progresso.sequencia > 0 ? cores.ouro : cores.desativado }]}>
              {progresso.sequencia}
            </Text>
            <Text style={[estilos.notaSequencia, { color: cores.legenda }]}>
              {progresso.sequencia === 1 ? 'dia seguido\n' : 'dias seguidos\n'}
              {fezDiariaHoje ? 'missão de hoje feita' : 'não quebre hoje'}
            </Text>
          </View>

          <View style={estilos.semana}>
            {semana.map(({ dia, rotulo, feito, ehHoje }) => (
              <View key={dia} style={estilos.diaSemana}>
                <View
                  style={[
                    estilos.quadradoDia,
                    { backgroundColor: cores.fundo, borderColor: cores.linha },
                    feito && { backgroundColor: cores.ouro, borderColor: cores.ouro },
                    !feito && ehHoje && { borderColor: cores.acento, borderWidth: 2, borderStyle: 'dashed' }
                  ]}
                >
                  {feito ? (
                    <Flame size={16} weight="fill" color={escurecer(cores.ouro, 0.55)} />
                  ) : ehHoje ? (
                    <Flame size={16} weight="bold" color={cores.acento} />
                  ) : null}
                </View>
                <Text style={[estilos.legenda, { color: ehHoje ? cores.acento : cores.desativado }]}>
                  {ehHoje ? 'HOJE' : rotulo}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── a missão do dia ───────────────────────────────────── */}
        <View
          style={[estilos.cartao, { borderColor: cores.acento, backgroundColor: cores.acentoFundo }]}
          onLayout={(e) => setAlturaCartao(e.nativeEvent.layout.height)}
        >
          <Gradiente de={cores.acentoFundo} para={tingir(cores.acento, cores, 0.55)} />
          <Animated.View
            pointerEvents="none"
            style={[estilos.varredura, { backgroundColor: cores.varredura }, scan]}
          />

          <View style={estilos.cartaoTopo}>
            <View style={estilos.missaoTitulo}>
              <Sword size={15} weight="fill" color={cores.acento} />
              <Rotulo cor={cores.acento}>{focoMultiplo ? 'missão do dia · mista' : 'missão do dia'}</Rotulo>
            </View>
            <View style={[estilos.chip, { backgroundColor: cores.fundo }]}>
              <Timer size={13} weight="bold" color={cores.acentoTexto} />
              <Text style={[estilos.duracao, { color: cores.acentoTexto }]}>{`${meta.minutos} min`}</Text>
            </View>
          </View>

          <View style={estilos.cartaoCorpo}>
            <Text style={[estilos.numero, { color: cores.textoForte }]}>{restam}</Text>
            <View style={estilos.cartaoDizeres}>
              <Text style={[estilos.cards, { color: cores.textoForte }]}>cards</Text>
              <Text style={[estilos.notaDiaria, { color: cores.acentoTexto }]}>{nota}</Text>
            </View>
            <View style={estilos.flex} />
            <Recompensa xp={meta.cards * 10} feita={fezDiariaHoje} reduzido={reduzido} />
          </View>

          <View style={estilos.botaoDiariaMoldura}>
            <BotaoDiaria
              rotulo={fezDiariaHoje ? 'Rever a sessão' : 'Começar missão'}
              cor={fezDiariaHoje ? cores.ok : cores.acento}
              aoTocar={() => router.push('/sessao')}
              pulsar={!fezDiariaHoje && !reduzido}
            />
          </View>
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

        {/* ── missão de uma linguagem só ────────────────────────── */}
        {/* Só aparece com mais de um foco escolhido. Uma vez feita qualquer
            missão do dia, as outras contam XP mas não a sequência de novo —
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
                    <View style={[estilos.siglaCheia, { backgroundColor: coresLinguagem[id] }]}>
                      <Text style={[estilos.siglaCheiaTexto, { color: cores.fundo }]}>{siglaLinguagem[id]}</Text>
                    </View>
                    <Text style={[estilos.tituloFoco, { color: cores.textoForte }]}>{linguagem.nome}</Text>
                    <View style={estilos.flex} />
                    <ArrowRight size={18} color={coresLinguagem[id]} weight="bold" />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ── evolução: quanto falta para o próximo nível, em % ─── */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Nível ${nivel}, ${percentualNivel}% do caminho para o próximo.`}
          onPress={() => router.push('/perfil')}
          style={({ pressed }) => [
            estilos.evolucao,
            { backgroundColor: cores.superficie, borderColor: cores.linha },
            pressed && estilos.pressionado
          ]}
        >
          <DevzinhoAvatar tamanho={52} nivel={nivel} expressao="feliz" />
          <View style={estilos.flex}>
            <View style={estilos.evolucaoTopo}>
              <Text style={[estilos.evolucaoTitulo, { color: cores.textoForte }]}>
                {rank.proximo ? `Rumo a ${rank.proximo.nome}` : 'Você é uma Lenda!'}
              </Text>
              <Text style={[estilos.evolucaoPercentual, { color: corNivel }]}>
                {`${rank.proximo ? percentualNivel : 100}%`}
              </Text>
            </View>
            <Trilho
              fracao={rank.proximo ? rank.progresso : 1}
              altura={12}
              cor={corNivel}
              duracao={animacao.rank}
              estilo={estilos.barraEvolucao}
            />
            <Text style={[estilos.notaLinha, { color: cores.legenda }]}>
              {rank.proximo ? `nível ${nivel} → ${nivel + 1}` : 'nível máximo'}
            </Text>
          </View>
        </Pressable>

        {/* ── suas trilhas: só as linguagens do foco ────────────── */}
        <View style={estilos.secao}>
          <Rotulo estilo={estilos.rotuloTrilhas}>suas trilhas</Rotulo>
        </View>
        <ScrollView
          horizontal={jornadas.length > 1}
          scrollEnabled={jornadas.length > 1}
          showsHorizontalScrollIndicator={false}
          snapToInterval={larguraJornada ? larguraJornada + espaco.sm : undefined}
          decelerationRate="fast"
          contentContainerStyle={[estilos.jornadas, jornadas.length > 1 ? estilos.jornadasLinha : null]}
        >
          {jornadas.map((j) => {
            const fracao = j.total ? j.feitas / j.total : 0;
            return (
              <Pressable
                key={j.id}
                accessibilityRole="button"
                accessibilityLabel={`Trilha de ${j.nome}, ${Math.round(fracao * 100)}% concluída. Continuar.`}
                onPress={() => router.push({ pathname: '/trilhas', params: { linguagem: j.id } })}
                style={({ pressed }) => [
                  estilos.jornada,
                  { width: larguraJornada, backgroundColor: cores.superficie, borderColor: j.cor },
                  pressed && estilos.pressionado
                ]}
              >
                <Gradiente de={cores.superficie} para={tingir(j.cor, cores, 0.78)} />
                <View style={estilos.jornadaTopo}>
                  <View style={[estilos.siglaCheia, estilos.siglaGrande, { backgroundColor: j.cor }]}>
                    <Text style={[estilos.siglaCheiaTexto, { color: cores.fundo }]}>{j.sigla}</Text>
                  </View>
                  <View style={estilos.flex}>
                    <Text style={[estilos.jornadaNome, { color: cores.textoForte }]}>{j.nome}</Text>
                    <Text style={[estilos.notaLinha, { color: cores.legenda }]}>
                      {`${j.feitas} de ${j.total} lições`}
                    </Text>
                  </View>
                  <Text style={[estilos.jornadaPercentual, { color: j.cor }]}>{`${Math.round(fracao * 100)}%`}</Text>
                </View>

                <Trilho fracao={fracao} altura={10} cor={j.cor} duracao={animacao.rank} estilo={estilos.barraJornada} />

                <View style={estilos.unidades}>
                  {j.unidades.map((u) => {
                    const completa = u.total > 0 && u.feitas === u.total;
                    return (
                      <View
                        key={u.id}
                        style={[
                          estilos.unidade,
                          { borderColor: completa ? cores.ouro : cores.linha, backgroundColor: completa ? cores.ouroFundo : cores.fundo }
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[estilos.unidadeTexto, { color: completa ? cores.ouro : cores.textoFraco }]}
                        >
                          {u.titulo}
                        </Text>
                        <Text style={[estilos.unidadeConta, { color: completa ? cores.ouro : cores.legenda }]}>
                          {`${u.feitas}/${u.total}`}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={[estilos.jornadaRodape, { borderTopColor: cores.linha }]}>
                  <View style={estilos.flex}>
                    <Text style={[estilos.proximaRotulo, { color: cores.legenda }]}>
                      {j.proxima ? 'PRÓXIMA LIÇÃO' : 'TRILHA COMPLETA'}
                    </Text>
                    <Text numberOfLines={1} style={[estilos.proximaTitulo, { color: cores.textoForte }]}>
                      {j.proxima ? j.proxima.titulo : 'Você fechou tudo aqui!'}
                    </Text>
                  </View>
                  <View style={[estilos.continuar, { backgroundColor: j.cor }]}>
                    <Text style={[estilos.continuarTexto, { color: cores.fundo }]}>
                      {j.feitas === 0 ? 'Começar' : 'Continuar'}
                    </Text>
                    <ArrowRight size={14} weight="bold" color={cores.fundo} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── pontos fracos ─────────────────────────────────────── */}
        {fracos.length > 0 && (
          <View style={estilos.secao}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/fracos')}
              style={({ pressed }) => [
                estilos.cartaoTrilha,
                { backgroundColor: cores.superficie },
                pressed && estilos.pressionado
              ]}
            >
              <View style={[estilos.siglaBadge, { borderColor: cores.erro }]}>
                <Text style={[estilos.sigla, { color: cores.erro }]}>!</Text>
              </View>

              <View style={estilos.flex}>
                <Text style={[estilos.tituloLinha, { color: cores.textoForte }]}>
                  {`${fracos.length} ponto${fracos.length > 1 ? 's' : ''} fraco${fracos.length > 1 ? 's' : ''}`}
                </Text>
                <Text style={[estilos.notaLinha, { color: cores.legenda }]} numberOfLines={1}>
                  {fracos.map((f) => f.card.licaoTitulo).join(' · ')}
                </Text>
              </View>

              <ArrowRight size={14} color={cores.legenda} weight="bold" />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </TelaAba>
  );
}

/* ─────────────────────────── peças da tela ─────────────────────────── */

/** O que o Devzinho diz ao abrir o app — uma frase só, a que mais importa. */
function falaDoDevzinho({
  nome,
  sequencia,
  fezDiariaHoje,
  vencidos
}: {
  nome: string;
  sequencia: number;
  fezDiariaHoje: boolean;
  vencidos: number;
}): { texto: string; expressao: ExpressaoDevzinho } {
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiroNome = nome.split(' ')[0] || 'dev';

  if (fezDiariaHoje) {
    return {
      texto: `Mandou bem, ${primeiroNome}! Missão do dia cumprida. ${sequencia > 1 ? `São ${sequencia} dias seguidos!` : 'Volta amanhã pra acender o fogo!'}`,
      expressao: 'animado'
    };
  }
  if (vencidos > 0) {
    return {
      texto: `${saudacao}, ${primeiroNome}! ${vencidos} card${vencidos > 1 ? 's voltaram' : ' voltou'} do ciclo. Bora revisar?`,
      expressao: 'determinado'
    };
  }
  if (sequencia > 0) {
    return {
      texto: `${saudacao}, ${primeiroNome}! ${sequencia} dia${sequencia > 1 ? 's' : ''} de sequência. Não deixa o fogo apagar hoje!`,
      expressao: 'determinado'
    };
  }
  return { texto: `${saudacao}, ${primeiroNome}! Vamos codar? Bora cumprir a missão do dia e acender o fogo!`, expressao: 'feliz' };
}

/**
 * A recompensa da missão: um baú dourado que balança de leve chamando o toque,
 * com o XP embaixo. Feita, vira um check.
 */
function Recompensa({ xp, feita, reduzido }: { xp: number; feita: boolean; reduzido: boolean }) {
  const cores = useCores();
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (feita || reduzido) return;
    const laco = Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        ...[-8, 8, -6, 6, -3, 0].map((v) =>
          Animated.timing(valor, { toValue: v, duration: 70, useNativeDriver: true })
        )
      ])
    );
    laco.start();
    return () => laco.stop();
  }, [feita, reduzido, valor]);

  return (
    <View style={estilos.recompensa}>
      <Animated.View
        style={[
          estilos.recompensaIcone,
          { backgroundColor: feita ? cores.ok : cores.ouroFundo, borderColor: feita ? cores.ok : cores.ouro },
          { transform: [{ rotate: valor.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] }) }] }
        ]}
      >
        {feita ? (
          <CheckCircle size={30} weight="fill" color="#FFFFFF" />
        ) : (
          <TreasureChest size={30} weight="fill" color={cores.ouro} />
        )}
      </Animated.View>
      <Text style={[estilos.recompensaTexto, { color: feita ? cores.ok : cores.ouro }]}>
        {feita ? 'feita!' : `+${xp} XP`}
      </Text>
    </View>
  );
}

/** A chama do HUD: tremula de leve quando a sequência está acesa. */
function Chama({ acesa, reduzido }: { acesa: boolean; reduzido: boolean }) {
  const cores = useCores();
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!acesa || reduzido) return;
    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(valor, { toValue: 0, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    );
    laco.start();
    return () => laco.stop();
  }, [acesa, reduzido, valor]);

  return (
    <Animated.View
      style={{
        transform: [
          { scaleY: valor.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) },
          { rotate: valor.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }) }
        ]
      }}
    >
      <Flame size={22} weight="fill" color={acesa ? cores.ouro : cores.desativado} />
    </Animated.View>
  );
}

/**
 * O botão da diária: "de jogo" (com degrau) e, enquanto a diária não foi
 * feita, respirando devagar para chamar o toque.
 */
function BotaoDiaria({
  rotulo,
  cor,
  aoTocar,
  pulsar
}: {
  rotulo: string;
  cor: string;
  aoTocar: () => void;
  pulsar: boolean;
}) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulsar) {
      valor.setValue(0);
      return;
    }
    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(valor, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    );
    laco.start();
    return () => laco.stop();
  }, [pulsar, valor]);

  return (
    <Animated.View style={{ transform: [{ scale: valor.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) }] }}>
      <Pressable accessibilityRole="button" onPress={aoTocar}>
        {({ pressed }) => (
          <View
            style={[
              estilos.botaoDegrau,
              { backgroundColor: escurecer(cor, 0.35) },
              pressed ? { marginTop: 5 } : { paddingBottom: 5 }
            ]}
          >
            <View style={[estilos.botaoDiaria, { backgroundColor: cor }]}>
              <Text style={[estilos.rotuloBotao, { color: '#FFFFFF' }]}>{rotulo}</Text>
              <Cursor cor="#FFFFFF" />
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center', gap: espaco.md },
  carregandoTexto: { ...tipo.notaMono },
  flex: { flex: 1 },
  conteudo: { paddingTop: topoConteudo - 10, paddingBottom: espaco.xl },
  pressionado: { opacity: 0.75 },

  // ── HUD ──────────────────────────────────────────────────────
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: margemTela,
    height: 52,
    paddingHorizontal: espaco.md,
    borderRadius: raio.lg,
    borderWidth: 1.5
  },
  hudItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: espaco.sm },
  hudNivel: { flex: 1, gap: 8 },
  hudDivisor: { width: 1.5, height: 24 },
  hudNumero: { ...tipo.tituloItem, fontSize: 18 },
  hudNivelRotulo: { ...tipo.rotuloCampo, letterSpacing: 1, fontSize: 10, lineHeight: 12 },
  hudNivelNome: { ...tipo.tituloItemMenor, fontSize: 14, lineHeight: 17 },
  fala: { marginTop: espaco.md, marginHorizontal: margemTela - 6 },

  // ── cartão da diária ─────────────────────────────────────────
  cartao: {
    marginTop: espaco.md,
    marginHorizontal: margemTela,
    borderWidth: tamanhos.linha,
    overflow: 'hidden',
    borderRadius: raio.lg
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
  missaoTitulo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recompensa: { alignItems: 'center', gap: 4, paddingBottom: 2 },
  recompensaIcone: {
    width: 56,
    height: 56,
    borderRadius: raio.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  recompensaTexto: { ...tipo.metricaMono, fontFamily: tipo.botao.fontFamily, fontSize: 13 },
  chips: { flexDirection: 'row', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: raio.pill
  },

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

  botaoDiariaMoldura: { padding: 14, paddingTop: 18 },
  botaoDegrau: { borderRadius: raio.md },
  botaoDiaria: {
    borderRadius: raio.md,
    minHeight: tamanhos.botao - 4,
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

  cartaoSequencia: {
    marginTop: espaco.md,
    marginHorizontal: margemTela,
    padding: espaco.md,
    borderRadius: raio.lg,
    borderWidth: 1.5
  },
  semana: { flexDirection: 'row', gap: 6, marginTop: 12 },
  diaSemana: { flex: 1, alignItems: 'center', gap: 6 },
  quadradoDia: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  legenda: { ...tipo.rotuloCelula, letterSpacing: 0 },

  evolucao: {
    marginTop: espaco.lg,
    marginHorizontal: margemTela,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingVertical: 10,
    paddingHorizontal: espaco.md,
    borderRadius: raio.lg,
    borderWidth: 1.5
  },
  evolucaoTopo: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  evolucaoTitulo: { ...tipo.tituloLinha },
  evolucaoPercentual: { ...tipo.tituloItem, fontSize: 18 },
  barraEvolucao: { marginTop: 6, marginBottom: 4 },

  siglaCheia: {
    minWidth: 34,
    height: 30,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  siglaGrande: { minWidth: 44, height: 44, borderRadius: 12 },
  siglaCheiaTexto: { fontFamily: tipo.botao.fontFamily, fontSize: 14 },

  jornadas: { paddingHorizontal: margemTela, gap: espaco.sm },
  jornadasLinha: { flexDirection: 'row' },
  jornada: {
    borderRadius: raio.lg,
    borderWidth: 1.5,
    padding: espaco.md,
    overflow: 'hidden'
  },
  jornadaTopo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  jornadaNome: { ...tipo.tituloItem, fontSize: 18 },
  jornadaPercentual: { ...tipo.tituloItem, fontSize: 22 },
  barraJornada: { marginTop: espaco.md },
  unidades: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: espaco.md },
  unidade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: raio.pill,
    borderWidth: 1.5,
    maxWidth: '100%'
  },
  unidadeTexto: { ...tipo.tituloItemMenor, fontSize: 12, lineHeight: 15, flexShrink: 1 },
  unidadeConta: { ...tipo.metricaMono, fontSize: 11 },
  jornadaRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    marginTop: espaco.md,
    paddingTop: espaco.md,
    borderTopWidth: 1
  },
  proximaRotulo: { ...tipo.rotuloCelula, letterSpacing: 1 },
  proximaTitulo: { ...tipo.tituloItemMenor, fontSize: 15, marginTop: 2 },
  continuar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: raio.pill
  },
  continuarTexto: { fontFamily: tipo.botao.fontFamily, fontSize: 14 },

  diariasFoco: { marginTop: 11, gap: espaco.sm },
  cartaoFoco: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: tamanhos.botaoSecundario + 6,
    paddingHorizontal: espaco.md + 2,
    borderWidth: tamanhos.linha,
    borderRadius: raio.md
  },
  siglaFoco: { ...tipo.tituloItem, fontFamily: tipo.metricaMonoMedia.fontFamily, minWidth: 30 },
  tituloFoco: { ...tipo.tituloItem },
  rotuloTrilhas: { marginBottom: 12 },
  listaTrilhas: { gap: espaco.sm },
  cartaoTrilha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    borderRadius: raio.md
  },
  siglaBadge: {
    width: 34,
    height: 34,
    borderRadius: raio.pill,
    borderWidth: tamanhos.linha,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sigla: { ...tipo.metricaMonoMedia, fontSize: 12 },
  tituloLinha: { ...tipo.tituloLinha },
  barraTrilha: { marginTop: 6 },
  notaLinha: { ...tipo.notaMonoMenor, marginTop: 4 },
  contagem: { ...tipo.metricaMonoMedia }
});
