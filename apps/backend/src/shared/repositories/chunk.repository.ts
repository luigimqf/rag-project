import { and, cosineDistance, desc, eq, getTableColumns, lt, type SQL, sql } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { chunksTable } from "../../db/schemas/chunk.js";
import { documentsTable } from "../../db/schemas/document.js";
import type {
  NewChunkInput,
  RetrievedChunk,
  RetrieveFilters,
  SearchOptions,
} from "../../modules/retrieval/types.js";

const INSERT_BATCH = 500;

export interface ChunkRepositoryDTO {
  existsForDocument(documentId: number, pipeline: string): Promise<boolean>;
  insertMany(chunks: NewChunkInput[]): Promise<void>;
  searchByVector(
    embedding: number[],
    filters: RetrieveFilters,
    opts: SearchOptions,
  ): Promise<RetrievedChunk[]>;
  searchByText(
    query: string,
    filters: RetrieveFilters,
    opts: SearchOptions,
  ): Promise<RetrievedChunk[]>;
}

const { id: _docId, ...documentColumns } = getTableColumns(documentsTable);
const { embedding: _emb, fts: _fts, ...chunkColumns } = getTableColumns(chunksTable);
const selection = { ...documentColumns, ...chunkColumns };

export class ChunkRepository implements ChunkRepositoryDTO {
  constructor(private readonly db: Database) {}

  async existsForDocument(documentId: number, pipeline: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: chunksTable.id })
      .from(chunksTable)
      .where(and(eq(chunksTable.documentId, documentId), eq(chunksTable.pipeline, pipeline)))
      .limit(1);

    return rows.length > 0;
  }

  async insertMany(chunks: NewChunkInput[]): Promise<void> {
    if (chunks.length === 0) return;

    await this.db.transaction(async (tx) => {
      for (let i = 0; i < chunks.length; i += INSERT_BATCH) {
        await tx.insert(chunksTable).values(chunks.slice(i, i + INSERT_BATCH));
      }
    });
  }

  searchByVector(
    embedding: number[],
    filters: RetrieveFilters,
    { limit, maxDistance }: SearchOptions,
  ): Promise<RetrievedChunk[]> {
    const distance = cosineDistance(chunksTable.embedding, embedding).mapWith(Number);

    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL hnsw.ef_search = 100`);
      await tx.execute(sql`SET LOCAL hnsw.iterative_scan = relaxed_order`);

      return tx
        .select(selection)
        .from(chunksTable)
        .innerJoin(documentsTable, eq(chunksTable.documentId, documentsTable.id))
        .where(
          and(
            ...this.toConditions(filters),
            maxDistance !== undefined ? lt(distance, maxDistance) : undefined,
          ),
        )
        .orderBy(distance)
        .limit(limit);
    });
  }

  searchByText(
    query: string,
    filters: RetrieveFilters,
    { limit }: SearchOptions,
  ): Promise<RetrievedChunk[]> {
    const tsq = sql`to_tsquery('portuguese', replace(plainto_tsquery('portuguese', ${query})::text, ' & ', ' | '))`;
    const rank = sql<number>`ts_rank_cd(${chunksTable.fts}, ${tsq})`;

    return this.db
      .select(selection)
      .from(chunksTable)
      .innerJoin(documentsTable, eq(chunksTable.documentId, documentsTable.id))
      .where(and(sql`${chunksTable.fts} @@ ${tsq}`, ...this.toConditions(filters)))
      .orderBy(desc(rank))
      .limit(limit);
  }

  private toConditions(f: RetrieveFilters): SQL[] {
    const conds: SQL[] = [];
    if (f.company) conds.push(eq(documentsTable.company, f.company));
    if (f.fiscalYear) conds.push(eq(documentsTable.fiscalYear, f.fiscalYear));
    if (f.docType) conds.push(eq(documentsTable.docType, f.docType));
    if (f.fiscalPeriod) conds.push(eq(documentsTable.fiscalPeriod, f.fiscalPeriod));
    if (f.pipeline) conds.push(eq(chunksTable.pipeline, f.pipeline));
    if (f.documentId) conds.push(eq(chunksTable.documentId, f.documentId));
    return conds;
  }
}
