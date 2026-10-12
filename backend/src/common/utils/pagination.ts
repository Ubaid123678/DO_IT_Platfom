export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const positiveInteger = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return fallback;
};

export const getPagination = (query: {
  page?: unknown;
  limit?: unknown;
}): Pagination => {
  const page = positiveInteger(query.page, DEFAULT_PAGE);
  const limit = Math.min(
    positiveInteger(query.limit, DEFAULT_LIMIT),
    MAX_LIMIT,
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};
