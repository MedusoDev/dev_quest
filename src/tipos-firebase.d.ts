import type { Persistence } from 'firebase/auth';

/**
 * `getReactNativePersistence` existe na build de React Native do Firebase Auth,
 * mas não nos tipos publicados — o `firebase/auth` aponta os `.d.ts` da versão
 * de navegador, que não tem essa função.
 *
 * O Metro resolve a build certa em tempo de execução; isto só conta ao
 * TypeScript o que já é verdade no aparelho. É melhor do que um `as any`, que
 * silenciaria também os erros de verdade nessa chamada.
 */
declare module 'firebase/auth' {
  export function getReactNativePersistence(armazenamento: unknown): Persistence;
}
