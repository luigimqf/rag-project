import type { FastifyRequest } from "fastify";
import type { Controller } from "../../../shared/types.js";
import type { RetrieveFilters } from "../../retrieval/types.js";
import type { AskUseCaseDTO } from "../usecases/ask.usecase.js";

type AskBody = {
  Body: { question: string; filters?: Omit<RetrieveFilters, "pipeline"> };
};

export class AskController implements Controller<AskBody> {
  constructor(private readonly askUseCase: AskUseCaseDTO) {}

  async handle(req: FastifyRequest<AskBody>) {
    const { question, filters } = req.body;

    const result = await this.askUseCase.execute(question, filters);

    return result;
  }
}
