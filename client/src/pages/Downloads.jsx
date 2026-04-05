import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import LibraryMediaCard from '../components/LibraryMediaCard';
import client from '../api/client';
import { ProfileContext } from '../contexts/ProfileContext';
import { useReviewsSummaryMap } from '../hooks/useReviewsSummaryMap';

function Downloads() {
  const { currentProfile } = useContext(ProfileContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const loadItems = useCallback(async () => {
    if (!currentProfile?._id) return;
    try {
      const res = await client.get('/downloads', {
        params: { profileId: currentProfile._id },
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      setItems(rows);
      setErr('');
    } catch (e) {
      console.log(e);
      setErr('Không tải được downloads.');
      setItems([]);
    }
  }, [currentProfile?._id]);

  useEffect(() => {
    if (!currentProfile?._id) return undefined;

    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadItems();
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentProfile?._id, loadItems]);

  const doneItems = useMemo(() => {
    const done = items.filter((i) => i.status === 'done');
    const byContent = new Map();
    for (const it of done) {
      const k = String(it.contentId || '');
      if (!k) continue;
      const prev = byContent.get(k);
      const t = new Date(it.updatedAt || it.createdAt || 0).getTime();
      const pt = prev
        ? new Date(prev.updatedAt || prev.createdAt || 0).getTime()
        : 0;
      if (!prev || t >= pt) byContent.set(k, it);
    }
    return [...byContent.values()].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime()
    );
  }, [items]);

  const contentIds = useMemo(
    () => doneItems.map((d) => String(d.contentId)).filter(Boolean),
    [doneItems]
  );

  const [movieMap, setMovieMap] = useState(new Map());
  useEffect(() => {
    if (!currentProfile?._id) return undefined;
    if (contentIds.length === 0) {
      setMovieMap(new Map());
      return undefined;
    }

    let cancelled = false;
    (async () => {
      const rows = await Promise.all(
        contentIds.map(async (cid) => {
          try {
            const res = await client.get(`/movies/find/${cid}`, {
              params: { profileId: currentProfile._id },
            });
            return { id: cid, movie: res.data };
          } catch {
            return { id: cid, movie: null };
          }
        })
      );
      if (cancelled) return;
      setMovieMap(new Map(rows.map((r) => [String(r.id), r.movie])));
    })();

    return () => {
      cancelled = true;
    };
  }, [contentIds, currentProfile]);

  const ratingMap = useReviewsSummaryMap(contentIds, currentProfile?._id);

  return (
    <div className='home page-library page-newhot'>
      <Navbar />
      <div className='page-newhot__inner'>
        <h1 className='page-newhot__title'>Downloads</h1>
        <p className='page-downloads__note'>
          Sau khi <strong>Tải về máy</strong> thành công trên trang phim, mục đã
          tải sẽ hiện ở đây.
        </p>

        {loading ? (
          <p className='featured-empty'>Đang tải…</p>
        ) : err ? (
          <p className='featured-empty'>{err}</p>
        ) : doneItems.length === 0 ? (
          <p className='featured-empty'>
            Chưa có phim đã tải. Mở trang phim → nút Tải về máy.
          </p>
        ) : (
          <div className='page-newhot__grid'>
            {doneItems.map((it) => {
              const cid = String(it.contentId || '');
              const movie =
                movieMap.get(cid) ||
                ({
                  _id: cid,
                  title: 'Đang tải thông tin…',
                  image: '',
                  imageSmall: '',
                });
              return (
                <LibraryMediaCard
                  key={cid}
                  movie={movie}
                  to={`/content/${cid}`}
                  ratingSummary={ratingMap.get(cid)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Downloads;
