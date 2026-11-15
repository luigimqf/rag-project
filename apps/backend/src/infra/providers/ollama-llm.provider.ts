import { Ollama } from "ollama";
import type { GenerateParams, LLMProvider } from "../../shared/providers/llm.provider.js";

export class OllamaLLMProvider implements LLMProvider {
  private readonly client: Ollama;

  constructor(
    host: string,
    readonly model: string,
    timeoutMs = 180_000,
  ) {
    this.client = new Ollama({
      host,
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) }),
    });
  }

  async generate({
    messages,
    temperature = 0,
    maxTokens,
    maxCtx,
  }: GenerateParams): Promise<string> {
    const res = await this.client.chat({
      model: this.model,
      messages,
      options: {
        temperature,
        ...(maxTokens !== undefined && { num_predict: maxTokens }),
        ...(maxCtx !== undefined && { num_ctx: maxCtx }),
      },
    });
    return res.message.content;
  }
}
