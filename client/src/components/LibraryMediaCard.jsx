import { Link } from 'react-router-dom';
import { mediaUrl } from '../utils/mediaUrl';

function formatRating(avg, count) {
  if (avg == null || Number.isNaN(Number(avg))) return 'Chưa có đánh giá';
  const n = Math.round(Number(avg) * 10) / 10;
  const c = count != null ? ` (${count})` : '';
  return `${n} ★${c}`;
}

export default function LibraryMediaCard({ movie, to, ratingSummary }) {
  if (!movie?._id) return null;
  const age =
    movie.limit != null && movie.limit !== ''
      ? `${movie.limit}+`
      : null;

  return (
    <Link
      to={to}
      state={{ movie }}
      className='page-library-card'
    >
      <img
        src={mediaUrl(movie.imageSmall || movie.image)}
        alt={movie.title || ''}
        className='page-library-card__img'
      />
      <div className='page-library-card__body'>
        <span className='page-library-card__title'>{movie.title}</span>
        <div className='page-library-card__meta'>
          <span className='page-library-card__rating'>
            {formatRating(
              ratingSummary?.averageRating,
              ratingSummary?.count
            )}
          </span>
          {age ? (
            <span className='page-library-card__age'>{age}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
