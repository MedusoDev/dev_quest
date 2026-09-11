import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { espaco, margemTela, siglaLinguagem, tamanhos, tipo, topoConteudo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { useProgresso, type FechoDeSessao } from '@/dados/ProgressoContexto';
import { comoTexto } from '@/nucleo/conteudo';
import { hoje, somarDias } from '@/nucleo/datas';
import { pontosFracos, revisoesEm } from '@/nucleo/diaria';
import { nivelDe, ordenarParaSessao } from '@/nucleo/dificuldade';
import type { Resultado, Sessao as EstadoSessao } from '@/nucleo/sessao';
import { BlocoCodigo } from '@/componentes/BlocoCodigo';
import { Botao } from '@/componentes/Botao';
import { corDoNivel, Regua, Rotulo, rotuloDoNivel, TextoRico, Vazio } from '@/componentes/basicos';
import { Resumo } from '@/componentes/Resumo';
import { Sessao } from '@/componentes/Sessao';

/**
 * PONTOS FRACOS — onde você mais tropeça, em ordem.
 *
 * O campo `erros` é gravado por card desde a primeira versão e é o dado mais
 * útil do banco. Esta tela é o que o torna visível.
 *
 * Um treino curto vale como diária a partir de 5 cards. Abaixo disso continua
 * dando XP e revisão, mas não segura a sequência — senão dava para manter a
 * sequência respondendo dois cards fáceis por dia.
 */

const MINIMO_PARA_DIARIA = 5;

export default function Fracos() {
  const cores = useCores();
  const router = useRouter();
  const { progresso, revisoes, registrarSessao } = useProgresso();

  const [treinando, setTreinando] = useState(false);
  const [fim, setFim] = useState<{ resultado: Resultado; fecho: FechoDeSessao } | null>(null);

  const fracos = pontosFracos(revisoes);
  const contaComoDiaria = fracos.length >= MINIMO_PARA_DIARIA;

  async function aoTerminar(sessao: EstadoSessao, resultado: Resultado) {
    const fecho = await registrarSessao({ sessao, resultado, contaComoDiaria });
    setFim({ resultado, fecho });
    setTreinando(false);
  }

  if (fim) {
    return (
      <Resumo
        resultado={fim.resultado}
        fecho={fim.fecho}
        xpTotal={progresso.xp}
        voltamAmanha={revisoesEm(revisoes, somarDias(hoje(), 1))}
        rotuloBotao="Voltar"
        aoConcluir={() => router.back()}
      />
    );
  }

  if (treinando) {
    return (
      <Sessao
        cards={ordenarParaSessao(fracos.map((f) => f.card))}
        origemDe={() => 'ponto fraco'}
        aoTerminar={aoTerminar}
        aoSair={() => setTreinando(false)}
      />
    );
  }

  if (fracos.length === 0) {
    return (
      <View style={[estilos.centro, { backgroundColor: cores.fundo }]}>
        <Vazio
          titulo="Nenhum ponto fraco"
          texto="Você ainda não errou nada — ou ainda não respondeu o suficiente para aparecer padrão. Esta tela se enche sozinha conforme você estuda."
        >
          <Botao rotulo="Voltar" variante="secundario" aoTocar={() => router.back()} />
        </Vazio>
      </View>
    );
  }

  return (
    <View style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <View style={estilos.cabecalho}>
          <Rotulo cor={cores.erro}>pontos fracos</Rotulo>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()}>
            <Text style={[estilos.fechar, { color: cores.legenda }]}>✕</Text>
          </Pressable>
        </View>

        <Text style={[estilos.titulo, { color: cores.textoForte }]}>Onde você tropeça</Text>
        <Text style={[estilos.nota, { color: cores.legenda }]}>
          Do pior para o menos ruim. Errar de novo é normal — o que importa é que eles voltem.
        </Text>

        {!contaComoDiaria && (
          <Text style={[estilos.aviso, { color: cores.desativado }]}>
            {`com menos de ${MINIMO_PARA_DIARIA} cards o treino não segura a sequência do dia`}
          </Text>
        )}

        <View style={estilos.lista}>
          {fracos.map(({ card, erros, dominado }) => (
            <View key={card.id} style={estilos.fraco}>
              <Regua />

              <View style={estilos.fracoTopo}>
                <Text style={[estilos.erros, { color: cores.erro }]}>{`${erros}×`}</Text>
                <Text style={[tipo.rotuloFino, { color: cores.acento }]}>
                  {siglaLinguagem[card.linguagem]}
                </Text>
                <View style={[estilos.tracinho, { backgroundColor: cores.linha }]} />
                <Text style={[tipo.rotuloFino, { color: corDoNivel(nivelDe(card), cores) }]}>
                  {rotuloDoNivel(nivelDe(card))}
                </Text>
                <View style={estilos.flex} />
                {dominado && (
                  <Text style={[estilos.dominado, { color: cores.acento }]}>maduro</Text>
                )}
              </View>

              <TextoRico
                texto={card.enunciado}
                estilo={estilos.enunciado}
                cor={cores.textoForte}
              />

              {card.codigo && (
                <BlocoCodigo codigo={comoTexto(card.codigo)} linguagem={card.linguagem} />
              )}

              <TextoRico texto={card.explicacao} estilo={tipo.corpoMenor} cor={cores.textoFraco} />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[estilos.rodape, { borderTopColor: cores.linha }]}>
        <Botao rotulo={`Treinar estes ${fracos.length}`} aoTocar={() => setTreinando(true)} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  tela: { flex: 1 },
  centro: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: margemTela,
    paddingVertical: espaco.xl
  },
  conteudo: {
    paddingHorizontal: margemTela,
    paddingTop: topoConteudo,
    paddingBottom: espaco.xl
  },

  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fechar: { ...tipo.fechar },

  titulo: { ...tipo.titulo, marginTop: espaco.sm },
  nota: { ...tipo.notaMono, marginTop: 12 },
  aviso: { ...tipo.notaMonoMenor, marginTop: espaco.md },

  lista: { marginTop: espaco.xl },
  fraco: { gap: espaco.md, marginBottom: espaco.xl },
  fracoTopo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, marginTop: espaco.md },
  tracinho: { width: 1, height: 11 },
  erros: { ...tipo.metricaPequena },
  dominado: { ...tipo.rotuloFino },
  enunciado: { ...tipo.tituloItemMenor },

  rodape: {
    paddingHorizontal: margemTela,
    paddingBottom: 30,
    paddingTop: espaco.md,
    borderTopWidth: tamanhos.linha
  }
});
