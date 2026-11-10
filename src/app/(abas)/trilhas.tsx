import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpenText, CaretDown, X } from 'phosphor-react-native';

import {
  coresDasLinguagens,
  espaco,
  fontes,
  margemTela,
  raio,
  rodapeFixo,
  siglaLinguagem,
  tamanhos,
  tipo
} from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { useProgresso } from '@/dados/ProgressoContexto';
import { useConta } from '@/dados/ContaContexto';
import {
  licaoEstaLiberada,
  licoesDaLinguagem,
  linguagens,
  obterLicao,
  type Licao,
  type LinguagemId
} from '@/nucleo/conteudo';
import { Botao, tingir } from '@/componentes/Botao';
import { Trilho } from '@/componentes/basicos';
import { TelaAba } from '@/componentes/abas';
import { CaminhoTrilha, PADROES_CAMINHO, type ItemCaminho } from '@/componentes/CaminhoTrilha';
import { Devzinho, nivelDoRank } from '@/componentes/Devzinho';
import { Gradiente } from '@/componentes/Gradiente';
import { useMovimentoReduzido } from '@/componentes/movimento';
import { RANKS, rankPara } from '@/nucleo/gamificacao';
import { SeletorLinguagem } from '@/componentes/SeletorLinguagem';

/**
 * TRILHAS — uma linguagem por vez, num caminho que é a cara dela.
 *
 *   1. **Começa no foco da pessoa.** A linguagem aberta é a que veio pela
 *      rota (`?linguagem=java`, vindo do cartão da Hoje) ou a primeira do
 *      foco. Com mais de um foco, chips logo abaixo trocam entre eles; o
 *      seletor completo (todas as linguagens) abre tocando o nome.
 *   2. **Cada linguagem tem identidade.** Cor própria (sigla, estrada,
 *      lição atual), desenho de caminho próprio (`PADROES_CAMINHO`) e um
 *      fundo de símbolos da linguagem flutuando devagar.
 *   3. **Unidades.** Cada trilha vira um banner "UNIDADE n" seguido do
 *      caminho, que termina num troféu. Tocar um hexágono liberado abre a
 *      folha com o resumo da lição.
 */
export default function Trilhas() {
  const cores = useCores();
  const router = useRouter();
  const { perfil } = useConta();
  const { licoesConcluidas, progresso } = useProgresso();
  const nivel = nivelDoRank(RANKS.findIndex((r) => r.nome === rankPara(progresso.xp).atual.nome));
  const parametros = useLocalSearchParams<{ linguagem?: string }>();
  const coresLinguagem = coresDasLinguagens(cores);

  const foco = (perfil?.foco ?? []).filter((id) => linguagens.some((l) => l.id === id)) as LinguagemId[];
  const inicial = (parametros.linguagem as LinguagemId | undefined) ?? foco[0] ?? linguagens[0]!.id;

  const [linguagemId, setLinguagemId] = useState<LinguagemId>(inicial);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [licaoAberta, setLicaoAberta] = useState<Licao | null>(null);

  // Vindo do cartão da Hoje com outra linguagem: troca para ela.
  useEffect(() => {
    if (parametros.linguagem && linguagens.some((l) => l.id === parametros.linguagem)) {
      setLinguagemId(parametros.linguagem as LinguagemId);
    }
  }, [parametros.linguagem]);

  const linguagem = linguagens.find((l) => l.id === linguagemId) ?? linguagens[0]!;
  const fila = useMemo(() => licoesDaLinguagem(linguagem.id), [linguagem.id]);
  const cor = coresLinguagem[linguagem.id as keyof typeof coresLinguagem] ?? cores.acento;

  const feitas = fila.filter((licao) => licoesConcluidas.has(licao.id)).length;
  const atual = fila.find((licao) => !licoesConcluidas.has(licao.id)) ?? null;
  const fracao = fila.length ? feitas / fila.length : 0;

  function abrir(licao: Licao) {
    if (!licaoEstaLiberada(linguagem.id, licao.id, licoesConcluidas)) return;
    setLicaoAberta(licao);
  }

  const secoes = linguagem.trilhas.map((trilha, indice) => {
    const licoes = trilha.licoes.map(obterLicao).filter((l): l is Licao => l !== null);

    return {
      chave: trilha.id,
      numero: indice + 1,
      titulo: trilha.titulo,
      rotulo: `${siglaLinguagem[linguagem.id]} · ${trilha.titulo}`,
      emBreve: Boolean(trilha.emBreve),
      emFoco: licoes.some((licao) => licao.id === atual?.id),
      feitas: licoes.filter((licao) => licoesConcluidas.has(licao.id)).length,
      licoes
    };
  });

  return (
    <TelaAba paleta={cores}>
      {/* símbolos da linguagem flutuando no fundo */}
      <FundoLinguagem key={linguagem.id} linguagemId={linguagem.id} cor={cor} />

      {/* ── cabeçalho: a linguagem, o progresso e o glossário ─── */}
      <View style={[estilos.topo, { borderBottomColor: cores.linha, backgroundColor: cores.fundo }]}>
        <View style={estilos.topoLinha}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${linguagem.nome}, ${feitas} de ${fila.length} lições. Trocar de linguagem.`}
            onPress={() => setSeletorAberto(true)}
            style={({ pressed }) => [estilos.linguagemBotao, pressed && estilos.pressionado]}
          >
            <View style={[estilos.sigla, { backgroundColor: cor }]}>
              <Text style={[estilos.siglaTexto, { color: cores.fundo }]}>{siglaLinguagem[linguagem.id]}</Text>
            </View>
            <View style={estilos.flex}>
              <View style={estilos.nomeLinha}>
                <Text style={[estilos.nome, { color: cores.textoForte }]}>{linguagem.nome}</Text>
                <CaretDown size={16} weight="bold" color={cores.legenda} />
              </View>
              <Text style={[estilos.contagem, { color: cores.legenda }]}>
                {`${feitas}/${fila.length} lições · ${Math.round(fracao * 100)}%`}
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir o glossário"
            onPress={() => router.push('/glossario')}
            style={({ pressed }) => [
              estilos.glossario,
              { backgroundColor: cores.superficie, borderColor: cores.linha },
              pressed && estilos.pressionado
            ]}
          >
            <BookOpenText size={22} weight="bold" color={cores.acentoSecundario} />
          </Pressable>
        </View>

        <Trilho fracao={fracao} altura={8} cor={cor} estilo={estilos.barraTopo} />

        {foco.length > 1 && (
          <View style={estilos.chips}>
            {foco.map((id) => {
              const ativa = id === linguagem.id;
              const corChip = coresLinguagem[id as keyof typeof coresLinguagem] ?? cores.acento;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: ativa }}
                  onPress={() => setLinguagemId(id)}
                  style={[
                    estilos.chip,
                    { borderColor: ativa ? corChip : cores.linha, backgroundColor: ativa ? corChip : cores.superficie }
                  ]}
                >
                  <Text style={[estilos.chipTexto, { color: ativa ? cores.fundo : cores.textoFraco }]}>
                    {linguagens.find((l) => l.id === id)?.nome ?? id}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        {secoes.map((secao) => {
          const itens: ItemCaminho[] = secao.licoes.map((licao) => ({
            licao,
            numero: fila.indexOf(licao) + 1,
            concluida: licoesConcluidas.has(licao.id),
            liberada: licaoEstaLiberada(linguagem.id, licao.id, licoesConcluidas),
            ehAtual: licao.id === atual?.id
          }));
          const completa = !secao.emBreve && secao.licoes.length > 0 && secao.feitas === secao.licoes.length;
          const corBanner = completa ? cores.ouro : secao.emFoco ? cor : cores.linha;

          return (
            <Fragment key={secao.chave}>
              {/* banner da unidade */}
              <View style={[estilos.unidade, { borderColor: corBanner, backgroundColor: cores.superficie }]}>
                {(secao.emFoco || completa) && (
                  <Gradiente de={cores.superficie} para={tingir(completa ? cores.ouro : cor, cores, 0.7)} angulo="horizontal" />
                )}
                <View style={estilos.flex}>
                  <Text style={[estilos.unidadeRotulo, { color: secao.emFoco || completa ? corBanner : cores.legenda }]}>
                    {`UNIDADE ${secao.numero}${secao.emFoco ? ' · EM ANDAMENTO' : completa ? ' · COMPLETA' : ''}`}
                  </Text>
                  <Text style={[estilos.unidadeTitulo, { color: cores.textoForte }]}>{secao.titulo}</Text>
                </View>
                <View style={estilos.unidadeLado}>
                  <Text style={[estilos.unidadeConta, { color: completa ? cores.ouro : cores.textoFraco }]}>
                    {secao.emBreve ? 'em breve' : `${secao.feitas}/${secao.licoes.length}`}
                  </Text>
                  {!secao.emBreve && (
                    <Trilho
                      fracao={secao.licoes.length ? secao.feitas / secao.licoes.length : 0}
                      cor={completa ? cores.ouro : cor}
                      estilo={estilos.unidadeBarra}
                    />
                  )}
                </View>
              </View>

              <CaminhoTrilha
                itens={itens}
                nivel={nivel}
                cor={cor}
                padrao={PADROES_CAMINHO[linguagem.id]}
                aoTocar={(item) => abrir(item.licao)}
              />
            </Fragment>
          );
        })}
      </ScrollView>

      <SeletorLinguagem
        aberto={seletorAberto}
        selecionada={linguagem.id}
        linguagens={linguagens.map((l) => {
          const licoes = licoesDaLinguagem(l.id);
          return {
            id: l.id,
            nome: l.nome,
            descricao: l.descricao,
            feitas: licoes.filter((licao) => licoesConcluidas.has(licao.id)).length,
            total: licoes.length
          };
        })}
        aoEscolher={(id) => {
          setLinguagemId(id as LinguagemId);
          setSeletorAberto(false);
        }}
        aoFechar={() => setSeletorAberto(false)}
      />

      <Modal
        visible={licaoAberta !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setLicaoAberta(null)}
      >
        <Pressable style={estilos.fundo} onPress={() => setLicaoAberta(null)}>
          <Pressable
            style={[estilos.folha, { backgroundColor: cores.fundo, borderTopColor: cores.linha }]}
            onPress={() => {}}
          >
            {licaoAberta && (
              <>
                {/* O Devzinho espia por cima da folha. */}
                <View pointerEvents="none" style={estilos.espiando}>
                  <Devzinho
                    tamanho={86}
                    nivel={nivel}
                    item="notebook"
                    expressao={licoesConcluidas.has(licaoAberta.id) ? 'feliz' : 'animado'}
                  />
                </View>
                <View style={estilos.folhaCabecalho}>
                  <Text style={[tipo.rotuloFino, { color: cores.acento }]}>
                    {`${fila.indexOf(licaoAberta) + 1} · ${
                      secoes.find((s) => s.licoes.some((l) => l.id === licaoAberta.id))?.rotulo ?? ''
                    }`}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={12}
                    onPress={() => setLicaoAberta(null)}
                  >
                    <X size={18} color={cores.legenda} weight="bold" />
                  </Pressable>
                </View>

                <Text style={[tipo.titulo, estilos.folhaTitulo, { color: cores.textoForte, marginRight: 70 }]}>
                  {licaoAberta.titulo}
                </Text>
                <Text style={[tipo.corpo, estilos.folhaResumo, { color: cores.textoFraco }]}>
                  {licaoAberta.resumo}
                </Text>

                <Botao
                  rotulo="Continuar"
                  aoTocar={() => {
                    const id = licaoAberta.id;
                    setLicaoAberta(null);
                    router.push(`/licao/${id}`);
                  }}
                />

                {licoesConcluidas.has(licaoAberta.id) && (
                  <Botao
                    rotulo="Revisar Conteúdo"
                    variante="secundario"
                    estilo={estilos.botaoRevisar}
                    aoTocar={() => {
                      const id = licaoAberta.id;
                      setLicaoAberta(null);
                      router.push({ pathname: '/licao/[id]', params: { id, revisar: '1' } });
                    }}
                  />
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </TelaAba>
  );
}

/** Símbolos que lembram cada linguagem, flutuando bem apagados no fundo. */
const SIMBOLOS: Record<string, string[]> = {
  csharp: ['#', '{ }', '=>', 'var', '<T>', 'async', ';'],
  java: ['{ }', ';', 'class', '@', '()', 'new', '[]'],
  javascript: ['=>', '{ }', '===', 'const', '...', '`${}`', '()'],
  python: ['def', '>>>', ':', '[]', '#', 'self', '**'],
  php: ['<?php', '$', '->', '{ }', ';', '::', '?>']
};

const POSICOES_FUNDO = [
  { x: 0.08, y: 0.22, t: 26 },
  { x: 0.8, y: 0.18, t: 20 },
  { x: 0.2, y: 0.46, t: 18 },
  { x: 0.86, y: 0.5, t: 28 },
  { x: 0.06, y: 0.72, t: 22 },
  { x: 0.72, y: 0.8, t: 18 },
  { x: 0.42, y: 0.92, t: 24 }
];

function FundoLinguagem({ linguagemId, cor }: { linguagemId: string; cor: string }) {
  const simbolos = SIMBOLOS[linguagemId] ?? SIMBOLOS.csharp!;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {POSICOES_FUNDO.map((p, i) => (
        <SimboloFlutuante key={i} texto={simbolos[i % simbolos.length]!} cor={cor} {...p} atraso={i * 700} />
      ))}
    </View>
  );
}

function SimboloFlutuante({
  texto,
  cor,
  x,
  y,
  t,
  atraso
}: {
  texto: string;
  cor: string;
  x: number;
  y: number;
  t: number;
  atraso: number;
}) {
  const reduzido = useMovimentoReduzido();
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzido) return;
    const laco = Animated.loop(
      Animated.sequence([
        Animated.delay(atraso),
        Animated.timing(valor, { toValue: 1, duration: 5200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(valor, { toValue: 0, duration: 5200, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    );
    laco.start();
    return () => laco.stop();
  }, [atraso, reduzido, valor]);

  return (
    <Animated.Text
      style={[
        estilos.fundoSimbolo,
        {
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          fontSize: t,
          color: cor,
          opacity: valor.interpolate({ inputRange: [0, 1], outputRange: [0.07, 0.16] }),
          transform: [
            { translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
            { rotate: valor.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) }
          ]
        }
      ]}
    >
      {texto}
    </Animated.Text>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  pressionado: { opacity: 0.75 },
  topo: {
    marginTop: 44,
    paddingHorizontal: margemTela,
    paddingBottom: espaco.md,
    borderBottomWidth: tamanhos.linha
  },
  topoLinha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  linguagemBotao: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  sigla: {
    minWidth: 46,
    height: 46,
    paddingHorizontal: 6,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  siglaTexto: { fontFamily: fontes.forte, fontSize: 16 },
  nomeLinha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nome: { ...tipo.tituloItem, fontSize: 20, lineHeight: 24 },
  contagem: { ...tipo.metricaMono, marginTop: 2 },
  glossario: {
    width: 46,
    height: 46,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  barraTopo: { marginTop: espaco.md },
  chips: { flexDirection: 'row', gap: espaco.sm, marginTop: espaco.md },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: raio.pill, borderWidth: 1.5 },
  chipTexto: { fontFamily: fontes.semi, fontSize: 13 },

  conteudo: { paddingTop: espaco.lg, paddingBottom: espaco.xl },

  unidade: {
    marginHorizontal: margemTela,
    marginTop: espaco.md,
    marginBottom: espaco.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingVertical: espaco.md,
    paddingHorizontal: espaco.md,
    borderRadius: raio.lg,
    borderWidth: 1.5,
    overflow: 'hidden'
  },
  unidadeRotulo: { ...tipo.rotuloCelula, letterSpacing: 1.2 },
  unidadeTitulo: { ...tipo.tituloItem, fontSize: 18, marginTop: 2 },
  unidadeLado: { alignItems: 'flex-end', width: 70 },
  unidadeConta: { ...tipo.metricaMono, fontFamily: fontes.forte, fontSize: 14 },
  unidadeBarra: { marginTop: 6, width: 70 },
  fundoSimbolo: { position: 'absolute', fontFamily: fontes.mono },

  fundo: { flex: 1, backgroundColor: 'rgba(4,5,6,0.72)', justifyContent: 'flex-end' },
  folha: {
    borderTopWidth: tamanhos.linha,
    paddingHorizontal: margemTela,
    paddingTop: 18,
    paddingBottom: rodapeFixo,
    borderTopLeftRadius: raio.lg,
    borderTopRightRadius: raio.lg
  },
  folhaCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 84
  },
  espiando: { position: 'absolute', right: 14, top: -64 },
  folhaTitulo: { marginTop: espaco.md },
  folhaResumo: { marginTop: espaco.sm, marginBottom: espaco.lg },
  botaoRevisar: { marginTop: espaco.sm }
});
