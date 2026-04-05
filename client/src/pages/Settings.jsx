import { useContext, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import client from '../api/client';
import { ProfileContext } from '../contexts/ProfileContext';

function Settings() {
  const { currentProfile } = useContext(ProfileContext);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    if (!currentProfile?._id) return;
    setLoading(true);
    setErr('');
    try {
      const res = await client.get('/settings/sections', {
        params: { profileId: currentProfile._id },
      });
      setDraft(res.data ? JSON.parse(JSON.stringify(res.data)) : null);
    } catch (e) {
      console.log(e);
      setErr('Không tải được settings.');
      setDraft(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfile?._id]);

  const save = async (type) => {
    if (!currentProfile?._id || !draft) return;
    const profileId = currentProfile._id;
    setSaving(type);
    try {
      if (type === 'notifications') {
        await client.put('/settings/notifications', {
          profileId,
          ...draft.notifications,
        });
      }
      if (type === 'playback') {
        await client.put('/settings/playback', {
          profileId,
          ...draft.playback,
        });
      }
      if (type === 'language') {
        await client.put('/settings/language', {
          profileId,
          ...draft.language,
        });
      }
      if (type === 'download') {
        await client.put('/settings/download', {
          profileId,
          ...draft.download,
        });
      }
      await load();
    } catch (e) {
      console.log(e);
      setErr('Không thể lưu thay đổi.');
    } finally {
      setSaving('');
    }
  };

  const ToggleRow = ({ label, checked, onChange }) => (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '8px 0',
        color: '#e5e5e5',
        fontSize: 14,
      }}
    >
      <span>{label}</span>
      <input type='checkbox' checked={checked} onChange={onChange} />
    </label>
  );

  return (
    <div className='home page-newhot'>
      <Navbar />
      <div className='page-newhot__inner'>
        <h1 className='page-newhot__title' style={{ marginBottom: 16 }}>
          Settings
        </h1>

        {loading ? (
          <p className='featured-empty'>Đang tải…</p>
        ) : err ? (
          <p className='featured-empty'>{err}</p>
        ) : !draft ? (
          <p className='featured-empty'>Không có dữ liệu settings.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <section
              style={{
                background: 'rgba(20,20,20,0.9)',
                border: '1px solid #222',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <h2 style={{ color: '#fff', margin: 0, fontSize: 16 }}>Notifications</h2>
                <button
                  type='button'
                  onClick={() => save('notifications')}
                  disabled={saving === 'notifications'}
                  style={{
                    border: '1px solid #333',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: saving === 'notifications' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving === 'notifications' ? 'Saving…' : 'Save'}
                </button>
              </div>

              <ToggleRow
                label='Bật thông báo'
                checked={Boolean(draft.notifications.notificationEnabled)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    notifications: {
                      ...d.notifications,
                      notificationEnabled: e.target.checked,
                    },
                  }))
                }
              />
              <ToggleRow
                label='New release'
                checked={Boolean(draft.notifications.notifyNewRelease)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    notifications: {
                      ...d.notifications,
                      notifyNewRelease: e.target.checked,
                    },
                  }))
                }
              />
              <ToggleRow
                label='New episode'
                checked={Boolean(draft.notifications.notifyNewEpisode)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    notifications: {
                      ...d.notifications,
                      notifyNewEpisode: e.target.checked,
                    },
                  }))
                }
              />
              <ToggleRow
                label='Trending'
                checked={Boolean(draft.notifications.notifyTrending)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    notifications: {
                      ...d.notifications,
                      notifyTrending: e.target.checked,
                    },
                  }))
                }
              />
            </section>

            <section
              style={{
                background: 'rgba(20,20,20,0.9)',
                border: '1px solid #222',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <h2 style={{ color: '#fff', margin: 0, fontSize: 16 }}>Playback</h2>
                <button
                  type='button'
                  onClick={() => save('playback')}
                  disabled={saving === 'playback'}
                  style={{
                    border: '1px solid #333',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: saving === 'playback' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving === 'playback' ? 'Saving…' : 'Save'}
                </button>
              </div>
              <ToggleRow
                label='Autoplay next'
                checked={Boolean(draft.playback.autoplayNext)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    playback: { ...d.playback, autoplayNext: e.target.checked },
                  }))
                }
              />
              <ToggleRow
                label='Autoplay preview'
                checked={Boolean(draft.playback.autoplayPreview)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    playback: {
                      ...d.playback,
                      autoplayPreview: e.target.checked,
                    },
                  }))
                }
              />
            </section>

            <section
              style={{
                background: 'rgba(20,20,20,0.9)',
                border: '1px solid #222',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <h2 style={{ color: '#fff', margin: 0, fontSize: 16 }}>Language</h2>
                <button
                  type='button'
                  onClick={() => save('language')}
                  disabled={saving === 'language'}
                  style={{
                    border: '1px solid #333',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: saving === 'language' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving === 'language' ? 'Saving…' : 'Save'}
                </button>
              </div>

              <label style={{ display: 'block', marginTop: 10, color: '#e5e5e5', fontSize: 14 }}>
                Display language
                <select
                  value={draft.language.displayLanguage || 'vi'}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      language: { ...d.language, displayLanguage: e.target.value },
                    }))
                  }
                  style={{
                    width: '100%',
                    marginTop: 8,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #333',
                    background: '#141414',
                    color: '#fff',
                  }}
                >
                  <option value='vi'>vi</option>
                  <option value='en'>en</option>
                </select>
              </label>

              <label style={{ display: 'block', marginTop: 10, color: '#e5e5e5', fontSize: 14 }}>
                Subtitle language
                <select
                  value={draft.language.subtitleLanguage || 'vi'}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      language: { ...d.language, subtitleLanguage: e.target.value },
                    }))
                  }
                  style={{
                    width: '100%',
                    marginTop: 8,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #333',
                    background: '#141414',
                    color: '#fff',
                  }}
                >
                  <option value='vi'>vi</option>
                  <option value='en'>en</option>
                </select>
              </label>
            </section>

            <section
              style={{
                background: 'rgba(20,20,20,0.9)',
                border: '1px solid #222',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <h2 style={{ color: '#fff', margin: 0, fontSize: 16 }}>Download</h2>
                <button
                  type='button'
                  onClick={() => save('download')}
                  disabled={saving === 'download'}
                  style={{
                    border: '1px solid #333',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: saving === 'download' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving === 'download' ? 'Saving…' : 'Save'}
                </button>
              </div>

              <ToggleRow
                label='Chỉ tải khi có Wi‑Fi'
                checked={Boolean(draft.download.downloadWifiOnly)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    download: { ...d.download, downloadWifiOnly: e.target.checked },
                  }))
                }
              />

              <label style={{ display: 'block', marginTop: 10, color: '#e5e5e5', fontSize: 14 }}>
                Quality
                <select
                  value={draft.download.downloadQuality || 'hd'}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      download: { ...d.download, downloadQuality: e.target.value },
                    }))
                  }
                  style={{
                    width: '100%',
                    marginTop: 8,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #333',
                    background: '#141414',
                    color: '#fff',
                  }}
                >
                  <option value='sd'>sd</option>
                  <option value='hd'>hd</option>
                  <option value='fhd'>fhd</option>
                </select>
              </label>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;

