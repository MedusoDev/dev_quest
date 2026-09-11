/**
 * Entrar, cadastrar e sair.
 *
 * E-mail e senha, convidado, ou Google. Login com Google exige um build de
 * verdade (EAS) — o Expo Go não tem o esquema de redirecionamento nativo que
 * o fluxo do Google precisa, então o botão só funciona a partir de um APK
 * instalado (ver `entrarComGoogle` abaixo e `googleConfigurado`).
 */

import { exchangeCodeAsync } from 'expo-auth-session';
import Constants from 'expo-constants';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User
} from 'firebase/auth';

import { auth } from './firebase';
import { excluirEventosDoUsuario, excluirPerfil } from './nuvem';
import { apagarTudoLocal } from './progresso';

export type { User };

/**
 * O Firebase devolve códigos como `auth/invalid-credential` e mensagens em
 * inglês. Traduzir os casos frequentes evita jogar erro cru na cara de quem
 * está tentando entrar.
 */
export function traduzirErro(erro: unknown): string {
  const codigo = (erro as { code?: string })?.code ?? '';

  const traducoes: Record<string, string> = {
    'auth/email-already-in-use': 'Já existe uma conta com esse e-mail. Tente entrar.',
    'auth/invalid-email': 'Esse e-mail não parece válido.',
    'auth/weak-password': 'A senha é curta demais. Use pelo menos 6 caracteres.',
    'auth/invalid-credential': 'E-mail ou senha não conferem.',
    'auth/user-not-found': 'Não achei conta com esse e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/too-many-requests': 'Muitas tentativas seguidas. Espere um minuto.',
    'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
    // Este é o erro que aparece se o método não foi ligado no console.
    'auth/operation-not-allowed':
      'Esse jeito de entrar está desligado no Firebase. Ligue em Authentication → Sign-in method.',
    'auth/admin-restricted-operation':
      'O modo convidado está desligado no Firebase. Ligue Anonymous em Authentication → Sign-in method.'
  };

  return traducoes[codigo] ?? 'Algo deu errado. Tente de novo.';
}

/**
 * O que um cadastro em andamento carrega, para `ContaContexto` ler ao criar o
 * perfil novo: o codinome (quando existe — Google já traz o nome pronto no
 * `displayName`, então não precisa passar por aqui) e o instante em que os
 * termos foram aceitos.
 *
 * Existe por causa de uma corrida: o Firebase dispara `onAuthStateChanged`
 * assim que a conta é criada, **antes** de `updateProfile` (no cadastro por
 * e-mail) terminar de gravar o `displayName`. Sem isto, o listener via um
 * `displayName` ainda `null`, criava o perfil como "Sem nome", e esse nome
 * errado era o que acabava subindo para o Firestore na primeira sessão.
 * Setado de forma síncrona, antes de qualquer `await`, então já está pronto
 * no instante em que a conta é criada — não há corrida possível com o
 * listener.
 *
 * O timestamp de aceite dos termos é capturado aqui, e não depois, porque só
 * é setado depois que a pessoa aceitou — no cadastro por e-mail, marcando a
 * caixa; no Google, ao tocar o botão (ver `entrar.tsx`).
 */
let cadastroPendente: { nome: string | null; termosAceitosEm: string } | null = null;

/** Lê e limpa o cadastro pendente — uma leitura só, para não vazar num login futuro. */
export function consumirCadastroPendente(): { nome: string | null; termosAceitosEm: string } | null {
  const dados = cadastroPendente;
  cadastroPendente = null;
  return dados;
}

/** Chamado ao tocar "Continuar com Google" — mesma ideia do consentimento do cadastro por e-mail. */
export function registrarConsentimentoGoogle(): void {
  cadastroPendente = { nome: null, termosAceitosEm: new Date().toISOString() };
}

export async function cadastrar(email: string, senha: string, nome: string): Promise<User> {
  cadastroPendente = { nome: nome.trim(), termosAceitosEm: new Date().toISOString() };

  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), senha);

  // O nome vai para o próprio Auth além do perfil no Firestore: assim ele
  // sobrevive mesmo se a gravação do perfil falhar.
  await updateProfile(user, { displayName: nome.trim() });

  return user;
}

export async function entrar(email: string, senha: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), senha);
  return user;
}

/**
 * Entrar sem conta.
 *
 * É uma sessão anônima do próprio Firebase, não um "sem login": assim o resto
 * do app — perfil, liga, sincronização — continua funcionando sem nenhum caso
 * especial, e o dia em que a pessoa criar conta de verdade é uma promoção da
 * mesma sessão, não um começar do zero.
 *
 * Exige **Anonymous** ligado em Authentication → Sign-in method no console.
 */
export async function entrarComoConvidado(): Promise<User> {
  const { user } = await signInAnonymously(auth);
  return user;
}

/**
 * Os client IDs do OAuth do Google, lidos de `app.json` → `extra`.
 *
 * Só existem depois de duas coisas manuais, feitas uma vez só: ligar Google em
 * Firebase Console → Authentication → Sign-in method (isso já cria o Web
 * client ID sozinho), e criar um client ID Android no Google Cloud Console
 * com o SHA-1 do build assinado (`eas credentials` mostra o SHA-1 depois do
 * primeiro build). Enquanto essas chaves não estiverem em `app.json`, o botão
 * de Google fica escondido — ver `googleConfigurado`.
 */
export function credenciaisGoogle(): { webClientId: string; androidClientId: string } {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  return {
    webClientId: typeof extra.googleWebClientId === 'string' ? extra.googleWebClientId : '',
    androidClientId:
      typeof extra.googleAndroidClientId === 'string' ? extra.googleAndroidClientId : ''
  };
}

export function googleConfigurado(): boolean {
  const { webClientId, androidClientId } = credenciaisGoogle();
  return webClientId.length > 0 && androidClientId.length > 0;
}

/**
 * O esquema de redirecionamento que o Google exige para um client OAuth do
 * tipo Android: `com.googleusercontent.apps.<prefixo-do-client-id>`, e não o
 * nome do pacote do app. Sem isto, o Google recusa a solicitação de login com
 * `invalid_request` antes mesmo de mostrar a tela de conta — o client
 * Android nunca teve um jeito de registrar `com.ouroboros.app` como
 * redirecionamento válido, só esse formato derivado do próprio client ID.
 *
 * Precisa estar registrado como `scheme` em `app.json` (intent filter do
 * Android) para o navegador conseguir devolver o controle ao app — por isso
 * uma mudança aqui exige um build novo, não só um `eas update`.
 */
export function redirectUriGoogle(): string {
  const { androidClientId } = credenciaisGoogle();
  const prefixo = androidClientId.split('.apps.googleusercontent.com')[0];
  return `com.googleusercontent.apps.${prefixo}:/oauthredirect`;
}

/**
 * Troca o ID token do Google (devolvido por `expo-auth-session`) por uma
 * sessão do Firebase.
 */
export async function entrarComGoogle(idToken: string): Promise<User> {
  const credencial = GoogleAuthProvider.credential(idToken);
  const { user } = await signInWithCredential(auth, credencial);
  return user;
}

/**
 * O "code verifier" do PKCE, guardado entre o toque em "Continuar com
 * Google" e a volta do navegador.
 *
 * Existe porque o retorno do Google (`app/oauthredirect.tsx`) chega numa
 * rota nova, e o `expo-router` desmonta a tela `entrar.tsx` no meio do
 * caminho — junto com ela, o estado do hook `Google.useAuthRequest` que
 * guardava esse verificador. Sem persistir em algum lugar fora do
 * componente, a troca do código por token na tela de retorno não teria como
 * provar que foi o mesmo app que iniciou o pedido.
 */
let verificadorPendente: string | null = null;

export function guardarVerificadorGoogle(verificador: string | undefined): void {
  verificadorPendente = verificador ?? null;
}

/**
 * Termina o login com Google a partir do código de autorização que chegou
 * em `app/oauthredirect.tsx`: troca o código pelo ID token (usando o code
 * verifier guardado antes de abrir o navegador) e entra no Firebase com ele.
 */
export async function concluirLoginGoogle(code: string): Promise<User> {
  const { androidClientId } = credenciaisGoogle();
  const verificador = verificadorPendente;
  verificadorPendente = null;

  if (!verificador) {
    throw new Error('Sessão de login com Google expirada. Tente de novo.');
  }

  const resultado = await exchangeCodeAsync(
    {
      clientId: androidClientId,
      code,
      redirectUri: redirectUriGoogle(),
      extraParams: { code_verifier: verificador }
    },
    { tokenEndpoint: 'https://oauth2.googleapis.com/token' }
  );

  if (!resultado.idToken) {
    throw new Error('O Google não devolveu o token esperado. Tente de novo.');
  }

  return entrarComGoogle(resultado.idToken);
}

export async function sair(): Promise<void> {
  await signOut(auth);
}

export async function recuperarSenha(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Excluir a conta — direito de eliminação da LGPD, e não um "sair".
 *
 * A ordem importa: apaga tudo na nuvem e no aparelho **enquanto ainda dá para
 * provar dono** (as regras do Firestore exigem `request.auth.uid == uid`), e
 * só por último apaga a conta do Firebase Auth. Se `deleteUser` falhar — o
 * caso comum é `auth/requires-recent-login`, quando o login foi há muito
 * tempo — o perfil e os eventos já foram apagados; quem chamou trata o erro
 * pedindo para a pessoa sair e entrar de novo antes de tentar excluir outra
 * vez, e a segunda tentativa só terá o `deleteUser` pendente.
 */
export async function excluirConta(): Promise<void> {
  const usuario = auth.currentUser;
  if (!usuario) return;

  await Promise.all([excluirPerfil(usuario.uid), excluirEventosDoUsuario(usuario.uid)]);
  await apagarTudoLocal();
  await deleteUser(usuario);
}
