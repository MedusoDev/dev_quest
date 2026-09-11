// No SDK 54 o tema vem do React Navigation, não do expo-router. Versões mais
// novas reexportam pelo expo-router — se um dia subirmos de SDK, é esta linha
// que muda.
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
    Stack,
    useRootNavigationState,
    useRouter,
    useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useState } from "react";
import { LogBox } from "react-native";

// Cada peso vem pelo caminho direto do arquivo, e não pela raiz do pacote.
// O `index.js` de `@expo-google-fonts` faz `require` de TODOS os pesos e
// itálicos — importar de lá empacotava dezenas de arquivos de fonte para usar
// sete. Assim entram exatamente os sete.
import JetBrainsMono_400Regular from "@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf";
import JetBrainsMono_500Medium from "@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf";
import JetBrainsMono_700Bold from "@expo-google-fonts/jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf";
import SpaceGrotesk_400Regular from "@expo-google-fonts/space-grotesk/400Regular/SpaceGrotesk_400Regular.ttf";
import SpaceGrotesk_500Medium from "@expo-google-fonts/space-grotesk/500Medium/SpaceGrotesk_500Medium.ttf";
import SpaceGrotesk_600SemiBold from "@expo-google-fonts/space-grotesk/600SemiBold/SpaceGrotesk_600SemiBold.ttf";
import SpaceGrotesk_700Bold from "@expo-google-fonts/space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf";

import { aoMarcarIntroducao, introducaoFoiVista } from "@/dados/apresentacao";
import { ProvedorConta, useConta } from "@/dados/ContaContexto";
import { auth } from "@/dados/firebase";
import {
    configurarComportamentoDeNotificacao,
    prepararCanalDeLembretes,
} from "@/dados/lembretes";
import { ProvedorProgresso, useProgresso } from "@/dados/ProgressoContexto";
import { ProvedorTema, useCores } from "@/dados/TemaContexto";
import { cores } from "@/tema";
import type { Paleta } from "@/tema/temas";

// O Expo Go, a partir do SDK 53, não suporta mais push remoto — e o
// `expo-notifications` registra um listener de push token assim que é
// importado, não só quando alguém pede um token de verdade. Isto dispara o
// aviso abaixo mesmo aqui, que só usa notificação local agendada
// (`dados/lembretes.ts`). Ignorado só no Expo Go; num development build o
// aviso não aparece e não precisa disto.
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go"
]);

// Impede a splash de sumir sozinha. Agora ela some quando as fontes terminam de
// carregar — antes disso o app mostraria texto na fonte do sistema e trocaria na
// cara do usuário, o que dá um pulo feio no primeiro segundo.
SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync(cores.fundo);
configurarComportamentoDeNotificacao();
prepararCanalDeLembretes();

function temaDeNavegacao(paleta: Paleta) {
  return {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: paleta.fundo,
      card: paleta.fundo,
      text: paleta.texto,
      border: paleta.linha,
      primary: paleta.acento,
    },
  };
}

export default function Layout() {
  // `useFonts` devolve [carregou, erro]. As duas famílias vêm em sete arquivos
  // porque cada peso é um arquivo — em fonte customizada o peso está no nome da
  // família, não no `fontWeight`. Ver o comentário em `@/tema`.
  const [fontesCarregadas, erroFontes] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(cores.fundo);

    // Se a fonte falhar, o app abre de qualquer jeito: melhor a fonte errada do
    // que uma splash eterna. O erro vai para o console e a gente vê depois.
    if (fontesCarregadas || erroFontes) {
      SplashScreen.hideAsync();
    }
    if (erroFontes) {
      console.warn("Fontes não carregaram, usando a do sistema:", erroFontes);
    }
  }, [fontesCarregadas, erroFontes]);

  // Enquanto carrega, devolve nada — a splash continua na tela cobrindo isso.
  if (!fontesCarregadas && !erroFontes) {
    return null;
  }

  return (
    <ProvedorTema>
      {/* O progresso abre o banco e carrega uma vez só, acima de todas as
          rotas. A conta fica por dentro porque observa o progresso: a cada
          mudança de XP ela atualiza o perfil público sozinha. */}
      <ProvedorProgresso>
        <ProvedorConta>
          <Aplicativo />
        </ProvedorConta>
      </ProvedorProgresso>
    </ProvedorTema>
  );
}

/**
 * Separado de `Layout` só para poder chamar `useCores()` — que precisa estar
 * dentro de `<ProvedorTema>`, montado ali em cima.
 */
function Aplicativo() {
  const paleta = useCores();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(paleta.fundo);
  }, [paleta.fundo]);

  return (
    <ThemeProvider value={temaDeNavegacao(paleta)}>
      {/* A cor dos ícones da barra de status segue o tema: claros no escuro,
          escuros no leve. */}
      <StatusBar style={paleta.barraStatus} />
      <Portao />
    </ThemeProvider>
  );
}

/**
 * Quem pode estar em qual tela.
 *
 * Fica aqui, e não em cada tela, porque uma tela só decide por si mesma: o
 * `index` mandava para o login, mas depois de sair dele ninguém mandava de
 * volta — e sair da conta no perfil deixaria a pessoa presa lá pelo mesmo
 * motivo. Um portão acima de todas as rotas resolve a classe inteira.
 *
 * Com os grupos `(auth)` e `(abas)`, o primeiro segmento é o nome do grupo.
 * Grupo não aparece na URL, então `/entrar` continua sendo `/entrar` — mas
 * `useSegments` enxerga o parêntese, e é por ele que perguntamos.
 */
function Portao() {
  const cores = useCores();
  const { carregando } = useProgresso();
  const { usuario, perfil, carregando: carregandoConta } = useConta();
  const usuarioAtual = usuario ?? auth.currentUser;
  const [introducaoCarregada, setIntroducaoCarregada] = useState(false);
  const [introducaoVista, setIntroducaoVista] = useState(false);

  const router = useRouter();
  const segmentos = useSegments();
  // Sem isto, um `replace` disparado antes de a navegação existir é ignorado
  // em silêncio — e o app fica na tela errada sem erro nenhum.
  const navegacaoPronta = Boolean(useRootNavigationState()?.key);

  const rota: string = segmentos[0] ?? "";
  const noLogin = rota === "(auth)";
  const noOnboarding = rota === "onboarding";
  const naIntroducao = rota === "introducao";
  const noTesteNivel = rota === "teste-nivel";
  const onboardingCompleto = perfil?.onboardingCompleto ?? false;
  // `false` por padrão em `perfilVazio` — então toda conta que existia antes
  // deste campo nascer lê `false` do Firestore (o campo nunca existiu no
  // documento) e cai no convite abaixo, uma vez só. Ver o comentário de
  // `nivelTestado` em `nucleo/perfil.ts`.
  const nivelTestado = perfil?.nivelTestado ?? false;

  useEffect(() => {
    const removerOuvinte = aoMarcarIntroducao((uid) => {
      if (uid !== usuarioAtual?.uid) return;
      setIntroducaoVista(true);
      setIntroducaoCarregada(true);
    });

    let ativo = true;

    if (!usuarioAtual) {
      setIntroducaoVista(false);
      setIntroducaoCarregada(false);
      return () => {
        removerOuvinte();
        ativo = false;
      };
    }

    setIntroducaoCarregada(false);
    introducaoFoiVista(usuarioAtual.uid).then((vista) => {
      if (!ativo) return;
      setIntroducaoVista(vista);
      setIntroducaoCarregada(true);
    });

    return () => {
      removerOuvinte();
      ativo = false;
    };
  }, [usuarioAtual]);

  useEffect(() => {
    if (
      !navegacaoPronta ||
      carregando ||
      carregandoConta ||
      (usuarioAtual && !introducaoCarregada)
    )
      return;

    // A ordem é a do fluxo: pedir conta, depois onboarding, depois deixar entrar.
    if (!usuarioAtual) {
      if (!noLogin) router.replace("/entrar");
      return;
    }

    // Conta admin não é conta de jogador: sem onboarding, sem introdução, sem
    // abas — vai sempre direto para o painel de métricas. `admin` nunca é
    // gravado pelo app (ver `docs/firestore.rules`), então isto não é um
    // caminho que uma conta comum consegue tomar sozinha.
    if (perfil?.admin) {
      if (rota !== "admin") router.replace("/admin/painel" as never);
      return;
    }

    // Nome, idade, foco de estudo e nível — pedidos uma vez só, logo depois
    // da conta existir e antes de a pessoa ver qualquer outra coisa.
    if (!onboardingCompleto) {
      if (!noOnboarding) router.replace("/onboarding" as never);
      return;
    }

    if (!introducaoVista) {
      if (!naIntroducao) router.replace("/introducao" as never);
      return;
    }

    // Convite único do teste de nível — só quem já tinha conta antes dele
    // existir passa por aqui; conta nova já sai do onboarding com isto
    // marcado (ver o comentário em `app/onboarding.tsx`).
    if (!nivelTestado) {
      if (!noTesteNivel) router.replace("/teste-nivel" as never);
      return;
    }

    if (noLogin || noOnboarding || naIntroducao || noTesteNivel) router.replace("/");
  }, [
    navegacaoPronta,
    carregando,
    carregandoConta,
    usuarioAtual,
    onboardingCompleto,
    introducaoCarregada,
    introducaoVista,
    nivelTestado,
    noLogin,
    noOnboarding,
    naIntroducao,
    noTesteNivel,
    router,
  ]);

  return (
    <Stack
      initialRouteName="(abas)"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: cores.fundo },
        animation: "fade",
      }}
    >
      {/* A sessão e o resumo cobrem a barra de abas por inteiro: são o único
          lugar do app em que não existe "ir para outro canto". */}
      <Stack.Screen name="sessao" options={{ animation: "fade" }} />
      {/* O glossário sobe do rodapé, e a própria tela anima essa subida — daí
          `animation: 'none'` aqui, para não haver duas transições somando. */}
      <Stack.Screen
        name="glossario"
        options={{ presentation: "transparentModal", animation: "none" }}
      />
    </Stack>
  );
}
