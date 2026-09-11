import { Tabs } from 'expo-router';

import { BarraAbas, ProvedorAbas } from '@/componentes/abas';
import { useCores } from '@/dados/TemaContexto';

/**
 * OS DOIS LUGARES DO PAINEL.
 *
 * Mesmo padrão de barra do app de jogador (`(abas)/_layout.tsx`), com a
 * própria instância de `ProvedorAbas` — as duas árvores de rota nunca ficam
 * montadas ao mesmo tempo, mas cada uma tem seu próprio estado de "de que
 * lado veio o toque" mesmo assim.
 *
 * Só duas abas: o painel de métricas e o perfil da própria conta admin (nome,
 * foto, sair). Nada de trilhas, relâmpago ou liga — quem está aqui não é
 * jogador, é o dono do app olhando os números.
 */
export default function LayoutAdmin() {
  const cores = useCores();

  return (
    <ProvedorAbas>
      <Tabs
        tabBar={(props) => <BarraAbas {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'none',
          sceneStyle: { backgroundColor: cores.fundo }
        }}
      >
        <Tabs.Screen name="painel" />
        <Tabs.Screen name="perfil" />
      </Tabs>
    </ProvedorAbas>
  );
}
