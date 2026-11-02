export function categoryProductCount(name: string, categories: (string | null)[]): number {
  const normalized = name.trim().toLowerCase();
  return categories.filter((category) => category?.trim().toLowerCase() === normalized).length;
}

// A trimmed category name, or null when blank or already taken (case-insensitive).
export function uniqueCategoryName(query: string, existing: string[]): string | null {
  const name = query.trim();
  if (!name) return null;
  const taken = new Set(existing.map((category) => category.trim().toLowerCase()));
  return taken.has(name.toLowerCase()) ? null : name;
}
