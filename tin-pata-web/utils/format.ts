export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

export function formatPageRange(start: number, end: number): string {
  if (start === end) {
    return `Page ${start}`;
  }
  return `Pages ${start}–${end}`;
}
