import { describe, expect, it } from 'vitest';

import { diaDaSemana, somarDias } from './datas';
import { progressoInicial } from './gamificacao';
import {
  BORDAS,
  bordaLiberada,
  bordasLiberadas,
  codigoValido,
  gerarCodigoLiga,
  normalizarCodigo,
  obterBorda,
  semanaDe,
  TAMANHO_CODIGO,
  validarEmail,
  validarNome,
  validarSenha
} from './perfil';

/* ─────────────────────────── a semana ──────────────────────────── */

describe('semana da liga', () => {
  it('toda a semana cai na mesma segunda-feira', () => {
    // 2026-08-24 é uma segunda; os seis dias seguintes pertencem a ela.
    const segunda = '2026-08-24';
    for (let i = 0; i < 7; i += 1) {
      expect(semanaDe(somarDias(segunda, i)), `dia +${i}`).toBe(segunda);
    }
  });

  it('o domingo pertence à semana que começou, não à que vem', () => {
    const domingo = '2026-08-30';
    expect(diaDaSemana(domingo)).toBe(0);
    expect(semanaDe(domingo)).toBe('2026-08-24');
  });

  it('a segunda seguinte já é outra semana', () => {
    expect(semanaDe('2026-08-31')).toBe('2026-08-31');
  });

  it('atravessa a virada de mês e de ano', () => {
    expect(semanaDe('2026-01-01')).toBe('2025-12-29');
  });
});

/* ────────────────────── código de convite ──────────────────────── */

describe('código de liga', () => {
  it('tem o tamanho combinado e é sempre válido', () => {
    for (let i = 0; i < 50; i += 1) {
      const codigo = gerarCodigoLiga();
      expect(codigo.length).toBe(TAMANHO_CODIGO);
      expect(codigoValido(codigo), codigo).toBe(true);
    }
  });

  it('nunca usa caractere que se confunde ao ditar', () => {
    // 0/O e 1/I fora: o código é lido em voz alta e digitado por outra pessoa.
    for (let i = 0; i < 50; i += 1) {
      expect(gerarCodigoLiga()).not.toMatch(/[01OI]/);
    }
  });

  it('normaliza o que a pessoa digita', () => {
    expect(normalizarCodigo(' ab2-cd3 ')).toBe('AB2CD3');
    expect(normalizarCodigo('a b 2 c d 3')).toBe('AB2CD3');
  });

  it('recusa código de tamanho errado ou com letra proibida', () => {
    expect(codigoValido('ABC')).toBe(false);
    expect(codigoValido('ABCDEFG')).toBe(false);
    expect(codigoValido('ABCDE0')).toBe(false); // zero não existe no alfabeto
  });
});

/* ──────────────────────── as validações ────────────────────────── */

describe('validações do cadastro', () => {
  it('nome curto demais ou longo demais é recusado', () => {
    expect(validarNome('a')).toBeTruthy();
    expect(validarNome('   ')).toBeTruthy();
    expect(validarNome('a'.repeat(21))).toBeTruthy();
    expect(validarNome('Gabriel')).toBeNull();
  });

  it('e-mail precisa de arroba e domínio', () => {
    expect(validarEmail('gabriel')).toBeTruthy();
    expect(validarEmail('gabriel@')).toBeTruthy();
    expect(validarEmail('gabriel@exemplo')).toBeTruthy();
    expect(validarEmail('gabriel@exemplo.com')).toBeNull();
  });

  it('senha curta é recusada antes de ir à rede', () => {
    expect(validarSenha('12345')).toBeTruthy();
    expect(validarSenha('123456')).toBeNull();
  });
});

/* ─────────────────────────── as bordas ─────────────────────────── */

describe('bordas', () => {
  it('quem começa do zero só tem a primeira', () => {
    const liberadas = bordasLiberadas(progressoInicial());
    expect(liberadas.map((b) => b.id)).toEqual(['ovo']);
  });

  it('borda de rank abre com XP suficiente', () => {
    const cria = BORDAS.find((b) => b.id === 'cria')!;
    expect(bordaLiberada(cria, { ...progressoInicial(), xp: 199 })).toBe(false);
    expect(bordaLiberada(cria, { ...progressoInicial(), xp: 200 })).toBe(true);
  });

  it('borda de conquista abre com a conquista', () => {
    const chama = BORDAS.find((b) => b.id === 'chama')!;
    expect(bordaLiberada(chama, progressoInicial())).toBe(false);
    expect(
      bordaLiberada(chama, { ...progressoInicial(), conquistas: ['sequencia-7'] })
    ).toBe(true);
  });

  it('id desconhecido cai na borda padrão em vez de quebrar a tela', () => {
    expect(obterBorda('nao-existe').id).toBe('ovo');
    expect(obterBorda(undefined).id).toBe('ovo');
  });

  it('toda borda diz como se consegue', () => {
    for (const borda of BORDAS) {
      expect(borda.comoConseguir, borda.id).toBeTruthy();
    }
  });
});
