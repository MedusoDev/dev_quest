/**
 * Conexão com o Firebase.
 *
 * Reaproveita o projeto `call-of-ouroboros`, o mesmo do site. Auth compartilhada
 * é uma vantagem — um dia a mesma conta serve nos dois — e as coleções do app
 * ficam separadas (`perfis`, `ligas`), sem encostar no que o site grava.
 *
 * A `apiKey` é pública por design no Firebase: ela identifica o projeto, não
 * autoriza nada. A proteção real vem das Security Rules em
 * `docs/firestore.rules`.
 */

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
// O pacote `firebase/auth` não republica a condição `react-native` do seu
// `exports` — o Metro cai na build de browser, que não tem
// `getReactNativePersistence`, e a sessão nunca é salva. `@firebase/auth` (a
// dependência real por trás de `firebase/auth`) declara essa condição
// corretamente, então a persistência tem que vir de lá.
// @ts-expect-error — a chave "types" do exports de `@firebase/auth` aponta
// para a declaração genérica antes de chegar na condição "react-native", que
// é onde `getReactNativePersistence` de fato existe. O valor em runtime está
// correto; só a tipagem publicada não enxerga.
import { getReactNativePersistence } from '@firebase/auth';

const config = {
  apiKey: 'AIzaSyC235l3FG9pjzEj76dhMlRouPdEB-rF7xo',
  authDomain: 'call-of-ouroboros.firebaseapp.com',
  projectId: 'call-of-ouroboros',
  storageBucket: 'call-of-ouroboros.firebasestorage.app',
  messagingSenderId: '753915977876',
  appId: '1:753915977876:web:7f1008ccaa906ed6f79481'
};

// `getApps()` evita reinicializar quando o Fast Refresh reexecuta o módulo.
export const app = getApps().length === 0 ? initializeApp(config) : getApp();

/**
 * Sem `getReactNativePersistence`, o Firebase guarda a sessão em memória e a
 * pessoa é deslogada toda vez que fecha o app. Com AsyncStorage, ela entra uma
 * vez e continua entrando — inclusive **offline**, que é o que permite manter
 * "conta obrigatória" sem exigir internet todo dia.
 */
function iniciarAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (erro) {
    // `initializeAuth` só pode rodar uma vez por app — a segunda chamada
    // (Fast Refresh) sempre cai aqui. Qualquer outro erro é logado: foi um
    // `catch` silencioso destes que escondeu a sessão nunca sendo persistida.
    if (!(erro instanceof Error) || !/already exists|already been called/i.test(erro.message)) {
      console.warn('iniciarAuth: initializeAuth falhou, usando getAuth sem persistência garantida.', erro);
    }
    return getAuth(app);
  }
}

export const auth = iniciarAuth();
export const bdNuvem = getFirestore(app);
