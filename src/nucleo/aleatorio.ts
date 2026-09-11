/**
 * Embaralhamento de Fisher-Yates. Devolve uma cópia; o array original fica
 * como estava.
 */
export function embaralhar<T>(itens: readonly T[]): T[] {
  const copia = [...itens];

  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }

  return copia;
}
