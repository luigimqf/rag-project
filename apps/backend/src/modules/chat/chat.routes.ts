import type { FastifyInstance } from "fastify";
import type { RetrieveFilters } from "../retrieval/types.js";
import { askFactory } from "./factories/ask.factory.js";

type AskBody = { question: string; filters?: RetrieveFilters };

export async function askRoutes(app: FastifyInstance) {
  const askController = askFactory();

  app.post<{ Body: AskBody }>(
    "/ask",
    {
      schema: {
        body: {
          type: "object",
          required: ["question"],
          properties: {
            question: { type: "string", minLength: 3, maxLength: 2000 },
            filters: {
              type: "object",
              properties: {
                company: { type: "string" },
                fiscalYear: { type: "integer" },
                docType: { type: "string" },
                fiscalPeriod: { type: "string" },
                pipeline: { type: "string" },
                documentId: { type: "integer" },
              },
              additionalProperties: false,
            },
          },
        },
      },
    },
    async (req) => askController.handle(req),
  );
}
