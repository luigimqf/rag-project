import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  company: text("company").notNull(),
  docType: text("doc_type").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  fiscalPeriod: text("fiscal_period").notNull().default("anual"),
  fileName: text("file_name").notNull().unique(),
});

export type Document = typeof documentsTable.$inferSelect;
export type NewDocument = typeof documentsTable.$inferInsert;

export type DocumentColumnKeys = keyof Document;
