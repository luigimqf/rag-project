import { type SQL, sql } from "drizzle-orm";
import { customType, index, integer, pgTable, serial, text, vector } from "drizzle-orm/pg-core";
import { documentsTable } from "./document.js";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const chunksTable = pgTable(
  "chunks",
  {
    id: serial("id").primaryKey(),
    pipeline: text("pipeline").notNull(),
    page: integer("page").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1024 }).notNull(),
    document_id: integer("document_id")
      .notNull()
      .references(() => documentsTable.id, { onDelete: "cascade" }),
    fts: tsvector("fts").generatedAlwaysAs(
      (): SQL => sql`to_tsvector('portuguese', ${chunksTable.content})`,
    ),
  },
  (t) => [
    index("chunks_fts_idx").using("gin", t.fts),
    index("chunks_embedding_idx").using("hnsw", t.embedding.op("vector_cosine_ops")),
  ],
);
