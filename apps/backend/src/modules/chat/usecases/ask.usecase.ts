import { buildContext, buildUserPrompt, SYSTEM_PROMPT } from "../../../rag/prompt.js";
import type { LLMProvider } from "../../../shared/providers/llm.provider.js";
import type { RetrieveFilters, Retriever } from "../../retrieval/types.js";

export type AskUseCaseDTO = {
  execute(
    question: string,
    filters?: RetrieveFilters,
  ): Promise<{ answer: string; sources: unknown } | null>;
};

export class AskUseCase implements AskUseCaseDTO {
  constructor(
    private readonly retriever: Retriever,
    private readonly llm: LLMProvider,
  ) {}

  async execute(
    question: string,
    filters?: RetrieveFilters,
  ): Promise<{ answer: string; sources: unknown } | null> {
    const chunks = await this.retriever.retrieve(question, filters);

    if (chunks.length === 0) {
      return null;
    }

    const { context, sources } = buildContext(chunks);

    const answer = await this.llm.generate({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(question, context) },
      ],
      temperature: 0,
      maxCtx: 8192,
    });

    return { answer, sources };
  }
}
