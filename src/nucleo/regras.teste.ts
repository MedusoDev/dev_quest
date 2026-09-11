import { describe, expect, it } from 'vitest';

import { diferencaEmDias, hoje, somarDias } from './datas';
import { agendar, ESCADA, estaDominado, estaVencido, type Revisao } from './revisao';
import {
  recordeSequencia,
  reguaDaSemana,
  calcularSequencia,
  CONGELAMENTOS_POR_MES,
  DIAS_DE_HISTORICO,
  progressoInicial,
  rankPara,
  registrarDia,
  xpDoCard
} from './gamificacao';
import { nivelDe, ordenarLicao, ordenarParaSessao } from './dificuldade';
import { cardAtual, iniciarSessao, responder, resultado, terminou } from './sessao';
import { avaliar, normalizarCodigo, respostaVazia, type Resposta } from './resposta';
import { todasAsLicoes, todosOsCards, type Card } from './conteudo';
import {
  desempenhoNosDificeis,
  licoesCompletadas,
  montarDiaria,
  montarTesteDeNivel,
  pontosFracos,
  sugestaoDeNivel
} from './diaria';
import { recomendarNivel } from './perfil';

/**
 * Tudo aqui roda em Node puro, sem emulador. É o que erra em silêncio e só
 * apareceria semanas depois — na sequência errada, ou na diária que seca.
 */

/* ───────────────────────────── datas ───────────────────────────── */

describe('datas', () => {
  it('atravessa a virada do mês', () => {
    expect(somarDias('2026-01-31', 1)).toBe('2026-02-01');
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('a diferença é positiva quando o fim vem depois', () => {
    expect(diferencaEmDias('2026-08-20', '2026-08-22')).toBe(2);
    expect(diferencaEmDias('2026-08-22', '2026-08-22')).toBe(0);
  });
});

/* ──────────────────────────── revisão ──────────────────────────── */

describe('ciclo de revisão', () => {
  it('acertar sobe um degrau por vez', () => {
    let e = agendar(null, true);
    expect(e.nivel).toBe(1);
    expect(e.proximaEm).toBe(somarDias(hoje(), 1));

    e = agendar(e, true);
    expect(e.proximaEm).toBe(somarDias(hoje(), 3));

    e = agendar(e, true);
    expect(e.proximaEm).toBe(somarDias(hoje(), 7));
  });

  it('errar joga o card de volta para o começo da escada', () => {
    let e = agendar(null, true);
    e = agendar(e, true);
    e = agendar(e, true);

    const depois = agendar(e, false);
    expect(depois.nivel).toBe(0);
    expect(depois.erros).toBe(1);
    expect(depois.proximaEm).toBe(somarDias(hoje(), 1));
  });

  it('a escada tem topo e o card fica dominado nele', () => {
    let e: Revisao | null = null;
    for (let i = 0; i < ESCADA.length + 3; i += 1) e = agendar(e, true);

    expect(e!.nivel).toBe(ESCADA.length);
    expect(estaDominado(e)).toBe(true);
  });

  it('card nunca visto conta como disponível', () => {
    expect(estaVencido(null)).toBe(true);
    expect(estaVencido({ proximaEm: somarDias(hoje(), 3) } as Revisao)).toBe(false);
  });
});

/* ─────────────────────────── sequência ─────────────────────────── */

describe('sequência de dias', () => {
  const base = { ...progressoInicial(), sequencia: 5, congelamentos: 2 };

  it('a primeira diária da vida começa em 1', () => {
    expect(calcularSequencia({ ...base, sequencia: 0, ultimaDiaria: null }).sequencia).toBe(1);
  });

  it('diária feita ontem soma um dia', () => {
    const f = calcularSequencia({ ...base, ultimaDiaria: somarDias(hoje(), -1) });
    expect(f.sequencia).toBe(6);
    expect(f.congelamentoGasto).toBe(false);
  });

  it('segunda diária no mesmo dia não soma de novo', () => {
    expect(calcularSequencia({ ...base, ultimaDiaria: hoje() }).sequencia).toBe(5);
  });

  it('um dia pulado gasta congelamento e mantém a sequência', () => {
    const f = calcularSequencia({ ...base, ultimaDiaria: somarDias(hoje(), -2) });
    expect(f.sequencia).toBe(6);
    expect(f.congelamentos).toBe(1);
    expect(f.congelamentoGasto).toBe(true);
  });

  it('sem congelamento sobrando, o dia pulado zera', () => {
    const f = calcularSequencia({
      ...base,
      congelamentos: 0,
      ultimaDiaria: somarDias(hoje(), -2)
    });
    expect(f.sequencia).toBe(1);
  });

  it('dois dias pulados zeram mesmo com congelamento', () => {
    expect(calcularSequencia({ ...base, ultimaDiaria: somarDias(hoje(), -3) }).sequencia).toBe(1);
  });

  it('a cota de congelamentos volta ao virar o mês', () => {
    const f = calcularSequencia({
      ...base,
      congelamentos: 0,
      mesCongelamentos: '2020-01',
      ultimaDiaria: somarDias(hoje(), -1)
    });
    expect(f.congelamentos).toBe(CONGELAMENTOS_POR_MES);
  });

  it('o histórico não repete o dia nem cresce sem limite', () => {
    const um = registrarDia([]);
    expect(registrarDia(um)).toEqual(um);

    const muitos = Array.from({ length: DIAS_DE_HISTORICO + 40 }, (_, i) =>
      somarDias('2020-01-01', i)
    );
    const atualizado = registrarDia(muitos);
    expect(atualizado.length).toBe(DIAS_DE_HISTORICO);
    expect(atualizado.at(-1)).toBe(hoje());
  });
});

/* ────────────────────────── ranks e XP ─────────────────────────── */

describe('ranks e XP', () => {
  it('escolhe a faixa certa', () => {
    expect(rankPara(0).atual.nome).toBe('Ovo');
    expect(rankPara(199).atual.nome).toBe('Ovo');
    expect(rankPara(200).atual.nome).toBe('Cria');
    expect(rankPara(999999).atual.nome).toBe('Ouroboros');
  });

  it('no topo a barra fica cheia, não dividida por zero', () => {
    expect(rankPara(999999).proximo).toBeNull();
    expect(rankPara(999999).progresso).toBe(1);
  });

  it('a barra enche proporcionalmente dentro da faixa', () => {
    const meio = rankPara(400); // entre Cria (200) e Serpente (600)
    expect(meio.progresso).toBe(0.5);
    expect(meio.faltam).toBe(200);
  });

  it('errar antes de acertar vale menos XP', () => {
    expect(xpDoCard(false)).toBe(10);
    expect(xpDoCard(true)).toBe(4);
  });
});

/* ──────────────────────── dificuldade ──────────────────────────── */

describe('ordem por dificuldade', () => {
  const trio = [
    { id: 'dificil', nivel: 3 },
    { id: 'leve', nivel: 1 },
    { id: 'medio', nivel: 2 }
  ];

  it('a lição sobe de leve para difícil', () => {
    expect(ordenarLicao(trio).map((c) => c.id)).toEqual(['leve', 'medio', 'dificil']);
  });

  it('o campo explícito manda sobre o palpite pelo tipo', () => {
    expect(nivelDe({ tipo: 'palavra-chave' })).toBe(1);
    expect(nivelDe({ tipo: 'escreva' })).toBe(3);
    expect(nivelDe({ tipo: 'escreva', nivel: 1 })).toBe(1);
  });

  it('a diária sobe de dificuldade mas fecha com um card leve', () => {
    const cards = [
      { id: 'l1', nivel: 1 },
      { id: 'l2', nivel: 1 },
      { id: 'm1', nivel: 2 },
      { id: 'd1', nivel: 3 },
      { id: 'd2', nivel: 3 }
    ];

    const ordem = ordenarParaSessao(cards);
    expect(nivelDe(ordem.at(-1)!)).toBe(1);
    expect(ordem[0]!.id).toBe('l1');
    expect(ordem.length).toBe(cards.length);
  });
});

/* ────────────────────── motor de sessão ────────────────────────── */

const falsos = [
  { id: 'a', tipo: 'palavra-chave' },
  { id: 'b', tipo: 'escreva' },
  { id: 'c', tipo: 'palavra-chave' }
] as unknown as Card[];

describe('motor de sessão', () => {
  it('acertar tudo de primeira fecha com XP cheio', () => {
    let s = iniciarSessao(falsos);
    for (let i = 0; i < 3; i += 1) s = responder(s, true);

    expect(terminou(s)).toBe(true);
    const fim = resultado(s);
    expect(fim.xpCards).toBe(30);
    expect(fim.xpTotal).toBe(50); // 30 dos cards + 20 de bônus
    expect(fim.semErro).toBe(true);
  });

  it('card errado volta para o fim da fila', () => {
    let s = iniciarSessao(falsos);

    s = responder(s, false);
    expect(cardAtual(s)!.id).toBe('b');
    expect(s.concluidos).toBe(0);

    s = responder(s, true);
    s = responder(s, true);
    expect(terminou(s)).toBe(false);
    expect(cardAtual(s)!.id).toBe('a');

    s = responder(s, true);
    expect(terminou(s)).toBe(true);

    const fim = resultado(s);
    expect(fim.xpCards).toBe(24); // 10 + 10 de primeira, 4 do que errou antes
    expect(fim.errados.map((c) => c.id)).toEqual(['a']);
  });

  it('errar o último card não deixa a sessão terminar devendo', () => {
    let s = iniciarSessao([falsos[0]!]);

    s = responder(s, false);
    expect(terminou(s)).toBe(false);
    expect(cardAtual(s)!.id).toBe('a');

    s = responder(s, true);
    expect(terminou(s)).toBe(true);
  });

  it('só os cards de escrever contam para o contador de escrita', () => {
    let s = iniciarSessao(falsos);
    for (let i = 0; i < 3; i += 1) s = responder(s, true);
    expect(resultado(s).escritaAcertos).toBe(1);
  });
});

/* ───────────────────── comparação de código ────────────────────── */

describe('resposta escrita', () => {
  it('espaço em volta de pontuação não muda a resposta', () => {
    const certo = normalizarCodigo('private int _vidas = 3;');
    expect(normalizarCodigo('private int _vidas=3;')).toBe(certo);
    expect(normalizarCodigo('  private   int _vidas = 3;  ')).toBe(certo);
  });

  it('maiúsculas continuam contando', () => {
    expect(normalizarCodigo('public void Zerar()')).not.toBe(normalizarCodigo('public void zerar()'));
  });

  it('faltar uma palavra continua sendo erro', () => {
    expect(normalizarCodigo('private readonly string _nome;')).not.toBe(
      normalizarCodigo('private string _nome;')
    );
  });
});

/* ──────────────── o conteúdo real, card a card ─────────────────── */

function respostaCerta(card: Card): Resposta {
  switch (card.tipo) {
    case 'lacuna':
      return [...(card.respostas ?? [])];
    case 'escreva':
      return card.resposta ?? '';
    case 'montar-linha':
      return (card.partes ?? []).map((_, i) => i);
    case 'ache-o-erro':
      return card.linhaErrada ?? 0;
    default:
      return card.correta ?? 0;
  }
}

function respostaErrada(card: Card): Resposta {
  switch (card.tipo) {
    case 'lacuna':
      return (card.respostas ?? []).map(() => '@@');
    case 'escreva':
      return 'nada a ver';
    case 'montar-linha':
      return (card.partes ?? []).map((_, i) => i).reverse();
    case 'ache-o-erro':
      return card.linhaErrada === 0 ? 1 : 0;
    default:
      return card.correta === 0 ? 1 : 0;
  }
}

describe('os cards do conteúdo', () => {
  const cards = todosOsCards();

  it('todos foram carregados', () => {
    expect(cards.length).toBe(418);
    expect(todasAsLicoes().length).toBe(45);
  });

  it('todo card tem nível, enunciado e explicação', () => {
    for (const card of cards) {
      expect([1, 2, 3], `${card.id} sem nível válido`).toContain(card.nivel);
      expect(card.enunciado, `${card.id} sem enunciado`).toBeTruthy();
      expect(card.explicacao, `${card.id} sem explicação`).toBeTruthy();
    }
  });

  it('todo gabarito é julgado como certo', () => {
    for (const card of cards) {
      expect(avaliar(card, respostaCerta(card)), `${card.id} julgado ERRADO`).toBe(true);
    }
  });

  it('nenhuma resposta errada é julgada como certa', () => {
    for (const card of cards) {
      expect(avaliar(card, respostaErrada(card)), `${card.id} aceitou resposta errada`).toBe(false);
    }
  });

  it('o botão sabe quando ainda falta responder', () => {
    for (const card of cards) {
      expect(respostaVazia(card, null), `${card.id}: null deveria contar como vazio`).toBe(true);
      expect(respostaVazia(card, respostaCerta(card)), `${card.id}: gabarito visto como vazio`).toBe(
        false
      );
    }
  });

  it('toda lição tem conceito e ao menos um card de escrever', () => {
    for (const licao of todasAsLicoes()) {
      expect(licao.conceito.texto.length, `${licao.id} sem conceito`).toBeGreaterThan(0);
      expect(
        licao.cards.some((c) => c.tipo === 'escreva'),
        `${licao.id} nunca pede para escrever`
      ).toBe(true);
    }
  });
});

/* ───────────────────── montagem da diária ──────────────────────── */

describe('montagem da diária', () => {
  const idiomas = ['csharp', 'javascript'] as const;

  it('o primeiro dia vem com a meta cheia', () => {
    const { cards, apresentar } = montarDiaria({
      revisoes: new Map(),
      concluidas: new Set(),
      linguagens: [...idiomas],
      meta: 10
    });

    expect(cards.length).toBe(10);
    expect(apresentar.length).toBe(2); // uma lição nova por linguagem
  });

  it('a diária não seca: em poucos dias todo card aparece', () => {
    const vistos = new Map();
    let concluidas = new Set<string>();

    for (let dia = 0; dia < 25; dia += 1) {
      const { cards } = montarDiaria({
        revisoes: vistos,
        concluidas,
        linguagens: [...idiomas],
        meta: 10
      });
      if (cards.length === 0) break;

      for (const card of cards) vistos.set(card.id, agendar(vistos.get(card.id), true));
      concluidas = new Set([...concluidas, ...licoesCompletadas(vistos, concluidas)]);
    }

    // A simulação só roda csharp+javascript (`idiomas`, acima) — comparar
    // contra o total do app inteiro contaria também os cards de python/java/php
    // que este teste nunca pediu para a diária trazer.
    const cardsDosIdiomas = todosOsCards().filter((card) => (idiomas as readonly string[]).includes(card.linguagem));
    const licoesDosIdiomas = todasAsLicoes().filter((licao) => (idiomas as readonly string[]).includes(licao.linguagem));

    expect(vistos.size).toBe(cardsDosIdiomas.length);
    expect(concluidas.size).toBe(licoesDosIdiomas.length);
  });

  it('pontos fracos ordenam do pior para o menos ruim', () => {
    const comErros = new Map(
      todosOsCards()
        .slice(0, 5)
        .map((card, i) => [card.id, { ...agendar(null, false), erros: 5 - i }])
    );

    const fracos = pontosFracos(comErros);
    expect(fracos[0]!.erros).toBe(5);
    expect(fracos.length).toBe(5);
  });
});

/* ─────────────────────── teste de nível ─────────────────────────── */

describe('teste de nível do onboarding', () => {
  it('monta 5 cards — 3 leve, 1 médio, 1 difícil — de tipo múltipla escolha', () => {
    for (const idioma of ['csharp', 'javascript'] as const) {
      const cards = montarTesteDeNivel(idioma);

      expect(cards.length).toBe(5);
      expect(cards.every((c) => c.linguagem === idioma)).toBe(true);
      expect(cards.every((c) => c.correta !== undefined)).toBe(true);

      const niveis = cards.map((c) => c.nivel).sort();
      expect(niveis).toEqual([1, 1, 1, 2, 3]);
    }
  });

  it('recomenda por faixa de acerto', () => {
    expect(recomendarNivel(0)).toBe('iniciante');
    expect(recomendarNivel(1)).toBe('iniciante');
    expect(recomendarNivel(2)).toBe('intermediario');
    expect(recomendarNivel(3)).toBe('intermediario');
    expect(recomendarNivel(4)).toBe('avancado');
    expect(recomendarNivel(5)).toBe('avancado');
  });
});

/** Vencido hoje mesmo, com `erros` fixado — pra entrar na fila de revisão sem depender de datas. */
function revisaoVencida(erros = 0): Revisao {
  return { nivel: 1, proximaEm: hoje(), acertosSeguidos: 1, erros, vistoEm: hoje() };
}

/* ──────────────── diária com viés de dificuldade por nível ─────── */

describe('composição da diária por nível', () => {
  it('avançado sai com bem mais difícil que iniciante, quando a revisão permite', () => {
    // Tudo já visto e vencido, nada de novo — o dia inteiro vem da revisão,
    // que é onde o viés por nível age.
    const revisoes = new Map(todosOsCards().map((c) => [c.id, revisaoVencida()]));
    const concluidas = new Set(todasAsLicoes().map((l) => l.id));
    const idiomas = ['csharp', 'javascript'] as const;

    const contarDificeis = (cards: Card[]) => cards.filter((c) => nivelDe(c) === 3).length;

    const avancado = montarDiaria({
      revisoes,
      concluidas,
      linguagens: [...idiomas],
      meta: 10,
      nivel: 'avancado'
    });
    const iniciante = montarDiaria({
      revisoes,
      concluidas,
      linguagens: [...idiomas],
      meta: 10,
      nivel: 'iniciante'
    });

    expect(avancado.cards.length).toBe(10);
    expect(iniciante.cards.length).toBe(10);
    // Alvo é 7 difícil pro avançado e 2 pro iniciante — folga só pro
    // arredondamento e pra disponibilidade real do conteúdo.
    expect(contarDificeis(avancado.cards)).toBeGreaterThanOrEqual(5);
    expect(contarDificeis(iniciante.cards)).toBeLessThanOrEqual(4);
    expect(contarDificeis(avancado.cards)).toBeGreaterThan(contarDificeis(iniciante.cards));
  });

  it('sem nível definido, continua sorteio puro — não quebra quem nunca testou', () => {
    const revisoes = new Map(todosOsCards().map((c) => [c.id, revisaoVencida()]));
    const concluidas = new Set(todasAsLicoes().map((l) => l.id));

    const diaria = montarDiaria({
      revisoes,
      concluidas,
      linguagens: ['csharp', 'javascript'],
      meta: 10,
      nivel: null
    });

    expect(diaria.cards.length).toBe(10);
  });
});

/* ──────────────────── sugestão de subir de nível ───────────────── */

describe('sugestão de subir de nível', () => {
  it('sugere o próximo degrau com taxa alta e amostra suficiente', () => {
    const dificeis = todosOsCards().filter((c) => nivelDe(c) !== 1).slice(0, 20);
    const revisoes = new Map(dificeis.map((c) => [c.id, revisaoVencida(0)]));

    expect(sugestaoDeNivel(revisoes, 'iniciante')).toBe('intermediario');
    expect(sugestaoDeNivel(revisoes, 'intermediario')).toBe('avancado');
    expect(sugestaoDeNivel(revisoes, 'avancado')).toBeNull();
    expect(sugestaoDeNivel(revisoes, null)).toBeNull();
  });

  it('não sugere com amostra pequena', () => {
    const dificeis = todosOsCards().filter((c) => nivelDe(c) !== 1).slice(0, 5);
    const revisoes = new Map(dificeis.map((c) => [c.id, revisaoVencida(0)]));

    expect(sugestaoDeNivel(revisoes, 'iniciante')).toBeNull();
  });

  it('não sugere com taxa de acerto baixa', () => {
    const dificeis = todosOsCards().filter((c) => nivelDe(c) !== 1).slice(0, 20);
    const revisoes = new Map(
      dificeis.map((c, i) => [c.id, revisaoVencida(i % 2 === 0 ? 1 : 0)])
    );

    const { total } = desempenhoNosDificeis(revisoes);
    expect(total).toBe(20);
    expect(sugestaoDeNivel(revisoes, 'iniciante')).toBeNull();
  });
});

/* ─────────────────── a régua de sequência de Hoje ──────────────── */

describe('régua da semana', () => {
  it('o recorde é a maior corrida de dias seguidos do histórico', () => {
    const base = hoje();

    // Três seguidos, um buraco, dois seguidos. O recorde é 3, não 5.
    const historico = [
      somarDias(base, -10),
      somarDias(base, -9),
      somarDias(base, -8),
      somarDias(base, -6),
      somarDias(base, -5)
    ];

    expect(recordeSequencia(historico)).toBe(3);
  });

  it('dia repetido no histórico não infla o recorde', () => {
    const base = hoje();
    expect(recordeSequencia([base, base, base])).toBe(1);
  });

  it('histórico vazio não tem recorde', () => {
    expect(recordeSequencia([])).toBe(0);
  });

  it('a régua tem sete dias, termina em hoje e marca só o que foi feito', () => {
    const base = hoje();
    const regua = reguaDaSemana([base, somarDias(base, -3)]);

    expect(regua.length).toBe(7);
    expect(regua[6]!.dia).toBe(base);
    expect(regua[6]!.ehHoje).toBe(true);
    expect(regua[6]!.rotulo).toBe('HOJE');

    expect(regua.filter((d) => d.feito).length).toBe(2);
    expect(regua[3]!.feito).toBe(true);
    // Um dia anterior a hoje nunca se chama HOJE.
    expect(regua.slice(0, 6).every((d) => d.rotulo !== 'HOJE')).toBe(true);
  });
});
