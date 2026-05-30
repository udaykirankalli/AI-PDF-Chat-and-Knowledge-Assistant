export type TextChunk = {
  text: string;
  index: number;
};

const targetChunkSize = 1100;
const overlapSize = 180;

export function chunkText(text: string): TextChunk[] {
  const normalizedText = text.replace(/\s+/g, " ").trim();

  if (!normalizedText) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let cursor = 0;

  while (cursor < normalizedText.length) {
    const targetEnd = Math.min(cursor + targetChunkSize, normalizedText.length);
    const sentenceEnd = findSentenceBoundary(normalizedText, cursor, targetEnd);
    const end = sentenceEnd > cursor ? sentenceEnd : targetEnd;
    const chunk = normalizedText.slice(cursor, end).trim();

    if (chunk) {
      chunks.push({
        text: chunk,
        index: chunks.length
      });
    }

    if (end >= normalizedText.length) {
      break;
    }

    cursor = Math.max(end - overlapSize, cursor + 1);
  }

  return chunks;
}

function findSentenceBoundary(text: string, start: number, targetEnd: number) {
  const window = text.slice(start, targetEnd);
  const boundary = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "), window.lastIndexOf("! "));

  if (boundary < targetChunkSize * 0.55) {
    return targetEnd;
  }

  return start + boundary + 1;
}
