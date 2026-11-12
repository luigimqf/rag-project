ALTER TABLE "chunks" RENAME COLUMN "pipepine" TO "pipeline";--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "fiscal_period" text DEFAULT 'anual' NOT NULL;--> statement-breakpoint
CREATE INDEX "chunks_embedding_idx" ON "chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
ALTER TABLE "chunks" DROP CONSTRAINT "chunks_document_id_documents_id_fkey", ADD CONSTRAINT "chunks_document_id_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE;