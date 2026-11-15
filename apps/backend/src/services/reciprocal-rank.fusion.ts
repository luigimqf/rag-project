//k=60: Serve para equilibrar, valores pequenos fazem os primeiras da lista valerem muito, desbalanceando o ranking, com o k=60 a diferença entre
//a primeira posição e a ultima posição é pequeno. Faz com que um dado aparecer nas duas listas pesa mais que a posição exata.

export function reciprocalRankFusion<T extends { id: number }>(
  lists: { items: T[]; weight?: number }[],
  k = 60,
): (T & { score: number })[] {
  const scores = new Map<number, { item: T; score: number }>();

  for (const { items, weight } of lists) {
    console.log(items);
    items.forEach((item, idx) => {
      const s = (weight ?? 1) / (k + idx + 1);
      const prev = scores.get(item.id);
      if (prev) prev.score += s;
      else scores.set(item.id, { item, score: s });
    });
  }

  console.log(scores);
  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ item, score }) => ({ ...item, score }));
}
