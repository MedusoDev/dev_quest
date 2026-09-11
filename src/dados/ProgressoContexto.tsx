import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

import { hoje } from '@/nucleo/datas';
import {
  calcularSequencia,
  conquistasNovas,
  FATOR_REPETICAO,
  progressoInicial,
  registrarDia,
  type Conquista,
  type Progresso
} from '@/nucleo/gamificacao';
import { agendar, type Revisao } from '@/nucleo/revisao';
import { licoesCompletadas } from '@/nucleo/diaria';
import type { Resultado, Sessao } from '@/nucleo/sessao';
import { sincronizarLembreteDiario } from './lembretes';
import {
  gravarLicoesConcluidas,
  gravarProgresso,
  gravarRevisoes,
  lerLicoesConcluidas,
  lerProgresso,
  lerRevisoes
} from './progresso';

/**
 * O estado do app inteiro num lugar só.
 *
 * As telas leem daqui e chamam `registrarSessao` no fim de uma sessão. Nenhuma
 * tela fala com o banco diretamente — assim, quando um dia existir sincronização
 * com a nuvem, é este arquivo que muda, e nenhuma tela.
 */

/** Os campos que a nuvem espelha — ver `restaurarDaNuvem` abaixo. */
type CamposDaNuvem = Pick<
  Progresso,
  'xp' | 'sequencia' | 'ultimaDiaria' | 'diarias' | 'cardsRespondidos' | 'cardsAcertados'
>;

export type FechoDeSessao = {
  xpGanho: number;
  sequencia: number;
  congelamentoGasto: boolean;
  repetindo: boolean;
  conquistas: Conquista[];
  /** Lições que fecharam sozinhas por terem tido todos os cards vistos. */
  licoesFechadas: string[];
};

type Valor = {
  progresso: Progresso;
  revisoes: Map<string, Revisao>;
  licoesConcluidas: Set<string>;
  carregando: boolean;
  fezDiariaHoje: boolean;
  recarregar: () => Promise<void>;
  definirMeta: (minutos: number) => void;
  restaurarDaNuvem: (campos: CamposDaNuvem) => void;
  dispensarSugestaoNivel: (totalAtual: number) => void;
  registrarSessao: (entrada: {
    sessao: Sessao;
    resultado: Resultado;
    licaoId?: string | null;
    contaComoDiaria?: boolean;
  }) => Promise<FechoDeSessao>;
  registrarRelampago: (
    acertos: number,
    respostas: number
  ) => Promise<{ recorde: boolean; conquistas: Conquista[] }>;
};

const Contexto = createContext<Valor | null>(null);

export function ProvedorProgresso({ children }: { children: ReactNode }) {
  const [progresso, setProgresso] = useState<Progresso>(progressoInicial);
  const [revisoes, setRevisoes] = useState<Map<string, Revisao>>(() => new Map());
  const [licoesConcluidas, setLicoesConcluidas] = useState<Set<string>>(() => new Set());
  const [carregando, setCarregando] = useState(true);

  /**
   * Lê tudo do SQLite. Também é chamado de fora quando o dono do aparelho
   * muda — aí o banco foi zerado e o estado em memória está desatualizado.
   */
  const recarregar = useCallback(async () => {
    const [p, r, l] = await Promise.all([lerProgresso(), lerRevisoes(), lerLicoesConcluidas()]);

    setProgresso(p);
    setRevisoes(r);
    setLicoesConcluidas(l);
    setCarregando(false);
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const fezDiariaHoje = progresso.ultimaDiaria === hoje();

  // Mantém o lembrete de notificação coerente com o dia — ver o comentário em
  // `dados/lembretes.ts`. Só depois de carregar: antes disso `progresso` ainda
  // é o `progressoInicial` de placeholder, e cancelaria um lembrete de verdade
  // por engano.
  useEffect(() => {
    if (carregando) return;
    sincronizarLembreteDiario(fezDiariaHoje);
  }, [carregando, fezDiariaHoje]);

  const definirMeta = useCallback((minutos: number) => {
    setProgresso((atual) => {
      const novo = { ...atual, metaDiariaMin: minutos };
      gravarProgresso(novo);
      return novo;
    });
  }, []);

  /**
   * Repõe os campos que a nuvem espelha, quando o local fica **atrás** dela —
   * reinstalação, troca de aparelho, ou `fixarDono` zerando o banco por ter
   * visto um uid diferente do salvo. Sem isto, a sincronização em
   * `ContaContexto` empurraria o zero local por cima do histórico real que só
   * sobrevivia na nuvem, apagando a diária e o XP de vez. Ver o comentário no
   * efeito de sincronização lá.
   */
  const restaurarDaNuvem = useCallback((campos: CamposDaNuvem) => {
    setProgresso((atual) => {
      const restaurado = { ...atual, ...campos };
      gravarProgresso(restaurado);
      return restaurado;
    });
  }, []);

  /**
   * Marca que a pessoa recusou a sugestão de subir de nível agora — guarda o
   * `total` de médio/difícil vistos naquele momento, pra `sugestaoDeNivel` só
   * voltar a insistir depois de mais `AMOSTRA_MINIMA_NIVEL` cards.
   */
  const dispensarSugestaoNivel = useCallback((totalAtual: number) => {
    setProgresso((atual) => {
      const novo = { ...atual, sugestaoNivelRecusadaEm: totalAtual };
      gravarProgresso(novo);
      return novo;
    });
  }, []);

  /**
   * Fecha uma sessão: reagenda os cards, soma XP, mexe na sequência e confere
   * conquistas. Devolve o que a tela de resumo precisa anunciar.
   */
  const registrarSessao = useCallback<Valor['registrarSessao']>(
    async ({ sessao, resultado, licaoId = null, contaComoDiaria = true }) => {
      const novasRevisoes = new Map<string, Revisao>();

      for (const card of sessao.cards) {
        // Pulado nunca foi respondido — não há o que agendar.
        if (sessao.pulados.includes(card.id)) continue;
        const acertouDePrimeira = !sessao.estados[card.id]!.errouAntes;
        novasRevisoes.set(card.id, agendar(revisoes.get(card.id), acertouDePrimeira));
      }

      const revisoesMescladas = new Map([...revisoes, ...novasRevisoes]);

      // Refazer lição concluída continua valendo revisão, mas paga menos XP.
      const repetindo = Boolean(licaoId) && licoesConcluidas.has(licaoId!);
      const xpGanho = repetindo
        ? Math.round(resultado.xpTotal * FATOR_REPETICAO)
        : resultado.xpTotal;

      // Quem estuda só pela diária nunca abre a lição na trilha. Sem marcar a
      // conclusão aqui, a trilha ficaria travada no primeiro degrau para sempre.
      const concluidas = new Set([
        ...licoesConcluidas,
        ...licoesCompletadas(revisoesMescladas, licoesConcluidas)
      ]);
      if (licaoId) concluidas.add(licaoId);

      const sequencia = contaComoDiaria
        ? calcularSequencia(progresso)
        : {
            sequencia: progresso.sequencia,
            ultimaDiaria: progresso.ultimaDiaria,
            congelamentos: progresso.congelamentos,
            mesCongelamentos: progresso.mesCongelamentos,
            congelamentoGasto: false
          };

      const { congelamentoGasto, ...camposSequencia } = sequencia;

      const parcial: Progresso = {
        ...progresso,
        ...camposSequencia,
        xp: progresso.xp + xpGanho,
        historico: contaComoDiaria ? registrarDia(progresso.historico) : progresso.historico,
        diarias: progresso.diarias + (contaComoDiaria ? 1 : 0),
        // A taxa de acerto do perfil sai daqui. Conta o acerto **de primeira**:
        // acertar na segunda tentativa é o card voltando da fila, e contar isso
        // como acerto faria a taxa subir para 100% em qualquer sessão longa.
        cardsRespondidos: progresso.cardsRespondidos + resultado.total,
        cardsAcertados: progresso.cardsAcertados + resultado.acertosDePrimeira,
        escritaAcertos: progresso.escritaAcertos + resultado.escritaAcertos,
        licoesPerfeitas:
          progresso.licoesPerfeitas + (licaoId && resultado.semErro && !repetindo ? 1 : 0)
      };

      const desbloqueadas = conquistasNovas(parcial);
      const atualizado: Progresso = {
        ...parcial,
        conquistas: [...progresso.conquistas, ...desbloqueadas.map((c) => c.id)]
      };

      const fechadas = [...concluidas].filter((id) => !licoesConcluidas.has(id));

      setProgresso(atualizado);
      setRevisoes(revisoesMescladas);
      setLicoesConcluidas(concluidas);

      await Promise.all([
        gravarProgresso(atualizado),
        gravarRevisoes(novasRevisoes),
        gravarLicoesConcluidas(fechadas, hoje())
      ]);

      return {
        xpGanho,
        sequencia: camposSequencia.sequencia,
        congelamentoGasto,
        repetindo,
        conquistas: desbloqueadas,
        licoesFechadas: fechadas.filter((id) => id !== licaoId)
      };
    },
    [progresso, revisoes, licoesConcluidas]
  );

  /**
   * Fecha uma partida de relâmpago.
   *
   * A partida sempre entra nos totais — é deles que saem a média e a taxa de
   * acerto da tela. Só o recorde é condicional. Antes, uma partida ruim não
   * gravava nada, e a média que a tela agora mostra ficaria enviesada para
   * cima justamente pelos dias em que a pessoa foi mal.
   */
  const registrarRelampago = useCallback<Valor['registrarRelampago']>(
    async (acertos, respostas) => {
      const recorde = acertos > progresso.recordeRelampago;

      const parcial: Progresso = {
        ...progresso,
        recordeRelampago: Math.max(progresso.recordeRelampago, acertos),
        relampagoPartidas: progresso.relampagoPartidas + 1,
        relampagoAcertos: progresso.relampagoAcertos + acertos,
        relampagoRespostas: progresso.relampagoRespostas + respostas
      };

      const desbloqueadas = conquistasNovas(parcial);
      const atualizado: Progresso = {
        ...parcial,
        conquistas: [...progresso.conquistas, ...desbloqueadas.map((c) => c.id)]
      };

      setProgresso(atualizado);
      await gravarProgresso(atualizado);

      return { recorde, conquistas: desbloqueadas };
    },
    [progresso]
  );

  const valor = useMemo<Valor>(
    () => ({
      progresso,
      revisoes,
      licoesConcluidas,
      carregando,
      fezDiariaHoje,
      recarregar,
      definirMeta,
      restaurarDaNuvem,
      dispensarSugestaoNivel,
      registrarSessao,
      registrarRelampago
    }),
    [
      progresso,
      revisoes,
      licoesConcluidas,
      carregando,
      fezDiariaHoje,
      recarregar,
      definirMeta,
      restaurarDaNuvem,
      dispensarSugestaoNivel,
      registrarSessao,
      registrarRelampago
    ]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useProgresso(): Valor {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useProgresso precisa estar dentro de <ProvedorProgresso>.');
  return contexto;
}
