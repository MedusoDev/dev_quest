import { Tabs } from 'expo-router';

import { useCores } from '@/dados/TemaContexto';
import { BarraAbas, ProvedorAbas } from '@/componentes/abas';

/**
 * Os cinco lugares do app.
 *
 * A barra é inteiramente nossa (`BarraAbas`): a padrão do React Navigation traz
 * raio, sombra e um indicador que não existem nesta identidade. O provedor em
 * volta guarda de que lado veio o toque, para a tela nova entrar por ali —
 * ver `componentes/abas.tsx`.
 *
 * `animation: 'none'` no navegador é de propósito: quem anima a troca é cada
 * tela, com `TelaAba`. Duas animações somadas dariam um deslize duplo.
 */
export default function LayoutAbas() {
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
        <Tabs.Screen name="index" />
        <Tabs.Screen name="trilhas" />
        <Tabs.Screen name="relampago" />
        <Tabs.Screen name="liga" />
        <Tabs.Screen name="perfil" />
      </Tabs>
    </ProvedorAbas>
  );
}
