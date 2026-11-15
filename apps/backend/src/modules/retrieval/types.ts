export type RetrieveFilters = {
  company?: string;
  docType?: string;
  fiscalYear?: number;
  fiscalPeriod?: string;
  pipeline?: string;
  documentId?: number;
};

export type RetrievedChunk = {
  id: number;
  documentId: number;
  pipeline: string;
  page: number;
  content: string;
  company: string;
  docType: string;
  fiscalYear: number;
  fiscalPeriod: string;
  fileName: string;
  distance?: number; // depuração
  textRank?: number; // depuração
};

export type NewChunkInput = {
  documentId: number;
  pipeline: string;
  page: number;
  content: string;
  embedding: number[];
};

export interface Retriever {
  retrieve(query: string, filters?: RetrieveFilters): Promise<ScoredChunk[]>;
}

export type ScoredChunk = RetrievedChunk & { score: number };

export type SearchOptions = {
  limit: number;
  maxDistance?: number | undefined;
  minStrictHits?: number | undefined;
};

export type TextSearchResult = { items: RetrievedChunk[]; strictCount: number };
