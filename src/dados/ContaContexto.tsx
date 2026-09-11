import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './firebase';
import {
  consumirCadastroPendente,
  excluirConta as excluirContaDoAuth,
  sair as sairDoAuth,
  type User
} from './conta';
import {
  aplicarProgresso,
  gravarPerfil,
  lerPerfil,
  perfilVazio,
  registrarEventoSessao
} from './nuvem';
import { fixarDono } from './progresso';
import { useProgresso } from './ProgressoContexto';
import type { PerfilPublico } from '@/nucleo/perfil';

/**
 * Quem está usando o app.
 *
 * Fica **dentro** do ProvedorProgresso porque ele observa o progresso local: a
 * cada mudança de XP, o perfil público na nuvem é atualizado sozinho. Assim
 * nenhuma tela precisa lembrar de sincronizar nada depois de uma sessão.
 */

type Valor = {
  usuario: User | null;
  perfil: PerfilPublico | null;
  carregando: boolean;
  atualizarPerfil: (campos: Partial<PerfilPublico>) => Promise<void>;
  recarregarPerfil: () => Promise<void>;
  sair: () => Promise<void>;
  excluirConta: () => Promise<void>;
};

const Contexto = createContext<Valor | null>(null);

export function ProvedorConta({ children }: { children: ReactNode }) {
  const {
    progresso,
    carregando: carregandoProgresso,
    recarregar,
    restaurarDaNuvem
  } = useProgresso();

  const [usuario, setUsuario] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Dispara também na primeira carga, depois que o Firebase confere se há
    // sessão salva no AsyncStorage. Até lá o app fica em carregamento — sem
    // isso, quem já entrou veria a tela de login piscar.
    return onAuthStateChanged(auth, async (atual) => {
      setUsuario(atual);

      if (!atual) {
        setPerfil(null);
        setCarregando(false);
        return;
      }

      // Conta diferente da última que usou este aparelho? O progresso local é
      // de outra pessoa e precisa sair da frente.
      const trocou = await fixarDono(atual.uid);
      if (trocou) await recarregar();

      // O nome de um cadastro que acabou de acontecer chega antes do
      // `displayName` do Auth estar pronto — ver o comentário em
      // `consumirCadastroPendente`.
      const existente = await lerPerfil(atual.uid);
      const pendente = existente ? null : consumirCadastroPendente();
      const daNuvem =
        existente ??
        {
          ...perfilVazio(atual.uid, pendente?.nome ?? atual.displayName ?? 'Sem nome'),
          termosAceitosEm: pendente?.termosAceitosEm ?? null
        };

      setPerfil(daNuvem);
      setCarregando(false);
    });
  }, [recarregar]);

  // Sobe o XP para o perfil público sempre que o progresso local muda. A
  // diferença entre o XP local e o já gravado é exatamente o que foi ganho —
  // então uma sincronização que falhou é recuperada na próxima.
  const sincronizando = useRef(false);

  useEffect(() => {
    if (!perfil || carregandoProgresso || sincronizando.current) return;
    if (progresso.xp === perfil.xp && progresso.sequencia === perfil.sequencia) return;

    // O local ficou **atrás** do que a nuvem já tinha — reinstalação, troca de
    // aparelho, ou `fixarDono` (em `dados/progresso.ts`) zerando o banco por
    // ter visto um uid diferente do salvo. Empurrar o zero local por cima do
    // histórico real da nuvem apagaria a diária e o XP de vez; em vez disso,
    // repõe o local a partir dela. Isto é o que faz "salvei a diária, abri de
    // novo e sumiu" não acontecer mais.
    if (progresso.xp < perfil.xp) {
      restaurarDaNuvem({
        xp: perfil.xp,
        sequencia: perfil.sequencia,
        ultimaDiaria: perfil.ultimaDiaria,
        diarias: perfil.diarias,
        cardsRespondidos: perfil.cardsRespondidos,
        cardsAcertados: perfil.cardsAcertados
      });
      return;
    }

    sincronizando.current = true;
    const atualizado = aplicarProgresso(perfil, progresso, progresso.xp - perfil.xp);

    // Cards respondidos só sobem numa sessão de verdade (relâmpago não mexe
    // neste contador) — é o que distingue "uma sessão aconteceu" de "só o XP
    // mudou", sem precisar que nenhuma tela avise explicitamente.
    const totalDaSessao = progresso.cardsRespondidos - perfil.cardsRespondidos;
    if (totalDaSessao > 0) {
      const acertosDaSessao = progresso.cardsAcertados - perfil.cardsAcertados;
      registrarEventoSessao({
        uid: perfil.uid,
        quando: new Date().toISOString(),
        total: totalDaSessao,
        acertos: acertosDaSessao,
        erros: totalDaSessao - acertosDaSessao,
        xpGanho: progresso.xp - perfil.xp
      });
    }

    setPerfil(atualizado);
    gravarPerfil(atualizado).finally(() => {
      sincronizando.current = false;
    });
  }, [progresso, perfil, carregandoProgresso, restaurarDaNuvem]);

  const atualizarPerfil = useCallback(
    async (campos: Partial<PerfilPublico>) => {
      if (!perfil) return;

      const atualizado = { ...perfil, ...campos };
      setPerfil(atualizado);
      await gravarPerfil(atualizado);
    },
    [perfil]
  );

  const recarregarPerfil = useCallback(async () => {
    if (!usuario) return;
    const daNuvem = await lerPerfil(usuario.uid);
    if (daNuvem) setPerfil(daNuvem);
  }, [usuario]);

  const valor = useMemo<Valor>(
    () => ({
      usuario,
      perfil,
      carregando,
      atualizarPerfil,
      recarregarPerfil,
      sair: sairDoAuth,
      excluirConta: excluirContaDoAuth
    }),
    [usuario, perfil, carregando, atualizarPerfil, recarregarPerfil]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useConta(): Valor {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useConta precisa estar dentro de <ProvedorConta>.');
  return contexto;
}
