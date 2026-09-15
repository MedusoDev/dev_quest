Aqui dentro vai ter ideias que vai ser implementada ao app.
ATENÇÃO: NEM TUDO QUE ESTA AQUI VAI SER IMPLEMENTANDO AGORA, TALVEZ SEJA SO IDEIA PARA O FUTURO OU APENAS UM RASCUNHO.

Organizado para virar cards no Trello: cada `###` é uma ideia/card, com contexto,
por que importa e pontos de atenção. Separado por fase para dar pra montar as
colunas do board (ex: Pré-requisitos / Produto / Comercial / Monetização / Backlog).

---

## ONDE ESTAMOS — estágios do projeto

Isto é a linha do tempo geral do projeto (diferente das `FASE 0-3` logo
abaixo, que organizam ideias por área — feature roadmap, não estágio).

- **Estágio 0 — Desenvolvimento / análise de ideias.** Concluído. É o que
  virou este arquivo inteiro: levantar o que precisa existir antes de
  qualquer pessoa de fora usar o app.
- **Estágio 1 — Pré-beta.** 🔵 Atual. Lançar o projeto pra um grupo fechado
  de beta testers, ver gente de verdade usando, e coletar dado de uso real
  (não mais suposição). O que já está pronto pra isso:
  - Branch `deploy` com pipeline de build/update no EAS (`eas.json`,
    `expo-updates`, canal `preview`).
  - Login por e-mail/senha, convidado e **Google** (as três formas testadas
    e funcionando de ponta a ponta).
  - LGPD mínimo: termo de consentimento, data de nascimento, exclusão de
    conta, filtro de codinome — ver Fase 0 abaixo.
  - Painel de métricas (`/admin`) já coletando frequência de uso, horário,
    taxa de acerto e crescimento de contas — pronto pra observar o pré-beta
    assim que a galera entrar.
  - Página pública (`hosting-legal/`, publicada em
    `call-of-ouroboros.web.app`) servindo de página inicial/privacidade/termos
    pro cadastro OAuth do Google.
- **Estágio 1.5 — Correções.** Depende do que o Estágio 1 mostrar. Reservado
  pra ajustar o que os beta testers acharem de errado ou confuso antes de
  qualquer apresentação — não é pra implementar feature nova, é pra consertar
  o que já existe.
- **Estágio 2 — Apresentação.** Levar os dados e o produto já ajustado pra
  fora (escola, investidor, etc. — ver Fase 2 "Comercial" abaixo). Ainda não
  começou; depende do 1 e do 1.5 estarem resolvidos.

---

## FASE 0 — Pré-requisitos (bloqueiam o piloto em escola)

### LGPD em dia
Ter termo de consentimento (do responsável legal quando o usuário for menor,
já que escola = provavelmente adolescente), política de privacidade clara,
anonimização/pseudonimização dos dados usados em métricas/apresentação, e um
jeito de o usuário deletar conta + dados.

**Status:** primeira versão implementada, pensada pro piloto fechado com beta
testers — ainda não é o texto jurídico formal que uma escola vai exigir.

- **Termo de consentimento**: tela `src/app/termos.tsx` com o texto de uso de
  dados. No cadastro (`entrar.tsx`), checkbox obrigatório de aceite antes de
  criar conta, com timestamp gravado em `PerfilPublico.termosAceitosEm`. Quem
  entra como convidado não tem checkbox (fluxo de um toque só), mas vê um
  aviso com link pros mesmos termos.
- **Data exata de criação**: `PerfilPublico.criadoEmExato` (timestamp ISO
  completo), ao lado de `criadoEm` (só o dia, que o painel de métricas já usa
  pra agrupar por coorte).
- **Data de nascimento em vez de idade solta**: onboarding e configurações
  agora pedem dia/mês/ano (`PerfilPublico.dataNascimento`) em vez de um número
  de idade — idade se calcula dela (`idadeDe` em `nucleo/perfil.ts`) e nunca
  fica desatualizada. Contas antigas com só `idade` gravada perdem esse dado
  na migração; não tinha como preservar sem pedir a data de novo.
- **Codinome sem conotação sexual**: `temConotacaoSexual` em
  `nucleo/perfil.ts`, aplicado dentro de `validarNome` (cadastro e edição).
  Lista curta e conservadora — primeira barreira, não filtro de profanidade
  completo; vale revisitar se aparecer tentativa de burlar com leetspeak ou
  separadores.
- **Excluir a própria conta**: botão "Excluir conta" no Perfil, dupla
  confirmação, chama `excluirConta()` (`dados/conta.ts`) — apaga perfil e
  eventos de sessão no Firestore, todo o SQLite local, e por último a conta
  do Firebase Auth. Se o login foi há muito tempo, o Firebase pode recusar
  apagar a conta em si (`auth/requires-recent-login`) mesmo com os dados já
  apagados — a pessoa precisa sair e entrar de novo antes de tentar excluir
  outra vez; isso está tratado com uma mensagem, não é um caminho quebrado.

**Ainda falta** pra virar de verdade "pronto pra escola": revisão jurídica do
texto de `termos.tsx` (o atual é honesto mas não foi escrito por advogado),
consentimento explícito de responsável legal quando `idadeDe(dataNascimento)`
indicar menor de idade (hoje só existe o aviso genérico "use com um
responsável" dentro do texto), e anonimização de fato nos agregados do painel
de métricas antes de qualquer apresentação externa.

**Por que importa:** dado de criança/adolescente é categoria sensível pela
LGPD. Ir pra escola sem isso pronto queima a credibilidade do piloto — não tem
segunda chance se a escola perceber informalidade com dado de aluno.

**Pontos de atenção:** decidir isso ANTES do piloto, não durante. Se uma
escola perguntar antes de assinar, precisa ter resposta pronta.

### Top da liga global
Um ranking semanal entre TODOS os usuários com conta, sem precisar de código
nem liga fechada — ao lado da liga de amigos que já existia.

**Status:** implementado. `lerLigaGlobal` (`dados/nuvem.ts`) traz o top 50 da
semana por `xpSemana`, ordenado no próprio Firestore. Um alternador
"Amigos / Top global" no topo da tela `(abas)/liga.tsx` alterna entre as duas
visões — sem seta de sobe/desce no modo global, porque promoção/rebaixamento
só faz sentido dentro de um grupo fechado pequeno.

**Por que importa:** dá um destino pra quem ainda não tem liga de amigos pra
entrar, e é uma vitrine de competição que já existe assim que alguém abre o
app pela primeira vez — não depende de convidar ninguém antes.

### Instrumentação de métricas/analytics
Pegar dados de uso para estudo e apresentação do projeto para escolas.

**Status:** primeira versão pessoal já existe, com duas abas próprias em
`src/app/admin/` (mesmo padrão de barra do app de jogador) — **painel**
(`painel.tsx`) e **perfil** (`perfil.tsx`, a própria conta admin: codinome,
foto, sair — sem XP/rank/conquistas, que não existem pra quem não joga). Uma
conta com `admin: true` (gravado à mão no console do Firebase — o app nunca
escreve esse campo, ver `docs/firestore.rules`) nem vira jogador: o portão em
`_layout.tsx` manda direto pra cá, sem onboarding nem abas de jogo. Duas
fontes de dado: o agregado em `perfis` (visão geral, distribuição por rank,
taxa de acerto por faixa de uso, crescimento acumulado de contas —
`src/nucleo/metricas.ts`) e `eventosSessao` — um registro por sessão
concluída com data/hora, só pra isto (`src/nucleo/eventos.ts`), lida só por
quem é admin de verdade (checagem cruzada na regra do Firestore). O painel
mostra gráfico de barras (frequência por dia, horário por hora) e gráfico de
linha (crescimento de contas, taxa de acerto ao longo do tempo —
`componentes/GraficoDeLinha.tsx`), mais uma tabela das sessões mais recentes.
Ainda é só a visão do dono do app, sem nada institucional/por escola.

**Por que importa:** o piloto beta gratuito em escolas só vale a pena se os
dados certos forem coletados desde o primeiro dia — perder essa janela não
tem como recuperar depois.

**Pontos de atenção:** definir ANTES do piloto o que medir: engajamento
(streak, tempo de sessão, frequência), aprendizado (evolução de acerto por
tópico/trilha) ou retenção (voltou no dia seguinte / na semana seguinte).

### Duração da sessão no painel de métricas
Hoje `eventosSessao` registra só a contagem de cards (acertos/erros) e o
horário em que a sessão terminou — não quanto tempo ela durou.

**Por que importa:** tempo de sessão é a métrica de engajamento mais direta
que falta no painel; sem ela dá pra saber "quantas sessões" mas não "quanto
tempo a pessoa realmente fica estudando por dia".

**Pontos de atenção:** precisa marcar o instante de início da sessão (hoje só
existe o de término) e guardar a diferença em `EventoSessao`. Cuidado com
sessão que fica aberta em segundo plano no celular — duração bruta de
timestamp pode inflar se a pessoa minimizar o app no meio.

### Funil de abandono
Quantas pessoas abrem o app vs. começam a diária vs. terminam a diária.

**Por que importa:** o painel de métricas hoje só enxerga quem *terminou*
uma sessão (é o único evento gravado). Sem o funil, não dá pra saber se a
perda de gente acontece na abertura do app, no meio da diária, ou nem chega a
começar — cada causa pede uma correção de produto diferente.

**Pontos de atenção:** exige um evento novo pra "abriu a diária" (não só
"terminou"), gravado em `sessao.tsx`. Cuidado pra não contar sessão pulada
(os até 5 cards que dá pra pular) como abandono — ver `LIMITE_PULOS` em
`nucleo/sessao.ts`.

### Pontos fracos agregados (visão do produto, não da pessoa)
A tela `fracos.tsx` já mostra, pra cada usuário, os cards que mais erra. O
painel de admin não tem o equivalente agregado: quais tópicos/cards o app
inteiro mais erra.

**Por que importa:** aponta onde o *conteúdo* está mal explicado ou mal
calibrado — dado acionável pra melhorar lição, não só pra medir aluno.

**Pontos de atenção:** hoje o campo `erros` por card (`nucleo/revisao.ts`)
só existe no SQLite local, nunca sobe pra nuvem — precisa de uma decisão
consciente de LGPD antes de agregar isso por card em vez de por pessoa (ver
Fase 0), já que aponta padrão de erro por conteúdo, não por identidade.

### Retenção em coorte de verdade (D1/D7/D30)
Hoje o painel mostra "ativos hoje" e "ativos nos últimos 7 dias" como
números soltos. Retenção de coorte agrupa por semana de cadastro (usando
`criadoEm`, que já existe em `PerfilPublico`) e mostra quantos de cada leva
ainda voltam depois de 1, 7 e 30 dias.

**Por que importa:** é a métrica padrão de produto pra saber se o app
prende de verdade, e é o tipo de gráfico que mais impressiona numa
apresentação pra escola/investidor — mostra tendência, não uma foto do dia.

**Pontos de atenção:** com poucos usuários (fase de piloto) o gráfico fica
ruidoso — vale esperar ter volume mínimo por coorte antes de confiar nele.

### Paginação em `eventosSessao`
`lerEventosSessao()` (`src/dados/nuvem.ts`) hoje traz só os 3000 eventos mais
recentes, sem cursor nem filtro por período.

**Por que importa:** funciona bem agora, mas não escala — com uso real
sustentado a coleção passa de 3000 eventos rápido, e o painel silenciosamente
passa a mostrar só uma janela recente sem avisar que cortou dado mais antigo.

**Pontos de atenção:** resolver com filtro por intervalo de data (ex:
`where('quando', '>=', inicioDoPeriodo)`) em vez de cursor de paginação
tradicional — o painel quase sempre quer "os últimos N dias", não "a página
2 de eventos".
Toda informação que contribuir é válida, mas sem foco vira ruído.

---

## FASE 1 — Produto / Conteúdo

### Enriquecer o núcleo do glossário
Hoje só tem "sobre" o termo — pouco conteúdo. Adicionar mais informações e
perguntas pra "rechear o peru": cada termo com definição, exemplo de código,
perguntas relacionadas linkando de volta pros cards de exercício, e busca.

**Por que importa:** vira fonte de referência de verdade, não só exercício.
Aumenta valor percebido e dá motivo pro usuário voltar ao app fora da sessão
diária (retenção e, futuramente, SEO se tiver versão web).

---

## FASE 2 — Comercial (B2B / instituições de ensino)

### Vender para instituições de ensino (escolas, faculdades)
Foco em usuários que estão iniciando em programação.

**Por que importa:** canal de distribuição em volume, diferente de crescimento
usuário-a-usuário.

**Pontos de atenção:** vender pra escola sem um pacote B2B diferenciado é só
dar o app de graça. Precisa de algo que só instituição usa: dashboard do
professor, atribuição de trilhas pra turma, relatório de desempenho por
aluno. Sem isso não é "produto institucional", é o mesmo app free.

### Piloto beta gratuito em escolas
Distribuir a versão beta gratuitamente em algumas escolas, coletar
informações e uso dos usuários, e usar isso como material de apresentação do
projeto (para outras escolas/investidores).

**Depende de:** LGPD em dia + instrumentação de métricas (Fase 0) já
prontas antes de começar.

**Por que importa:** vira o case de entrada — prova social e dados reais pra
negociar com a próxima escola.

### ~~Trocar o nome "Ouroboros"~~ — feito: agora é DevQuest
Nome antigo era difícil de falar/lembrar. Trocado para **DevQuest** em
setembro de 2026 (código, docs, assets e repositório GitHub), ainda antes de
qualquer usuário instalado — era o momento mais barato pra fazer essa troca.

**Por que importava:** nome é ativo de marca. Trocar depois de já ter
usuários instalados e reviews na loja custa caro (rebranding, reviews
perdidos, links quebrados, ASO do zero).

**Pontos de atenção:** o Firebase compartilhado (`call-of-ouroboros`) e o
`android.package` (`com.ouroboros.app`) ainda não foram trocados — ficam como
estão até o backend próprio do clone de faculdade estar pronto (ver
`docs/CONFIGURAR_FIREBASE.md`).

---

## FASE 3 — Monetização

### Sistema de planos (free / pago)
Toda conta vai ter um plano associado. Por padrão, toda conta criada nasce no
plano **free** — os planos pagos (o que cada um libera, preço, etc.) ainda
não estão desenhados, só a existência do campo.

**Status:** infraestrutura mínima já existe — `PerfilPublico.plano` em
`src/nucleo/perfil.ts` (tipo `PlanoId = 'free' | 'plus'`, ainda sem nenhuma
feature amarrada a `'plus'`), `PLANO_PADRAO = 'free'` aplicado em toda conta
nova (`perfilVazio` em `src/dados/nuvem.ts`), e trava no
`docs/firestore.rules` para o campo não poder ser mudado pelo cliente — só
vira algo diferente de `'free'` por uma confirmação de pagamento do lado do
servidor (Admin SDK), nunca por escrita direta do app.

**Por que importa:** ter o campo pronto agora evita migração de dados depois,
quando o primeiro plano pago (provavelmente a IA para tirar dúvidas, abaixo)
estiver pronto — toda conta já existente já tem `plano: 'free'` explícito.

**Pontos de atenção:** o "o que cada plano inclui" ainda precisa ser
desenhado — este item é só o esqueleto. Cada feature paga nova (IA, sem
anúncio, etc.) deve checar `perfil.plano` antes de liberar, nunca assumir.

### IA para tirar dúvidas (plano pago)
Pega as questões que o usuário errou e permite usar IA pra tirar a dúvida
sobre elas. Exclusivo para usuários pagos.

**Por que importa:** trava de monetização forte porque entrega valor
tangível e mensurável ("a IA te ajudou exatamente onde você errou").

**Pontos de atenção:** custo de API por usuário pago pode corroer margem se
não tiver limite (ex: N perguntas/dia no plano). Dá pra prototipar rápido
pra validar antes de industrializar.

### Anúncio após cada ciclo de cards completo
Fonte de receita do plano free.

**Por que importa:** monetiza quem não paga, sem depender só de conversão.

**Pontos de atenção:** público é gente começando a programar (muitos jovens/
estudantes) — anúncio forçado e agressivo demais afasta antes de converter
em pago. Considerar anúncio opcional (assistir pra ganhar bônus de XP) pelo
menos no early stage, em vez de interstitial obrigatório.

---

## Ordem sugerida de execução

1. LGPD + instrumentação de métricas (Fase 0) — pré-requisito do piloto.
2. Glossário robusto (Fase 1) — barato de fazer, aumenta valor percebido.
3. Piloto em escola (Fase 2) — já com Fase 0 pronta.
4. Pacote B2B (dashboard professor etc.) e decisão do novo nome, em paralelo
   ao piloto.
5. Monetização — IA paga e anúncios (Fase 3) — só faz sentido com base de
   usuários ativa formada pelo piloto.
marca como meduso.dev)