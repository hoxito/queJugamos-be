export type PageInput = {
  page?: number;
  limit?: number;
};

export type PageOptions = {
  page: number;
  limit: number;
  skip: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
};

export function resolvePageOptions(input: PageInput, defaultLimit = 30): PageOptions {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.max(1, input.limit ?? defaultLimit);
  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
}

export function paginatedResponse<T>(items: T[], total: number, options: PageOptions): PaginatedResponse<T> {
  return {
    items,
    total,
    page: options.page,
    limit: options.limit,
    hasNextPage: options.skip + items.length < total
  };
}
