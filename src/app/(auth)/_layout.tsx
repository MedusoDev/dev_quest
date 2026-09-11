import { Stack } from 'expo-router';

import { useCores } from '@/dados/TemaContexto';

/**
 * A rota de entrada do app.
 *
 * Um arquivo só — Login e Registro são a mesma tela com um alternador interno,
 * porque separá-los em duas rotas faria o cabeçalho e o alternador saltarem a
 * cada troca. Ver `entrar.tsx`.
 */
export default function LayoutAuth() {
  const cores = useCores();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: cores.fundo },
        animation: 'fade'
      }}
    />
  );
}
