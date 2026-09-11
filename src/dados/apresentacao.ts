import AsyncStorage from "@react-native-async-storage/async-storage";

const prefixo = "ouroboros:introducao:v1:";
const ouvintes = new Set<(uid: string) => void>();

export async function introducaoFoiVista(uid: string): Promise<boolean> {
  return (await AsyncStorage.getItem(`${prefixo}${uid}`)) === "sim";
}

export async function marcarIntroducaoVista(uid: string): Promise<void> {
  await AsyncStorage.setItem(`${prefixo}${uid}`, "sim");
  ouvintes.forEach((ouvinte) => ouvinte(uid));
}

export function aoMarcarIntroducao(ouvinte: (uid: string) => void): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}
