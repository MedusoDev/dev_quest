import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { hoje } from '@/nucleo/datas';

/**
 * NOTIFICAÇÃO — um interruptor só, em Configurações.
 *
 * Desligado por padrão. Ligando, o aparelho passa a repetir "sua diária está
 * esperando" a cada `INTERVALO_HORAS`, começando dali — nada disto passa pelo
 * Firebase, é `expo-notifications` agendando na fila local do aparelho.
 *
 * A régua é o dia: assim que a diária fecha, `sincronizarLembreteDiario`
 * cancela o que estava rodando, e nada mais chega até virar o dia. Quando vira
 * o dia e a diária de hoje ainda não foi feita, ela agenda de novo — por isso
 * essa função precisa ser chamada sempre que `fezDiariaHoje` mudar de valor
 * (ver o efeito em `ProgressoContexto.tsx`), e não só no toque do interruptor.
 *
 * Sem notificação de liga: ela nunca teve o mesmo peso da diária, e um
 * segundo lembrete rodando por trás só complicava sem ajudar ninguém a lembrar
 * do que importa.
 */

const CHAVE_ATIVADO = 'ouroboros:notificacoes:ativado:v2';
const CHAVE_ID = 'ouroboros:notificacoes:id:v2';
/** Que dia (ISO) o lembrete corrente foi agendado para — evita reagendar de novo no mesmo dia. */
const CHAVE_DIA_AGENDADO = 'ouroboros:notificacoes:dia-agendado:v2';

const INTERVALO_HORAS = 2;
const TITULO = 'Sua diária está esperando';
const CORPO = 'Ainda não fechou o ciclo de hoje.';

/** Lê se a pessoa ligou as notificações — `false` por padrão, para quem nunca tocou no interruptor. */
export async function lerNotificacoesAtivadas(): Promise<boolean> {
  const salvo = await AsyncStorage.getItem(CHAVE_ATIVADO);
  return salvo === 'sim';
}

async function cancelarLembreteAtual(): Promise<void> {
  const idAtual = await AsyncStorage.getItem(CHAVE_ID);
  if (idAtual) await Notifications.cancelScheduledNotificationAsync(idAtual).catch(() => {});
  await AsyncStorage.removeItem(CHAVE_ID);
  await AsyncStorage.removeItem(CHAVE_DIA_AGENDADO);
}

async function agendarLembreteRecorrente(): Promise<void> {
  await cancelarLembreteAtual();

  const id = await Notifications.scheduleNotificationAsync({
    content: { title: TITULO, body: CORPO },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: INTERVALO_HORAS * 60 * 60,
      repeats: true
    }
  });

  await AsyncStorage.setItem(CHAVE_ID, id);
  await AsyncStorage.setItem(CHAVE_DIA_AGENDADO, hoje());
}

/**
 * Liga ou desliga a notificação de verdade.
 *
 * Desligar cancela o que estava agendado e persiste o estado — sempre dá
 * certo. Ligar pede permissão na primeira vez; se o sistema negar, o estado
 * persistido volta a `false` e a função devolve `false`, para a tela desfazer
 * o interruptor em vez de fingir que ligou. Só agenda de imediato se a diária
 * de hoje ainda não foi feita — feita, não tem por que já começar tocando.
 */
export async function definirNotificacoes(ligado: boolean, fezDiariaHoje: boolean): Promise<boolean> {
  if (!ligado) {
    await cancelarLembreteAtual();
    await AsyncStorage.setItem(CHAVE_ATIVADO, 'nao');
    return false;
  }

  const permissaoAtual = await Notifications.getPermissionsAsync();
  let concedida = permissaoAtual.granted;
  if (!concedida) {
    const pedido = await Notifications.requestPermissionsAsync();
    concedida = pedido.granted;
  }

  if (!concedida) {
    await AsyncStorage.setItem(CHAVE_ATIVADO, 'nao');
    return false;
  }

  await AsyncStorage.setItem(CHAVE_ATIVADO, 'sim');
  if (!fezDiariaHoje) await agendarLembreteRecorrente();
  return true;
}

/**
 * Mantém o lembrete coerente com o dia. Chamado sempre que `fezDiariaHoje`
 * mudar (ver o efeito em `ProgressoContexto.tsx`): fecha a diária e ele
 * cancela o que sobrou de hoje; vira o dia sem a diária feita e ele agenda de
 * novo. Não faz nada se a pessoa nunca ligou o interruptor.
 */
export async function sincronizarLembreteDiario(fezDiariaHoje: boolean): Promise<void> {
  const ativado = await lerNotificacoesAtivadas();
  if (!ativado) return;

  if (fezDiariaHoje) {
    await cancelarLembreteAtual();
    return;
  }

  const diaAgendado = await AsyncStorage.getItem(CHAVE_DIA_AGENDADO);
  if (diaAgendado === hoje()) return;

  await agendarLembreteRecorrente();
}

/** Canal padrão no Android — sem ele, o SO agenda com importância mínima e a notificação não soa. */
export async function prepararCanalDeLembretes(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('lembretes', {
    name: 'Lembretes',
    importance: Notifications.AndroidImportance.DEFAULT
  });
}

/** Como a notificação se comporta com o app aberto — chamado uma vez, no `_layout.tsx`. */
export function configurarComportamentoDeNotificacao(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false
    })
  });
}
