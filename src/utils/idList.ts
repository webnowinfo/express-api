/**
 * Parse an ID list stored in a legacy text column. Accepts comma/semicolon/space separated
 * values ("1,5,12") and JSON arrays ("[1,5,12]" or '["1","5"]'). Invalid entries are dropped.
 */
export const parseIdList = (raw: string | null | undefined): number[] => {
  if (!raw) return [];
  const ids = raw
    .replace(/[[\]"']/g, '')
    .split(/[\s,;]+/)
    .filter((part) => part !== '')
    .map(Number)
    .filter((id) => Number.isInteger(id) && id >= 0);
  return [...new Set(ids)];
};

// New values are always written comma-separated
export const formatIdList = (ids: number[]): string => [...new Set(ids)].join(',');
