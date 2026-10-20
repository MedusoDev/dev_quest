# Devzinho — o mascote no app

O Devzinho é desenhado em código (SVG), não é imagem. Por isso ele muda de
expressão, evolui de nível e se mexe. Tudo fica em
`src/componentes/Devzinho.tsx`.

## Usar numa tela

```tsx
import { Devzinho } from '@/componentes/Devzinho';

<Devzinho tamanho={100} expressao="feliz" item="varinha" nivel={3} />
```

| Prop | Valores | Padrão |
|---|---|---|
| `tamanho` | largura em dp (a altura é 1.1×) | `120` |
| `expressao` | `determinado`, `feliz`, `animado`, `surpreso`, `triste`, `pensando`, `bravo` | `determinado` |
| `item` | `notebook`, `varinha`, `nenhum` | `notebook` |
| `nivel` | `1` a `6` (Iniciante → Lenda) | `2` |
| `aura` | auréola colorida do nível | `true` |
| `flutuar` | sobe e desce em laço | `true` |
| `reacao` | `{ tipo: 'pulo' \| 'tremor', chave }`: muda a `chave` para disparar de novo | `null` |
| `bloqueado` | silhueta apagada (nível ainda não alcançado) | `false` |

Ele pisca sozinho. Com "reduzir movimento" ligado no celular, fica parado.

Para converter o rank da pessoa em nível: `nivelDoRank(indiceNoRANKS)`.

## Evolução (nível = rank)

| Nível | Rank | Aura | Extra |
|---|---|---|---|
| 1 | Iniciante | cinza | — |
| 2 | Aprendiz | azul | — |
| 3 | Dev | verde | — |
| 4 | Full Stack | roxo | óculos |
| 5 | Dev Master | dourado | coroa |
| 6 | Lenda | ciano | coroa |

## Com balão de fala

```tsx
import { DevzinhoFala } from '@/componentes/BalaoFala';

<DevzinhoFala texto="Bora codar?" expressao="feliz" />
```

O texto aparece letra por letra. `BalaoFala` sozinho também existe.

## Onde ele aparece

Login, introdução, onboarding, teste de nível, Hoje (cumprimento + barra de
evolução), Trilhas (ao lado da lição atual e na folha da lição), conceito novo,
feedback de resposta (pula no acerto, treme no erro), resumo da sessão (comemora
e mostra quando sobe de nível), Relâmpago, Liga, Perfil (herói + "Evolução do
Devzinho") e estados vazios.

## Cores da marca

`tema/temas.ts`: azul `#1E90FF` (acento), marinho `#0B1630` (fundo), dourado
`#FFC107` (`ouro`, recompensa), ciano `#4DD0FF` (`acentoSecundario`). A fonte
de títulos e corpo é a Nunito; código e rótulos continuam em JetBrains Mono.

Os ícones do app (`assets/images/`) foram gerados a partir do mesmo desenho.
