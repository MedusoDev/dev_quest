import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Rotulo } from "@/componentes/basicos";
import { useCores } from "@/dados/TemaContexto";
import { espaco, margemTela, tipo, topoConteudo } from "@/tema";

/**
 * TERMOS E POLÍTICA DE PRIVACIDADE.
 *
 * Texto simples e honesto, não um contrato jurídico — pensado para o piloto
 * fechado com beta testers, não para produção com uma instituição de ensino
 * (isso continua pendente, ver Fase 0 de `feat/ideia.md`). Aberto a partir do
 * link na tela de cadastro (`entrar.tsx`) e, sem checkbox, do aviso abaixo do
 * botão de convidado.
 */
export default function Termos() {
  const cores = useCores();
  const router = useRouter();

  return (
    <View style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.cabecalho}>
          <Rotulo cor={cores.acento}>termos e privacidade</Rotulo>
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.back()}
          >
            <Text style={[estilos.fechar, { color: cores.legenda }]}>✕</Text>
          </Pressable>
        </View>

        <Text style={[estilos.titulo, { color: cores.textoForte }]}>Como usamos seus dados</Text>

        <Secao titulo="O que coletamos">
          Codinome, e-mail (se você não entrar como convidado), data de
          nascimento, foco de estudo e nível informado. Também guardamos, a
          cada sessão concluída, quantos cards você acertou e errou, o XP
          ganho e o horário — sem o conteúdo das suas respostas, que fica só
          no seu aparelho.
        </Secao>

        <Secao titulo="Para que usamos">
          Para melhorar o aplicativo e entender como as pessoas usam ele de
          verdade — em que ponto travam, com que frequência voltam, se o
          conteúdo está ensinando. Seu codinome, XP e sequência aparecem no
          ranking para quem também tem conta; o resto não é mostrado para
          mais ninguém além de você.
        </Secao>

        <Secao titulo="Com quem compartilhamos">
          Com ninguém fora deste app. Os dados ficam no Firebase (Google
          Cloud) e não são vendidos nem repassados a terceiros.
        </Secao>

        <Secao titulo="Seus direitos">
          Você pode editar seu codinome e data de nascimento a qualquer
          momento em Configurações. Você pode excluir sua conta e todos os
          seus dados permanentemente pelo Perfil, opção "Excluir conta" — a
          exclusão é imediata e não tem como ser desfeita.
        </Secao>

        <Secao titulo="Menores de idade">
          Se você é menor de 18 anos, use o app com o conhecimento de um
          responsável legal.
        </Secao>
      </ScrollView>
    </View>
  );
}

function Secao({ titulo, children }: { titulo: string; children: string }) {
  const cores = useCores();

  return (
    <View style={estilos.secao}>
      <Text style={[estilos.tituloSecao, { color: cores.textoForte }]}>{titulo}</Text>
      <Text style={[estilos.corpo, { color: cores.legenda }]}>{children}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    paddingHorizontal: margemTela,
    paddingTop: topoConteudo,
    paddingBottom: espaco.xl,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fechar: { ...tipo.fechar },

  titulo: { ...tipo.titulo, marginTop: espaco.sm },

  secao: { marginTop: espaco.xl },
  tituloSecao: { ...tipo.tituloItemMenor },
  corpo: {
    ...tipo.corpo,
    marginTop: espaco.sm,
    lineHeight: 22,
  },
});
