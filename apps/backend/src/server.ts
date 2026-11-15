import { setupApp } from "./lib/app.js";
import { env } from "./lib/env.js";

// TODO:
// Validação com Zod no controller- Validação com Zod no controller
// Testes: o script test do backend é só exit 1. Testes unitários de reciprocalRankFusion, chunkPages e buildContext
// Ingestão asincrona: rota para upload de arquivo com bullmq e redis para substituir script ingest
// Reranker: Depois do RRF voce busca 40 candidatos e reordena ate os 8 finais
// Extração de filtro: "Qual o lucro da Petrobas em 2024", um LLM com saída estruturada (zod) extrai company e fiscalYear e preenche RetrieveFilters
// Decomposição de perguntas comparativas: "Compare a receita de 2022 e 2023" vira duas buscas e os  resultados são combinados depois
// Observabilidade: tracing de cada etapa (embed → busca vetorial → busca textual → RRF → LLM) com latência e tokens. Ferramentas possíveis: OpenTelemetry ou Langfuse.
// Cache semântico para perguntas repetidas.
// Streaming das respostas por SSE: Fastify e Ollama já suportam.
// 1. Testes + validação Zod (rápido, fecha as lacunas).
// 2. Harness de avaliação (é a base para medir todo o resto).
// 3. Reranker e extração de filtros, cada um com o antes e depois documentado.
// 4. Frontend com streaming e citações.
// 5. Ingestão assíncrona e observabilidade.

const app = setupApp();

app.listen({ port: env.PORT }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
