import { useContext, useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import LibraryMediaCard from '../components/LibraryMediaCard';
import client from '../api/client';
import { ProfileContext } from '../contexts/ProfileContext';
import { useReviewsSummaryMap } from '../hooks/useReviewsSummaryMap';

function MyList() {
  const { currentProfile } = useContext(ProfileContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const contentIds = useMemo(
    () => items.map((m) => String(m._id)).filter(Boolean),
    [items]
  );
  const ratingMap = useReviewsSummaryMap(contentIds, currentProfile?._id);

  useEffect(() => {
    if (!currentProfile?._id) return undefined;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await client.get('/my-list', {
          params: { profileId: currentProfile._id },
        });
        if (!cancelled) setItems(res.data || []);
      } catch (e) {
        console.log(e);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentProfile]);

  return (
    <div className='home page-library page-mylist'>
      <Navbar />
      <div className='page-newhot__inner'>
        <h1 className='page-newhot__title'>My List</h1>

        {loading ? (
          <p className='featured-empty'>Đang tải…</p>
        ) : items.length === 0 ? (
          <p className='featured-empty'>Chưa có gì trong My List.</p>
        ) : (
          <div className='page-newhot__grid'>
            {items.map((item) => (
              <LibraryMediaCard
                key={item._id}
                movie={item}
                to={`/content/${item._id}`}
                ratingSummary={ratingMap.get(String(item._id))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyList;
