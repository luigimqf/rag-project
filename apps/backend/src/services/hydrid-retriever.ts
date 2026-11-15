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
};

const DEFAULT_CONFIG: Omit<HybridRetrieverConfig, "pipeline"> = {
  topK: 8,
  candidates: 40,
  maxDistance: 0.6,
  rrfK: 60,
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
    const { pipeline, topK, candidates, maxDistance, rrfK } = this.config;
    const scoped = { ...filters, pipeline: filters.pipeline ?? pipeline };

    const embedding = await this.embedder.embedOne(query);

    const [byVector, byText] = await Promise.all([
      this.chunks.searchByVector(embedding, scoped, { limit: candidates, maxDistance }),
      this.chunks.searchByText(query, scoped, { limit: candidates }),
    ]);

    return reciprocalRankFusion([byVector, byText], rrfK).slice(0, topK);
  }
}
