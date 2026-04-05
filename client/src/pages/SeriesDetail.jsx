import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import client from '../api/client';
import { ProfileContext } from '../contexts/ProfileContext';
import { mediaUrl } from '../utils/mediaUrl';

function SeriesDetail() {
  const { id } = useParams();
  const { currentProfile } = useContext(ProfileContext);
  const [series, setSeries] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!id || !currentProfile?._id) return undefined;
    setSeries(null);
    setEpisodes([]);
    let cancelled = false;
    (async () => {
      setErr('');
      try {
        const [s, eps] = await Promise.all([
          client.get(`/series/${id}`, {
            params: { profileId: currentProfile._id },
          }),
          client.get('/episodes', { params: { seriesId: id } }),
        ]);
        if (!cancelled) {
          setSeries(s.data);
          setEpisodes(Array.isArray(eps.data) ? eps.data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setErr('Không tải được series.');
          setSeries(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, currentProfile]);

  const bySeasonId = useMemo(() => {
    const groups = new Map();
    for (const ep of episodes) {
      const sid = String(ep.seasonId);
      if (!groups.has(sid)) groups.set(sid, []);
      groups.get(sid).push(ep);
    }
    return groups;
  }, [episodes]);

  if (err || !series) {
    return (
      <div className='home page-detail'>
        <Navbar />
        <p className='featured-empty' style={{ padding: 24 }}>
          {err || 'Đang tải…'}
        </p>
      </div>
    );
  }

  const seasons = series.seasons || [];

  return (
    <div className='home page-detail'>
      <Navbar />
      <div
        className='page-detail__hero page-detail__hero--tall'
        style={{
          backgroundImage: `linear-gradient(180deg, transparent 30%, #141414), url(${mediaUrl(series.image || series.imageSmall)})`,
        }}
      >
        <div className='page-detail__hero-inner'>
          <h1 className='page-detail__headline'>{series.title}</h1>
          <p className='page-detail__meta'>
            {series.limit != null ? `${series.limit}+ · ` : ''}
            {series.genre || ''}
          </p>
          <p className='page-detail__desc'>{series.description}</p>
        </div>
      </div>

      <section className='page-detail__section'>
        <h2 className='page-detail__section-title'>Tập phim</h2>
        {seasons.length === 0 ? (
          <p className='featured-empty'>Chưa có mùa / tập.</p>
        ) : (
          seasons.map((se) => {
            const raw = bySeasonId.get(String(se._id)) || [];
            const eps = [...raw].sort(
              (a, b) => a.episodeNumber - b.episodeNumber
            );
            return (
              <div key={se._id} className='page-detail__season'>
                <h3 className='page-detail__season-title'>
                  {se.title || `Mùa ${se.seasonNumber}`}
                </h3>
                <ul className='page-detail__ep-list'>
                  {eps.map((ep) => (
                    <li key={ep._id}>
                      <Link
                        to='/watch'
                        state={{
                          movie: {
                            _id: ep._id,
                            video: ep.video,
                            title: ep.title,
                            imageSmall: ep.imageSmall,
                            description: ep.description,
                            duration: ep.duration,
                          },
                          contentType: 'episode',
                        }}
                        className='page-detail__ep-link'
                      >
                        {ep.episodeNumber}. {ep.title}
                        {!ep.video ? (
                          <span className='page-detail__ep-muted'>
                            {' '}
                            (chưa có video)
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

export default SeriesDetail;
