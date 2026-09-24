import { useCallback, useEffect, useState } from 'react';
import { AxiosResponse } from 'axios';
import { Page } from '../api/types';
import { apiErrorMessage } from '../api/client';

/** Drives a search box + filter selects + page number against a paginated
 * list endpoint. Re-fetches whenever the query params or page change. */
export function usePaginated<T>(fetcher: (params: Record<string, unknown>) => Promise<AxiosResponse<Page<T>>>, extraParams: Record<string, unknown> = {}) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [data, setData] = useState<Page<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const extraKey = JSON.stringify(extraParams);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    // Drop empty-string filter values (an unset <select>) rather than sending
    // e.g. status=&provider= — the server's zod enums reject '' as invalid.
    const extra = Object.fromEntries(Object.entries(JSON.parse(extraKey)).filter(([, v]) => v !== ''));
    fetcher({ page, pageSize: 20, ...(q ? { q } : {}), ...extra })
      .then((res) => setData(res.data))
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, extraKey]);

  useEffect(() => {
    load();
  }, [load]);

  // Any filter/search change resets to page 1.
  const setQuery = useCallback((next: string) => {
    setQ(next);
    setPage(1);
  }, []);

  return { data, loading, error, page, setPage, q, setQuery, reload: load };
}
