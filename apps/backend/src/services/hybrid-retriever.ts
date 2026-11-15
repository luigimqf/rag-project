import type { RetrieveFilters, Retriever, ScoredChunk } from "../modules/retrieval/types.js";
import type { EmbeddingProvider } from "../shared/providers/embedding.provider.js";
import type { ChunkRepositoryDTO } from "../shared/repositories/chunk.repository.js";
import { reciprocalRankFusion } from "./reciprocal-rank.fusion.js";

export type HybridRetrieverConfig = {
  pipeline: string;
  topK: number;
  candidates: number;
  maxDistance?: number;
  rrfK: number;
  minStrictHits: number;
  vectorWeight: number;
  textWeight: number;
};

const DEFAULT_CONFIG: Omit<HybridRetrieverConfig, "pipeline"> = {
  topK: 8,
  candidates: 40,
  maxDistance: 0.6,
  rrfK: 60,
  minStrictHits: 5,
  vectorWeight: 1,
  textWeight: 1,
};

export class HybridRetriever implements Retriever {
  private readonly config: HybridRetrieverConfig;

  constructor(
    private readonly chunks: ChunkRepositoryDTO,
    private readonly embedder: EmbeddingProvider,
    config: Pick<HybridRetrieverConfig, "pipeline"> & Partial<HybridRetrieverConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async retrieve(query: string, filters: RetrieveFilters = {}): Promise<ScoredChunk[]> {
    const {
      pipeline,
      topK,
      candidates,
      maxDistance,
      rrfK,
      minStrictHits,
      vectorWeight,
      textWeight,
    } = this.config;
    const scoped = { ...filters, pipeline };

    const embedding = await this.embedder.embedOne(query);

    const [byVector, byText] = await Promise.all([
      this.chunks.searchByVector(embedding, scoped, { limit: candidates, maxDistance }),
      this.chunks.searchByText(query, scoped, { limit: candidates, minStrictHits }),
    ]);

    if (byVector.length === 0 && byText.strictCount === 0) return [];

    return reciprocalRankFusion(
      [
        { items: byVector, weight: vectorWeight },
        { items: byText.items, weight: textWeight },
      ],
      rrfK,
    ).slice(0, topK);
  }
}
