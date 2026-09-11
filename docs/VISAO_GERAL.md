# Ouroboros — visão geral do projeto

Este documento explica **o que o app é, como está construído e como cada parte
funciona**. É o ponto de partida para quem chega no projeto agora.

> Este repositório é um clone do projeto pessoal `ouroboros_app`, criado para
> o trabalho de faculdade. O original não é alterado por aqui.

---

## 1. O que é o app

Ouroboros é um app de celular (Android primeiro) para **aprender programação
por gamificação**, no estilo Duolingo:

- Sessões diárias curtas ("a diária") com cards de exercício.
- **Repetição espaçada**: o que você acerta volta mais tarde; o que erra volta
  logo. É o "ciclo Ouroboros" — a cobra que morde o próprio rabo.
- Trilhas por linguagem: **C#, JavaScript, Java, PHP e Python**.
- XP, ranks, sequência de dias, conquistas, e uma **liga** (ranking entre
  amigos por código).
- Conta obrigatória (e-mail/senha, Google ou convidado), onboarding de perfil,
  teste de nível e temas de cor.

---

## 2. Tecnologias

| Camada | Tecnologia | Para quê |
|---|---|---|
| App | **Expo SDK 54 + React Native 0.81 + TypeScript** | o app em si, roda no Android via Expo Go ou APK |
| Navegação | **expo-router** | cada arquivo em `src/app/` vira uma rota |
| Dados locais | **expo-sqlite** | progresso, revisões agendadas, lições concluídas |
| Sessão/prefs | **AsyncStorage** | persistência do login e cache do perfil |
| Backend | **Firebase** (Auth + Firestore) | conta, perfil público, ligas, eventos de sessão |
| Login Google | **expo-auth-session** + expo-web-browser | OAuth com PKCE |
| Notificações | **expo-notifications** | lembrete diário local (não usa push) |
| Animações | react-native-reanimated / gesture-handler | movimento das telas |
| Testes | **vitest** | testa `src/nucleo/` em Node puro |
| Build | **EAS** (`eas.json`) | gera APK (`preview`) e build de produção |
| Fontes | Sora, Space Grotesk, IBM Plex Mono, JetBrains Mono | identidade "Terminal" |

Tudo em **português** — nomes de arquivos, funções, variáveis e comentários.

---

## 3. Como rodar

```bash
npm install
npm start
```

Lê o QR code com o app **Expo Go** no celular (mesmo Wi-Fi do PC). Salvar um
arquivo atualiza a tela na hora.

| Comando | O que faz |
|---|---|
| `npm start` | servidor de desenvolvimento + QR code |
| `npm test` | roda os testes de `src/nucleo/` |
| `npm run tipos` | `tsc --noEmit`, checa os tipos |
| `npm run lint` | ESLint |
| `npm run android` | abre no emulador (precisa de Android Studio) |

> O login com Google **não funciona no Expo Go** — precisa de um build (APK)
> porque depende do esquema de URL nativo. E-mail/senha e convidado funcionam
> normalmente no Expo Go.

---

## 4. Estrutura de pastas

```
src/app/          telas e rotas (expo-router)
src/componentes/  peças de UI reaproveitadas entre telas
src/nucleo/       regras de negócio PURAS — sem React, sem React Native
src/dados/        SQLite local + Firebase + contextos React
src/tema/         cores, espaçamentos, fontes, paletas de tema
conteudo/         as lições, em JSON, uma pasta por linguagem
docs/             regras do Firestore, documentação
hosting-legal/    página pública (termos/privacidade) para o OAuth do Google
feat/             ideias e roadmap (ideia.md)
redesign-de-layout-do-projeto/  protótipo de design (handoff do Claude Design)
assets/           ícones, splash
```

### A regra mais importante: `src/nucleo/` não conhece tela

Nada em `src/nucleo/` importa React ou React Native. Isso permite rodar
`npm test` e validar em segundos se uma regra de sequência, XP ou agendamento
está certa — sem abrir emulador. Quando for mexer em **regra**, mexa aqui.
Quando for mexer em **tela**, mexa em `src/app/` ou `src/componentes/`.

---

## 5. As telas (`src/app/`)

O nome do arquivo é a rota. Pastas entre parênteses agrupam sem aparecer na URL.

| Rota | Arquivo | O que faz |
|---|---|---|
| `/` (aba Hoje) | `(abas)/index.tsx` | tela inicial: a diária do dia, sequência, XP |
| aba Trilhas | `(abas)/trilhas.tsx` | lista de linguagens → trilhas → lições |
| aba Relâmpago | `(abas)/relampago.tsx` | 60 s de múltipla escolha por velocidade |
| aba Liga | `(abas)/liga.tsx` | ranking semanal entre amigos (por código) |
| aba Perfil | `(abas)/perfil.tsx` | XP, rank, conquistas, calendário, gráfico |
| `/entrar` | `(auth)/entrar.tsx` | login, cadastro, convidado, Google |
| `/onboarding` | `onboarding.tsx` | nome, idade, nível, foco de estudo |
| `/introducao` | `introducao.tsx` | tour guiado de como o app funciona |
| `/teste-nivel` | `teste-nivel.tsx` | teste para posicionar quem já sabe algo |
| `/sessao` | `sessao.tsx` | a tela onde os cards são respondidos |
| `/licao/[id]` | `licao/[id].tsx` | conceito + glossário de uma lição |
| `/fracos` | `fracos.tsx` | pontos fracos (cards mais errados) |
| `/glossario` | `glossario.tsx` | glossário de termos |
| `/configuracoes` | `configuracoes.tsx` | editar perfil, tema, lembrete, excluir conta |
| `/termos` | `termos.tsx` | termos de uso e privacidade (LGPD) |
| `/oauthredirect` | `oauthredirect.tsx` | ponto de volta do login Google |
| `/admin/painel` | `admin/painel.tsx` | painel de métricas (só conta `admin`) |

`src/app/_layout.tsx` é o layout raiz: carrega fontes, abre o SQLite, inicia
os contextos (Conta, Progresso, Tema) e decide para onde mandar a pessoa
(entrar → onboarding → introdução → abas, ou direto para `/admin`).

---

## 6. O conteúdo (`conteudo/`)

Cada linguagem tem uma pasta com:

- `trilhas.json` — nome, cor e as trilhas da linguagem, cada trilha com a
  ordem das lições.
- `licoes/*.json` — uma lição por arquivo, com `id`, `linguagem`, `trilha`,
  `titulo`, `resumo`, `conceito` (o texto explicativo), `glossario` e `cards`.

Tipos de card que existem hoje (julgados em `src/nucleo/resposta.ts`):

| Tipo | O que a pessoa faz |
|---|---|
| `o-que-faz` | múltipla escolha: o que este código faz? |
| `saida` | múltipla escolha: qual é a saída? |
| `palavra-chave` | escolher a palavra-chave certa |
| `lacuna` | preencher a lacuna no código |
| `escreva` | digitar uma linha de código |
| `montar-linha` | ordenar pedaços para montar a linha |
| `estrutura` | identificar a estrutura correta |

Os JSON são importados um a um em `src/nucleo/conteudo.ts` (o Metro embute
tudo no bundle). **Para adicionar uma lição**: crie o JSON, registre em
`trilhas.json` da linguagem e em `conteudo.ts`.

---

## 7. As regras de negócio (`src/nucleo/`)

| Arquivo | Responsabilidade |
|---|---|
| `revisao.ts` | o ciclo de repetição espaçada: a "escada" de intervalos, quando um card está vencido ou dominado |
| `diaria.ts` | monta a fila do dia: ~60% conteúdo novo + ~40% revisão vencida |
| `sessao.ts` | o motor da sessão: fila que só esvazia quando tudo foi acertado; errar manda o card para o fim |
| `resposta.ts` | julga cada tipo de card (certo/errado) |
| `gamificacao.ts` | XP, ranks, sequência de dias, conquistas — os números moram aqui |
| `dificuldade.ts` | níveis de dificuldade = quanto apoio a tela dá |
| `perfil.ts` | perfil público (bordas, semana da liga, tipos) |
| `metricas.ts` | agregados do painel admin, calculados a partir dos perfis |
| `eventos.ts` | evento de sessão concluída (data/hora, para métricas) |
| `datas.ts` | datas sempre como `'AAAA-MM-DD'` no fuso local (evita a sequência quebrar por UTC) |
| `conteudo.ts` | carrega os JSON de `conteudo/` |
| `destacarSintaxe.ts` | classifica os pedaços de uma linha de código para o `BlocoCodigo` pintar |
| `aleatorio.ts` | embaralhar (Fisher-Yates) |
| `*.teste.ts` | testes vitest |

---

## 8. Os dados (`src/dados/`)

**Duas fontes, com papéis diferentes:**

### Local — SQLite (`bd.ts`, `progresso.ts`)
É a **fonte da verdade** do progresso. O app abre instantâneo e funciona
offline. Tabelas: `ajustes` (chave/valor), `revisoes` (agendamento por card),
`licoes` (concluídas). `ProgressoContexto.tsx` expõe isso para as telas.

### Nuvem — Firebase (`firebase.ts`, `conta.ts`, `nuvem.ts`)
Só sobe o que precisa ser **comparado entre pessoas**:

- **Auth**: e-mail/senha, anônimo (convidado) e Google. Sessão persistida com
  AsyncStorage para não deslogar ao fechar o app.
- **Firestore**, três coleções:
  - `perfis/{uid}` — nome, codinome, foto (base64 pequena), XP, sequência,
    foco, onboarding, `admin`, `plano`. Público entre quem tem conta.
  - `ligas/{codigo}` — nome e criador. Entra-se pelo código.
  - `eventosSessao/{id}` — uma linha por sessão concluída; só a própria
    pessoa e o admin leem.
- `ContaContexto.tsx` gerencia login/logout e mantém o perfil em cache local
  para o app não voltar ao onboarding se a rede falhar.

As **regras de segurança** estão em `docs/firestore.rules` — os campos `admin`
e `plano` só podem ser mudados pelo console do Firebase, nunca pelo app.

### Outros
- `TemaContexto.tsx` — tema atual (`useCores()`); as paletas ficam em
  `src/tema/temas.ts`.
- `lembretes.ts` — lembrete diário via `expo-notifications` (local).
- `apresentacao.ts` — estado do tour de introdução.

---

## 9. Fluxos principais

**Primeira vez:** abrir → `/entrar` (criar conta ou convidado) → `/onboarding`
(nome, idade, nível, foco) → opcionalmente `/teste-nivel` → `/introducao` →
abas.

**A diária:** aba Hoje → `diaria.ts` monta a fila (novo + revisão vencida) →
`/sessao` roda `sessao.ts` → cada resposta é julgada por `resposta.ts` →
ao terminar, `revisao.ts` reagenda cada card, `gamificacao.ts` calcula XP e
sequência, `progresso.ts` grava no SQLite e `nuvem.ts` sobe o perfil e o
evento de sessão. Com mais de uma linguagem no foco, há diária mista e uma
por linguagem — a primeira do dia conta para a sequência, as demais são bônus.

**Login com Google:** `entrar.tsx` abre o navegador via `expo-auth-session`
(PKCE) → o Google devolve para `ouroboros://oauthredirect?code=...` →
`oauthredirect.tsx` troca o código por token e entra no Firebase. Os IDs de
cliente ficam em `app.json` → `extra.googleWebClientId` /
`googleAndroidClientId`, e o esquema nativo em `app.json` → `scheme`.

**Admin:** um perfil com `admin: true` (setado no console do Firebase) cai
direto em `/admin/painel`, que lê todos os perfis e eventos e mostra
frequência, horário de estudo, taxa de acerto e crescimento de contas.

---

## 10. Design e identidade

- Tema "Terminal": fundo escuro, fontes mono para código, verde-limão
  `#c7f74e` como destaque. Cores, espaços e tipografia em `src/tema/`.
- Várias paletas selecionáveis em Configurações (`src/tema/temas.ts`).
- O protótipo visual das telas está em `redesign-de-layout-do-projeto/`
  (HTML exportado do Claude Design) — serve de referência, não é código do app.

---

## 11. Build e publicação

- `eas.json` define dois perfis: `preview` (gera **APK** para distribuir
  direto) e `production`.
- `expo-updates` permite mandar atualização de JS sem novo APK.
- `hosting-legal/` é uma página estática publicada no Firebase Hosting; o
  Google exige uma página pública de termos/privacidade para aprovar o OAuth.

---

## 12. Onde estão as ideias e o roadmap

`feat/ideia.md` — estágios do projeto (pré-beta, correções, apresentação…),
requisitos de LGPD, ideias de produto e monetização. Nem tudo ali será feito;
é um banco de ideias organizado para virar cards de Trello.

---

## 13. Firebase próprio para este clone

Este clone ainda aponta para o Firebase do projeto original. Para o trabalho
de faculdade usar um backend separado, siga
[`docs/CONFIGURAR_FIREBASE.md`](CONFIGURAR_FIREBASE.md).
