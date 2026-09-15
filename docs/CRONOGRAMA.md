# DevQuest — Cronograma

> As datas das entregas 2 e final ainda não foram divulgadas pelo professor;
> os meses de outubro a dezembro são uma estimativa e serão ajustados.

## Equipe e papéis

| Membro | Papel | Frente principal |
|---|---|---|
| Gabriel de Oliveira Barros | Tech Leader / Back end | arquitetura, núcleo (`src/nucleo/`), dados e Firebase |
| Anderson Djalma Santos Pinto | Designer / Front end | identidade visual, telas em `src/app/` e `src/componentes/` |
| Ryan Nunes da Silva | Front end — UX/UI | protótipos de tela, fluxo de onboarding e sessão |
| Brian Samuel de Barros Santos | Documentação / Back end | LaTeX, site da equipe, conteúdo das lições |
| Matheus Wendell de Paula Souza | Testes / QA | testes automatizados (`vitest`), testes com usuários, relatório de bugs |

---

## Visão geral por fase

```mermaid
gantt
    title DevQuest — 2026.2
    dateFormat  YYYY-MM-DD
    axisFormat  %d/%m

    section Fase 0 · Base (antes da disciplina)
    App base: conta, diária, repetição espaçada, 5 linguagens   :done, f0, 2026-06-01, 2026-08-31

    section Fase 1 · Organização (Entrega 1 — 14/09)
    Clone do projeto e renomeação para DevQuest                  :done, f1a, 2026-09-01, 2026-09-10
    Site da equipe (Google Sites)                                :done, f1b, 2026-09-05, 2026-09-14
    GitHub com colaboradores                                     :done, f1c, 2026-09-08, 2026-09-14
    Documentação Markdown (README, arquitetura, cronograma)      :active, f1d, 2026-09-10, 2026-09-20
    Documento LaTeX — estrutura inicial                          :active, f1e, 2026-09-12, 2026-09-25
    Design Thinking documentado no site                          :done, f1f, 2026-09-08, 2026-09-14

    section Fase 2 · Backend próprio e onboarding da equipe
    Firebase próprio da equipe (docs/CONFIGURAR_FIREBASE.md)     :f2a, 2026-09-16, 2026-09-30
    Reativar login e-mail/senha e Google                         :f2b, 2026-09-20, 2026-10-05
    Todos os membros rodando o app no celular                    :f2c, 2026-09-16, 2026-09-25
    Primeiro commit de cada membro                               :f2d, 2026-09-16, 2026-09-25

    section Fase 3 · Produto (Entrega 2 — a confirmar)
    Revisão de UX das telas Hoje, Sessão e Onboarding            :f3a, 2026-10-01, 2026-10-20
    Novas lições (4ª trilha por linguagem)                       :f3b, 2026-10-05, 2026-11-10
    Glossário com exemplos de código e busca                     :f3c, 2026-10-15, 2026-11-05
    Cobertura de testes do núcleo (diaria, sessao, gamificacao)  :f3d, 2026-10-01, 2026-10-31
    LaTeX — requisitos, arquitetura e casos de uso               :f3e, 2026-10-01, 2026-10-31

    section Fase 4 · Validação
    Teste com usuários (grupo fechado, 10–15 pessoas)            :f4a, 2026-11-03, 2026-11-21
    Correções a partir do feedback                               :f4b, 2026-11-10, 2026-11-30
    Métricas do piloto no painel admin                           :f4c, 2026-11-03, 2026-11-30

    section Fase 5 · Entrega final (a confirmar)
    LaTeX — resultados, testes e conclusão                       :f5a, 2026-11-20, 2026-12-08
    APK final (EAS build preview)                                :f5b, 2026-12-01, 2026-12-08
    Apresentação                                                 :milestone, f5c, 2026-12-10, 0d
```

---

## Detalhamento

### Fase 0 — Base do app *(concluída, antes da disciplina)*

O DevQuest nasceu do projeto pessoal `ouroboros_app`. O que já existia ao
iniciar o trabalho de faculdade:

- Conta (e-mail/senha, Google, convidado), onboarding com data de nascimento,
  nível e foco de estudo, teste de nível e tour de introdução.
- A diária com repetição espaçada, modo Relâmpago, trilhas, glossário,
  pontos fracos, liga (amigos e top global), perfil com XP/ranks/conquistas.
- Conteúdo de 5 linguagens (C#, Java, JavaScript, PHP, Python) — 3 trilhas
  × 3 lições cada.
- Termos de uso e exclusão de conta (LGPD mínimo), temas de cor, lembrete
  diário, painel admin de métricas.

### Fase 1 — Organização *(Entrega 1 — 14/09)*

| Item | Responsável | Status |
|---|---|---|
| Clone do repositório e renomeação para DevQuest (v1.1.0) | Gabriel | ✅ |
| Site da equipe: Início, Projeto, Cronograma, Equipe | Anderson, Brian | ✅ (ajustes de foto/contato pendentes) |
| Design Thinking (imersão → testes) documentado no site | Gabriel, Ryan | ✅ |
| GitHub com os 5 colaboradores | Gabriel | ⚠️ 1 convite pendente |
| README, `docs/ARQUITETURA.md`, `docs/CRONOGRAMA.md` | Gabriel, Brian | 🔵 em andamento |
| Documento LaTeX — capa, introdução, arquitetura | Brian | 🔵 em andamento |

### Fase 2 — Backend próprio e onboarding da equipe *(16/09 – 05/10)*

| Item | Responsável |
|---|---|
| Criar o Firebase da equipe seguindo `docs/CONFIGURAR_FIREBASE.md` | Gabriel |
| Reativar os botões reais de login (hoje todos caem no convidado "admin") | Gabriel, Brian |
| Cada membro roda o app no próprio celular via Expo Go | todos |
| Cada membro faz o primeiro commit (ex.: `EQUIPE.md`, correção de lição) | todos |

### Fase 3 — Produto *(outubro; Entrega 2 — data a confirmar)*

| Item | Responsável |
|---|---|
| Revisão de UX das telas Hoje, Sessão e Onboarding | Ryan, Anderson |
| 4ª trilha para cada linguagem (+15 lições) | Brian, Gabriel |
| Glossário com exemplo de código e busca | Anderson, Brian |
| Ampliar testes `vitest` de `diaria`, `sessao` e `gamificacao` | Matheus |
| LaTeX: requisitos funcionais/não funcionais, arquitetura, casos de uso | Brian, Matheus |

### Fase 4 — Validação *(novembro)*

| Item | Responsável |
|---|---|
| Teste com grupo fechado de 10–15 usuários (APK via EAS `preview`) | Matheus, Ryan |
| Coleta de métricas no painel admin (frequência, acerto, retenção) | Gabriel |
| Correções priorizadas a partir do feedback | todos |

### Fase 5 — Entrega final *(dezembro; data a confirmar)*

| Item | Responsável |
|---|---|
| LaTeX: resultados dos testes, discussão e conclusão | Brian, Matheus |
| APK final e site atualizado | Gabriel, Anderson |
| Apresentação | todos |
