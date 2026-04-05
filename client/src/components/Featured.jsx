import { PlayArrow } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { mediaUrl } from '../utils/mediaUrl';

function Featured({
  type,
  setGenre,
  hero,
  profileId,
}) {
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    if (hero) {
      setMovie(hero);
      return undefined;
    }

    let cancelled = false;
    const getRandomMovie = async () => {
      try {
        const params = new URLSearchParams();
        if (type) params.set('type', type);
        if (profileId) params.set('profileId', profileId);
        const q = params.toString();
        const res = await client.get('/movies/random' + (q ? `?${q}` : ''));
        if (!cancelled) setMovie(res.data?.[0] ?? null);
      } catch (err) {
        console.log(err);
        if (!cancelled) setMovie(null);
      }
    };
    getRandomMovie();
    return () => {
      cancelled = true;
    };
  }, [type, hero, profileId]);

  return (
    <div className={type ? 'featured featured--typed' : 'featured'}>
      {type && (
        <div className='category'>
          <span className='featuredMovieType'>
            {type === 'movie' ? 'Movies' : 'TV Shows'}
          </span>
          <select
            name='genre'
            id='genre'
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value=''>Genres</option>
            <option value='Action'>Action</option>
            <option value='Anime'>Anime</option>
            <option value='Comedy'>Comedy</option>
            <option value='Crime'>Crime</option>
            <option value='Documentary'>Documentary</option>
            <option value='Drama'>Drama</option>
            <option value='Fantasy'>Fantasy</option>
            <option value='Horror'>Horror</option>
            <option value='Romance'>Romance</option>
            <option value='Thriller'>Thriller</option>
          </select>
        </div>
      )}
      {!movie ? (
        <p className='featured-empty'>
          Chưa có nội dung — thêm phim và list từ admin.
        </p>
      ) : (
        <>
          <img
            src={mediaUrl(movie.image)}
            alt=''
            className='featured-header'
          />
          <div className='featured-gradient' aria-hidden />
          <div className='info'>
            {movie.imageTitle ? (
              <img
                src={mediaUrl(movie.imageTitle)}
                alt=''
                className='featured-title'
              />
            ) : (
              <h1 className='featured-title-text'>{movie.title}</h1>
            )}
            <div className='buttons'>
              <Link
                to={movie._id ? `/content/${movie._id}` : '/browse'}
                style={{ textDecoration: 'none' }}
              >
                <button className='play' type='button'>
                  <PlayArrow className='feat-icon' />
                  <span>Chi tiết</span>
                </button>
              </Link>
              {movie.limit != null && movie.limit !== '' ? (
                <span className='age-rating'>{movie.limit}+</span>
              ) : null}
            </div>
            {movie.description ? (
              <span className='description'>{movie.description}</span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

export default Featured;
