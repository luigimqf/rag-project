import { readdir } from "node:fs/promises";
import path from "node:path";
import { db } from "../db/index.js";
import { embeddingProvider } from "../infra/providers/index.js";
import { chunkPages } from "../ingest/chunker.js";
import { extractPages } from "../ingest/pdf.js";
import { buildPipelineId, CHUNKING } from "../ingest/pipeline.js";
import type { NewChunkInput } from "../modules/retrieval/types.js";
import { ChunkRepository } from "../shared/repositories/chunk.repository.js";
import {
  DocumentRepository,
  type NewDocumentInput,
} from "../shared/repositories/document.repository.js";

const PDF_DIR = path.resolve("data/pdfs");
const EMBED_BATCH = 32; // Textos por chamada ao modelo de embedding
const PIPELINE = buildPipelineId(embeddingProvider.model);

const documents = new DocumentRepository(db);
const chunks = new ChunkRepository(db);

/** Padrão: empresa_tipo_ano[_periodo].pdf */
function parseFileName(fileName: string): NewDocumentInput | null {
  const [company, docType, year, period] = path.basename(fileName, ".pdf").split("_");
  const fiscalYear = Number(year);

  if (!company || !docType || !year || Number.isNaN(fiscalYear)) return null;

  return { company, docType, fiscalYear, fiscalPeriod: period ?? "anual", fileName };
}

async function embedInBatches(texts: string[]): Promise<number[][]> {
  const vectors: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    vectors.push(...(await embeddingProvider.embed(texts.slice(i, i + EMBED_BATCH))));
    console.log(`  embeddings ${Math.min(i + EMBED_BATCH, texts.length)} / ${texts.length}`);
  }

  return vectors;
}

async function ingestFile(fileName: string) {
  const meta = parseFileName(fileName);

  if (!meta) {
    return console.warn(`${fileName}: nome fora do padrão empresa_tipo_ano.pdf, pulando`);
  }

  const doc = (await documents.findByFileName(fileName)) ?? (await documents.create(meta));

  if (await chunks.existsForDocument(doc.id, PIPELINE)) {
    return console.log(`${fileName}: já ingerido (${PIPELINE})`);
  }

  const pages = await extractPages(path.join(PDF_DIR, fileName));
  const pieces = chunkPages(pages, CHUNKING.size, CHUNKING.overlap);

  console.log(`${fileName}: ${pages.length} páginas -> ${pieces.length} chunks`);

  const vectors = await embedInBatches(pieces.map((c) => c.content));

  const rows: NewChunkInput[] = pieces.map((c, i) => {
    const embedding = vectors[i];
    if (!embedding) throw new Error(`Embedding ausente no chunk ${i}`);

    return { documentId: doc.id, pipeline: PIPELINE, page: c.page, content: c.content, embedding };
  });

  await chunks.insertMany(rows);
}

const files = (await readdir(PDF_DIR)).filter((f) => f.endsWith(".pdf"));
let failed = 0;

console.log(`Pipeline: ${PIPELINE}`);

for (const f of files) {
  try {
    await ingestFile(f);
  } catch (err) {
    failed++;
    console.error(`${f}: falhou`, err);
  }
}

process.exit(failed > 0 ? 1 : 0);
