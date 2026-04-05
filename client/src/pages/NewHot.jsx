import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import client from '../api/client';
import { ProfileContext } from '../contexts/ProfileContext';
import { mediaUrl } from '../utils/mediaUrl';

function NewHot() {
  const { currentProfile } = useContext(ProfileContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProfile?._id) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await client.get('/catalog/new-hot', {
          params: { profileId: currentProfile._id, limit: 40 },
        });
        if (!cancelled) setItems(res.data?.items || []);
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
    <div className='home page-newhot'>
      <Navbar />
      <div className='page-newhot__inner'>
        <h1 className='page-newhot__title'>Mới &amp; Hot</h1>
        {loading ? (
          <p className='featured-empty'>Đang tải…</p>
        ) : (
          <div className='page-newhot__grid'>
            {items.map((item) => (
              <Link
                key={item._id}
                to={
                  item.contentType === 'series'
                    ? `/series/${item._id}`
                    : `/content/${item._id}`
                }
                className='page-newhot__card'
              >
                <img
                  src={mediaUrl(item.imageSmall || item.image)}
                  alt={item.title}
                  className='page-newhot__img'
                />
                <span className='page-newhot__card-title'>{item.title}</span>
                {item.contentType === 'series' ? (
                  <span className='page-newhot__badge'>Series</span>
                ) : null}
              </Link>
            ))}
          </div>
        )}
        {!loading && items.length === 0 ? (
          <p className='featured-empty'>Chưa có nội dung.</p>
        ) : null}
      </div>
    </div>
  );
}

export default NewHot;
