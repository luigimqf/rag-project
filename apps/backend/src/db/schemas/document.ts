import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";

export const documentsTable = pgTable("documents", {
  id: serial('id').primaryKey(),
  company: text('company').notNull(),
  doc_type: text('doc_type').notNull(),
  fiscal_year: integer('fiscal_year').notNull(),
  fiscal_period: text('fiscal_period').notNull().default('anual'),
  file_name: text('file_name').notNull().unique(),
})