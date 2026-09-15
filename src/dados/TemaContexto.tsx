import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';

import { aplicarPaletaTema } from '@/tema';
import { fichasTema, temaDoSistema, temaPadrao, temas, type IdTema, type Paleta } from '@/tema/temas';

/**
 * O TEMA TROCÁVEL, de verdade.
 *
 * `tema/index.ts` continua existindo e continua sendo lido por toda tela que
 * ainda não migrou — ele é a paleta pesada estática, sempre igual. Este
 * contexto é para quem já migrou: em vez de `import { cores } from '@/tema'`,
 * a tela chama `useCores()` e lê a paleta corrente, que muda quando a pessoa
 * troca de tema em Configurações.
 *
 * "Seguir o sistema" ignora o tema escolhido manualmente e usa
 * `temaDoSistema(esquema)` — hoje isso só distingue claro (`leve`) de escuro
 * (`pesado`); o tema `medio` só se chega escolhendo à mão.
 *
 * Cada tela migra na sua vez — ver a nota em `tema/temas.ts`. Enquanto uma
 * tela lê `cores` do índice estático, ela fica no tema pesado não importa o
 * que a pessoa escolha aqui; nada quebra, ela só não muda de cor ainda.
 */

const CHAVE_TEMA = 'devquest:tema:escolhido:v1';
const CHAVE_SEGUIR_SISTEMA = 'devquest:tema:seguir-sistema:v1';

type Valor = {
  idTema: IdTema;
  cores: Paleta;
  seguirSistema: boolean;
  definirTema: (id: IdTema) => void;
  definirSeguirSistema: (valor: boolean) => void;
};

const Contexto = createContext<Valor | null>(null);

function idTemaValido(valor: string | null): valor is IdTema {
  return valor === 'leve' || valor === 'medio' || valor === 'pesado';
}

export function ProvedorTema({ children }: { children: ReactNode }) {
  const esquemaSistema = useColorScheme();
  const [idEscolhido, setIdEscolhido] = useState<IdTema>(temaPadrao);
  const [seguirSistema, setSeguirSistema] = useState(false);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    let vivo = true;

    Promise.all([
      AsyncStorage.getItem(CHAVE_TEMA),
      AsyncStorage.getItem(CHAVE_SEGUIR_SISTEMA)
    ]).then(([temaSalvo, seguirSalvo]) => {
      if (!vivo) return;
      if (idTemaValido(temaSalvo)) setIdEscolhido(temaSalvo);
      if (seguirSalvo != null) setSeguirSistema(seguirSalvo === 'sim');
      setCarregado(true);
    });

    return () => {
      vivo = false;
    };
  }, []);

  const idTema = seguirSistema ? temaDoSistema(esquemaSistema) : idEscolhido;
  const cores = temas[idTema];

  useEffect(() => {
    aplicarPaletaTema(cores);
  }, [cores]);

  // Some no primeiro quadro se o SystemUI ainda não confirmou o fundo salvo —
  // por isso só aplica depois que a leitura do AsyncStorage termina.
  useEffect(() => {
    if (!carregado) return;
    SystemUI.setBackgroundColorAsync(cores.fundo);
  }, [carregado, cores.fundo]);

  const definirTema = useCallback((id: IdTema) => {
    setIdEscolhido(id);
    AsyncStorage.setItem(CHAVE_TEMA, id);
  }, []);

  const definirSeguirSistema = useCallback((valor: boolean) => {
    setSeguirSistema(valor);
    AsyncStorage.setItem(CHAVE_SEGUIR_SISTEMA, valor ? 'sim' : 'nao');
  }, []);

  const valor = useMemo<Valor>(
    () => ({ idTema, cores, seguirSistema, definirTema, definirSeguirSistema }),
    [idTema, cores, seguirSistema, definirTema, definirSeguirSistema]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useTema(): Valor {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useTema precisa estar dentro de <ProvedorTema>.');
  return contexto;
}

/** Atalho para quem só precisa da paleta corrente. */
export const useCores = (): Paleta => useTema().cores;

export { fichasTema };
