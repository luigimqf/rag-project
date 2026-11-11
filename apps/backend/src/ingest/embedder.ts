const EMBEDDER_URL = "";

export async function embed(texts:string[]): Promise<number[][]> {
  const res = await fetch(EMBEDDER_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({model: "bge-m3", input: texts})
  });

  if(!res.ok) throw new Error(`Embedding falhou: ${res.status} ${await res.text()}`)

  const data = (await res.json()) as {embeddings: number[][]}

  return data.embeddings;
}