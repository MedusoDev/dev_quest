import { Image, StyleSheet, Text, View } from 'react-native';

import { tamanhos, tipo } from '@/tema';
import type { Paleta } from '@/tema/temas';
import { useCores } from '@/dados/TemaContexto';
import { obterBorda } from '@/nucleo/perfil';

/**
 * A foto do perfil dentro de um quadrado de borda fina.
 *
 * No redesign o avatar é **quadrado**, com 1 px de borda e as iniciais em mono.
 * Nada de círculo, nada de moldura decorativa em volta: no meio de uma tela
 * feita só de réguas, um círculo com anel giratório seria o único objeto que
 * não pertence.
 *
 * As bordas ganhas estudando (`nucleo/perfil`) continuam existindo — mas agora
 * elas colorem a régua de 1 px em vez de desenharem um aro. É a mesma recompensa
 * dita no vocabulário novo.
 *
 * A foto vem como JPEG em base64, guardada no próprio documento do perfil. Isso
 * evita o Firebase Storage, que hoje exige plano pago em projeto novo — e uma
 * imagem de 256 px comprimida cabe folgada no limite de 1 MiB do Firestore.
 *
 * Sem foto, aparecem as iniciais. Nunca um ícone genérico de pessoa: iniciais
 * distinguem uma linha da outra no ranking, o ícone não.
 */

type Props = {
  nome: string;
  /** JPEG em base64, sem o prefixo `data:`. */
  foto?: string;
  bordaId?: string;
  tamanho?: number;
  /** Sobrepõe o tema corrente. Sem isto o avatar já usa `useCores()` sozinho. */
  paleta?: Paleta;
};

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0]!.slice(0, 2).toUpperCase();
  return (partes[0]![0]! + partes[partes.length - 1]![0]!).toUpperCase();
}

export function Avatar({ nome, foto, bordaId, tamanho = tamanhos.avatar, paleta }: Props) {
  const temaAtual = useCores();
  const c = paleta ?? temaAtual;
  const borda = obterBorda(bordaId);

  // A borda padrão fica na régua neutra; as ganhas acendem na cor delas. Assim
  // o avatar comum não vira mais um ponto colorido na tela.
  const corBorda = bordaId && bordaId !== 'ovo' ? borda.cor : c.linha;

  return (
    <View
      style={[
        estilos.caixa,
        { width: tamanho, height: tamanho, borderColor: corBorda }
      ]}
    >
      {foto ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: `data:image/jpeg;base64,${foto}` }}
          style={{ width: tamanho, height: tamanho }}
        />
      ) : (
        <Text
          style={[
            tamanho >= tamanhos.avatarGrande ? tipo.iniciaisGrandes : tipo.iniciais,
            { color: c.legenda }
          ]}
        >
          {iniciais(nome)}
        </Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: tamanhos.linha,
    overflow: 'hidden'
  }
});
