import { PlayArrow } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { mediaUrl } from '../utils/mediaUrl';

function ListItem({ index, item, profileId }) {
  const [isHovered, setIsHovered] = useState(false);
  const [movie, setMovie] = useState({});
  const moveDistance = index * 240 + index * 8;

  const isDoc =
    item && typeof item === 'object' && item._id && item.imageSmall;

  useEffect(() => {
    if (isDoc) {
      setMovie(item);
      return undefined;
    }
    const id = typeof item === 'object' ? item._id : item;
    if (!id) return undefined;

    let cancelled = false;
    const getMovie = async () => {
      try {
        const res = await client.get(`/movies/find/${id}`, {
          params: profileId ? { profileId } : {},
        });
        if (!cancelled) setMovie(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    getMovie();
    return () => {
      cancelled = true;
    };
  }, [item, isDoc, profileId]);

  const to = movie._id ? `/content/${movie._id}` : '/browse';

  return (
    <Link to={to}>
      <div
        className='listItem'
        style={{ left: isHovered && moveDistance }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img src={mediaUrl(movie.imageSmall)} alt='Show Preview' />
        {isHovered && movie.trailer && (
          <>
            <video src={mediaUrl(movie.trailer)} autoPlay muted loop />
            <div className='itemInfo'>
              <div className='icons'>
                <PlayArrow className='play' />
              </div>
              <div className='itemInfoTop'>
                <span className='bordered'>{movie.limit}+</span>
                <span className='duration'>{movie.duration}</span>
                <span className='bordered hd'>HD</span>
              </div>
              <div className='genre'>{movie.genre}</div>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

export default ListItem;
