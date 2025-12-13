import { useState, useEffect, useCallback } from 'react';

interface PaginationResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  refresh: () => void;
}

interface PaginationOptions {
  initialPage?: number;
  limit?: number;
  autoLoad?: boolean;
}

/**
 * Hook para manejar paginación de forma simple
 *
 * @example
 * const { data, loading, page, totalPages, nextPage, prevPage } = usePagination(
 *   (page, limit) => getEmployeesPaginated(page, limit, true),
 *   { limit: 20 }
 * );
 */
export function usePagination<T>(
  fetchFunction: (page: number, limit: number) => Promise<{
    results: T[];
    total: number;
    page: number;
    pages: number;
  }>,
  options: PaginationOptions = {}
): PaginationResult<T> {
  const {
    initialPage = 1,
    limit = 50,
    autoLoad = true
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFunction(pageNum, limit);
      setData(response.results);
      setTotalPages(response.pages);
      setTotal(response.total);
      setPage(response.page);
    } catch (err: any) {
      setError(err.message || 'Error loading data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, limit]);

  useEffect(() => {
    if (autoLoad) {
      loadData(page);
    }
  }, [page, autoLoad, loadData]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  const refresh = useCallback(() => {
    loadData(page);
  }, [page, loadData]);

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    total,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    goToPage,
    nextPage,
    prevPage,
    refresh
  };
}
