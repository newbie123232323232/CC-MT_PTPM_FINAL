import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import client from '../api/client';
import { ProfileContext } from '../contexts/ProfileContext';

function Notifications() {
  const { currentProfile } = useContext(ProfileContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    if (!currentProfile?._id) return;
    setLoading(true);
    setErr('');
    try {
      const res = await client.get('/notifications', {
        params: { profileId: currentProfile._id, limit: 30, page: 1 },
      });
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (e) {
      console.log(e);
      setErr('Không tải được thông báo.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfile?._id]);

  useEffect(() => {
    const onPush = (e) => {
      const n = e.detail;
      if (!n || !n._id) return;
      setItems((prev) => {
        if (prev.some((x) => String(x._id) === String(n._id))) return prev;
        return [n, ...prev];
      });
    };
    window.addEventListener('notification:new', onPush);
    return () => window.removeEventListener('notification:new', onPush);
  }, []);

  const markRead = async (id) => {
    if (!id) return;
    try {
      await client.post(`/notifications/${id}/read`);
      await load();
    } catch (e) {
      console.log(e);
    }
  };

  const markAllRead = async () => {
    if (!currentProfile?._id) return;
    setBusy(true);
    try {
      await client.post('/notifications/read-all', {
        profileId: currentProfile._id,
      });
      await load();
    } catch (e) {
      console.log(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='home page-newhot'>
      <Navbar />
      <div className='page-newhot__inner'>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <h1 className='page-newhot__title' style={{ margin: 0 }}>
            Thông báo
          </h1>
          <button
            type='button'
            style={{
              border: '1px solid #333',
              background: 'rgba(0,0,0,0.4)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 8,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
            onClick={markAllRead}
            disabled={busy}
          >
            {busy ? 'Đang xử lý…' : 'Đánh dấu đã đọc'}
          </button>
        </div>

        {loading ? (
          <p className='featured-empty'>Đang tải…</p>
        ) : err ? (
          <p className='featured-empty'>{err}</p>
        ) : items.length === 0 ? (
          <p className='featured-empty'>Chưa có thông báo.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((n) => (
              <div
                key={n._id}
                style={{
                  background: 'rgba(20,20,20,0.9)',
                  border: n.read ? '1px solid #222' : '1px solid #e50914',
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  <strong style={{ color: '#fff' }}>{n.title}</strong>
                  <span style={{ color: '#777', fontSize: 12 }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                  </span>
                </div>

                <div style={{ color: '#e5e5e5', fontSize: 14, lineHeight: 1.35 }}>
                  {n.body}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: 10,
                  }}
                >
                  {n.contentId ? (
                    <Link
                      to={`/content/${n.contentId}`}
                      className='link'
                      style={{ color: '#fff', fontSize: 13 }}
                    >
                      Mở nội dung
                    </Link>
                  ) : (
                    <span />
                  )}
                  {n.read ? (
                    <span style={{ color: '#666', fontSize: 12 }}>Đã đọc</span>
                  ) : (
                    <button
                      type='button'
                      onClick={() => markRead(n._id)}
                      style={{
                        border: '1px solid #333',
                        background: 'rgba(0,0,0,0.4)',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      Đã đọc
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;

