import { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Add, Download, PlayArrow, PlaylistAddCheck } from '@mui/icons-material';
import Navbar from '../components/Navbar';
import client from '../api/client';
import { ProfileContext } from '../contexts/ProfileContext';
import { AuthContext } from '../authContext/AuthContext';
import { mediaUrl } from '../utils/mediaUrl';
import { downloadMediaToDevice } from '../utils/directFileDownload';

function StarsDisplay({ value }) {
  const v = Math.round(Number(value) || 0);
  const full = '★'.repeat(Math.min(5, Math.max(0, v)));
  const empty = '☆'.repeat(5 - Math.min(5, Math.max(0, v)));
  return (
    <span className='page-detail__stars' aria-label={`${v} of 5 stars`}>
      {full}
      {empty}
    </span>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className='page-detail__stars page-detail__stars--interactive'>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type='button'
          className={n <= value ? 'on' : ''}
          onClick={() => onChange(n)}
          aria-label={`${n} sao`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function MovieDetail() {
  const { id } = useParams();
  const { currentProfile } = useContext(ProfileContext);
  const { user } = useContext(AuthContext);
  const [item, setItem] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [err, setErr] = useState('');
  const [reviews, setReviews] = useState(null);
  const [revLoading, setRevLoading] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState('');
  const [revErr, setRevErr] = useState('');
  const [revBusy, setRevBusy] = useState(false);
  const [inMyList, setInMyList] = useState(false);
  const [listBusy, setListBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadHint, setDownloadHint] = useState('');

  useEffect(() => {
    if (!id || !currentProfile?._id) return undefined;
    setItem(null);
    setSimilar([]);
    let cancelled = false;
    (async () => {
      setErr('');
      try {
        const [d, s] = await Promise.all([
          client.get(`/catalog/content/${id}`, {
            params: { profileId: currentProfile._id },
          }),
          client.get(`/catalog/content/${id}/similar`, {
            params: { profileId: currentProfile._id },
          }),
        ]);
        if (!cancelled) {
          setItem(d.data);
          setSimilar(Array.isArray(s.data) ? s.data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setErr('Không tải được nội dung.');
          setItem(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, currentProfile]);

  useEffect(() => {
    if (!id || !currentProfile?._id) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get('/my-list', {
          params: { profileId: currentProfile._id },
        });
        if (!cancelled) {
          const rows = Array.isArray(data) ? data : [];
          setInMyList(rows.some((m) => String(m._id) === String(id)));
        }
      } catch {
        if (!cancelled) setInMyList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, currentProfile?._id]);

  const loadReviews = async () => {
    if (!id || !currentProfile?._id) return;
    setRevLoading(true);
    setRevErr('');
    try {
      const { data } = await client.get(`/reviews/content/${id}`, {
        params: { profileId: currentProfile._id },
      });
      setReviews(data);
      if (data?.myReview) {
        setFormRating(data.myReview.rating);
        setFormText(data.myReview.text || '');
      } else {
        setFormRating(5);
        setFormText('');
      }
    } catch (e) {
      setRevErr('Không tải được đánh giá.');
      setReviews(null);
    } finally {
      setRevLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentProfile?._id]);

  const submitReview = async () => {
    if (!user || !currentProfile?._id || !id) return;
    const text = formText.trim();
    if (!text) {
      setRevErr('Nhập nội dung đánh giá.');
      return;
    }
    setRevBusy(true);
    setRevErr('');
    try {
      if (reviews?.myReview) {
        await client.put(`/reviews/content/${id}`, {
          profileId: currentProfile._id,
          rating: formRating,
          text,
        });
      } else {
        await client.post(`/reviews/content/${id}`, {
          profileId: currentProfile._id,
          rating: formRating,
          text,
        });
      }
      await loadReviews();
    } catch (e) {
      const msg = e.response?.data?.message || 'Không lưu được.';
      setRevErr(msg);
    } finally {
      setRevBusy(false);
    }
  };

  const deleteReview = async () => {
    if (!user || !currentProfile?._id || !id) return;
    setRevBusy(true);
    setRevErr('');
    try {
      await client.delete(`/reviews/content/${id}`, {
        params: { profileId: currentProfile._id },
      });
      setFormRating(5);
      setFormText('');
      await loadReviews();
    } catch (e) {
      const msg = e.response?.data?.message || 'Không xóa được.';
      setRevErr(msg);
    } finally {
      setRevBusy(false);
    }
  };

  const toggleMyList = async () => {
    if (!currentProfile?._id || !id) return;
    setListBusy(true);
    try {
      if (inMyList) {
        await client.delete(`/my-list/${id}`, {
          params: { profileId: currentProfile._id },
        });
        setInMyList(false);
      } else {
        await client.post('/my-list', {
          profileId: currentProfile._id,
          contentId: id,
        });
        setInMyList(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setListBusy(false);
    }
  };

  const registerDirectDownloadRecord = async () => {
    if (!currentProfile?._id || !id) return;
    try {
      const { data: list } = await client.get('/downloads', {
        params: { profileId: currentProfile._id },
      });
      const rows = Array.isArray(list) ? list : [];
      if (
        rows.some(
          (d) => String(d.contentId) === String(id) && d.status === 'done'
        )
      ) {
        return;
      }
      const { data: created } = await client.post('/downloads', {
        profileId: currentProfile._id,
        contentId: id,
        quality: 'hd',
      });
      const dlId = created?._id;
      if (!dlId) return;
      await client.put(`/downloads/${dlId}`, {
        status: 'downloading',
        networkType: 'wifi',
      });
      await client.put(`/downloads/${dlId}`, {
        status: 'done',
        progress: 100,
        localRef: 'browser:direct',
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const startDownload = async () => {
    if (!item?.video) {
      setDownloadHint('Phim chưa có file video để tải.');
      return;
    }
    setDownloadBusy(true);
    setDownloadHint('');
    try {
      const src = mediaUrl(item.video);
      const result = await downloadMediaToDevice(src, item.title);
      if (!result.ok) {
        setDownloadHint(result.message);
        return;
      }
      await registerDirectDownloadRecord();
      if (result.mode === 'blob') {
        setDownloadHint(
          'Đang tải xuống — kiểm tra thư mục Downloads của trình duyệt.'
        );
      } else {
        setDownloadHint(
          result.note ||
            'Đã mở tab mới — dùng “Lưu thành…” (Ctrl+S) nếu cần.'
        );
      }
    } catch (e) {
      console.error(e);
      setDownloadHint('Không tải được. Thử tắt chặn popup hoặc kiểm tra URL video.');
    } finally {
      setDownloadBusy(false);
    }
  };

  if (err || !item) {
    return (
      <div className='home page-detail'>
        <Navbar />
        <p className='featured-empty' style={{ padding: 24 }}>
          {err || 'Đang tải…'}
        </p>
      </div>
    );
  }

  const avg = reviews?.averageRating;
  const cnt = reviews?.count ?? 0;

  return (
    <div className='home page-detail'>
      <Navbar />
      <div
        className='page-detail__hero'
        style={{
          backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(20,20,20,0.97) 88%, #141414 100%), url(${mediaUrl(item.image)})`,
        }}
      >
        <div className='page-detail__hero-inner'>
          <h1 className='page-detail__headline'>{item.title}</h1>
          <p className='page-detail__meta'>
            {item.limit != null ? `${item.limit}+ · ` : ''}
            {item.genre || ''} {item.duration ? ` · ${item.duration}` : ''}
          </p>
          <div className='page-detail__actions'>
            <Link to='/watch' state={{ movie: item, contentType: 'movie' }}>
              <button type='button' className='page-detail__action-btn'>
                <PlayArrow className='page-detail__action-icon' />
                Phát
              </button>
            </Link>
            {currentProfile?._id ? (
              <>
                <button
                  type='button'
                  className='page-detail__action-btn'
                  disabled={listBusy}
                  onClick={toggleMyList}
                >
                  {inMyList ? (
                    <>
                      <PlaylistAddCheck className='page-detail__action-icon' />
                      Đã trong My List
                    </>
                  ) : (
                    <>
                      <Add className='page-detail__action-icon' />
                      Thêm vào My List
                    </>
                  )}
                </button>
                <button
                  type='button'
                  className='page-detail__action-btn'
                  disabled={downloadBusy || !item.video}
                  title={
                    item.video
                      ? 'Tải file video về máy'
                      : 'Chưa có file video'
                  }
                  onClick={startDownload}
                >
                  <Download className='page-detail__action-icon' />
                  Tải về máy
                </button>
              </>
            ) : null}
          </div>
          {downloadHint ? (
            <p className='page-detail__action-hint'>{downloadHint}</p>
          ) : null}
        </div>
      </div>

      <div className='page-detail__below-hero'>
        {item.description ? (
          <p className='page-detail__desc'>{item.description}</p>
        ) : null}
      </div>

      <section className='page-detail__section page-detail__section--reviews' id='reviews'>
        <h2 className='page-detail__section-title'>Đánh giá & bình luận</h2>
        {revLoading && !reviews ? (
          <p className='featured-empty'>Đang tải đánh giá…</p>
        ) : (
          <>
            <div className='page-detail__reviews-summary'>
              {avg != null ? (
                <>
                  <StarsDisplay value={avg} />{' '}
                  <strong>{avg}</strong>/5 · {cnt} lượt
                </>
              ) : (
                <span>Chưa có đánh giá — hãy là người đầu tiên.</span>
              )}
            </div>

            {user && currentProfile?._id ? (
              <div className='page-detail__review-form'>
                <span style={{ color: '#b3b3b3', fontSize: 14 }}>Số sao (1–5)</span>
                <StarPicker value={formRating} onChange={setFormRating} />
                <textarea
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder='Viết đánh giá…'
                  maxLength={2000}
                />
                {revErr ? (
                  <p className='featured-empty' style={{ margin: 0 }}>
                    {revErr}
                  </p>
                ) : null}
                <div className='page-detail__review-actions'>
                  <button
                    type='button'
                    className='page-detail__review-submit'
                    disabled={revBusy}
                    onClick={submitReview}
                  >
                    {reviews?.myReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                  </button>
                  {reviews?.myReview ? (
                    <button
                      type='button'
                      className='page-detail__review-delete'
                      disabled={revBusy}
                      onClick={deleteReview}
                    >
                      Xóa đánh giá
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className='featured-empty' style={{ marginBottom: 16 }}>
                Đăng nhập và chọn profile để gửi đánh giá.
              </p>
            )}

            <ul className='page-detail__review-list'>
              {(reviews?.items || []).map((r) => (
                <li key={r._id} className='page-detail__review-item'>
                  <div className='page-detail__review-head'>
                    <StarsDisplay value={r.rating} />
                    <span>{r.profileName || 'Profile'}</span>
                    <span style={{ color: '#737373', fontWeight: 400 }}>
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString('vi-VN')
                        : ''}
                    </span>
                  </div>
                  <p className='page-detail__review-body'>{r.text}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {similar.length > 0 ? (
        <section className='page-detail__section'>
          <h2 className='page-detail__section-title'>Có thể bạn thích</h2>
          <div className='page-newhot__grid'>
            {similar.map((m) => (
              <Link
                key={m._id}
                to={`/content/${m._id}`}
                className='page-newhot__card'
              >
                <img
                  src={mediaUrl(m.imageSmall || m.image)}
                  alt={m.title}
                  className='page-newhot__img'
                />
                <span className='page-newhot__card-title'>{m.title}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default MovieDetail;
