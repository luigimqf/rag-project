import { db } from "../../../db/index.js";
import { embeddingProvider, llmProvider } from "../../../infra/providers/index.js";
import { buildPipelineId } from "../../../ingest/pipeline.js";
import { HybridRetriever } from "../../../services/hydrid-retriever.js";
import { ChunkRepository } from "../../../shared/repositories/chunk.repository.js";
import { AskController } from "../controllers/ask.controller.js";
import { AskUseCase } from "../usecases/ask.usecase.js";

export function askFactory() {
  const chunkRepository = new ChunkRepository(db);
  const retriever = new HybridRetriever(chunkRepository, embeddingProvider, {
    pipeline: buildPipelineId(embeddingProvider.model),
  });
  const askUseCase = new AskUseCase(retriever, llmProvider);
  return new AskController(askUseCase);
}
