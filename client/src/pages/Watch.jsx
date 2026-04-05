import { ArrowBackOutlined } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import client from '../api/client';
import { ProfileContext } from '../contexts/ProfileContext';
import { mediaUrl } from '../utils/mediaUrl';

function Watch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentProfile } = useContext(ProfileContext);
  const videoRef = useRef(null);

  const movie = location.state?.movie;
  const contentType = location.state?.contentType || 'movie';

  const [initialProgress, setInitialProgress] = useState(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [bufferedPct, setBufferedPct] = useState(0);

  const sendProgress = useCallback(() => {
    const el = videoRef.current;
    const profileId = currentProfile?._id;
    const contentId = movie?._id;
    if (!el || !profileId || !contentId) return;
    const dur = el.duration;
    if (!dur || !Number.isFinite(dur)) return;
    client
      .post('/playback/progress', {
        profileId,
        contentId,
        contentType,
        positionSec: Math.floor(el.currentTime),
        durationSec: Math.floor(dur),
      })
      .catch(() => {});
  }, [movie?._id, currentProfile?._id, contentType]);

  useEffect(() => {
    if (!movie?._id || !currentProfile?._id || !movie?.video) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const res = await client.post('/playback/start', {
          profileId: currentProfile._id,
          contentId: movie._id,
          contentType,
        });
        if (!cancelled) setInitialProgress(res.data);
      } catch (e) {
        console.log(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [movie, currentProfile, contentType]);

  useEffect(() => {
    if (!movie?._id || !movie?.video || !currentProfile?._id) return undefined;
    const id = setInterval(() => sendProgress(), 12000);
    return () => clearInterval(id);
  }, [movie?._id, movie?.video, currentProfile?._id, sendProgress]);

  const handleEnded = useCallback(async () => {
    sendProgress();
    const profileId = currentProfile?._id;
    const contentId = movie?._id;
    if (!profileId || !contentId) return;

    try {
      await client.post('/playback/complete', {
        profileId,
        contentId,
        contentType,
      });
    } catch (_) {
      /* ignore */
    }

    if (contentType !== 'episode') return;

    let autoplayNext = true;
    try {
      const { data: sections } = await client.get('/settings/sections', {
        params: { profileId },
      });
      autoplayNext = Boolean(sections?.playback?.autoplayNext);
    } catch (_) {
      autoplayNext = true;
    }
    if (!autoplayNext) return;

    try {
      const { data } = await client.get('/playback/next-episode', {
        params: { profileId, currentEpisodeId: contentId },
      });
      const next = data?.nextEpisode;
      if (!next?.video) return;

      navigate('/watch', {
        replace: true,
        state: {
          movie: {
            _id: next._id,
            video: next.video,
            title: next.title,
            imageSmall: next.imageSmall,
            description: next.description,
            duration: next.duration,
          },
          contentType: 'episode',
        },
      });
    } catch (e) {
      console.log(e);
    }
  }, [contentType, currentProfile?._id, movie?._id, navigate, sendProgress]);

  const seekFromProgress = useCallback(
    (el) => {
      const pos = initialProgress?.positionSec;
      if (!el || !pos || pos <= 0) return;
      const dur = el.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      el.currentTime = Math.min(pos, Math.max(0, dur - 0.5));
    },
    [initialProgress]
  );

  const handleLoadedMetadata = (e) => {
    seekFromProgress(e.target);
  };

  const updateBuffered = useCallback(() => {
    const el = videoRef.current;
    if (!el?.buffered?.length || !el.duration || !Number.isFinite(el.duration)) {
      setBufferedPct(0);
      return;
    }
    let maxEnd = 0;
    for (let i = 0; i < el.buffered.length; i += 1) {
      maxEnd = Math.max(maxEnd, el.buffered.end(i));
    }
    setBufferedPct(Math.min(100, (maxEnd / el.duration) * 100));
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (el) seekFromProgress(el);
  }, [initialProgress, seekFromProgress]);

  if (!movie?.video) {
    return (
      <div className='watch'>
        <button
          type='button'
          className='watch-back-btn'
          onClick={() => navigate(-1)}
        >
          <ArrowBackOutlined />
        </button>
        <p style={{ color: '#fff', padding: 24 }}>
          Không có video cho nội dung này.
        </p>
      </div>
    );
  }

  const poster =
    movie.image || movie.imageTitle || movie.imageSmall || undefined;

  return (
    <div className='watch'>
      <button
        type='button'
        className='watch-back-btn'
        onClick={() => navigate(-1)}
      >
        <ArrowBackOutlined />
      </button>
      <div className='watch-video-wrap'>
        <video
          ref={videoRef}
          src={mediaUrl(movie.video)}
          className='video'
          poster={poster}
          preload='auto'
          playsInline
          autoPlay
          controls
          onLoadedMetadata={handleLoadedMetadata}
          onLoadStart={() => {
            setIsBuffering(true);
          }}
          onLoadedData={() => {
            setIsBuffering(false);
            updateBuffered();
          }}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onCanPlay={() => setIsBuffering(false)}
          onStalled={() => setIsBuffering(true)}
          onProgress={updateBuffered}
          onTimeUpdate={updateBuffered}
          onEnded={handleEnded}
          onPause={sendProgress}
        />
        <div
          className='watch-buffer-rail'
          aria-hidden
          title='Phần timeline đã tải trước (buffer)'
        >
          <div
            className='watch-buffer-rail-fill'
            style={{ width: `${bufferedPct}%` }}
          />
        </div>
        {isBuffering ? (
          <div className='watch-buffer-overlay'>
            <span className='watch-buffer-label'>Đang tải…</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Watch;
