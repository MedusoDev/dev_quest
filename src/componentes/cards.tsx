import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { espaco, tamanhos, tipo } from '@/tema';
import { useCores } from '@/dados/TemaContexto';
import { embaralhar } from '@/nucleo/aleatorio';
import { comoTexto, type Card } from '@/nucleo/conteudo';
import type { Resposta } from '@/nucleo/resposta';
import { Alternativa } from './Alternativa';
import { BlocoCodigo } from './BlocoCodigo';
import { TextoRico } from './basicos';

/**
 * Os oito tipos de exercício.
 *
 * Todos recebem o mesmo contrato — card, resposta, `setResposta`, `revelado` —
 * e nenhum deles sabe julgar se está certo. Quem julga é `nucleo/resposta.ts`.
 * A tela de sessão não conhece nenhum tipo em particular: ela chama
 * `RenderizarCard` e pronto.
 */

export type PropsCard = {
  card: Card;
  resposta: Resposta;
  setResposta: (r: Resposta) => void;
  revelado: boolean;
};

/* ───────────────── alternativas: 4 dos 8 tipos ─────────────────── */

function CardAlternativas({ card, resposta, setResposta, revelado }: PropsCard) {
  const cores = useCores();
  // Embaralhar é obrigatório: no conteúdo, a resposta certa foi escrita quase
  // sempre na primeira posição. Sem isto dava para gabaritar sem ler nada.
  const ordem = useMemo(
    () => embaralhar((card.alternativas ?? []).map((_, indice) => indice)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- embaralha uma vez por card, não a cada render
    [card.id]
  );

  // Nos cards de "qual é a saída" as alternativas são valores de código.
  const mono = card.tipo === 'saida';

  return (
    <>
      {card.codigo && (
        <BlocoCodigo
          codigo={comoTexto(card.codigo)}
          linguagem={card.linguagem}
          numerado={card.tipo === 'estrutura'}
          alturaMaxima={card.tipo === 'estrutura' ? 232 : undefined}
        />
      )}

      {card.pergunta && (
        <TextoRico texto={card.pergunta} estilo={tipo.alternativa} cor={cores.textoFraco} />
      )}

      <View style={estilos.lista}>
        {ordem.map((original, posicao) => (
          <Alternativa
            key={original}
            indice={posicao}
            texto={card.alternativas![original]!}
            mono={mono}
            escolhida={resposta === original}
            revelado={revelado}
            correta={original === card.correta}
            aoTocar={() => setResposta(original)}
          />
        ))}
      </View>
    </>
  );
}

/* ────────────────────────── preencher ──────────────────────────── */

function CardLacuna({ card, resposta, setResposta, revelado }: PropsCard) {
  const cores = useCores();
  const coresCodigo = {
    palavraChave: cores.acento,
    texto: cores.acentoTexto,
    numero: cores.acento,
    comentario: cores.legenda,
    tipo: cores.acento,
    identificador: cores.textoFraco,
    pontuacao: cores.legenda
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- embaralha uma vez por card, não a cada render
  const tokens = useMemo(() => embaralhar(card.tokens ?? []), [card.id]);
  const respostas = card.respostas ?? [];
  const escolhas = (resposta as (string | null)[] | null) ?? [];

  // A próxima lacuna a preencher é a primeira ainda vazia.
  const vazia = escolhas.findIndex((v) => !v);
  const alvo = vazia === -1 ? escolhas.length : vazia;

  function escolher(token: string) {
    const novas = [...escolhas];
    novas[alvo] = token;
    setResposta(novas);
  }

  function limpar(indice: number) {
    const novas = [...escolhas];
    novas[indice] = null;
    setResposta(novas);
  }

  // As lacunas são numeradas na ordem de leitura, atravessando as linhas.
  let contador = -1;

  return (
    <>
      <View
        style={[
          estilos.caixaCodigo,
          { backgroundColor: cores.acentoFundo, borderLeftColor: cores.acento }
        ]}
      >
        {(card.codigo ?? []).map((linha, indiceLinha) => (
          <View key={indiceLinha} style={estilos.linhaLacuna}>
            {linha.split('___').map((trecho, indiceTrecho) => {
              if (indiceTrecho === 0) {
                return (
                  <Text key={indiceTrecho} style={[estilos.codigo, { color: coresCodigo.identificador }]}>
                    {trecho}
                  </Text>
                );
              }

              contador += 1;
              const indice = contador;
              const valor = escolhas[indice];

              const estado = revelado
                ? valor === respostas[indice]
                  ? { borderColor: cores.acento, backgroundColor: cores.acentoFundo }
                  : { borderColor: cores.erro, backgroundColor: cores.erroFundo }
                : indice === alvo
                  ? { borderColor: cores.acento }
                  : valor
                    ? { borderColor: cores.acentoLinha, backgroundColor: cores.superficie }
                    : null;

              return (
                <View key={indiceTrecho} style={estilos.pedaco}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={revelado || !valor}
                    onPress={() => limpar(indice)}
                    style={[estilos.lacuna, { borderColor: cores.acentoLinha }, estado]}
                  >
                    <Text
                      style={[
                        estilos.codigo,
                        { color: coresCodigo.identificador },
                        valor && { color: cores.acento }
                      ]}
                    >
                      {valor ?? '     '}
                    </Text>
                  </Pressable>
                  <Text style={[estilos.codigo, { color: coresCodigo.identificador }]}>{trecho}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={estilos.pecas}>
        {tokens.map((token) => (
          <Pressable
            key={token}
            accessibilityRole="button"
            disabled={revelado || alvo >= respostas.length}
            onPress={() => escolher(token)}
            style={({ pressed }) => [
              estilos.peca,
              { backgroundColor: cores.superficie, borderColor: cores.linha },
              pressed && estilos.pecaPressionada,
              (revelado || alvo >= respostas.length) && estilos.pecaApagada
            ]}
          >
            <Text style={[estilos.pecaTexto, { color: cores.texto }]}>{token}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

/* ─────────────────────────── escrever ──────────────────────────── */

/**
 * A barra de símbolos.
 *
 * Sem ela, escrever `private readonly List<string> _itens = new();` no teclado
 * do Android exige trocar de camada umas quinze vezes. É o detalhe que decide
 * se o exercício mais importante do app é usável.
 */
const SIMBOLOS = ['(', ')', '{', '}', '[', ']', ';', '=', '>', '<', '_', '.', '"', "'", ':', '/'];

function BarraSimbolos({ aoInserir }: { aoInserir: (s: string) => void }) {
  const cores = useCores();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      contentContainerStyle={estilos.barra}
    >
      {SIMBOLOS.map((simbolo) => (
        <Pressable
          key={simbolo}
          accessibilityLabel={`inserir ${simbolo}`}
          accessibilityRole="button"
          onPress={() => aoInserir(simbolo)}
          style={({ pressed }) => [
            estilos.tecla,
            { backgroundColor: cores.superficie, borderColor: cores.linha },
            pressed && estilos.pecaPressionada
          ]}
        >
          <Text style={[estilos.teclaTexto, { color: cores.acento }]}>{simbolo}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function CardEscreva({ card, resposta, setResposta, revelado }: PropsCard) {
  const cores = useCores();
  const texto = (resposta as string | null) ?? '';

  return (
    <>
      <TextInput
        style={[
          estilos.entrada,
          { backgroundColor: cores.superficie, borderColor: cores.linha, color: cores.textoForte },
          revelado && estilos.entradaRevelada
        ]}
        value={texto}
        onChangeText={setResposta}
        editable={!revelado}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        placeholder="digite a linha aqui"
        placeholderTextColor={cores.desativado}
      />

      {!revelado && <BarraSimbolos aoInserir={(s) => setResposta(texto + s)} />}

      {card.dica && !revelado && (
        <Text style={[estilos.dica, { color: cores.desativado }]}>{`dica: ${card.dica}`}</Text>
      )}
    </>
  );
}

/* ────────────────────────── montar linha ───────────────────────── */

function CardMontarLinha({ card, resposta, setResposta, revelado }: PropsCard) {
  const cores = useCores();
  const partes = card.partes ?? [];
  // Guardamos índices, não texto: duas peças iguais precisam ser botões
  // distintos, senão tocar numa remove a outra.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- embaralha uma vez por card, não a cada render
  const ordem = useMemo(() => embaralhar(partes.map((_, i) => i)), [card.id]);

  const escolhidos = (resposta as number[] | null) ?? [];
  const disponiveis = ordem.filter((i) => !escolhidos.includes(i));

  return (
    <>
      <View style={[estilos.montagem, { backgroundColor: cores.superficie, borderColor: cores.linha }]}>
        {escolhidos.length === 0 ? (
          <Text style={[estilos.montagemVazia, { color: cores.desativado }]}>
            toque nas peças na ordem certa
          </Text>
        ) : (
          escolhidos.map((indice, posicao) => (
            <Pressable
              key={`${indice}-${posicao}`}
              accessibilityRole="button"
              disabled={revelado}
              onPress={() => setResposta(escolhidos.filter((_, p) => p !== posicao))}
              style={[estilos.peca, { borderColor: cores.acento, backgroundColor: cores.acentoFundo }]}
            >
              <Text style={[estilos.pecaTexto, { color: cores.acento }]}>{partes[indice]}</Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={estilos.pecas}>
        {disponiveis.map((indice) => (
          <Pressable
            key={indice}
            accessibilityRole="button"
            disabled={revelado}
            onPress={() => setResposta([...escolhidos, indice])}
            style={({ pressed }) => [
              estilos.peca,
              { backgroundColor: cores.superficie, borderColor: cores.linha },
              pressed && estilos.pecaPressionada
            ]}
          >
            <Text style={[estilos.pecaTexto, { color: cores.texto }]}>{partes[indice]}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

/* ─────────────────────────── ache o erro ───────────────────────── */

function CardAcheOErro({ card, resposta, setResposta, revelado }: PropsCard) {
  return (
    <BlocoCodigo
      codigo={comoTexto(card.codigo)}
      linguagem={card.linguagem}
      numerado
      aoTocarLinha={(indice) => setResposta(indice)}
      linhaSelecionada={resposta as number | null}
      linhaCerta={card.linhaErrada ?? null}
      revelado={revelado}
    />
  );
}

/* ──────────────────────────── registro ─────────────────────────── */

export function RenderizarCard(props: PropsCard) {
  switch (props.card.tipo) {
    case 'lacuna':
      return <CardLacuna {...props} />;
    case 'escreva':
      return <CardEscreva {...props} />;
    case 'montar-linha':
      return <CardMontarLinha {...props} />;
    case 'ache-o-erro':
      return <CardAcheOErro {...props} />;
    default:
      return <CardAlternativas {...props} />;
  }
}

const estilos = StyleSheet.create({
  lista: { gap: espaco.sm },

  // ── código com lacunas ─────────────────────────────────────────
  caixaCodigo: {
    borderLeftWidth: tamanhos.trilho,
    paddingVertical: espaco.md + 2,
    paddingHorizontal: 18
  },
  linhaLacuna: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', minHeight: 28 },
  pedaco: { flexDirection: 'row', alignItems: 'center' },
  codigo: { ...tipo.codigo },

  lacuna: {
    borderWidth: tamanhos.linha,
    paddingHorizontal: espaco.sm,
    marginHorizontal: 2,
    minWidth: 56,
    alignItems: 'center'
  },

  // ── peças ──────────────────────────────────────────────────────
  pecas: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  peca: {
    borderWidth: tamanhos.linha,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm + 2,
    minHeight: 40,
    justifyContent: 'center'
  },
  pecaPressionada: { opacity: 0.7 },
  pecaApagada: { opacity: 0.35 },
  pecaTexto: { ...tipo.codigo, lineHeight: 20 },

  montagem: {
    minHeight: 62,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: espaco.sm,
    borderWidth: tamanhos.linha,
    padding: espaco.sm
  },
  montagemVazia: { ...tipo.notaMonoMenor, paddingHorizontal: espaco.xs },

  // ── escrever ───────────────────────────────────────────────────
  entrada: {
    minHeight: 96,
    borderWidth: tamanhos.linha,
    padding: espaco.md,
    ...tipo.codigo,
    lineHeight: 22,
    textAlignVertical: 'top'
  },
  entradaRevelada: { opacity: 0.7 },

  barra: { gap: espaco.xs + 2, paddingVertical: espaco.xs },
  tecla: {
    width: tamanhos.alvoMin,
    height: tamanhos.alvoMin,
    borderWidth: tamanhos.linha,
    alignItems: 'center',
    justifyContent: 'center'
  },
  teclaTexto: { ...tipo.codigo, fontSize: 16, lineHeight: 20 },

  dica: { ...tipo.notaMonoMenor }
});
