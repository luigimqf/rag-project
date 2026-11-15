export const CHUNKING = { size: 1000, overlap: 200 } as const;

export function buildPipelineId(embeddingModel: string) {
  return `fixed-${CHUNKING.size}-${CHUNKING.overlap}:${embeddingModel}`;
}
