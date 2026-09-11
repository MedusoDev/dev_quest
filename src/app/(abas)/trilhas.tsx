import { Fragment, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { espaco, margemTela, siglaLinguagem, tamanhos, tipo } from '@/tema';
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
import { Rotulo } from '@/componentes/basicos';
import { TelaAba } from '@/componentes/abas';
import { CicloTrilha, type PontoCiclo } from '@/componentes/CicloTrilha';
import { BotaoLinguagem, SeletorLinguagem } from '@/componentes/SeletorLinguagem';

/**
 * TRILHAS — uma linguagem por vez, desenhada como o ciclo do Ouroboros.
 *
 * O que mudou em relação à versão anterior:
 *
 *   1. **Uma linguagem na tela.** Antes as trilhas de C# e de JavaScript
 *      vinham empilhadas na mesma rolagem; com mais linguagens isso não
 *      escala. Agora a linguagem é escolhida no cabeçalho e a tela mostra só
 *      a dela — o progresso de cada uma vive no seletor.
 *   2. **Sem título de abertura.** Saíram o rótulo mono e o título de 30 —
 *      eram meia tela de cabeçalho antes do primeiro conteúdo. Ficou uma
 *      barra de 52 dp: nome da linguagem à esquerda, glossário à direita.
 *   3. **O ciclo no lugar da timeline.** O anel mostra a linguagem inteira
 *      de uma vez; ver `CicloTrilha.tsx`. A lista embaixo continua existindo,
 *      compacta, para quem quer ler os nomes.
 *
 * O rótulo mono no acento continua marcando **uma** trilha: aquela onde está
 * a lição atual.
 */
export default function Trilhas() {
  const cores = useCores();
  const router = useRouter();
  const { licoesConcluidas } = useProgresso();

  const [linguagemId, setLinguagemId] = useState<LinguagemId>(linguagens[0]!.id);
  const [seletorAberto, setSeletorAberto] = useState(false);

  const linguagem = linguagens.find((l) => l.id === linguagemId)!;
  const fila = useMemo(() => licoesDaLinguagem(linguagemId), [linguagemId]);

  const feitas = fila.filter((licao) => licoesConcluidas.has(licao.id)).length;
  const atual = fila.find((licao) => !licoesConcluidas.has(licao.id)) ?? null;

  function abrir(licao: Licao) {
    if (!licaoEstaLiberada(linguagemId, licao.id, licoesConcluidas)) return;
    router.push(`/licao/${licao.id}`);
  }

  const pontos: PontoCiclo[] = fila.map((licao) => ({
    id: licao.id,
    concluida: licoesConcluidas.has(licao.id),
    atual: licao.id === atual?.id,
    aoTocar: () => abrir(licao)
  }));

  const faltam = fila.length - feitas;

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
        <CicloTrilha
          pontos={pontos}
          rotulo={
            atual
              ? `lição ${String(fila.indexOf(atual) + 1).padStart(2, '0')}`
              : 'ciclo fechado'
          }
          titulo={atual ? atual.titulo : 'A cabeça achou a cauda'}
          nota={
            atual
              ? `${atual.cards.length} cards · ${feitas} de ${fila.length} feitas`
              : `${fila.length} de ${fila.length} feitas`
          }
          acao={atual ? 'continuar' : 'rever'}
          aoTocarCentro={() => (atual ? abrir(atual) : setSeletorAberto(true))}
          legenda={
            atual
              ? `o corpo fecha o ciclo em ${faltam} liç${faltam === 1 ? 'ão' : 'ões'}`
              : 'o ciclo está inteiro'
          }
        />

        <View style={estilos.lista}>
          {secoes.map((secao) => (
            <Fragment key={secao.chave}>
              <View style={estilos.secao}>
                <Rotulo cor={secao.emFoco ? cores.acento : cores.legenda}>{secao.rotulo}</Rotulo>
                <Text style={[estilos.secaoContagem, { color: cores.legenda }]}>
                  {secao.emBreve ? 'em breve' : `${secao.feitas}/${secao.licoes.length}`}
                </Text>
              </View>

              {secao.licoes.map((licao) => {
                const concluida = licoesConcluidas.has(licao.id);
                const liberada = licaoEstaLiberada(linguagemId, licao.id, licoesConcluidas);
                const ehAtual = licao.id === atual?.id;

                return (
                  <Pressable
                    key={licao.id}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !liberada }}
                    onPress={() => abrir(licao)}
                    style={[estilos.linha, { borderTopColor: cores.linha }]}
                  >
                    <View
                      style={[
                        estilos.no,
                        concluida && { backgroundColor: cores.acento },
                        ehAtual && { borderWidth: 2, borderColor: cores.acento },
                        !concluida && !ehAtual && { borderWidth: tamanhos.linha, borderColor: cores.linha }
                      ]}
                    >
                      {concluida ? (
                        <Text style={[estilos.noTexto, { color: cores.acentoFundo }]}>✓</Text>
                      ) : ehAtual ? (
                        <Text style={[estilos.noTexto, { fontSize: 10, color: cores.acento }]}>
                          {fila.indexOf(licao) + 1}
                        </Text>
                      ) : null}
                    </View>

                    <Text
                      style={[
                        tipo.botaoDiscreto,
                        estilos.linhaTitulo,
                        { color: liberada ? cores.textoForte : cores.desativado }
                      ]}
                      numberOfLines={1}
                    >
                      {licao.titulo}
                    </Text>

                    <Text
                      style={[
                        tipo.metricaMono,
                        {
                          color: ehAtual
                            ? cores.acento
                            : liberada
                              ? cores.legenda
                              : cores.desativado
                        }
                      ]}
                    >
                      {concluida
                        ? 'feita'
                        : ehAtual
                          ? 'aqui →'
                          : liberada
                            ? `${licao.cards.length} cards`
                            : 'travada'}
                    </Text>
                  </Pressable>
                );
              })}
            </Fragment>
          ))}
        </View>
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

  conteudo: { paddingTop: espaco.md, paddingBottom: espaco.xl },

  lista: { paddingHorizontal: margemTela, marginTop: espaco.md },
  secao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: espaco.sm,
    paddingBottom: 6
  },
  secaoContagem: { ...tipo.metricaMono },

  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: tamanhos.alvoMin,
    paddingVertical: 8,
    borderTopWidth: tamanhos.linha
  },
  no: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  noTexto: { fontFamily: tipo.metricaPequena.fontFamily, fontSize: 11 },

  linhaTitulo: { flex: 1 }
});
