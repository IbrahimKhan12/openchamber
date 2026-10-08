type TextNodeLike = { data: string };

type TextBoundaryAffinity = 'left' | 'right';

export const createTextPositionIndex = <T extends TextNodeLike>(textNodes: T[]) => {
  const endOffsets: number[] = [];
  let totalLength = 0;
  for (const node of textNodes) {
    totalLength += node.data.length;
    endOffsets.push(totalLength);
  }

  return (targetOffset: number, affinity: TextBoundaryAffinity): { node: T; offset: number } | null => {
    let low = 0;
    let high = textNodes.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      const endOffset = endOffsets[middle];
      if (targetOffset < endOffset || (targetOffset === endOffset && affinity === 'left')) {
        high = middle;
      } else {
        low = middle + 1;
      }
    }

    const node = textNodes[low] ?? textNodes.at(-1);
    if (!node) return null;
    if (low === textNodes.length) return { node, offset: node.data.length };
    return { node, offset: Math.max(0, targetOffset - (low === 0 ? 0 : endOffsets[low - 1])) };
  };
};
