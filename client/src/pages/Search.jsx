import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import client from '../api/client';
import { ProfileContext } from '../contexts/ProfileContext';
import { mediaUrl } from '../utils/mediaUrl';

function Search() {
  const { currentProfile } = useContext(ProfileContext);
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentProfile?._id) return undefined;
    const query = q.trim();
    if (query.length < 1) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await client.get('/catalog/search', {
          params: {
            q: query,
            profileId: currentProfile._id,
            limit: 30,
          },
        });
        if (!cancelled) setItems(res.data?.items || []);
      } catch (e) {
        console.log(e);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 320);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, currentProfile]);

  return (
    <div className='home page-search'>
      <Navbar />
      <div className='page-search__inner'>
        <input
          type='search'
          className='page-search__input'
          placeholder='Phim, series…'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete='off'
        />
        {loading ? (
          <p className='featured-empty'>Đang tìm…</p>
        ) : (
          <div className='page-newhot__grid'>
            {items.map((item) => (
              <Link
                key={item._id}
                to={`/content/${item._id}`}
                className='page-newhot__card'
              >
                <img
                  src={mediaUrl(item.imageSmall || item.image)}
                  alt={item.title}
                  className='page-newhot__img'
                />
                <span className='page-newhot__card-title'>{item.title}</span>
              </Link>
            ))}
          </div>
        )}
        {!loading && q.trim().length >= 1 && items.length === 0 ? (
          <p className='featured-empty'>Không có kết quả.</p>
        ) : null}
      </div>
    </div>
  );
}

export default Search;
