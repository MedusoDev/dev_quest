# Handoff: DevQuest — ciclo em Trilhas, Perfil e Configurações compactos, três temas

## Visão geral

Quatro mudanças no app, todas desenhadas em HTML nesta conversa e todas dentro
da identidade **Terminal** que já está em `src/tema/index.ts`:

1. **Trilhas** redesenhada como o ciclo do Ouroboros — a linguagem inteira é
   uma circunferência de pontos e o corpo da cobra cobre o caminho já andado.
2. **Seletor de linguagem** no lugar dos chips fixos, para o app aguentar mais
   linguagens que C# e JavaScript.
3. **Perfil** e **Configurações** compactos: cabeçalho de uma linha em vez de
   título de abertura, e réguas mais apertadas.
4. **Três temas de cor** (leve, médio, pesado), cada um com o seu acento.

## Sobre os arquivos deste pacote

Duas categorias, e a diferença importa:

- **`src/`** — código React Native **para colar no projeto**. Escrito contra as
  fichas reais (`@/tema`), a API real de `@/nucleo/conteudo` e as peças de
  `@/componentes/basicos`. Não é pseudocódigo: é o arquivo.
- **`referencias/`** — os protótipos HTML. São **referência de desenho**, não
  código para portar. Servem para medir e para ver a interação rodando.

Duas telas (Perfil e Configurações) vêm só como especificação escrita, na seção
"Perfil e Configurações" abaixo. O motivo: as duas dependem de peças que este
pacote não leu por inteiro (`Avatar`, `Calendario`, o formulário de
`configuracoes.tsx`, `expo-image-picker`), e adivinhar a API delas produziria
um arquivo que não compila. Os valores estão todos ali, medidos.

## Fidelidade

**Hi-fi.** Cores, tipografia, espaçamentos e alturas de alvo são finais e saem
de `src/tema/index.ts`. Nenhum valor solto: se um número aparece na spec e não
existe nas fichas, ele está anotado como novo.

---

## 1. Trilhas — o ciclo

### O que sai

- O rótulo mono + título de 30 no topo (era meia tela antes do conteúdo).
- A `Timeline` vertical. O componente continua no projeto; esta tela deixa de
  usá-lo. (`Timeline.tsx` fica: nada mais o consome, então dá para remover num
  segundo passo, quando não houver dúvida.)
- As trilhas de todas as linguagens empilhadas na mesma rolagem.
- A `ContagemNiveis` por trilha. Ela contava cards de todas as lições de uma
  trilha, incluindo as travadas — informação que não muda decisão nenhuma nesta
  tela. Continua viva na tela da lição.

### O que entra

**`src/componentes/CicloTrilha.tsx`** (novo)

O anel. Geometria em unidades de `viewBox` 100×100, para não depender de
densidade de tela:

| peça | valor |
| --- | --- |
| raio do anel | 34 |
| espessura do corpo | 10, `strokeLinecap="round"` |
| caminho que falta | `stroke` `cores.linha`, 1px, `strokeDasharray="1.6 3.2"` |
| ponto de lição | quadrado 4.6 × 4.6, centrado no raio |
| cabeça | círculo r 5.6, `cores.acento` |
| olho | círculo r 1.5, `cores.fundo`, 1.6 adiante e 1.8 para fora |
| lado do palco | 280 dp |

Estados do ponto:

| estado | preenchimento | borda |
| --- | --- | --- |
| concluída | `cores.acento` | — |
| atual | nenhum | `cores.acento`, 1.2 |
| travada / futura | `cores.linha` | — |

O corpo é um `Circle` com `strokeDasharray` `${VOLTA * feitas / total} ${VOLTA}`
e `transform="rotate(-90 50 50)"`, o que põe a cauda às 12h. Os pontos são
desenhados **antes** do corpo: o traço passa por cima dos já vencidos, e é isso
que dá a leitura de "a cobra ganhou forma". A cabeça e o olho vêm por último.

Animação: uma progressão só (0→1) alimenta corpo, cabeça e olho — se cada um
animasse por conta, a cabeça descolaria da ponta do traço no meio do caminho.
`animacao.rank` (900ms) com `animacao.curva.barra`, `useNativeDriver: false`
(dasharray é layout no SVG). Respeita `useMovimentoReduzido()`.

No centro, sem tocar no anel: rótulo `tipo.rotuloSecao` no acento, título
`tipo.tituloItem`, nota `tipo.notaMonoMenor` em legenda, e o `Pressable`
"continuar ▌" com `Cursor` — 44 dp de alvo. Abaixo do anel, a legenda
"o corpo fecha o ciclo em N lições" em `tipo.metricaMono` `cores.desativado`.

**`src/app/(abas)/trilhas.tsx`** (substitui o atual — neste zip o arquivo está
em `src/app/-abas-/trilhas.tsx`, porque os parênteses não sobrevivem ao
empacotamento; renomeie a pasta para `(abas)` ao colar.)

Uma linguagem por vez. Cabeçalho de 52 dp com o botão de linguagem à esquerda
e "glossário" à direita, ambos com 44 dp de alvo. Depois o ciclo, depois a
lista compacta: nó de 18 dp, título `tipo.botaoDiscreto` com `numberOfLines={1}`,
nota à direita ("feita" / "aqui →" / "N cards" / "travada"). Régua de 1px em
cima de cada linha, `paddingVertical` 8.

O rótulo mono no acento continua marcando **uma** trilha: a que contém a lição
atual. As outras em `cores.legenda`.

Estado: `useState` para a linguagem escolhida e para a folha do seletor. O
progresso continua vindo de `useProgresso()`; nada de novo persistido.

### 2. Seletor de linguagem

**`src/componentes/SeletorLinguagem.tsx`** (novo) — duas exportações.

`BotaoLinguagem`: o gatilho. Caixa com `borderColor: cores.acentoLinha` sobre
`cores.acentoFundo`, `minHeight: tamanhos.alvoMin` (44), `paddingHorizontal` 11,
`marginLeft: -11` para o texto alinhar com a margem da tela. Dentro: nome em
`tipo.tituloLinha` `textoForte`, contagem em `tipo.metricaMono` `acentoTexto`, e
um chevron **em SVG** 10×7 (`strokeWidth` 1.6, `strokeLinecap="square"`) — o
glifo ▾ em 9px lia como ponto, não como seta.

`SeletorLinguagem`: `Modal transparent animationType="slide"`. Modal e não uma
View absoluta por dois motivos: precisa cobrir a barra de abas de 76 dp, e o
botão voltar do Android tem que fechar. Fundo `rgba(4,5,6,0.72)`, folha ancorada
embaixo com `borderTopWidth` 1. Cada item: marca quadrada de 10 dp (cheia no
acento se ativa, borda `linha` se não), nome + descrição do `trilhas.json`, e à
direita um `Trilho` de 52 dp de largura com a contagem embaixo. `maxHeight` 340
na lista — com oito linguagens ela rola, e o layout do ciclo não muda.

Por que folha e não chips: dois chips caíam bem na largura de 390; cinco não
caem, e uma fileira rolável horizontal esconde opções sem dizer que existem.

---

## 3. Perfil e Configurações — especificação

### Perfil (`src/app/(abas)/perfil.tsx`)

Sai o rótulo + título de abertura. Entra a mesma barra de 52 dp de Trilhas:
"Perfil" em `tipo.tituloLinha`, "configurações" à direita em `tipo.metricaMono`
`legenda`, 44 dp de alvo, `borderBottomWidth` 1 `cores.linha`.

Ordem e medidas:

1. **Identidade** — linha de `paddingVertical` 14, `gap` 12: avatar de 44
   (`tamanhos.avatar`), codinome em `tipo.tituloPerfil` reduzido para 20/22
   (`letterSpacing` -0.7), e sob ele "RANK 02 · CRIA · faltam 220 XP" em
   `tipo.metricaMono` no acento. O `tituloPerfil` de 26 fica grande demais
   quando o cabeçalho já nomeia a tela.
2. **Métricas** — a grade 2×2 vira **uma fileira de quatro**, `borderTopWidth` e
   `borderBottomWidth` 1, cada célula com `borderRightWidth` 1 menos a última.
   Número em `tipo.metricaPequena` ampliado para 22/22 (`letterSpacing` -1),
   rótulo em `tipo.rotuloCelula` `legenda` com `marginTop` 5. Padding 11 × 10.
   Conteúdo: XP · SEQ · MADUROS · ACERTO.
3. **Sobre você** — três réguas de `paddingVertical` 8 (NOME, IDADE,
   FOCO · NÍVEL): rótulo `tipo.rotuloCelula` `legenda` à esquerda, valor
   `tipo.metricaMono` `textoForte` à direita. "editar" no cabeçalho da seção.
4. **A escada** — as seis linhas de rank viram uma régua de seis segmentos:
   `flexDirection: 'row'`, `gap` 4, cada segmento `flex: 1` com barra de 4 dp
   (acento se alcançado, `linha` se não) e o nome embaixo em mono 9.5.
   O rank corrente em acento; os futuros em `desativado`.
5. **Últimas 5 semanas** — grade 7 × 5, `gap` 3, células `aspectRatio: 1`.
   Dia com sessão em acento, sem sessão em `cores.linha`, hoje com borda de
   acento e fundo nenhum, futuro com borda `linha`.
6. **Conquistas** — réguas de `paddingVertical` 9: marca de 8 dp (cheia no
   acento se ganha, borda `linha` se não), título `tipo.botaoDiscreto`, progresso
   à direita em `tipo.metricaMono`. Três visíveis, "ver tudo" no cabeçalho.

Resultado: da identidade até conquistas cabe sem rolar em 844 dp. Antes a grade
2×2 e a escada em lista consumiam a tela inteira.

### Configurações (`src/app/configuracoes.tsx`)

Hoje a tela é só "Sobre você". Passa a ser configurações de verdade, e cabe
inteira em 844 dp. Barra de 52 dp: "‹ perfil" + "Configurações" à esquerda,
versão do app à direita em `tipo.metricaMono` `desativado`.

Seções, na ordem — cada rótulo em `tipo.rotuloSecao`, o primeiro no acento e os
demais em `legenda`, `paddingTop` 11 / `paddingBottom` 6:

1. **tema** — três cartões numa fileira (`gap` 6, `flex: 1`): três amostras de
   12 dp (fundo, linha, acento do tema) e o nome em `tipo.tituloItemMenor`
   reduzido a 13/16. Ativo com borda de acento sobre `acentoFundo`. Abaixo,
   uma régua com "seguir o sistema" e um interruptor de 34 × 18.
2. **lembretes** — três linhas de `paddingVertical` 8: nome à esquerda, horário
   em `tipo.metricaMono` no meio, interruptor de 34 × 18 à direita. Diária
   20:00 (ligado), sequência em risco 22:00 (ligado), fim da liga domingo
   (desligado). O interruptor é um quadrado de 14 dp dentro de um trilho — raio
   zero, como todo o resto.
3. **ritmo da diária** — três cartões: Leve 5 min · 10, Firme 10 min · 20,
   Pesado 20 min · 40.
4. **sobre você** — o formulário atual, compactado: linha de avatar 30 dp +
   codinome + "trocar foto" no acento, depois quatro réguas de `paddingVertical`
   7 (NOME, NASCIMENTO, FOCO, NÍVEL) com o valor e um "›".
5. **conta e dados** — cinco réguas de `paddingVertical` 7: e-mail + plano,
   "Baixar meus dados" (JSON), "Termos e privacidade", "Sair da conta" em
   `legenda`, "Excluir conta" em `cores.erro`.

Os interruptores de 34 × 18 e as réguas de 7–8 dp são os únicos valores novos;
tudo mais sai das fichas. Nenhuma linha desce abaixo de `tamanhos.alvoMin` como
área tocável: o `paddingVertical` é o visual, o `hitSlop` completa os 44.

---

## 4. Os três temas

**`src/tema/temas.ts`** (novo, aditivo — não mexe no `index.ts`).

Traz `temas.leve`, `temas.medio`, `temas.pesado`, o tipo `Paleta`, as fichas
para a lista de Configurações e `temaDoSistema()`. O tema pesado é a paleta
Terminal atual, valor por valor, então adotar o arquivo não muda nada até
alguém trocar de tema.

Cada tema tem o seu acento, e não por gosto: o verde-lima sobre papel branco dá
contraste de 1.5:1 e desaparece. No leve o acento é um azul de tinta (#2b4bd8,
6.9:1 sobre o papel); no médio, um ciano menos vibrante que reduz halo em OLED.

### O trabalho que falta para tema trocável

O `index.ts` diz, no comentário do topo, que o app é escuro e só escuro. Este
arquivo não revoga a decisão sozinho — ele a deixa pronta. Para valer em
runtime:

1. `TemaContexto` guardando o id escolhido (AsyncStorage, ao lado do que
   `ProgressoContexto` já faz) e expondo `{ cores, tema, definirTema }`.
2. `useCores()` devolvendo a paleta corrente.
3. Nas telas: `StyleSheet.create` estático não serve para o que depende de cor.
   Mova essas propriedades para `style` inline (`{ color: c.acento }`) e deixe no
   StyleSheet só geometria — layout não muda com o tema.
4. `StatusBar` seguindo `paleta.barraStatus`.

Vale fazer tela por tela. Enquanto uma tela não migrou, ela continua lendo
`cores` do `index.ts` e fica no pesado: nada quebra no meio do caminho.

---

## Ordem sugerida

1. `src/tema/temas.ts` — aditivo, zero risco.
2. `CicloTrilha.tsx` + `SeletorLinguagem.tsx` + `trilhas.tsx` — fecham juntos,
   é a mudança grande.
3. Perfil compacto.
4. Configurações.
5. Tema trocável em runtime, tela por tela.

## Dependências

Nada novo. `react-native-svg` já está no projeto (`Anel.tsx`, `LogoGoogle.tsx`);
`Modal` e `Animated` são do React Native.

## Arquivos

```
src/componentes/CicloTrilha.tsx        novo
src/componentes/SeletorLinguagem.tsx   novo
src/app/-abas-/trilhas.tsx             substitui src/app/(abas)/trilhas.tsx
src/tema/temas.ts                      novo
referencias/DevQuest - Telas.html      as 10 telas, com o alternador de tema
referencias/Trilhas interativo.html    o fluxo clicável de Trilhas
```

Os dois arquivos em `referencias/` abrem no navegador. No primeiro, o botão
LEVE / MÉDIO / PESADO no topo repinta as dez telas. No segundo dá para tocar
o ciclo, fazer uma lição inteira e ver o corpo crescer na volta.
