import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { concluirLoginGoogle, traduzirErro } from '@/dados/conta';
import { useCores } from '@/dados/TemaContexto';
import { espaco, margemTela, tipo } from '@/tema';

/**
 * PONTO DE VOLTA DO LOGIN COM GOOGLE.
 *
 * O navegador devolve o controle ao app numa URL fixa
 * (`ouroboros://oauthredirect?code=...`) — isso é o `expo-router` que
 * decide, ao ver essa rota, desmontar `entrar.tsx` e montar esta tela. É
 * por isso que a troca do código por token não pode depender de nada que
 * vivia na tela anterior (ver `guardarVerificadorGoogle` em
 * `dados/conta.ts`): quando chegamos aqui, aquele componente já não existe.
 *
 * Tela transitória — nunca fica visível por muito tempo. Sucesso ou erro,
 * ela sempre devolve pra `/entrar`, que por sua vez sai do caminho sozinha
 * assim que o `Portao` em `_layout.tsx` perceber a sessão nova.
 */
export default function OAuthRedirect() {
  const cores = useCores();
  const router = useRouter();
  const { code, error } = useLocalSearchParams<{ code?: string; error?: string }>();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const processado = useRef(false);

  useEffect(() => {
    if (processado.current) return;
    processado.current = true;

    async function concluir() {
      if (error) {
        setMensagem('O Google cancelou o login.');
      } else if (!code) {
        setMensagem('Não recebi o retorno esperado do Google.');
      } else {
        try {
          await concluirLoginGoogle(code);
          // Sem navegar daqui: o `Portao` percebe a sessão nova e decide
          // sozinho onboarding ou introdução, igual num cadastro por e-mail.
          return;
        } catch (e) {
          // Erro do Firebase (tem `.code`) usa a tradução; erro nosso, de
          // sessão expirada por exemplo, já vem com mensagem pronta.
          const comCodigo = (e as { code?: string })?.code;
          setMensagem(comCodigo ? traduzirErro(e) : ((e as Error)?.message ?? 'Não deu para entrar.'));
        }
      }

      setTimeout(() => router.replace('/entrar'), 1500);
    }

    concluir();
  }, [code, error, router]);

  return (
    <View style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <Text style={[estilos.texto, { color: cores.legenda }]}>{mensagem ?? 'Entrando…'}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: margemTela,
    gap: espaco.md
  },
  texto: { ...tipo.notaMono, textAlign: 'center' }
});
