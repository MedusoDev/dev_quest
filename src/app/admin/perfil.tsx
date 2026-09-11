import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/componentes/Avatar';
import { Botao } from '@/componentes/Botao';
import { TelaAba } from '@/componentes/abas';
import { Rotulo, Vazio } from '@/componentes/basicos';
import { useConta } from '@/dados/ContaContexto';
import { useCores } from '@/dados/TemaContexto';
import { validarNome } from '@/nucleo/perfil';
import { espaco, margemTela, tamanhos, tipo, topoConteudo } from '@/tema';

/**
 * PERFIL DO ADMIN — a própria conta, sem nada de jogador.
 *
 * Conta admin nunca passou pelo onboarding (o portão pula direto pra
 * `/admin`), então não tem nome completo, idade, foco de estudo nem nível —
 * só o que toda conta do Firebase Auth já tem: codinome, foto, e-mail. Sem
 * grade de XP, sem rank, sem conquistas: essas métricas não existem pra
 * quem não joga.
 */
export default function PerfilAdmin() {
  const cores = useCores();
  const { usuario, perfil, atualizarPerfil, sair } = useConta();

  const [codinome, setCodinome] = useState(perfil?.nome ?? '');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [trocandoFoto, setTrocandoFoto] = useState(false);

  async function trocarFoto() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Sem permissão', 'Preciso de acesso às suas fotos para trocar o avatar.');
      return;
    }

    const escolha = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1
    });

    if (escolha.canceled || !escolha.assets[0]) return;

    setTrocandoFoto(true);
    try {
      const reduzida = await manipulateAsync(
        escolha.assets[0].uri,
        [{ resize: { width: 256, height: 256 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );

      if (reduzida.base64) await atualizarPerfil({ foto: reduzida.base64 });
    } catch {
      Alert.alert('Não deu', 'Não consegui preparar essa imagem. Tente outra.');
    } finally {
      setTrocandoFoto(false);
    }
  }

  async function salvar() {
    const problema = validarNome(codinome);
    if (problema) {
      setErro(problema);
      return;
    }

    setErro(null);
    setSalvando(true);
    try {
      await atualizarPerfil({ nome: codinome.trim() });
    } finally {
      setSalvando(false);
    }
  }

  function confirmarSaida() {
    Alert.alert('Sair da conta', 'Você precisa entrar de novo para ver o painel.', [
      { text: 'Ficar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => sair() }
    ]);
  }

  if (!perfil) {
    return (
      <View style={[estilos.centro, { backgroundColor: cores.fundo }]}>
        <Vazio titulo="Carregando" texto="Um instante." />
      </View>
    );
  }

  return (
    <TelaAba>
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Rotulo cor={cores.acento}>conta admin</Rotulo>
        <Text style={[estilos.titulo, { color: cores.textoForte }]}>Seu perfil</Text>

        <Pressable
          accessibilityRole="button"
          disabled={trocandoFoto}
          onPress={trocarFoto}
          style={estilos.avatarLinha}
        >
          <Avatar nome={codinome || 'Admin'} foto={perfil.foto} tamanho={tamanhos.avatarGrande} />
          <Text style={[estilos.trocarFoto, { color: cores.acento }]}>
            {trocandoFoto ? 'enviando…' : 'trocar foto'}
          </Text>
        </Pressable>

        <View style={estilos.campo}>
          <Text style={[estilos.rotuloCampo, { color: cores.legenda }]}>CODINOME</Text>
          <TextInput
            style={[
              estilos.entrada,
              { backgroundColor: cores.superficie, borderColor: cores.linha, color: cores.textoForte },
            ]}
            value={codinome}
            onChangeText={setCodinome}
            placeholder="admin"
            placeholderTextColor={cores.desativado}
            maxLength={20}
          />
        </View>

        {erro && (
          <View
            style={[
              estilos.aviso,
              { borderLeftColor: cores.erro, backgroundColor: cores.erroFundo },
            ]}
          >
            <Text style={[estilos.avisoTexto, { color: cores.erro }]}>{erro}</Text>
          </View>
        )}

        <Botao
          estilo={estilos.botao}
          rotulo={salvando ? 'Salvando…' : 'Salvar'}
          desabilitado={salvando}
          aoTocar={salvar}
        />

        <View style={estilos.conta}>
          <Text style={[estilos.email, { color: cores.desativado }]}>
            {usuario?.isAnonymous ? 'sessão de convidado' : (usuario?.email ?? '')}
          </Text>
          <Botao rotulo="Sair da conta" variante="discreto" aoTocar={confirmarSaida} />
        </View>
      </ScrollView>
    </TelaAba>
  );
}

const estilos = StyleSheet.create({
  centro: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: margemTela,
    paddingVertical: espaco.xl
  },
  conteudo: { paddingHorizontal: margemTela, paddingTop: topoConteudo, paddingBottom: espaco.xl },
  titulo: { ...tipo.titulo, marginTop: espaco.sm },

  avatarLinha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, marginTop: espaco.xl },
  trocarFoto: { ...tipo.metricaMono },

  campo: { marginTop: espaco.xl },
  rotuloCampo: { ...tipo.rotuloCampo },
  entrada: {
    marginTop: espaco.sm,
    minHeight: tamanhos.campo,
    borderWidth: tamanhos.linha,
    paddingHorizontal: 15,
    ...tipo.campo
  },

  aviso: {
    marginTop: espaco.xl,
    borderLeftWidth: tamanhos.trilho,
    paddingVertical: 12,
    paddingHorizontal: espaco.md
  },
  avisoTexto: { ...tipo.metricaMonoMedia, lineHeight: 19 },

  botao: { marginTop: espaco.xl },

  conta: { marginTop: espaco.xxl, gap: espaco.md },
  email: { ...tipo.metricaMono }
});
