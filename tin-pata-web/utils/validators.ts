export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function minLength(value: string, min: number): boolean {
  return value.trim().length >= min;
}
