import { Ollama } from "ollama";
import type { EmbeddingProvider } from "../../shared/providers/embedding.provider.js";

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  private readonly client: Ollama;

  constructor(
    host: string,
    readonly model: string,
    readonly dimensions: number,
  ) {
    this.client = new Ollama({ host });
  }

  async embed(texts: string[]): Promise<number[][]> {
    const { embeddings } = await this.client.embed({ model: this.model, input: texts });

    if (embeddings.length !== texts.length) {
      throw new Error(`Esperado ${texts.length} embeddings, recebido ${embeddings.length}`);
    }

    const wrong = embeddings.find((v) => v.length !== this.dimensions);
    if (wrong) {
      throw new Error(
        `Modelo ${this.model} retornou ${wrong.length} dimensões, esperado ${this.dimensions}`,
      );
    }

    return embeddings;
  }

  async embedOne(text: string): Promise<number[]> {
    const [vec] = await this.embed([text.trim()]);
    if (!vec?.length) throw new Error(`Embedding vazio para o modelo ${this.model}`);
    return vec;
  }
}
