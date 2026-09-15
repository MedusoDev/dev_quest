# DevQuest

> **Clone para o projeto de faculdade.** Copiado do projeto pessoal
> `ouroboros_app` (renomeado para `devquest_app`) em setembro de 2026.
> Documentação para começar:
>
> - [`docs/VISAO_GERAL.md`](docs/VISAO_GERAL.md) — o que o app é, como está
>   construído e o que cada parte faz.
> - [`docs/CONFIGURAR_FIREBASE.md`](docs/CONFIGURAR_FIREBASE.md) — criar um
>   Firebase próprio para este clone e o que alterar no código.

**Versão 1.1.0**

App de celular para aprender programação por gamificação. Sessões diárias
curtas, repetição espaçada, e trilhas de **C#, Java, JavaScript, PHP e
Python** — com conta obrigatória (e-mail/senha, Google ou convidado),
onboarding de perfil e um foco de estudo que a própria diária respeita.

Expo + React Native + TypeScript, Android primeiro.

Documentação complementar em [`docs/`](docs/):
[arquitetura](docs/ARQUITETURA.md) · [cronograma](docs/CRONOGRAMA.md) ·
[visão geral](docs/VISAO_GERAL.md) · [Firebase](docs/CONFIGURAR_FIREBASE.md).

## O que já existe nesta versão

- **Conta**: entrar, criar conta ou continuar como convidado (sessão anônima
  do Firebase), tudo numa tela só (`src/app/(auth)/entrar.tsx`). Login com
  Google via OAuth (só funciona em build APK, não no Expo Go).
- **Onboarding**: depois de criar a conta, a pessoa informa nome completo,
  data de nascimento, nível de conhecimento e o **foco de estudo** — uma ou
  mais linguagens. Escolher mais de uma linguagem mostra um aviso explicando
  que isso mistura conceitos diferentes na mesma diária. Quem já sabe algo
  pode fazer um **teste de nível** para pular o básico.
- **Conteúdo**: 5 linguagens, cada uma com 3 trilhas de 3 lições (45 lições
  no total), em JSON em `conteudo/`. Cada lição tem conceito explicativo,
  glossário e cards de 7 tipos (múltipla escolha, lacuna, escrever código,
  montar linha…).
- **Introdução guiada**: um tour com réplicas em miniatura da tela Hoje e de
  um card de exercício, balão por balão — não é mais um texto solto, é
  mostrado como o app funciona.
- **A diária**: sessão do dia com ~60% conteúdo novo e ~40% revisão vencida
  (repetição espaçada). Errar não penaliza — o card volta para o fim da fila.
  Dá para pular até 5 cards por sessão, sem volta. Quando o foco de estudo tem
  mais de uma linguagem, a tela Hoje oferece a diária mista e uma diária por
  linguagem à parte — a primeira feita no dia conta para a sequência, as
  demais são bônus de XP.
- **Relâmpago**: 60 segundos de múltipla escolha por velocidade, à parte da
  sequência e do agendamento.
- **Gamificação**: XP, ranks, sequência de dias e conquistas
  (`src/nucleo/gamificacao.ts`).
- **Trilhas, glossário, pontos fracos, liga e perfil** — a liga tem ranking
  semanal entre amigos (por código) e um top global. O perfil permite editar
  codinome, nome completo, foto, data de nascimento, foco, tema de cores e
  lembrete diário em `src/app/configuracoes.tsx`.
- **Perfil público sincronizado** com o Firestore (XP, sequência, foco,
  onboarding), com cache local para o app não voltar para o onboarding se a
  leitura da nuvem falhar por falta de rede.
- **LGPD mínimo**: termos de uso/privacidade (`src/app/termos.tsx`), aceite
  com data no cadastro, e exclusão da própria conta com todos os dados.
- **Painel admin** (`src/app/admin/`): métricas de uso (frequência, horário,
  taxa de acerto, crescimento de contas) para contas com `admin: true`.

## Rodar no seu celular

```bash
npm install
npm start
```

Aparece um QR code no terminal. Instale o **Expo Go** no celular, abra e leia
o código — o app roda ali. Celular e PC precisam estar no mesmo Wi-Fi.

Depois disso, salvar um arquivo atualiza a tela do celular na hora, sem
recompilar nada.

| Comando | O que faz |
|---|---|
| `npm start` | servidor de desenvolvimento e QR code |
| `npm test` | testa a lógica do núcleo, em Node puro |
| `npm run tipos` | checa os tipos sem compilar |
| `npm run lint` | ESLint |
| `npm run android` | abre no emulador (precisa de Android Studio) |

Android Studio é **opcional**: o Expo Go cobre todo o desenvolvimento.

## Como o projeto se divide

```
src/app/          telas e rotas — o nome do arquivo é a rota (expo-router)
src/componentes/  peças reaproveitadas entre telas
src/nucleo/       regras de negócio, sem React e sem React Native
src/dados/        SQLite local (progresso) + Firebase (conta e perfil público)
src/tema/         cores, espaçamentos, fontes — a identidade "Terminal"
conteudo/         as lições, em JSON, uma pasta por linguagem
docs/             arquitetura, cronograma, visão geral, regras do Firestore
feat/             banco de ideias pessoal (não é o roadmap oficial do projeto)
```

Detalhes da arquitetura e do diagrama de componentes em
[`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

A regra que sustenta o resto: **`src/nucleo/` não conhece tela.** Nada de
`import` de React ou React Native ali dentro. É isso que permite rodar
`npm test` e saber em segundos se uma regra de sequência ou de agendamento
está certa, sem abrir emulador.

O progresso (XP, sequência, revisões agendadas, lições concluídas) mora no
SQLite do aparelho e é a fonte da verdade — o app abre instantâneo e funciona
sem internet. Só o perfil público (nome, foto, foco, posição no ranking da
liga) sobe para o Firestore, porque é o que precisa ser comparado entre
pessoas diferentes.

## Firebase

O projeto usa um Firebase compartilhado com o site `call_of_ouroboros`
(mesma conta, coleções `perfis` e `ligas` separadas das do site). As regras de
segurança do Firestore estão em [`docs/firestore.rules`](docs/firestore.rules)
— publique-as junto das do site, nunca sozinhas.
