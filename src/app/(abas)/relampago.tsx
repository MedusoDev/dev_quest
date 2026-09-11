import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { espaco, margemTela, siglaLinguagem, tamanhos, tipo, topoConteudo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { useProgresso } from '@/dados/ProgressoContexto';
import { embaralhar } from '@/nucleo/aleatorio';
import { comoTexto, linguagens, type Card } from '@/nucleo/conteudo';
import { montarRelampago } from '@/nucleo/diaria';
import { nivelDe } from '@/nucleo/dificuldade';
import type { Conquista } from '@/nucleo/gamificacao';
import { Alternativa } from '@/componentes/Alternativa';
import { BlocoCodigo } from '@/componentes/BlocoCodigo';
import { Botao } from '@/componentes/Botao';
import { corDoNivel, ReguaMetrica, Rotulo, TextoRico, Trilho, rotuloDoNivel } from '@/componentes/basicos';
import { TelaAba } from '@/componentes/abas';

/**
 * RELÂMPAGO — o lado Kahoot.
 *
 * 60 segundos, só múltipla escolha, pontuação por velocidade. **Não conta para
 * a sequência de dias e não mexe no agendamento**, de propósito: se contasse,
 * viraria o atalho preguiçoso e a diária deixaria de ser feita. A tela diz isso
 * em voz alta, na nota de abertura — a regra só funciona se for conhecida.
 *
 * O número 60 em corpo 128 é o maior objeto do app inteiro. É o que faz esta
 * aba parecer outra coisa das outras quatro sem precisar de uma segunda cor.
 */

const DURACAO = 60;
const PONTOS_BASE = 100;
const BONUS_MAXIMO = 50;

type Fase = 'pronto' | 'jogando' | 'fim';

export default function Relampago() {
  const cores = useCores();
  const { progresso, registrarRelampago } = useProgresso();

  const [fase, setFase] = useState<Fase>('pronto');
  const [restante, setRestante] = useState(DURACAO);
  const [indice, setIndice] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [respostas, setRespostas] = useState(0);
  const [pontos, setPontos] = useState(0);
  const [escolhido, setEscolhido] = useState<number | null>(null);
  const [fecho, setFecho] = useState<{ recorde: boolean; conquistas: Conquista[] } | null>(null);

  const inicioDoCard = useRef(Date.now());

  // Estado, não `useMemo`: precisa de uma leva nova a cada partida. Antes era
  // montado uma vez só na abertura da tela, então "De novo" reaproveitava a
  // mesma leva embaralhada, na mesma ordem — a mesma sequência de perguntas se
  // repetindo partida após partida sem sair da tela.
  const [cards, setCards] = useState<Card[]>(() => montarRelampago(linguagens.map((l) => l.id)));
  const card = cards[indice % Math.max(cards.length, 1)];

  // Uma partida rápida pode dar a volta na leva inteira antes dos 60s
  // acabarem — sem isto, a segunda volta repetiria a mesma ordem da primeira.
  useEffect(() => {
    if (cards.length > 0 && indice > 0 && indice % cards.length === 0) {
      setCards((atual) => embaralhar(atual));
    }
  }, [indice, cards.length]);

  const ordem = useMemo(
    () => (card ? embaralhar((card.alternativas ?? []).map((_, i) => i)) : []),
    [card]
  );

  const encerrar = useCallback(async () => {
    setFase('fim');
    setFecho(await registrarRelampago(acertos, respostas));
  }, [acertos, respostas, registrarRelampago]);

  useEffect(() => {
    if (fase !== 'jogando') return;

    const relogio = setInterval(() => {
      setRestante((valor) => (valor <= 1 ? 0 : valor - 1));
    }, 1000);

    return () => clearInterval(relogio);
  }, [fase]);

  useEffect(() => {
    if (fase === 'jogando' && restante === 0) encerrar();
  }, [restante, fase, encerrar]);

  function comecar() {
    setCards(montarRelampago(linguagens.map((l) => l.id)));
    setFase('jogando');
    setRestante(DURACAO);
    setIndice(0);
    setAcertos(0);
    setRespostas(0);
    setPontos(0);
    setEscolhido(null);
    setFecho(null);
    inicioDoCard.current = Date.now();
  }

  function responder(alternativa: number) {
    if (escolhido !== null || !card) return;
    setEscolhido(alternativa);
    setRespostas((v) => v + 1);

    if (alternativa === card.correta) {
      // Quanto mais rápido, maior o bônus: meio ponto por décimo de segundo
      // poupado, até o teto.
      const decimos = Math.floor((Date.now() - inicioDoCard.current) / 100);
      setAcertos((v) => v + 1);
      setPontos((v) => v + PONTOS_BASE + Math.max(0, BONUS_MAXIMO - decimos));
    }

    // Meio segundo para o olho registrar o acento ou o vermelho, e segue.
    setTimeout(() => {
      setEscolhido(null);
      setIndice((v) => v + 1);
      inicioDoCard.current = Date.now();
    }, 500);
  }

  /* ── antes e depois da partida ────────────────────────────────── */

  if (fase !== 'jogando') {
    const acabou = fase === 'fim';

    const media =
      progresso.relampagoPartidas > 0
        ? Math.round(progresso.relampagoAcertos / progresso.relampagoPartidas)
        : 0;
    const taxa =
      progresso.relampagoRespostas > 0
        ? Math.round((progresso.relampagoAcertos / progresso.relampagoRespostas) * 100)
        : 0;

    return (
      <TelaAba>
        <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
          <Rotulo cor={cores.acento}>relâmpago</Rotulo>
          <Text style={[estilos.titulo, { color: cores.textoForte }]}>
            {acabou ? `${pontos} pontos` : '60 segundos, fora do ciclo'}
          </Text>
          <Text style={[estilos.nota, { color: cores.legenda }]}>
            {acabou
              ? `${acertos} acerto${acertos === 1 ? '' : 's'} em ${respostas} card${respostas === 1 ? '' : 's'}.`
              : 'Não conta pra sequência, não mexe no agendamento. Só velocidade.'}
          </Text>

          <View style={estilos.relogio}>
            <Text style={[estilos.numeroGigante, { color: cores.textoForte }]}>
              {acabou ? acertos : DURACAO}
            </Text>
            <Text style={[estilos.unidade, { color: cores.legenda }]}>{acabou ? 'cards' : 's'}</Text>
          </View>

          <View style={estilos.reguas}>
            <ReguaMetrica rotulo="melhor" valor={`${progresso.recordeRelampago} cards`} />
            <ReguaMetrica rotulo="média" valor={`${media} cards`} />
            <ReguaMetrica rotulo="acerto" valor={`${taxa}%`} corValor={cores.acento} ultima />
          </View>

          {fecho?.recorde && (
            <Text style={[estilos.recorde, { color: cores.acento }]}>recorde pessoal novo</Text>
          )}
          {fecho?.conquistas.map((c) => (
            <Text key={c.id} style={[estilos.recorde, { color: cores.acento }]}>{`conquista: ${c.nome}`}</Text>
          ))}

          <View style={estilos.acao}>
            <Botao rotulo={acabou ? 'De novo' : 'Disparar'} aoTocar={comecar} />
          </View>
        </ScrollView>
      </TelaAba>
    );
  }

  /* ── durante a partida ────────────────────────────────────────── */

  if (!card) return null;

  const nivel = nivelDe(card);

  return (
    <TelaAba>
      <View style={estilos.topo}>
        <Pressable accessibilityLabel="Encerrar" accessibilityRole="button" hitSlop={10} onPress={encerrar}>
          <Text style={[estilos.fechar, { color: cores.legenda }]}>✕</Text>
        </Pressable>

        <Trilho
          fracao={restante / DURACAO}
          altura={tamanhos.trilhoGrosso}
          cor={restante <= 10 ? cores.erro : cores.acento}
          duracao={900}
          estilo={estilos.flex}
        />

        <Text style={[estilos.contador, { color: cores.legenda }]}>{`${restante}s`}</Text>

        <View style={estilos.pontos}>
          <Text style={[estilos.pontosNumero, { color: cores.acento }]}>{pontos}</Text>
          <Text style={[estilos.pontosRotulo, { color: cores.acentoTexto }]}>PT</Text>
        </View>
      </View>

      <View style={estilos.contexto}>
        <Text style={[tipo.rotuloFino, { color: cores.acento }]}>
          {siglaLinguagem[card.linguagem]}
        </Text>
        <View style={[estilos.tracinho, { backgroundColor: cores.linha }]} />
        <Text style={[tipo.rotuloFino, { color: corDoNivel(nivel, cores) }]}>{rotuloDoNivel(nivel)}</Text>
        <View style={[estilos.tracinho, { backgroundColor: cores.linha }]} />
        <Text style={[tipo.rotuloFino, { color: cores.legenda }]}>fora do ciclo</Text>
      </View>

      <ScrollView contentContainerStyle={estilos.corpo} showsVerticalScrollIndicator={false}>
        <TextoRico
          texto={card.enunciado}
          estilo={tipo.pergunta}
          cor={cores.textoForte}
          estiloCodigo={tipo.codigoNoTexto21}
        />

        {card.codigo && <BlocoCodigo codigo={comoTexto(card.codigo)} linguagem={card.linguagem} />}

        {card.pergunta && (
          <TextoRico texto={card.pergunta} estilo={tipo.alternativa} cor={cores.textoFraco} />
        )}

        {/* `key={card.id}` força o React a remontar as alternativas a cada
            pergunta. Sem isto, como os `original` de `ordem` repetem 0..3 em
            toda pergunta, o React reaproveitava o mesmo componente
            `Alternativa` de uma posição — e a animação de cor guardada nele
            (o desvanecer do verde/vermelho revelado) continuava rodando por
            cima da pergunta seguinte, como se estivesse entregando de
            antemão qual era a resposta certa. */}
        <View style={estilos.alternativas} key={card.id}>
          {ordem.map((original, posicao) => (
            <Alternativa
              key={original}
              indice={posicao}
              texto={card.alternativas![original]!}
              mono={card.tipo === 'saida'}
              escolhida={escolhido === original}
              revelado={escolhido !== null}
              correta={original === card.correta}
              aoTocar={() => responder(original)}
            />
          ))}
        </View>
      </ScrollView>
    </TelaAba>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: {
    paddingHorizontal: margemTela,
    paddingTop: topoConteudo,
    paddingBottom: espaco.xl
  },

  titulo: { ...tipo.titulo, marginTop: espaco.sm },
  nota: { ...tipo.notaMono, marginTop: 12 },

  relogio: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
    marginTop: espaco.xxl
  },
  numeroGigante: { ...tipo.heroiGigante },
  unidade: { ...tipo.campo, paddingBottom: espaco.md },

  reguas: { marginTop: espaco.xxl },
  recorde: { ...tipo.metricaMonoMedia, marginTop: espaco.md },
  acao: { marginTop: espaco.xl },

  // ── durante a partida ────────────────────────────────────────
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingHorizontal: margemTela,
    paddingTop: topoConteudo
  },
  fechar: { ...tipo.fechar },
  contador: { ...tipo.metricaMono },
  pontos: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  pontosNumero: { ...tipo.metricaPequena, fontSize: 14 },
  pontosRotulo: { ...tipo.rotuloCelula, letterSpacing: 0 },

  contexto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    paddingHorizontal: margemTela,
    paddingTop: 16
  },
  tracinho: { width: 1, height: 11 },

  corpo: {
    paddingHorizontal: margemTela,
    paddingTop: espaco.lg,
    paddingBottom: espaco.xl,
    gap: 18
  },
  alternativas: { gap: espaco.sm }
});
