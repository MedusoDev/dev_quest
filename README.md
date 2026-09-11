# Ouroboros

**Versão 1.0.0**

App de celular para aprender programação por gamificação. Sessões diárias
curtas, repetição espaçada, e trilhas de C# e JavaScript — hoje com conta
obrigatória (e-mail/senha ou convidado), onboarding de perfil e um foco de
estudo que a própria diária respeita.

Expo + React Native + TypeScript, Android primeiro.

## O que já existe nesta versão

- **Conta**: entrar, criar conta ou continuar como convidado (sessão anônima
  do Firebase), tudo numa tela só (`src/app/(auth)/entrar.tsx`).
- **Onboarding**: depois de criar a conta, a pessoa informa nome completo,
  idade, nível de conhecimento e o **foco de estudo** — uma ou mais
  linguagens. Escolher mais de uma linguagem mostra um aviso explicando que
  isso mistura conceitos diferentes na mesma diária.
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
- **Trilhas, pontos fracos, liga (ranking entre amigos) e perfil** — com
  edição de codinome, nome completo, foto, idade e foco em
  `src/app/configuracoes.tsx`.
- **Perfil público sincronizado** com o Firestore (XP, sequência, foco,
  onboarding), com cache local para o app não voltar para o onboarding se a
  leitura da nuvem falhar por falta de rede.

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
conteudo/         as lições, em JSON, por linguagem
docs/             regras de segurança do Firestore, briefing de design
```

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
