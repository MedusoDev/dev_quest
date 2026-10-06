# DevQuest — custos e precificação

Simulação de quanto custa construir e manter o DevQuest como SaaS, feita para
o trabalho de DevOps. Os números vêm da planilha de custos do grupo e da
apresentação [Viabilidade financeira DevQuest](https://www.canva.com/d/Lu6u-Ub_3p7jdRH).

> Todos os valores estão em reais (R$) e são estimativas. Para testar outros
> cenários, edite as células de premissa da
> [planilha](https://docs.google.com/spreadsheets/d/1Mmqr2-6eJIs9BF5-yY8Ow4A875P-GvldU3b_gk9pxqE/edit)
> e atualize este documento.

---

## 1. Equipe e senioridade

| Integrante | Nível | Papel no projeto |
|---|---|---|
| Gabriel de Oliveira Barros | Especialista | backend, deploy e coordenação |
| Anderson Djalma Santos Pinto | Sênior | frontend |
| Brian Samuel de Barros Santos | Júnior | backend |
| Ryan Nunes da Silva | Júnior | frontend |
| Matheus Wendell de Paula Souza | Júnior | testes / QA |

## 2. Valor por hora de cada integrante

Valor/hora = salário mensal ÷ 160 h (8 h × 20 dias úteis). Os salários são
faixas de mercado de 2026 (Glassdoor / Código Fonte TV) ajustadas para
Alagoas. Encargos trabalhistas não estão incluídos.

| Nível | Salário/mês | Valor/hora | Integrantes |
|---|---|---|---|
| Especialista | R$ 14.000 | R$ 87,50 | 1 |
| Sênior | R$ 10.000 | R$ 62,50 | 1 |
| Júnior | R$ 3.500 | R$ 21,88 | 3 |
| **Equipe completa** | | **R$ 215,63** | 5 |

## 3. Custo do projeto (SaaS)

Premissas: MVP construído em **3 meses**, com **20 h/semana por integrante**
(80 h/mês).

### Investimento para construir o MVP

| Item | Cálculo | Valor |
|---|---|---|
| Especialista | R$ 87,50 × 80 h × 3 meses | R$ 21.000 |
| Sênior | R$ 62,50 × 80 h × 3 meses | R$ 15.000 |
| Júniores (3) | R$ 21,88 × 80 h × 3 meses × 3 | R$ 15.750 |
| Infra + ferramentas | R$ 550 × 3 meses | R$ 1.650 |
| **Total investido** | | **R$ 53.400** |

### Custo mensal de operação (após o lançamento)

| Item | Valor/mês |
|---|---|
| Infraestrutura (Firebase: Firestore, Auth, Storage) | R$ 400 |
| Ferramentas (Expo EAS Build, domínio, e-mail) | R$ 150 |
| Marketing e parcerias com escolas | R$ 300 |
| **Custos fixos** | **R$ 850** |
| Taxa de pagamento / impostos (8% do MRR individual) | R$ 96 |
| **Custo total mensal** | **R$ 946** |
| Custo por cliente pagante | R$ 2,78 |

### Retorno

- Lucro operacional: R$ 5.666 (MRR) − R$ 946 = **R$ 4.720/mês**
- Payback do investimento: R$ 53.400 ÷ R$ 4.720 ≈ **11 meses**

## 4. Planos

| Plano | Canal | O que inclui | Preço/mês | Quem paga | Ativos esperados | MRR |
|---|---|---|---|---|---|---|
| Free | Individual (B2C) | primeiras lições, com anúncios | R$ 0,00 | ninguém | 2.000 | R$ 0 |
| Premium Individual | Individual (B2C) | todas as lições e as 5 linguagens, sem anúncios | R$ 29,90 | aluno | 40 | R$ 1.196 |
| Escola (por aluno) | Institucional (B2B2C) | Premium completo para os alunos matriculados | R$ 14,90 | escola | 300 | R$ 4.470 |

**Totais:** MRR R$ 5.666 · ARR R$ 67.992 · 340 clientes pagantes · ARPU
R$ 16,66.

## 5. Ponto de equilíbrio

- 31 assinantes individuais, se só esse canal existisse.
- 58 alunos via escola, se só esse canal existisse.
- Receita mínima na mistura atual dos dois canais: R$ 865/mês.
- Margem de segurança atual: 555,3% acima do mínimo.

## 6. Unit economics por canal

| Métrica | Individual (B2C) | Escolas (B2B2C) |
|---|---|---|
| Novos clientes | 5 assinaturas/mês | 1 escola/semestre (150 alunos) |
| CAC | R$ 10,00 | R$ 500 por escola (R$ 3,33 por aluno) |
| Churn mensal | 8% | 2% |
| Tempo de vida médio | 12,5 meses | 50 meses |
| ARPU | R$ 29,90 | R$ 14,90 |
| LTV | R$ 311,37 | R$ 620,66 |
| LTV/CAC | 31,1x | 186,2x |
| Payback | 0,4 mês | 0,3 mês |

Margem bruta: 83,3%. O canal Escolas responde por 79% do MRR, tem churn
menor e o melhor LTV/CAC — é o motor principal do negócio.
