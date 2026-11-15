ALTER TABLE "chunks" DROP COLUMN "fts";--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "fts" tsvector GENERATED ALWAYS AS (to_tsvector('pt_unaccent', "chunks"."content")) STORED;--> statement-breakpoint
CREATE INDEX "chunks_fts_idx" ON "chunks" USING gin ("fts");