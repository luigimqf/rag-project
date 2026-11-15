export function reciprocalRankFusion<T extends { id: number }>(
  lists: T[][],
  k = 60,
): (T & { score: number })[] {
  const scores = new Map<number, { item: T; score: number }>();

  for (const list of lists) {
    list.forEach((item, idx) => {
      const s = 1 / (k + idx + 1);
      const prev = scores.get(item.id);
      if (prev) prev.score += s;
      else scores.set(item.id, { item, score: s });
    });
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ item, score }) => ({ ...item, score }));
}
