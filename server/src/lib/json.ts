export function toJsonArray(values: string[] | undefined): string {
  return JSON.stringify(values ?? []);
}

export function fromJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
