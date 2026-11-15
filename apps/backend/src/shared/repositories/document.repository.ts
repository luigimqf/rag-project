import { eq } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { documentsTable } from "../../db/schemas/document.js";

export type DocumentRecord = {
  id: number;
  company: string;
  docType: string;
  fiscalYear: number;
  fiscalPeriod: string;
  fileName: string;
};

export type NewDocumentInput = Omit<DocumentRecord, "id">;

export interface DocumentRepositoryDTO {
  findByFileName(fileName: string): Promise<DocumentRecord | null>;
  create(input: NewDocumentInput): Promise<DocumentRecord>;
}

export class DocumentRepository implements DocumentRepositoryDTO {
  constructor(private readonly db: Database) {}

  async findByFileName(fileName: string): Promise<DocumentRecord | null> {
    const [doc] = await this.db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.fileName, fileName))
      .limit(1);

    return doc ?? null;
  }

  async create(input: NewDocumentInput): Promise<DocumentRecord> {
    const [doc] = await this.db.insert(documentsTable).values(input).returning();

    if (!doc) throw new Error(`Falha ao inserir documento ${input.fileName}`);

    return doc;
  }
}
