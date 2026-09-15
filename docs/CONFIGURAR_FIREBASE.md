# Configurar um Firebase próprio para este clone

Este clone ainda aponta para o Firebase do projeto original
(`call-of-ouroboros`, compartilhado com o site). Para o trabalho de faculdade
ter um backend **separado** — sem misturar contas, perfis e ligas com o
projeto pessoal — siga este passo a passo.

Ao final, você terá alterado **4 arquivos**:

| Arquivo | O que muda |
|---|---|
| `src/dados/firebase.ts` | o objeto `config` inteiro |
| `app.json` | `scheme`, `extra.googleWebClientId`, `extra.googleAndroidClientId` (e opcionalmente `owner`, `extra.eas.projectId`, `updates.url`) |
| `hosting-legal/.firebaserc` | `projects.default` |
| `docs/firestore.rules` | (sem mudança de conteúdo — só publicar no projeto novo) |

O login por e-mail/senha e convidado precisam só das partes 1 a 3.
O login com Google precisa das partes 4 e 5.

---

## Parte 1 — Criar o projeto no Firebase

1. Acesse https://console.firebase.google.com e clique em **Adicionar projeto**.
2. Nome sugerido: `devquest-faculdade`. Google Analytics pode ficar desativado.
3. Espere criar e entre no projeto.

## Parte 2 — Ativar Authentication

1. No menu lateral: **Build → Authentication → Get started**.
2. Na aba **Sign-in method**, ative:
   - **Email/Password** (só o primeiro toggle; "Email link" não é usado).
   - **Anonymous** — é o "continuar como convidado".
   - **Google** — só se for usar o login com Google (ver Parte 4). Ao ativar,
     o Firebase pede um e-mail de suporte; informe o seu.

## Parte 3 — Criar o Firestore e publicar as regras

1. **Build → Firestore Database → Create database**.
2. Local: `southamerica-east1` (São Paulo). Comece em **modo de produção**
   (as regras abaixo substituem o padrão).
3. Aba **Rules**: apague o conteúdo, cole **tudo** de
   [`docs/firestore.rules`](firestore.rules) e clique em **Publish**.

   > O bloco `match /users/{uid}` no fim das regras era do site que dividia o
   > projeto original. Neste Firebase novo ele não atrapalha; pode manter ou
   > apagar.

4. Não precisa criar coleções à mão — o app cria `perfis`, `ligas` e
   `eventosSessao` na primeira gravação.

## Parte 4 — Registrar o app e copiar a configuração

1. Na página inicial do projeto (**Project Overview**), clique no ícone
   **Web** (`</>`) para adicionar um app.

   > Sim, **Web** — mesmo o app sendo Android. Usamos o SDK JavaScript do
   > Firebase (`firebase` no `package.json`), que se registra como app web.
   > Não registre um app Android: isso gera `google-services.json`, que este
   > projeto não usa.

2. Apelido: `devquest-app`. Deixe Hosting desmarcado. **Register app**.
3. Vai aparecer um objeto `firebaseConfig`. Copie os valores para
   `src/dados/firebase.ts`, substituindo o bloco `config`:

   ```ts
   const config = {
     apiKey: 'COLE_AQUI',
     authDomain: 'devquest-faculdade.firebaseapp.com',
     projectId: 'devquest-faculdade',
     storageBucket: 'devquest-faculdade.firebasestorage.app',
     messagingSenderId: 'COLE_AQUI',
     appId: 'COLE_AQUI'
   };
   ```

   A `apiKey` do Firebase é pública por design — ela identifica o projeto,
   não autoriza nada. A segurança vem das regras da Parte 3.

4. Aproveite e atualize o comentário no topo de `firebase.ts`, que ainda fala
   do projeto compartilhado com o site.

**Neste ponto, e-mail/senha e convidado já funcionam.** Rode `npm start`,
crie uma conta no app e confira no console em **Authentication → Users** e
**Firestore → perfis**.

---

## Parte 5 — Login com Google (opcional)

O login com Google usa OAuth nativo via `expo-auth-session`. Ele precisa de
dois "clientes OAuth" no Google Cloud (um Web, um Android) e **só funciona em
um build (APK), não no Expo Go**. Se a equipe não for usar Google, pule esta
parte — o botão do Google some sozinho quando os IDs estão vazios
(ver `loginGoogleDisponivel` em `src/dados/conta.ts`).

### 5.1 — Obter a impressão digital SHA-1

O cliente Android exige o SHA-1 do certificado que assina o APK. Com o EAS:

```bash
npx eas credentials -p android
```

Escolha o perfil `preview`, depois **Keystore** → a tela mostra o
**SHA-1 Fingerprint**. Copie.

### 5.2 — Criar os clientes OAuth

1. Ao ativar o provedor Google no Firebase (Parte 2), ele já criou um projeto
   no Google Cloud com o mesmo nome. Acesse
   https://console.cloud.google.com → selecione `devquest-faculdade`.
2. **APIs e serviços → Tela de permissão OAuth**: tipo **Externo**, nome do
   app `DevQuest`, seu e-mail de suporte, e em *Domínios autorizados* coloque
   `devquest-faculdade.firebaseapp.com`. Salve. Enquanto o app estiver em
   modo **Testing**, só as contas listadas em *Test users* conseguem entrar —
   adicione o e-mail de cada pessoa da equipe.
3. **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**:
   - **Tipo: Aplicativo da Web**. Nome `DevQuest Web`. Não precisa de URIs.
     Copie o **ID do cliente** → é o `googleWebClientId`.
     (O Firebase geralmente já criou um "Web client (auto created by Google
     Service)" — pode usar esse em vez de criar outro.)
   - **Tipo: Android**. Nome `DevQuest Android`.
     Nome do pacote: `com.ouroboros.app` (é o `android.package` do
     `app.json`). Impressão digital SHA-1: a da etapa 5.1.
     Copie o **ID do cliente** → é o `googleAndroidClientId`.

### 5.3 — Colocar os IDs no `app.json`

Substitua os três lugares:

```jsonc
"scheme": [
  "devquest",
  "com.googleusercontent.apps.NUMERO-HASH_DO_CLIENTE_ANDROID"
],
// ...
"extra": {
  "googleWebClientId": "NUMERO-HASH_WEB.apps.googleusercontent.com",
  "googleAndroidClientId": "NUMERO-HASH_ANDROID.apps.googleusercontent.com",
```

O segundo item de `scheme` é o ID do cliente **Android** invertido: se o ID
é `123-abc.apps.googleusercontent.com`, o scheme é
`com.googleusercontent.apps.123-abc`. É por esse esquema que o Google
devolve o usuário para o app (`oauthredirect.tsx`).

### 5.4 — Voltar ao Firebase

Em **Authentication → Sign-in method → Google**, expanda *Web SDK
configuration* e confira que o **Web client ID** é o mesmo do passo 5.2.

### 5.5 — Página pública de termos (só para publicar o OAuth)

Enquanto a tela de permissão estiver em modo Testing, não precisa. Para
tirar do Testing, o Google exige uma página pública de termos/privacidade.
A pasta `hosting-legal/` já é essa página:

1. Em `hosting-legal/.firebaserc`, troque `"default": "call-of-ouroboros"`
   por `"default": "devquest-faculdade"`.
2. Ative **Build → Hosting** no console e publique:
   ```bash
   cd hosting-legal
   npx firebase-tools login
   npx firebase-tools deploy --only hosting
   ```
3. Use a URL gerada (`devquest-faculdade.web.app`) na tela de permissão OAuth.

---

## Parte 6 — Conta admin (opcional)

O painel `/admin/painel` só abre para perfis com `admin: true`, e o app nunca
grava esse campo. Para ter uma conta admin:

1. Crie a conta normalmente no app.
2. No console, **Firestore → perfis → documento com o uid da conta** →
   adicione o campo `admin` (boolean) = `true`.
3. Feche e abra o app: ele cai direto no painel.

---

## Parte 7 — EAS / builds (só se for gerar APK)

O `app.json` ainda aponta para a conta Expo e o projeto EAS do original
(`owner`, `extra.eas.projectId`, `updates.url`). Para gerar APK pela conta
da equipe:

1. Crie uma conta em https://expo.dev e faça `npx eas login`.
2. Remova de `app.json` as chaves `owner`, `extra.eas.projectId` e
   `updates.url`.
3. Rode `npx eas init` — ele recria essas chaves apontando para o projeto novo.
4. Gere o APK:
   ```bash
   npx eas build -p android --profile preview
   ```

---

## Checklist final

- [ ] `src/dados/firebase.ts` com o `config` do projeto novo
- [ ] Email/Password e Anonymous ativados em Authentication
- [ ] Regras de `docs/firestore.rules` publicadas no Firestore
- [ ] Criar conta no app aparece em Authentication → Users e em Firestore → perfis
- [ ] (Google) clientes Web e Android criados, IDs e `scheme` no `app.json`
- [ ] (Google) e-mails da equipe em *Test users* da tela de permissão
- [ ] (Hosting) `.firebaserc` apontando para o projeto novo
- [ ] (EAS) `owner`/`projectId`/`updates.url` regenerados com `eas init`
