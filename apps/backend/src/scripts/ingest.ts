import path from "node:path";
import { db } from "../db/index.js";
import { documentsTable } from "../db/schemas/document.js";
import { eq } from "drizzle-orm";
import { chunksTable } from "../db/schemas/chunk.js";
import { readdir } from "node:fs/promises";
import { extractPages } from "../ingest/pdf.js";
import { chunkPages } from "../ingest/chunker.js";
import { embed } from "../ingest/embedder.js";

const PDF_DIR = path.resolve("data/pdfs");
const PIPELINE = "fixed-1000-200"; // Estrategia de chunking
const BATCH = 32; // Batch para salver chunks

async function ingestFile(fileName: string) {
  const existing = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.file_name, fileName));

  if (existing.length) return console.log(`${fileName} já ingerido`);

  const [company, doc_type, year, period] = path.basename(fileName, ".pdf").split("_");

  if (!company || !doc_type || !year || Number.isNaN(Number(year))) {
    return console.warn(`${fileName}: nome fora do padrão empresa_tipo_ano.pdf, pulando`);
  }

  const pages = await extractPages(path.join(PDF_DIR, fileName));

  const chunks = chunkPages(pages);

  console.log(`${fileName}: ${pages.length} páginas -> ${chunks.length} chunks`);

  await db.transaction(async (tx) => {
    const [doc] = await tx
      .insert(documentsTable)
      .values({
        company,
        doc_type,
        fiscal_year: Number(year),
        fiscal_period: period ?? "anual",
        file_name: fileName,
      })
      .returning();

    if (!doc) throw new Error(`Falha ao inserir documento ${fileName}`);

    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH);
      const vectors = await embed(batch.map((c) => c.content));

      await tx.insert(chunksTable).values(
        batch.map((c, j) => {
          const embedding = vectors[j];
          if (!embedding) throw new Error(`Embedding ausente no chunk ${i + j}`);

          return {
            pipeline: PIPELINE,
            page: c.page,
            content: c.content,
            embedding,
            document_id: doc.id,
          };
        }),
      );
      console.log(`${Math.min(i + BATCH, chunks.length)} / ${chunks.length}`);
    }
  });
}

const files = (await readdir(PDF_DIR)).filter((f) => f.endsWith(".pdf"));

for (const f of files) await ingestFile(f);

process.exit(0);
