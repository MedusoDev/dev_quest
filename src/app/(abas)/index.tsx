import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Flame, Lightning, Timer } from 'phosphor-react-native';

import {
  animacao,
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
import { linguagens, obterLinguagem, obterLicao, type Licao } from '@/nucleo/conteudo';
import {
  AMOSTRA_MINIMA_NIVEL,
  contarVencidos,
  desempenhoNosDificeis,
  pontosFracos,
  sugestaoDeNivel
} from '@/nucleo/diaria';
import { metaPara, RANKS, rankPara, recordeSequencia, reguaDaSemana } from '@/nucleo/gamificacao';
import { NIVEIS_CONHECIMENTO } from '@/nucleo/perfil';
import { Anel } from '@/componentes/Anel';
import { Cursor, Rotulo, Trilho } from '@/componentes/basicos';
import { TelaAba } from '@/componentes/abas';
import { useMovimentoReduzido, useVarredura } from '@/componentes/movimento';
import { Devzinho, CORES_NIVEL, nivelDoRank, type ExpressaoDevzinho } from '@/componentes/Devzinho';
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

  const rank = rankPara(progresso.xp);
  const indiceRank = RANKS.findIndex((r) => r.nome === rank.atual.nome);
  const nivel = nivelDoRank(indiceRank);
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

  return (
    <TelaAba>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        {/* ── HUD: sequência, XP e nível ─────────────────────────── */}
        <View style={estilos.hud}>
          <Pressable
            accessibilityLabel={`Sequência: ${progresso.sequencia} dias. Toque para ver o perfil.`}
            accessibilityRole="button"
            onPress={() => router.push('/perfil')}
            style={[estilos.pilula, { backgroundColor: cores.superficie, borderColor: cores.linha }]}
          >
            <Chama acesa={progresso.sequencia > 0} reduzido={reduzido} />
            <Text style={[estilos.pilulaNumero, { color: progresso.sequencia > 0 ? cores.ouro : cores.desativado }]}>
              {progresso.sequencia}
            </Text>
          </Pressable>

          <View style={[estilos.pilula, { backgroundColor: cores.superficie, borderColor: cores.linha }]}>
            <Lightning size={20} weight="fill" color={cores.acentoSecundario} />
            <Text style={[estilos.pilulaNumero, { color: cores.acentoSecundario }]}>{progresso.xp}</Text>
          </View>

          <View style={estilos.flex} />

          <Pressable
            accessibilityLabel={`Nível ${nivel}: ${rank.atual.nome}. Toque para ver o perfil.`}
            accessibilityRole="button"
            onPress={() => router.push('/perfil')}
            style={[estilos.pilula, { backgroundColor: cores.superficie, borderColor: CORES_NIVEL[nivel] }]}
          >
            <Text style={[estilos.pilulaNivel, { color: CORES_NIVEL[nivel] }]}>{`NV ${nivel}`}</Text>
            <Text style={[estilos.pilulaRank, { color: cores.textoForte }]}>{rank.atual.nome}</Text>
          </Pressable>
        </View>

        {/* ── o Devzinho fala ──────────────────────────────────── */}
        <DevzinhoFala
          texto={fala.texto}
          expressao={fala.expressao}
          nivel={nivel}
          tamanho={100}
          estilo={estilos.fala}
        />

        {/* ── o cartão da diária ────────────────────────────────── */}
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
            <Rotulo cor={cores.acento}>
              {focoMultiplo ? 'diária mista' : 'diária'}
            </Rotulo>
            <View style={estilos.chips}>
              <View style={[estilos.chip, { backgroundColor: cores.fundo }]}>
                <Timer size={13} weight="bold" color={cores.acentoTexto} />
                <Text style={[estilos.duracao, { color: cores.acentoTexto }]}>{`${meta.minutos} min`}</Text>
              </View>
              <View style={[estilos.chip, { backgroundColor: cores.ouroFundo }]}>
                <Lightning size={13} weight="fill" color={cores.ouro} />
                <Text style={[estilos.duracao, { color: cores.ouro }]}>{fezDiariaHoje ? 'feita' : `+${meta.cards * 10} XP`}</Text>
              </View>
            </View>
          </View>

          <View style={estilos.cartaoCorpo}>
            <Text style={[estilos.numero, { color: cores.textoForte }]}>{restam}</Text>
            <View style={estilos.cartaoDizeres}>
              <Text style={[estilos.cards, { color: cores.textoForte }]}>cards</Text>
              <Text style={[estilos.notaDiaria, { color: cores.acentoTexto }]}>{nota}</Text>
            </View>
            <View style={estilos.flex} />
            <Anel
              tamanho={56}
              progresso={fezDiariaHoje ? 1 : 0}
              corFundo={cores.acentoFundo}
            />
          </View>

          <View style={estilos.botaoDiariaMoldura}>
            <BotaoDiaria
              rotulo={fezDiariaHoje ? 'Rever a sessão' : 'Começar'}
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
                    <ArrowRight size={18} color={coresLinguagem[id]} weight="bold" />
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
            <Text style={[estilos.sequencia, { color: progresso.sequencia > 0 ? cores.ouro : cores.desativado }]}>
              {progresso.sequencia}
            </Text>
            <Text style={[estilos.notaSequencia, { color: cores.legenda }]}>
              {'dias seguidos\n'}
              {fezDiariaHoje ? 'feita hoje' : 'não quebre hoje'}
            </Text>
          </View>

          <View style={estilos.semana}>
            {semana.map(({ dia, rotulo, feito, ehHoje }) => (
              <View key={dia} style={estilos.diaSemana}>
                <View
                  style={[
                    estilos.bolaDia,
                    { backgroundColor: cores.superficie, borderColor: cores.linha },
                    feito && { backgroundColor: cores.ouroFundo, borderColor: cores.ouro },
                    !feito && ehHoje && { borderColor: cores.acento, borderStyle: 'dashed' }
                  ]}
                >
                  <Flame
                    size={18}
                    weight={feito ? 'fill' : 'bold'}
                    color={feito ? cores.ouro : ehHoje ? cores.acento : cores.desativado2}
                  />
                </View>
                <Text style={[estilos.legenda, { color: ehHoje ? cores.acento : cores.desativado }]}>
                  {ehHoje ? 'HOJE' : rotulo}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── evolução: quanto falta para o próximo nível ───────── */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/perfil')}
          style={({ pressed }) => [
            estilos.evolucao,
            { backgroundColor: cores.superficie, borderColor: cores.linha },
            pressed && estilos.pressionado
          ]}
        >
          <Devzinho tamanho={54} nivel={nivel} item="notebook" flutuar={false} />
          <View style={estilos.flex}>
            <Text style={[estilos.evolucaoTitulo, { color: cores.textoForte }]}>
              {rank.proximo ? `Rumo a ${rank.proximo.nome}` : 'Você é uma Lenda!'}
            </Text>
            <Trilho
              fracao={rank.progresso}
              cor={CORES_NIVEL[nivel]}
              duracao={animacao.rank}
              estilo={estilos.barraEvolucao}
            />
            <Text style={[estilos.notaLinha, { color: cores.legenda }]}>
              {rank.proximo ? `faltam ${rank.faltam} XP · nível ${nivel + 1}` : `${progresso.xp} XP no total`}
            </Text>
          </View>
          <ArrowRight size={16} color={cores.legenda} weight="bold" />
        </Pressable>

        {/* ── trilhas ───────────────────────────────────────────── */}
        <View style={estilos.secao}>
          <Rotulo estilo={estilos.rotuloTrilhas}>trilhas</Rotulo>

          <View style={estilos.listaTrilhas}>
            {trilhas.map((trilha) => (
              <Pressable
                key={trilha.chave}
                accessibilityRole="button"
                onPress={() => router.push('/trilhas')}
                style={({ pressed }) => [
                  estilos.cartaoTrilha,
                  { backgroundColor: cores.superficie },
                  pressed && estilos.pressionado
                ]}
              >
                <View style={[estilos.siglaBadge, { borderColor: trilha.cor }]}>
                  <Text style={[estilos.sigla, { color: trilha.cor }]}>{trilha.sigla}</Text>
                </View>

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
            )}
          </View>
        </View>
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
      texto: `Mandou bem, ${primeiroNome}! Diária feita. ${sequencia > 1 ? `São ${sequencia} dias seguidos!` : 'Volta amanhã pra acender o fogo!'}`,
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
  return { texto: `${saudacao}, ${primeiroNome}! Vamos codar? Começa a diária e acende o fogo.`, expressao: 'feliz' };
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
    gap: espaco.sm,
    paddingHorizontal: margemTela
  },
  pilula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: raio.pill,
    borderWidth: 1.5
  },
  pilulaNumero: { ...tipo.tituloItem, fontSize: 17 },
  pilulaNivel: { ...tipo.rotuloCampo, letterSpacing: 1 },
  pilulaRank: { ...tipo.tituloItemMenor, fontSize: 14 },
  fala: { marginTop: espaco.md, marginHorizontal: margemTela - 6 },

  // ── cartão da diária ─────────────────────────────────────────
  cartao: {
    marginTop: espaco.sm,
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

  semana: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  diaSemana: { alignItems: 'center', gap: 6 },
  bolaDia: {
    width: 38,
    height: 38,
    borderRadius: raio.pill,
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
  evolucaoTitulo: { ...tipo.tituloLinha },
  barraEvolucao: { marginTop: 8 },

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
