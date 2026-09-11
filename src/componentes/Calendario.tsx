import { StyleSheet, Text, View } from 'react-native';

import { espaco, tamanhos, tipo } from '@/tema';
import type { Paleta } from '@/tema/temas';
import { useCores } from '@/dados/TemaContexto';
import { diaDaSemana, hoje, somarDias } from '@/nucleo/datas';

/**
 * Calendário das últimas semanas.
 *
 * Um número solto ("sequência 3") não cria pressão nenhuma. Uma grade com
 * buracos visíveis cria — e é ela que faz a pessoa não querer quebrar a
 * sequência.
 *
 * No redesign as células perderam o número de dentro e o canto arredondado:
 * viraram quadrados cheios ou vazios, como as barras da régua de sequência em
 * Hoje. A data de cada um não importava; o padrão de buracos, sim.
 */

const SEMANAS = 5;
const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function Calendario({ historico, paleta }: { historico: string[]; paleta?: Paleta }) {
  const temaAtual = useCores();
  const c = paleta ?? temaAtual;
  const feitos = new Set(historico);
  const hojeIso = hoje();

  // Termina no sábado da semana atual para as colunas alinharem por dia da
  // semana, como num calendário de verdade.
  const fim = somarDias(hojeIso, 6 - diaDaSemana(hojeIso));
  const inicio = somarDias(fim, -(SEMANAS * 7 - 1));

  const dias = Array.from({ length: SEMANAS * 7 }, (_, i) => {
    const dia = somarDias(inicio, i);
    return { dia, feito: feitos.has(dia), ehHoje: dia === hojeIso, futuro: dia > hojeIso };
  });

  return (
    <View style={estilos.tudo}>
      <View style={estilos.linha}>
        {LETRAS.map((letra, indice) => (
          <View key={indice} style={estilos.coluna}>
            <Text style={[estilos.cabecalho, { color: c.desativado }]}>{letra}</Text>
          </View>
        ))}
      </View>

      <View style={estilos.grade}>
        {dias.map(({ dia, feito, ehHoje, futuro }) => (
          <View key={dia} style={estilos.coluna}>
            <View
              style={[
                estilos.dia,
                { backgroundColor: c.linha },
                feito && { backgroundColor: c.acento },
                !feito && ehHoje && { backgroundColor: 'transparent', borderColor: c.acento },
                futuro && { backgroundColor: 'transparent', borderColor: c.linha }
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tudo: { gap: espaco.sm },
  linha: { flexDirection: 'row' },
  grade: { flexDirection: 'row', flexWrap: 'wrap' },
  coluna: { width: `${100 / 7}%`, padding: 2 },

  cabecalho: {
    ...tipo.rotuloCelula,
    letterSpacing: 0,
    textAlign: 'center'
  },

  dia: {
    aspectRatio: 1,
    borderWidth: tamanhos.linha,
    borderColor: 'transparent'
  }
});
