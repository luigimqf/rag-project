import { readFile } from "node:fs/promises";
import { extractText, getDocumentProxy } from "unpdf";

export const extractPages = async (filepath: string) => {
  const buffer = await readFile(filepath);

  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });

  return text.map((t) => t.replace(/\s+/g, "").trim());
};
