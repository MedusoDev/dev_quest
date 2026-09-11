// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro, com uma única mudança: `.wasm` conta como asset.
 *
 * O `expo-sqlite` no alvo **web** importa `wa-sqlite.wasm`, e o resolvedor
 * padrão não conhece essa extensão — sem isto o bundle de web quebra antes de
 * montar qualquer tela. No Android e no iOS nada disso é usado; o banco é o
 * SQLite nativo.
 *
 * O web não é alvo de produção deste app (ver README): serve para olhar a
 * interface no navegador durante o desenvolvimento, sem depender do celular.
 */
const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

module.exports = config;
