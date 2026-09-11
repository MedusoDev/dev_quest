import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

/**
 * Testes só do núcleo — a lógica pura.
 *
 * O núcleo não importa nada de React Native, então roda em Node puro, sem
 * emulador e sem celular. É por isso que ele fica separado: você escreve a
 * regra da streak, roda `npm test` e sabe em dois segundos se ela está certa.
 *
 * Telas não são testadas aqui. Elas se verificam abrindo o app.
 */
export default defineConfig({
  test: {
    include: ['src/nucleo/**/*.teste.ts'],
    environment: 'node',
    // Ainda nao ha testes: `npm test` passa em vez de falhar ate a Fase 2.
    passWithNoTests: true
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  }
});
