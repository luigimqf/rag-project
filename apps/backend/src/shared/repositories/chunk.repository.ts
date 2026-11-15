import { and, cosineDistance, desc, eq, getTableColumns, type SQL, sql } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { chunksTable, FTS_CONFIG } from "../../db/schemas/chunk.js";
import { documentsTable } from "../../db/schemas/document.js";
import type {
  NewChunkInput,
  RetrievedChunk,
  RetrieveFilters,
  SearchOptions,
  TextSearchResult,
} from "../../modules/retrieval/types.js";

const INSERT_BATCH = 500;
const ftsConfig = sql.raw(`'${FTS_CONFIG}'`);
const DEFAULT_MIN_STRICT_HITS = 5;

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
  ): Promise<TextSearchResult>;
}

const { id: _docId, ...documentColumns } = getTableColumns(documentsTable);
const { embedding: _emb, fts: _fts, ...chunkColumns } = getTableColumns(chunksTable);
const selection = { ...documentColumns, ...chunkColumns };
const selectionSql = sql.join(
  Object.entries(selection).map(([key, col]) => sql`${col} as ${sql.identifier(key)}`),
  sql`, `,
);

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
    const distance = cosineDistance(chunksTable.embedding, embedding);
    const where = and(...this.toConditions(filters));

    const ef = Math.max(100, Math.trunc(limit));
    if (!Number.isSafeInteger(ef) || ef <= 0) {
      throw new Error(`ef_search inválido: ${ef}`);
    }

    return this.db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SET LOCAL hnsw.ef_search = ${ef}`));
      await tx.execute(sql`SET LOCAL hnsw.iterative_scan = relaxed_order`);

      return tx.execute<RetrievedChunk>(
        sql`
          with nearest as materialized (
            select ${selectionSql}, ${distance} as distance
            from ${chunksTable}
            inner join ${documentsTable} on ${eq(chunksTable.documentId, documentsTable.id)}
            ${where ? sql`where ${where}` : sql.empty()}
            order by distance
            limit ${limit}
          )
          select * from nearest
          ${maxDistance !== undefined ? sql`where distance < ${maxDistance}` : sql.empty()}
          order by distance`,
        "objects",
      );
    });
  }

  async searchByText(
    query: string,
    filters: RetrieveFilters,
    { limit, minStrictHits = DEFAULT_MIN_STRICT_HITS }: SearchOptions,
  ): Promise<TextSearchResult> {
    const strictQuery = sql`plainto_tsquery(${ftsConfig}, ${query})`;
    const strict = await this.runTextSearch(strictQuery, filters, limit);

    if (strict.length >= Math.min(minStrictHits, limit)) {
      return { items: strict, strictCount: strict.length };
    }

    const orQuery = sql`to_tsquery('simple', replace(plainto_tsquery(${ftsConfig}, ${query})::text, ' & ', ' | '))`;
    const loose = await this.runTextSearch(orQuery, filters, limit + strict.length);

    const seen = new Set(strict.map((c) => c.id));
    const items = [...strict, ...loose.filter((c) => !seen.has(c.id))].slice(0, limit);

    return { items, strictCount: strict.length };
  }

  private runTextSearch(
    tsq: SQL,
    filters: RetrieveFilters,
    limit: number,
  ): Promise<RetrievedChunk[]> {
    const rank = sql<number>`ts_rank_cd(${chunksTable.fts}, ${tsq})`.mapWith(Number);

    return this.db
      .select({ ...selection, textRank: rank })
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
