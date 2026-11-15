import type { RetrievedChunk } from "../modules/retrieval/types.js";

export const SYSTEM_PROMPT = `Você é um analista que responde perguntas sobre documentos financeiros.
Use APENAS as informações dentro de <contexto>.
Cite as fontes no formato [n] logo após cada afirmação.
Se a resposta não estiver no contexto, diga claramente que não encontrou a informação.
Não invente números.`;

export function buildContext(chunks: RetrievedChunk[], maxChars = 12_000) {
  const blocks: string[] = [];
  const sources: { n: number; chunkId: number; fileName: string; page: number }[] = [];
  let total = 0;

  for (const c of chunks) {
    const n = blocks.length + 1;
    const header = `[${n}] ${c.company} · ${c.docType} · ${c.fiscalPeriod} ${c.fiscalYear} · ${c.fileName}, p. ${c.page}`;
    const block = `${header}\n${c.content}`;

    if (total + block.length > maxChars) break;

    blocks.push(block);
    sources.push({ n, chunkId: c.id, fileName: c.fileName, page: c.page });

    total += block.length;
  }

  return { context: blocks.join("\n\n---\n\n"), sources };
}

export function buildUserPrompt(question: string, context: string) {
  return `<contexto>\n${context}\n</contexto>\n\nPergunta: ${question}`;
}
