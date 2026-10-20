import { Alert, Platform } from 'react-native';

/**
 * `Alert.alert` COM SUPORTE A WEB.
 *
 * `react-native-web` não implementa `Alert.alert` — é um método vazio. Sem
 * isto, todo diálogo de confirmação (sair da conta, excluir conta, regredir
 * nível) simplesmente não aparece quando o app roda no navegador, e o botão
 * parece não fazer nada.
 *
 * Na web, uma pergunta com botão de cancelar vira `window.confirm`; sem botão
 * de cancelar vira `window.alert`. Cobre os dois padrões que o app usa hoje —
 * não é um substituto genérico para qualquer combinação de botões.
 */

type BotaoAlerta = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export function alertar(titulo: string, mensagem?: string, botoes?: BotaoAlerta[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(titulo, mensagem, botoes);
    return;
  }

  const lista = botoes && botoes.length > 0 ? botoes : [{ text: 'OK' }];
  const texto = [titulo, mensagem].filter(Boolean).join('\n\n');

  if (lista.length === 1) {
    window.alert(texto);
    lista[0]?.onPress?.();
    return;
  }

  const cancelar = lista.find((botao) => botao.style === 'cancel');
  const confirmar = lista.find((botao) => botao !== cancelar) ?? lista[lista.length - 1];

  if (window.confirm(texto)) {
    confirmar?.onPress?.();
  } else {
    cancelar?.onPress?.();
  }
}
