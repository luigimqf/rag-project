export type Chunk = {page:number, content: string};

export const chunkPages = (pages: string[], size = 1000, overlap = 200) => {
  const chunks: Chunk[] = [];

  pages.forEach((text, i) => {
    let start = 0;

    while(start < text.length) {
      let end = Math.min(start + size, text.length)

      if(end < text.length) {
        const lastDot = text.lastIndexOf('. ',end)
        if(lastDot > start + size * 0.5) end = lastDot + 1
      }

      const content = text.slice(start,end).trim();

      if(content.length > 50) chunks.push({page: i + 1, content})

      if(end >= text.length) break;
      start = end - overlap
    }
  })

  return chunks
}