import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { espaco, margemTela, tamanhos, tipo, topoConteudo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { useConta } from '@/dados/ContaContexto';
import { buscarLiga, criarLiga, lerLigaGlobal, lerRanking, type Liga } from '@/dados/nuvem';
import { codigoValido, normalizarCodigo, semanaDe, type PerfilPublico } from '@/nucleo/perfil';
import { hoje, somarDias } from '@/nucleo/datas';
import { Botao } from '@/componentes/Botao';
import { Regua, Rotulo, Vazio } from '@/componentes/basicos';
import { TelaAba } from '@/componentes/abas';

/**
 * A LIGA — ranking semanal entre amigos.
 *
 * Semanal, e não desde sempre, porque quem entra depois precisa ter chance. Na
 * segunda-feira todo mundo volta a zero e a disputa recomeça.
 *
 * Entra-se por código: sem busca de usuário, sem lista pública, sem pedido de
 * amizade. Um código de seis letras que se manda no grupo resolve.
 *
 * ── DUAS REGRAS QUE NÃO PODEM SAIR DAQUI ──────────────────────────────────
 *
 * 1. A lista é **ordenada por XP e a posição é recalculada a partir da ordem**,
 *    nunca lida de um campo. Posição gravada é posição que envelhece errado no
 *    primeiro empate.
 * 2. O XP mostrado é o **da semana**, não o total do perfil. O total é assunto
 *    do Perfil; misturar os dois faria quem joga há mais tempo ganhar sempre.
 */

/** Quantos sobem e quantos caem. Só os números; a regra é do produto. */
const SOBEM = 5;
const CAEM = 3;

type Modo = 'amigos' | 'global';

export default function TelaLiga() {
  const cores = useCores();
  const { usuario, perfil, atualizarPerfil } = useConta();

  const [modo, setModo] = useState<Modo>('amigos');
  const [liga, setLiga] = useState<Liga | null>(null);
  const [ranking, setRanking] = useState<PerfilPublico[]>([]);
  const [rankingGlobal, setRankingGlobal] = useState<PerfilPublico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [nomeNovo, setNomeNovo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);

    if (!perfil?.ligaCodigo) {
      setLiga(null);
      setRanking([]);
    } else {
      const [dados, lista] = await Promise.all([
        buscarLiga(perfil.ligaCodigo),
        lerRanking(perfil.ligaCodigo)
      ]);
      setLiga(dados);
      setRanking(lista);
    }

    setRankingGlobal(await lerLigaGlobal());
    setCarregando(false);
  }, [perfil?.ligaCodigo]);

  // Recarrega ao voltar para a aba: o XP de quem estudou agora precisa
  // aparecer sem exigir fechar e abrir o app.
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const alternador = (
    <View style={[estilos.alternador, { borderColor: cores.linha }]}>
      <AbaModo rotulo="Amigos" ativa={modo === 'amigos'} aoTocar={() => setModo('amigos')} />
      <AbaModo rotulo="Top global" ativa={modo === 'global'} aoTocar={() => setModo('global')} />
    </View>
  );

  /* ── modo global: top da semana entre todo mundo ─────────────────── */

  if (modo === 'global') {
    const ordenadoGlobal = [...rankingGlobal].sort((a, b) => b.xpSemana - a.xpSemana);

    return (
      <TelaAba>
        <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
          <Rotulo cor={cores.acento}>liga</Rotulo>
          <Text style={[estilos.titulo, { color: cores.textoForte }]}>Top da semana, geral</Text>
          <Text style={[estilos.nota, { color: cores.legenda }]}>
            Todo mundo com conta, sem precisar de código nem liga fechada. Zera toda segunda.
          </Text>

          {alternador}

          {carregando && (
            <Text style={[estilos.nota, { color: cores.legenda }]}>buscando o ranking…</Text>
          )}

          {!carregando && ordenadoGlobal.length === 0 && (
            <View style={estilos.vazio}>
              <Vazio titulo="Ninguém pontuou ainda" texto="Faça sua diária para entrar no placar." />
            </View>
          )}

          {ordenadoGlobal.length > 0 && (
            <View style={estilos.lista}>
              {ordenadoGlobal.map((pessoa, posicao) => {
                const euMesmo = pessoa.uid === usuario?.uid;
                return (
                  <View
                    key={pessoa.uid}
                    style={[estilos.linha, { borderTopColor: cores.linha }, euMesmo && { backgroundColor: cores.acentoFundo }]}
                  >
                    <Text
                      style={[
                        estilos.posicao,
                        { color: cores.legenda },
                        euMesmo && { color: cores.acento }
                      ]}
                    >
                      {posicao + 1}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        estilos.nome,
                        { color: cores.textoForte },
                        euMesmo && { color: cores.acento }
                      ]}
                    >
                      {pessoa.nome}
                    </Text>
                    <Text style={[estilos.xp, { color: cores.legenda }]}>{pessoa.xpSemana}</Text>
                  </View>
                );
              })}
              <Regua />
            </View>
          )}
        </ScrollView>
      </TelaAba>
    );
  }

  async function entrarPorCodigo() {
    setErro(null);
    if (!codigoValido(codigo)) return setErro('O código tem 6 letras e números.');

    setOcupado(true);
    const encontrada = await buscarLiga(codigo);
    setOcupado(false);

    if (!encontrada) return setErro('Não achei liga com esse código.');
    await atualizarPerfil({ ligaCodigo: encontrada.codigo });
  }

  async function criar() {
    setErro(null);
    if (nomeNovo.trim().length < 2) return setErro('Dê um nome à liga.');
    if (!usuario) return;

    setOcupado(true);
    const nova = await criarLiga(nomeNovo, usuario.uid);
    setOcupado(false);

    if (!nova) return setErro('Não consegui criar agora. Tente de novo.');
    await atualizarPerfil({ ligaCodigo: nova.codigo });
  }

  /* ── sem liga: criar ou entrar ─────────────────────────────────── */

  if (!perfil?.ligaCodigo) {
    return (
      <TelaAba>
        <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <Rotulo cor={cores.acento}>liga</Rotulo>
          <Text style={[estilos.titulo, { color: cores.textoForte }]}>Estude com seus amigos</Text>
          <Text style={[estilos.nota, { color: cores.legenda }]}>
            Um ranking semanal fechado. Zera toda segunda, então quem começou depois ainda
            alcança.
          </Text>

          {alternador}

          <View style={estilos.bloco}>
            <Text style={[estilos.rotuloCampo, { color: cores.legenda }]}>CÓDIGO DA LIGA</Text>
            <TextInput
              style={[
                estilos.entrada,
                estilos.entradaCodigo,
                { backgroundColor: cores.superficie, borderColor: cores.linha, color: cores.textoForte }
              ]}
              value={codigo}
              onChangeText={(t) => setCodigo(normalizarCodigo(t))}
              placeholder="XXXXXX"
              placeholderTextColor={cores.desativado}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
            />
            <Botao rotulo="Entrar" desabilitado={ocupado} aoTocar={entrarPorCodigo} />
          </View>

          <View style={estilos.bloco}>
            <Text style={[estilos.rotuloCampo, { color: cores.legenda }]}>OU CRIE A SUA</Text>
            <TextInput
              style={[
                estilos.entrada,
                { backgroundColor: cores.superficie, borderColor: cores.linha, color: cores.textoForte }
              ]}
              value={nomeNovo}
              onChangeText={setNomeNovo}
              placeholder="nome da liga"
              placeholderTextColor={cores.desativado}
            />
            <Botao
              rotulo="Criar liga"
              variante="secundario"
              desabilitado={ocupado}
              aoTocar={criar}
            />
          </View>

          {erro && <Text style={[estilos.erro, { color: cores.erro }]}>{erro}</Text>}
        </ScrollView>
      </TelaAba>
    );
  }

  /* ── com liga: o ranking ───────────────────────────────────────── */

  // Ordena aqui, e a posição sai do índice. Ver a regra 1 no topo do arquivo.
  const ordenado = [...ranking].sort((a, b) => b.xpSemana - a.xpSemana);
  const total = ordenado.length;

  return (
    <TelaAba>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <View style={estilos.cabecalho}>
          <Rotulo cor={cores.acento}>{liga?.nome ?? 'sua liga'}</Rotulo>
          <Text style={[estilos.fecha, { color: cores.legenda }]}>
            {`fecha em ${faltaParaSegunda()}`}
          </Text>
        </View>

        <Text style={[estilos.titulo, { color: cores.textoForte }]}>
          {`Top ${SOBEM} sobem. Últimos ${CAEM} caem.`}
        </Text>

        {alternador}

        <Pressable
          accessibilityLabel="Código para convidar"
          accessibilityRole="text"
          style={[estilos.codigo, { borderColor: cores.acentoLinha, backgroundColor: cores.acentoFundo }]}
        >
          <Text style={[estilos.rotuloCampo, { color: cores.legenda }]}>CONVITE</Text>
          <Text style={[estilos.codigoTexto, { color: cores.acento }]}>{perfil.ligaCodigo}</Text>
        </Pressable>

        {carregando && (
          <Text style={[estilos.nota, { color: cores.legenda }]}>buscando o ranking…</Text>
        )}

        {!carregando && total === 0 && (
          <View style={estilos.vazio}>
            <Vazio
              titulo="Ninguém pontuou ainda"
              texto="Faça sua diária para abrir o placar da semana — e mande o código para os seus amigos."
            />
          </View>
        )}

        {total > 0 && (
          <View style={estilos.lista}>
            {ordenado.map((pessoa, posicao) => {
              const euMesmo = pessoa.uid === usuario?.uid;
              const sobe = posicao < SOBEM;
              const cai = posicao >= total - CAEM && total > SOBEM;

              return (
                <View
                  key={pessoa.uid}
                  style={[
                    estilos.linha,
                    { borderTopColor: cores.linha },
                    euMesmo && { backgroundColor: cores.acentoFundo }
                  ]}
                >
                  <Text
                    style={[
                      estilos.posicao,
                      { color: cores.legenda },
                      euMesmo && { color: cores.acento }
                    ]}
                  >
                    {posicao + 1}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      estilos.nome,
                      { color: cores.textoForte },
                      euMesmo && { color: cores.acento }
                    ]}
                  >
                    {pessoa.nome}
                  </Text>
                  <Text style={[estilos.xp, { color: cores.legenda }]}>{pessoa.xpSemana}</Text>
                  <Text
                    style={[
                      estilos.marca,
                      { color: sobe ? cores.acento : cai ? cores.erro : cores.desativado }
                    ]}
                  >
                    {sobe ? '↑' : cai ? '↓' : ''}
                  </Text>
                </View>
              );
            })}
            <Regua />
          </View>
        )}

        <View style={estilos.sair}>
          <Botao
            rotulo="Sair da liga"
            variante="discreto"
            aoTocar={() => atualizarPerfil({ ligaCodigo: null })}
          />
        </View>
      </ScrollView>
    </TelaAba>
  );
}

/** Uma aba do alternador "Amigos / Top global". */
function AbaModo({
  rotulo,
  ativa,
  aoTocar
}: {
  rotulo: string;
  ativa: boolean;
  aoTocar: () => void;
}) {
  const cores = useCores();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: ativa }}
      onPress={aoTocar}
      style={[estilos.abaModo, ativa && { backgroundColor: cores.acento }]}
    >
      <Text style={[tipo.rotuloCampo, { color: ativa ? cores.acentoFundo : cores.legenda }]}>
        {rotulo.toUpperCase()}
      </Text>
    </Pressable>
  );
}

/**
 * Quanto falta para a virada da semana, em dias e horas.
 *
 * A data de virada é a próxima segunda; as horas saem do relógio local. Como o
 * app é local-first e a semana é definida por dia (não por instante), isto é
 * uma estimativa de vitrine — não é ela que zera o placar.
 */
function faltaParaSegunda(): string {
  const proxima = somarDias(semanaDe(hoje()), 7);
  const agora = new Date();
  const virada = new Date(`${proxima}T00:00:00`);

  const horasTotais = Math.max(0, Math.round((virada.getTime() - agora.getTime()) / 3_600_000));

  return `${Math.floor(horasTotais / 24)}d ${horasTotais % 24}h`;
}

const estilos = StyleSheet.create({
  conteudo: {
    paddingHorizontal: margemTela,
    paddingTop: topoConteudo,
    paddingBottom: espaco.xl
  },

  cabecalho: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  fecha: { ...tipo.metricaMono },

  titulo: { ...tipo.titulo, marginTop: espaco.sm },
  nota: { ...tipo.notaMono, marginTop: 12 },
  erro: { ...tipo.metricaMonoMedia, marginTop: espaco.md },

  alternador: {
    flexDirection: 'row',
    borderWidth: tamanhos.linha,
    marginTop: espaco.xl
  },
  abaModo: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center' },

  codigo: {
    marginTop: espaco.xl,
    borderWidth: tamanhos.linha,
    paddingVertical: espaco.md,
    paddingHorizontal: espaco.md,
    gap: espaco.sm
  },
  codigoTexto: { ...tipo.monoForte, fontSize: 22, letterSpacing: 6 },

  bloco: { marginTop: espaco.xl, gap: espaco.sm },
  rotuloCampo: { ...tipo.rotuloCampo },
  entrada: {
    minHeight: tamanhos.campo,
    borderWidth: tamanhos.linha,
    paddingHorizontal: 15,
    ...tipo.campo
  },
  entradaCodigo: { letterSpacing: 6, textAlign: 'center' },

  vazio: { marginTop: espaco.xl },
  lista: { marginTop: espaco.xl },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingVertical: 13,
    paddingHorizontal: espaco.sm,
    marginHorizontal: -espaco.sm,
    borderTopWidth: tamanhos.linha
  },

  posicao: { ...tipo.metricaMonoMedia, width: 22 },
  nome: { ...tipo.tituloItemMenor, flex: 1 },
  xp: { ...tipo.metricaMonoMedia },
  marca: { ...tipo.metricaMono, width: 14, textAlign: 'center' },

  sair: { marginTop: espaco.xl }
});
