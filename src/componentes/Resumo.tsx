import { useEffect, useMemo, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';

import { animacao, espaco, margemTela, raio, tipo, topoConteudo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { comoTexto, obterLicao } from '@/nucleo/conteudo';
import { RANKS, rankPara } from '@/nucleo/gamificacao';
import type { Resultado } from '@/nucleo/sessao';
import type { FechoDeSessao } from '@/dados/ProgressoContexto';
import { BlocoCodigo } from './BlocoCodigo';
import { Botao } from './Botao';
import { Regua, ReguaMetrica, Rotulo, TextoRico } from './basicos';
import { useMovimentoReduzido, usePop, useQueda } from './movimento';
import { Lightning, Trophy, LockOpen } from 'phosphor-react-native';
import { BalaoFala } from './BalaoFala';
import { CORES_NIVEL, Devzinho, nivelDoRank, type ExpressaoDevzinho } from './Devzinho';

/**
 * FIM DE SESSÃO.
 *
 * O XP em corpo 96 é o herói da tela e entra com um *pop* — é a recompensa, e
 * ela precisa chegar antes de qualquer leitura. Logo abaixo, quatro réguas
 * dizem o resto em uma linha cada.
 *
 * O Devzinho comemora junto — a expressão e a fala dele seguem a taxa de
 * acerto, e se a sessão fez a pessoa **subir de nível**, ele aparece já
 * evoluído (aura nova, óculos, coroa...) num cartão próprio.
 *
 * O confete roda **uma vez**. Em laço ele viraria papel de parede e a pessoa
 * pararia de olhar o número que ele estava comemorando.
 *
 * ── O QUE NÃO É DECORAÇÃO ─────────────────────────────────────────────────
 *
 * A lista do que foi errado, com a explicação junto, continua no fim da tela. É
 * a última chance de o conceito colar antes de o card sumir na fila de revisão
 * — sem ela a sessão termina em número, não em aprendizado.
 */

type Props = {
  resultado: Resultado;
  fecho: FechoDeSessao | null;
  /** XP total do perfil depois desta sessão, para a régua do rank. */
  xpTotal: number;
  /** Quantos cards voltam amanhã. Sai do agendamento, não de um palpite. */
  voltamAmanha: number;
  aoConcluir: () => void;
  rotuloBotao?: string;
};

export function Resumo({
  resultado,
  fecho,
  xpTotal,
  voltamAmanha,
  aoConcluir,
  rotuloBotao = 'Fechar o ciclo'
}: Props) {
  const cores = useCores();
  const reduzido = useMovimentoReduzido();

  const xpGanho = fecho?.xpGanho ?? resultado.xpTotal;
  const xpNaTela = useContagem(xpGanho);
  const pop = usePop(true, animacao.popResumo, reduzido);

  const rank = rankPara(xpTotal);
  const rankAntes = rankPara(Math.max(0, xpTotal - xpGanho));
  const nivel = nivelDoRank(RANKS.findIndex((r) => r.nome === rank.atual.nome));
  const subiuDeNivel = rankAntes.atual.nome !== rank.atual.nome;
  const taxa = resultado.total > 0 ? resultado.acertosDePrimeira / resultado.total : 0;
  const humor = humorDaSessao(taxa);
  const fechadas = (fecho?.licoesFechadas ?? []).map(obterLicao).filter(Boolean);

  return (
    <View style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <Confete ativo={!reduzido} />

      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        {/* ── o Devzinho comemora ─────────────────────────────── */}
        <View style={estilos.festa}>
          <Devzinho
            tamanho={128}
            expressao={humor.expressao}
            item="varinha"
            nivel={nivel}
            reacao={humor.pula && !reduzido ? { tipo: 'pulo', chave: 'resumo' } : null}
          />
          <BalaoFala texto={humor.fala} ponta="esquerda" estilo={estilos.festaBalao} />
        </View>

        <Rotulo cor={cores.acento}>sessão fechada</Rotulo>

        <View style={estilos.heroi}>
          <Lightning size={54} weight="fill" color={cores.ouro} style={estilos.raio} />
          <Animated.Text style={[estilos.xp, { color: cores.ouro }, pop]}>{`+${xpNaTela}`}</Animated.Text>
          <Text style={[estilos.unidade, { color: cores.acentoTexto }]}>XP</Text>
        </View>

        {subiuDeNivel && (
          <View
            style={[
              estilos.nivelNovo,
              { borderColor: CORES_NIVEL[nivel], backgroundColor: cores.superficie }
            ]}
          >
            <Devzinho tamanho={70} nivel={nivel} expressao="animado" item="notebook" />
            <View style={estilos.flex}>
              <Text style={[estilos.desbloqueioRotulo, { color: CORES_NIVEL[nivel] }]}>
                {`SUBIU PARA O NÍVEL ${nivel}`}
              </Text>
              <Text style={[estilos.desbloqueioTitulo, { color: cores.textoForte }]}>{rank.atual.nome}</Text>
              <Text style={[estilos.desbloqueioNota, { color: cores.acentoTexto }]}>
                O Devzinho evoluiu com você!
              </Text>
            </View>
          </View>
        )}

        <View style={estilos.reguas}>
          <ReguaMetrica
            rotulo="acertos"
            valor={`${resultado.acertosDePrimeira} de ${resultado.total}`}
            corValor={cores.acento}
          />
          {fecho && (
            <ReguaMetrica
              rotulo="sequência"
              valor={`${fecho.sequencia} dia${fecho.sequencia === 1 ? '' : 's'}`}
            />
          )}
          <ReguaMetrica rotulo="voltam amanhã" valor={`${voltamAmanha} cards`} />
          <ReguaMetrica
            rotulo="rank"
            valor={rank.proximo ? `${xpTotal} / ${rank.proximo.xp}` : rank.atual.nome}
            ultima
          />
        </View>

        {fecho?.congelamentoGasto && (
          <Text style={[estilos.nota, { color: cores.legenda }]}>
            um congelamento salvou a sequência de ontem
          </Text>
        )}
        {fecho?.repetindo && (
          <Text style={[estilos.nota, { color: cores.legenda }]}>
            lição repetida: o XP vale um quarto — a revisão conta igual
          </Text>
        )}

        {/* ── o que abriu ───────────────────────────────────────── */}
        {fechadas.map((licao) => (
          <View
            key={licao!.id}
            style={[
              estilos.desbloqueio,
              { borderColor: cores.acento, backgroundColor: cores.acentoFundo }
            ]}
          >
            <View style={estilos.linhaRotulo}>
              <LockOpen size={14} weight="bold" color={cores.acento} />
              <Text style={[estilos.desbloqueioRotulo, { color: cores.acento }]}>DESBLOQUEOU</Text>
            </View>
            <Text style={[estilos.desbloqueioTitulo, { color: cores.textoForte }]}>{licao!.titulo}</Text>
            <Text style={[estilos.desbloqueioNota, { color: cores.acentoTexto }]}>{licao!.resumo}</Text>
          </View>
        ))}

        {fecho?.conquistas.map((c) => (
          <View
            key={c.id}
            style={[
              estilos.desbloqueio,
              { borderColor: cores.ouro, backgroundColor: cores.ouroFundo }
            ]}
          >
            <View style={estilos.linhaRotulo}>
              <Trophy size={14} weight="fill" color={cores.ouro} />
              <Text style={[estilos.desbloqueioRotulo, { color: cores.ouro }]}>CONQUISTA</Text>
            </View>
            <Text style={[estilos.desbloqueioTitulo, { color: cores.textoForte }]}>{c.nome}</Text>
            <Text style={[estilos.desbloqueioNota, { color: cores.acentoTexto }]}>{c.descricao}</Text>
          </View>
        ))}

        {/* ── o que voltou pra fila ─────────────────────────────── */}
        {resultado.errados.length > 0 && (
          <View style={estilos.errados}>
            <Rotulo>o que voltou pra fila</Rotulo>
            <Text style={[estilos.nota, { color: cores.legenda }]}>
              estes voltam antes dos outros — errar é o que coloca um card no início do ciclo
            </Text>

            {resultado.errados.map((card) => (
              <View key={card.id} style={estilos.errado}>
                <Regua />
                <TextoRico
                  texto={card.enunciado}
                  estilo={estilos.erradoEnunciado}
                  cor={cores.textoForte}
                />
                {card.codigo && (
                  <BlocoCodigo codigo={comoTexto(card.codigo)} linguagem={card.linguagem} />
                )}
                <TextoRico
                  texto={card.explicacao}
                  estilo={tipo.corpoMenor}
                  cor={cores.textoFraco}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={estilos.rodape}>
        <Botao rotulo={rotuloBotao} aoTocar={aoConcluir} />
      </View>
    </View>
  );
}

/** A cara e a fala do Devzinho no fim da sessão, pela taxa de acerto de primeira. */
function humorDaSessao(taxa: number): { expressao: ExpressaoDevzinho; fala: string; pula: boolean } {
  if (taxa >= 0.9) return { expressao: 'animado', fala: 'Que sessão! Você tá voando!', pula: true };
  if (taxa >= 0.7) return { expressao: 'feliz', fala: 'Mandou muito bem! Bora manter o ritmo.', pula: true };
  if (taxa >= 0.4)
    return { expressao: 'determinado', fala: 'Boa! O que errou volta logo pra fixar.', pula: false };
  return { expressao: 'determinado', fala: 'Errar faz parte. Amanhã esses cards voltam e você pega!', pula: false };
}

/** Faz o XP subir na tela em vez de simplesmente aparecer: 22 passos de 40 ms. */
function useContagem(alvo: number) {
  const [valor, setValor] = useState(0);

  useEffect(() => {
    if (alvo <= 0) return setValor(alvo);

    let passo = 0;
    const relogio = setInterval(() => {
      passo += 1;
      setValor(Math.round((alvo * passo) / 22));
      if (passo >= 22) clearInterval(relogio);
    }, 40);

    return () => clearInterval(relogio);
  }, [alvo]);

  return valor;
}

/* ─────────────────────────── o confete ─────────────────────────── */

const PECAS = 26;

function Confete({ ativo }: { ativo: boolean }) {
  const cores = useCores();
  const coresConfete = [cores.acento, cores.ouro, cores.acentoSecundario, cores.textoForte, cores.ok];

  // Sorteado uma vez: sem o `useMemo`, cada re-renderização daria posições
  // novas e o confete pularia pela tela em vez de cair.
  const pecas = useMemo(
    () =>
      Array.from({ length: PECAS }, (_, indice) => ({
        indice,
        esquerda: Math.random() * 100,
        largura: 3 + Math.random() * 4,
        altura: 8 + Math.random() * 9,
        duracao:
          animacao.confeteMin + Math.random() * (animacao.confeteMax - animacao.confeteMin),
        atraso: Math.random() * animacao.confeteAtraso
      })),
    []
  );

  if (!ativo) return null;

  return (
    <View pointerEvents="none" style={estilos.confete}>
      {pecas.map((peca) => (
        <Peca key={peca.indice} {...peca} cor={coresConfete[peca.indice % coresConfete.length]!} />
      ))}
    </View>
  );
}

function Peca({
  esquerda,
  largura,
  altura,
  cor,
  duracao,
  atraso
}: {
  esquerda: number;
  largura: number;
  altura: number;
  cor: string;
  duracao: number;
  atraso: number;
}) {
  const queda = useQueda(duracao, atraso);

  return (
    <Animated.View
      style={[
        estilos.peca,
        { left: `${esquerda}%`, width: largura, height: altura, backgroundColor: cor },
        queda
      ]}
    />
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    paddingHorizontal: margemTela,
    paddingTop: topoConteudo,
    paddingBottom: espaco.xl
  },

  confete: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', zIndex: 1 },
  peca: { position: 'absolute', top: 0 },

  flex: { flex: 1 },
  festa: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: espaco.lg },
  festaBalao: { flex: 1 },
  raio: { marginBottom: 12 },
  linhaRotulo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nivelNovo: {
    marginTop: espaco.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    borderWidth: 2,
    borderRadius: raio.lg
  },
  heroi: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 12 },
  xp: { ...tipo.heroiXp },
  unidade: { ...tipo.monoForte, fontFamily: tipo.codigo.fontFamily, paddingBottom: espaco.md },

  reguas: { marginTop: 24 },
  nota: { ...tipo.notaMonoMenor, marginTop: espaco.md },

  desbloqueio: {
    marginTop: margemTela,
    borderWidth: 1.5,
    borderRadius: raio.lg,
    paddingVertical: 16,
    paddingHorizontal: 18
  },
  desbloqueioRotulo: { ...tipo.rotuloCelula, letterSpacing: 1.6 },
  desbloqueioTitulo: { ...tipo.tituloLinha, marginTop: 8 },
  desbloqueioNota: { ...tipo.notaMonoCurta, marginTop: 5 },

  errados: { marginTop: espaco.xxl },
  errado: { marginTop: espaco.lg, gap: espaco.md },
  erradoEnunciado: { ...tipo.tituloItemMenor, marginTop: espaco.md },

  rodape: { paddingHorizontal: margemTela, paddingBottom: 30, paddingTop: espaco.md }
});
