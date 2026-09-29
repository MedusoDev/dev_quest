import { Fragment, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'phosphor-react-native';

import { espaco, margemTela, raio, rodapeFixo, siglaLinguagem, tamanhos, tipo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { useProgresso } from '@/dados/ProgressoContexto';
import {
  licaoEstaLiberada,
  licoesDaLinguagem,
  linguagens,
  obterLicao,
  type Licao,
  type LinguagemId
} from '@/nucleo/conteudo';
import { Botao } from '@/componentes/Botao';
import { Rotulo } from '@/componentes/basicos';
import { TelaAba } from '@/componentes/abas';
import { CaminhoTrilha, type ItemCaminho } from '@/componentes/CaminhoTrilha';
import { BotaoLinguagem, SeletorLinguagem } from '@/componentes/SeletorLinguagem';

/**
 * TRILHAS — uma linguagem por vez, num caminho de hexágonos.
 *
 *   1. **Uma linguagem na tela.** A linguagem é escolhida no cabeçalho e a
 *      tela mostra só a dela — o progresso de cada uma vive no seletor.
 *   2. **Sem título de abertura.** Barra de 52 dp: nome da linguagem à
 *      esquerda, glossário à direita.
 *   3. **Caminho sinuoso por seção.** Cada trilha (sub-seção) vira uma
 *      cápsula de título seguida de um `CaminhoTrilha` — hexágonos ligados por
 *      linha pontilhada. Tocar um hexágono liberado abre um cartão com o
 *      resumo da lição e os botões Continuar/Revisar Conteúdo.
 */
export default function Trilhas() {
  const cores = useCores();
  const router = useRouter();
  const { licoesConcluidas } = useProgresso();

  const [linguagemId, setLinguagemId] = useState<LinguagemId>(linguagens[0]!.id);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [licaoAberta, setLicaoAberta] = useState<Licao | null>(null);

  const linguagem = linguagens.find((l) => l.id === linguagemId)!;
  const fila = useMemo(() => licoesDaLinguagem(linguagemId), [linguagemId]);

  const feitas = fila.filter((licao) => licoesConcluidas.has(licao.id)).length;
  const atual = fila.find((licao) => !licoesConcluidas.has(licao.id)) ?? null;

  function abrir(licao: Licao) {
    if (!licaoEstaLiberada(linguagemId, licao.id, licoesConcluidas)) return;
    setLicaoAberta(licao);
  }

  const secoes = linguagem.trilhas.map((trilha) => {
    const licoes = trilha.licoes.map(obterLicao).filter((l): l is Licao => l !== null);

    return {
      chave: trilha.id,
      rotulo: `${siglaLinguagem[linguagem.id]} · ${trilha.titulo}`,
      emBreve: Boolean(trilha.emBreve),
      emFoco: licoes.some((licao) => licao.id === atual?.id),
      feitas: licoes.filter((licao) => licoesConcluidas.has(licao.id)).length,
      licoes
    };
  });

  return (
    <TelaAba paleta={cores}>
      <View style={[estilos.barra, { borderBottomColor: cores.linha }]}>
        <BotaoLinguagem
          nome={linguagem.nome}
          contagem={`${feitas}/${fila.length} lições`}
          aoTocar={() => setSeletorAberto(true)}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/glossario')}
          style={estilos.glossario}
        >
          <Text style={[estilos.glossarioTexto, { color: cores.legenda }]}>glossário</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        {secoes.map((secao) => {
          const itens: ItemCaminho[] = secao.licoes.map((licao) => ({
            licao,
            numero: fila.indexOf(licao) + 1,
            concluida: licoesConcluidas.has(licao.id),
            liberada: licaoEstaLiberada(linguagemId, licao.id, licoesConcluidas),
            ehAtual: licao.id === atual?.id
          }));

          return (
            <Fragment key={secao.chave}>
              <View
                style={[
                  estilos.capsula,
                  {
                    backgroundColor: secao.emFoco ? cores.acentoFundo : cores.superficie,
                    alignSelf: 'center'
                  }
                ]}
              >
                <Rotulo cor={secao.emFoco ? cores.acento : cores.legenda}>{secao.rotulo}</Rotulo>
                <Text style={[estilos.secaoContagem, { color: cores.legenda }]}>
                  {secao.emBreve ? 'em breve' : `${secao.feitas}/${secao.licoes.length}`}
                </Text>
              </View>

              <CaminhoTrilha itens={itens} aoTocar={(item) => abrir(item.licao)} />
            </Fragment>
          );
        })}
      </ScrollView>

      <SeletorLinguagem
        aberto={seletorAberto}
        selecionada={linguagemId}
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

                <Text style={[tipo.titulo, estilos.folhaTitulo, { color: cores.textoForte }]}>
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

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    marginTop: 46,
    paddingHorizontal: margemTela,
    borderBottomWidth: tamanhos.linha
  },
  glossario: {
    minHeight: tamanhos.alvoMin,
    justifyContent: 'center',
    paddingLeft: espaco.md
  },
  glossarioTexto: { ...tipo.metricaMono },

  conteudo: { paddingTop: espaco.lg, paddingBottom: espaco.xl },

  capsula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.xs + 2,
    borderRadius: raio.pill,
    marginBottom: espaco.sm
  },
  secaoContagem: { ...tipo.metricaMono },

  fundo: { flex: 1, backgroundColor: 'rgba(4,5,6,0.72)', justifyContent: 'flex-end' },
  folha: {
    borderTopWidth: tamanhos.linha,
    paddingHorizontal: margemTela,
    paddingTop: 18,
    paddingBottom: rodapeFixo,
    borderTopLeftRadius: raio.lg,
    borderTopRightRadius: raio.lg
  },
  folhaCabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  folhaTitulo: { marginTop: espaco.md },
  folhaResumo: { marginTop: espaco.sm, marginBottom: espaco.lg },
  botaoRevisar: { marginTop: espaco.sm }
});
