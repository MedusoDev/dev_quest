import { useEffect, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { espaco, margemTela, siglaLinguagem, tamanhos, tipo, topoConteudo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import type { Card } from '@/nucleo/conteudo';
import { nivelDe } from '@/nucleo/dificuldade';
import { xpDoCard } from '@/nucleo/gamificacao';
import { avaliar, respostaCertaEmTexto, respostaVazia, type Resposta } from '@/nucleo/resposta';
import {
  cardAtual,
  dePrimeira,
  iniciarSessao,
  LIMITE_PULOS,
  progresso as fracaoFeita,
  pular,
  responder,
  resultado as calcularResultado,
  terminou,
  type Resultado,
  type Sessao as EstadoSessao
} from '@/nucleo/sessao';
import { corDoNivel, rotuloDoNivel, TextoRico, Trilho } from './basicos';
import { Botao } from './Botao';
import { RenderizarCard } from './cards';
import { PainelFeedback } from './PainelFeedback';
import { useAbertura, useMovimentoReduzido, useTremor } from './movimento';

/**
 * A TELA DE EXERCÍCIO.
 *
 * Vale para a diária, para a lição e para o treino de pontos fracos — muda só a
 * lista de cards que entra.
 *
 * É a tela onde a pessoa passa mais tempo, e a regra de desenho é uma só:
 * **nada compete com a pergunta**. Sem abas embaixo, sem cabeçalho com título,
 * sem chips coloridos. Uma barra fina em cima com o progresso, uma linha de
 * contexto em mono minúsculo, e então a pergunta em corpo 21.
 *
 * ── ESCOLHER NÃO É RESPONDER ──────────────────────────────────────────────
 *
 * Tocar numa alternativa só marca o rascunho — a mesma régua acende no
 * acento, exatamente como um card de escrever mostra o que foi digitado. A
 * resposta só vale quando o botão "Verificar" é tocado. Confirmar sempre pelo
 * mesmo gesto, em todo tipo de card, evita o toque errado que respondia por
 * engano antes de a pessoa terminar de ler as opções.
 *
 * ── DUAS FASES POR CARD ───────────────────────────────────────────────────
 *
 * Responder e conferir. A explicação só aparece depois de responder,
 * **inclusive quando a pessoa acerta** — é ali que ela aprende o porquê, e não
 * só o quê.
 */

type Props = {
  cards: Card[];
  /** Diz se o card veio do ciclo de revisão, para a linha de contexto. */
  ehRevisao?: (card: Card) => boolean;
  /** Sobrepõe o texto de origem. O treino de pontos fracos usa. */
  origemDe?: (card: Card) => string;
  aoTerminar: (sessao: EstadoSessao, resultado: Resultado) => void;
  aoSair: () => void;
};

/** O rótulo do botão conta o que falta, em vez de só ficar apagado. */
function rotuloDoBotao(card: Card, falta: boolean): string {
  if (!falta) return 'Verificar';
  if (card.tipo === 'escreva') return 'Digite a linha';
  if (card.tipo === 'lacuna') return 'Preencha as lacunas';
  if (card.tipo === 'montar-linha') return 'Monte a linha';
  if (card.tipo === 'ache-o-erro') return 'Toque numa linha';
  return 'Escolha uma resposta';
}

export function Sessao({ cards, ehRevisao, origemDe, aoTerminar, aoSair }: Props) {
  const cores = useCores();
  const reduzido = useMovimentoReduzido();
  const abertura = useAbertura(reduzido);

  const [sessao, setSessao] = useState<EstadoSessao>(() => iniciarSessao(cards));
  const [resposta, setResposta] = useState<Resposta>(null);
  const [revelado, setRevelado] = useState(false);
  const [acertou, setAcertou] = useState(false);

  const card = cardAtual(sessao);

  // O tremor é do bloco da pergunta. Dispara no erro e some sozinho.
  const tremor = useTremor(revelado && !acertou, reduzido);

  useEffect(() => {
    if (terminou(sessao)) aoTerminar(sessao, calcularResultado(sessao));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve disparar quando a sessão muda
  }, [sessao]);

  if (!card) return null;

  const falta = respostaVazia(card, resposta);
  const nivel = nivelDe(card);

  const origem =
    origemDe?.(card) ?? (ehRevisao?.(card) ? 'volta do ciclo' : 'card novo');

  function conferir(valor: Resposta) {
    setAcertou(avaliar(card!, valor));
    setRevelado(true);
  }

  /** Toda resposta passa por aqui, e só guarda o rascunho — confirmar é o botão. */
  function registrar(valor: Resposta) {
    setResposta(valor);
  }

  function continuar() {
    setSessao((atual) => responder(atual, acertou));
    setResposta(null);
    setRevelado(false);
    setAcertou(false);
  }

  function aoPular() {
    setSessao((atual) => pular(atual));
    setResposta(null);
    setRevelado(false);
    setAcertou(false);
  }

  const ultimo = sessao.concluidos + 1 >= sessao.total && acertou;

  return (
    <Animated.View style={[estilos.tela, { backgroundColor: cores.fundo }, abertura]}>
      {/* ── barra de topo ─────────────────────────────────────── */}
      <View style={estilos.topo}>
        <Pressable
          accessibilityLabel="Sair da sessão"
          accessibilityRole="button"
          hitSlop={12}
          onPress={aoSair}
        >
          <Text style={[estilos.fechar, { color: cores.legenda }]}>✕</Text>
        </Pressable>

        {/* A barra usa `resolvidos`, não o índice da fila: um card que voltou
            para o fim não pode fazer o progresso andar para trás. */}
        <Trilho
          fracao={fracaoFeita(sessao)}
          altura={tamanhos.trilhoGrosso}
          estilo={estilos.flex}
        />

        <Text style={[estilos.contador, { color: cores.legenda }]}>{`${sessao.concluidos + 1}/${sessao.total}`}</Text>

        <View style={estilos.xp}>
          <Text style={[estilos.xpNumero, { color: cores.acento }]}>{sessao.xp}</Text>
          <Text style={[estilos.xpRotulo, { color: cores.acentoTexto }]}>XP</Text>
        </View>
      </View>

      {/* ── linha de contexto ─────────────────────────────────── */}
      <View style={estilos.contexto}>
        <Text style={[tipo.rotuloFino, { color: cores.acento }]}>
          {siglaLinguagem[card.linguagem]}
        </Text>
        <View style={[estilos.tracinho, { backgroundColor: cores.linha }]} />
        <Text style={[tipo.rotuloFino, { color: corDoNivel(nivel, cores) }]}>{rotuloDoNivel(nivel)}</Text>
        <View style={[estilos.tracinho, { backgroundColor: cores.linha }]} />
        <Text style={[tipo.rotuloFino, { color: cores.legenda }]}>{origem}</Text>
      </View>

      {/* ── corpo ─────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* A `key` garante estado limpo ao trocar de card: sem ela, um card de
            escrever herdaria o texto digitado no anterior. */}
        <Animated.View key={card.id} style={[estilos.bloco, tremor]}>
          <TextoRico
            texto={card.enunciado}
            estilo={tipo.pergunta}
            cor={cores.textoForte}
            estiloCodigo={tipo.codigoNoTexto21}
          />

          <RenderizarCard
            card={card}
            resposta={resposta}
            setResposta={registrar}
            revelado={revelado}
          />
        </Animated.View>
      </ScrollView>

      {/* ── ação ──────────────────────────────────────────────── */}
      {!revelado && (
        <View
          style={[
            estilos.rodape,
            { borderTopColor: cores.linha, backgroundColor: cores.fundo }
          ]}
        >
          <View style={estilos.linhaAcoes}>
            <Botao
              estilo={estilos.botaoMetade}
              altura={tamanhos.botao}
              variante="secundario"
              rotulo={
                sessao.pulados.length >= LIMITE_PULOS
                  ? 'Sem pulos'
                  : `Pular (${LIMITE_PULOS - sessao.pulados.length})`
              }
              desabilitado={sessao.pulados.length >= LIMITE_PULOS}
              aoTocar={aoPular}
            />

            <Botao
              estilo={estilos.botaoMetade}
              rotulo={rotuloDoBotao(card, falta)}
              desabilitado={falta}
              aoTocar={() => conferir(resposta)}
            />
          </View>
        </View>
      )}

      {revelado && (
        <PainelFeedback
          // Chave nova a cada card: sem ela a animação de entrada só rodaria
          // na primeira vez.
          key={`${card.id}-${sessao.concluidos}`}
          acertou={acertou}
          dePrimeira={dePrimeira(sessao, card.id)}
          explicacao={card.explicacao}
          respostaCerta={acertou ? undefined : respostaCertaEmTexto(card)}
          xpGanho={xpDoCard(!dePrimeira(sessao, card.id))}
          ultimo={ultimo}
          aoContinuar={continuar}
        />
      )}
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  flex: { flex: 1 },

  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingHorizontal: margemTela,
    paddingTop: topoConteudo
  },
  fechar: { ...tipo.fechar },
  contador: { ...tipo.metricaMono },
  xp: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  xpNumero: { ...tipo.metricaPequena, fontSize: 14 },
  xpRotulo: { ...tipo.rotuloCelula, letterSpacing: 0 },

  contexto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    paddingHorizontal: margemTela,
    paddingTop: 16
  },
  tracinho: { width: 1, height: 11 },

  conteudo: {
    paddingHorizontal: margemTela,
    paddingTop: margemTela,
    // Espaço para o painel de feedback não cobrir o fim do conteúdo.
    paddingBottom: 300
  },
  bloco: { gap: 18 },

  rodape: {
    paddingHorizontal: margemTela,
    paddingTop: espaco.md,
    paddingBottom: 30,
    borderTopWidth: tamanhos.linha
  },
  linhaAcoes: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  botaoMetade: { flex: 1 }
});
