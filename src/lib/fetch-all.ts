type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

export async function fetchAll<T>(
  factory: (from: number, to: number) => PromiseLike<PageResult<T>>,
) {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await factory(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}
