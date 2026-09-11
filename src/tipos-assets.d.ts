// O Metro sabe carregar `.ttf` como asset, mas o TypeScript não conhece esse
// tipo de import. Esta declaração é o que permite importar cada peso de fonte
// pelo caminho direto do arquivo, em vez de pela raiz do pacote.
declare module '*.ttf' {
  const asset: number;
  export default asset;
}
