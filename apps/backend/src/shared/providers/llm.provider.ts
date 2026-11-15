export type ChatMessage = { role: "system" | "user"; content: string };

export type GenerateParams = {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  maxCtx?: number;
};

export interface LLMProvider {
  readonly model: string;
  generate(params: GenerateParams): Promise<string>;
}
