export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function parsePagination(query: PaginationQuery, defaultSort = 'createdAt') {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const skip = (page - 1) * limit;

  const orderBy = query.sortBy
    ? { [query.sortBy]: query.sortOrder || 'asc' }
    : { [defaultSort]: 'desc' };

  return { skip, take: limit, orderBy };
}