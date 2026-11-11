CREATE TABLE "chunks" (
	"id" serial PRIMARY KEY,
	"pipepine" text NOT NULL,
	"page" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1024) NOT NULL,
	"document_id" integer NOT NULL,
	"fts" tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', "chunks"."content")) STORED
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY,
	"company" text NOT NULL,
	"doc_type" text NOT NULL,
	"fiscal_year" integer NOT NULL,
	"file_name" text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE INDEX "chunks_fts_idx" ON "chunks" USING gin ("fts");--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_document_id_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id");