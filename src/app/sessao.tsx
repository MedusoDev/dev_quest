import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { espaco, margemTela } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { useConta } from '@/dados/ContaContexto';
import { useProgresso, type FechoDeSessao } from '@/dados/ProgressoContexto';
import { linguagens, type LinguagemId } from '@/nucleo/conteudo';
import { hoje, somarDias } from '@/nucleo/datas';
import { montarDiaria, revisoesEm } from '@/nucleo/diaria';
import { foiVisto } from '@/nucleo/revisao';
import { metaPara } from '@/nucleo/gamificacao';
import type { Resultado, Sessao as EstadoSessao } from '@/nucleo/sessao';
import { Conceito } from '@/componentes/Conceito';
import { Resumo } from '@/componentes/Resumo';
import { Sessao } from '@/componentes/Sessao';
import { Vazio } from '@/componentes/basicos';
import { Botao } from '@/componentes/Botao';

/**
 * A SESSÃO DIÁRIA.
 *
 * Conteúdo novo misturado com o que o ciclo mandou revisar hoje. A pessoa não
 * escolhe nada — abre e faz.
 *
 * Três fases: conceito das lições novas, os cards, e o resumo. A tela cobre a
 * barra de abas por inteiro: enquanto a sessão está aberta não existe "ir para
 * outro canto".
 */
export default function TelaSessao() {
  const cores = useCores();
  const router = useRouter();
  const { linguagem } = useLocalSearchParams<{ linguagem?: string }>();
  const { perfil } = useConta();
  const {
    progresso,
    revisoes,
    licoesConcluidas,
    fezDiariaHoje,
    registrarSessao
  } = useProgresso();

  const meta = metaPara(progresso.metaDiariaMin);

  // Uma linguagem só, se veio pela rota (`/sessao?linguagem=csharp`, a diária
  // por linguagem escolhida na tela Hoje). Sem isso, o foco do perfil — e sem
  // foco nenhum escolhido, todas, como sempre foi.
  const linguagensDaSessao: LinguagemId[] = linguagem
    ? [linguagem as LinguagemId]
    : perfil?.foco.length
      ? perfil.foco
      : linguagens.map((l) => l.id);

  // A primeira diária do dia é a que conta para a sequência; feita essa, as
  // demais (de outra linguagem do foco, por exemplo) continuam dando XP mas
  // não dobram a sequência nem o contador de diárias. Fixado no início da
  // sessão: `fezDiariaHoje` não muda de novo antes de `aoTerminar`.
  const [contaComoDiaria] = useState(() => !fezDiariaHoje);

  // Sorteada uma vez só: sem o `useMemo`, qualquer re-renderização remontaria
  // a fila no meio da sessão.
  const { cards, apresentar } = useMemo(
    () =>
      montarDiaria({
        revisoes,
        concluidas: licoesConcluidas,
        linguagens: linguagensDaSessao,
        meta: meta.cards,
        nivel: perfil?.nivel ?? null
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sorteada uma vez só, de propósito
    []
  );

  const [conceitoAtual, setConceitoAtual] = useState(0);
  const [fim, setFim] = useState<{ resultado: Resultado; fecho: FechoDeSessao } | null>(null);

  async function aoTerminar(sessao: EstadoSessao, resultado: Resultado) {
    const fecho = await registrarSessao({ sessao, resultado, contaComoDiaria });
    setFim({ resultado, fecho });
  }

  if (cards.length === 0) {
    return (
      <View style={[estilos.centro, { backgroundColor: cores.fundo }]}>
        <Vazio
          titulo="Nada para hoje"
          texto="Você já viu todos os cards que existem e não há revisão vencida. O ciclo vai trazê-los de volta nos próximos dias."
        >
          <Botao rotulo="Voltar" variante="secundario" aoTocar={() => router.back()} />
        </Vazio>
      </View>
    );
  }

  if (fim) {
    return (
      <Resumo
        resultado={fim.resultado}
        fecho={fim.fecho}
        xpTotal={progresso.xp}
        voltamAmanha={revisoesEm(revisoes, somarDias(hoje(), 1))}
        aoConcluir={() => router.replace('/')}
      />
    );
  }

  // Assunto novo entrou na diária: explica antes de cobrar.
  if (conceitoAtual < apresentar.length) {
    const licao = apresentar[conceitoAtual]!;
    const ultimo = conceitoAtual === apresentar.length - 1;

    return (
      <Conceito
        licao={licao}
        passo={
          apresentar.length > 1
            ? `assunto novo · ${conceitoAtual + 1} de ${apresentar.length}`
            : 'assunto novo'
        }
        rotuloBotao={ultimo ? `Começar os ${cards.length} cards` : 'Próximo assunto'}
        aoContinuar={() => setConceitoAtual((i) => i + 1)}
      />
    );
  }

  return (
    <Sessao
      cards={cards}
      // Card já visto antes é revisão: é o único lugar em que o ciclo Ouroboros
      // aparece na cara da pessoa, na linha de contexto do exercício.
      ehRevisao={(card) => foiVisto(revisoes.get(card.id))}
      aoTerminar={aoTerminar}
      aoSair={() => router.back()}
    />
  );
}

const estilos = {
  centro: {
    flex: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: margemTela,
    paddingVertical: espaco.xl
  }
};
