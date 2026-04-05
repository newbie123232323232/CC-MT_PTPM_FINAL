import { useEffect, useMemo, useState } from 'react';
import client from '../api/client';

/** contentIds: string[] → Map<id, { averageRating, count } | null> */
export function useReviewsSummaryMap(contentIds, profileId) {
  const [map, setMap] = useState(() => new Map());
  const key = useMemo(
    () => (contentIds.length ? [...contentIds].sort().join(',') : ''),
    [contentIds]
  );

  useEffect(() => {
    if (!profileId || !key) {
      setMap(new Map());
      return undefined;
    }

    const ids = key.split(',');
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        ids.map(async (cid) => {
          try {
            const { data } = await client.get(`/reviews/content/${cid}`, {
              params: { profileId, limit: 1, page: 1 },
            });
            return [
              cid,
              {
                averageRating: data?.averageRating ?? null,
                count: data?.count ?? 0,
              },
            ];
          } catch {
            return [cid, null];
          }
        })
      );
      if (!cancelled) setMap(new Map(entries));
    })();

    return () => {
      cancelled = true;
    };
  }, [profileId, key]);

  return map;
}
