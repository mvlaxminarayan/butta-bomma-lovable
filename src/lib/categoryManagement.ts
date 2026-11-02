export function categoryProductCount(name: string, categories: (string | null)[]): number {
  const normalized = name.trim().toLowerCase();
  return categories.filter((category) => category?.trim().toLowerCase() === normalized).length;
}