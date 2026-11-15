import { chunksTable } from "../../db/schemas/chunk.js";
import { env } from "../../lib/env.js";
import type { EmbeddingProvider } from "../../shared/providers/embedding.provider.js";
import type { LLMProvider } from "../../shared/providers/llm.provider.js";
import { OllamaEmbeddingProvider } from "./ollama-embedding.provider.js";
import { OllamaLLMProvider } from "./ollama-llm.provider.js";

function assertEmbeddingDimensions(dims: number) {
  const columnDims = chunksTable.embedding.length;

  if (dims !== columnDims) {
    throw new Error(
      `EMBED_DIMS (${dims}) difere da coluna chunks.embedding (${columnDims}). ` +
        "Ajuste o schema + migration ou o modelo de embedding.",
    );
  }
}

function makeEmbeddingProvider(): EmbeddingProvider {
  assertEmbeddingDimensions(env.EMBED_DIMS);

  switch (env.EMBEDDING_PROVIDER) {
    case "ollama":
      return new OllamaEmbeddingProvider(env.EMBEDDER_HOST, env.EMBEDDER_MODEL, env.EMBED_DIMS);
  }
}

function makeLLMProvider(): LLMProvider {
  switch (env.LLM_PROVIDER) {
    case "ollama":
      return new OllamaLLMProvider(env.LLM_HOST ?? env.EMBEDDER_HOST, env.LLM_MODEL);
  }
}

// Singleton: criados uma vez, não a cada request
export const embeddingProvider = makeEmbeddingProvider();
export const llmProvider = makeLLMProvider();
