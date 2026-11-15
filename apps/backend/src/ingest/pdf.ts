/** biome-ignore-all lint/suspicious/noControlCharactersInRegex: Postgresql rejects control characters in text */
import { readFile } from "node:fs/promises";
import { extractText, getDocumentProxy } from "unpdf";

const clean = (s: string) =>
  s.replace(/\u0000/g, "").replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " "); // Postgres rejeita

export const extractPages = async (filepath: string) => {
  const buffer = await readFile(filepath);

  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });

  return text.map((t) => clean(t).replace(/\s+/g, " ").trim());
};
