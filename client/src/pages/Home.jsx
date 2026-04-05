import { useContext, useEffect, useState } from 'react';
import Featured from '../components/Featured';
import HomeSkeleton from '../components/HomeSkeleton';
import List from '../components/List';
import Navbar from '../components/Navbar';
import client from '../api/client';
import { ProfileContext } from '../contexts/ProfileContext';

function Home({ type }) {
  const { currentProfile } = useContext(ProfileContext);
  const [genre, setGenre] = useState(null);
  const [feed, setFeed] = useState(undefined);
  const [continueContent, setContinueContent] = useState([]);
  const [recentContent, setRecentContent] = useState([]);

  useEffect(() => {
    if (!currentProfile?._id) return undefined;

    let cancelled = false;
    const load = async () => {
      try {
        const res = await client.get('/home', {
          params: {
            profileId: currentProfile._id,
            ...(type ? { type } : {}),
            ...(genre ? { genre } : {}),
          },
        });
        if (!cancelled) setFeed(res.data ?? null);
      } catch (err) {
        console.log(err);
        if (!cancelled) setFeed(null);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [type, genre, currentProfile]);

  useEffect(() => {
    if (!currentProfile?._id) return undefined;

    let cancelled = false;
    const loadHistory = async () => {
      try {
        const profileId = currentProfile._id;
        const [contRes, recentRes] = await Promise.all([
          client.get('/history/continue', { params: { profileId } }),
          client.get('/history/recent', { params: { profileId, limit: 12 } }),
        ]);

        const contItems = Array.isArray(contRes.data) ? contRes.data : [];
        const recentItems = Array.isArray(recentRes.data?.items)
          ? recentRes.data.items
          : [];

        const contMovies = contItems.map((x) => x?.content).filter(Boolean);
        const recMovies = recentItems.map((x) => x?.content).filter(Boolean);

        if (!cancelled) {
          setContinueContent(contMovies);
          setRecentContent(recMovies);
        }
      } catch (err) {
        console.log(err);
        if (!cancelled) {
          setContinueContent([]);
          setRecentContent([]);
        }
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [currentProfile]);

  if (feed === undefined) {
    return (
      <div className='home'>
        <Navbar />
        <HomeSkeleton />
      </div>
    );
  }

  const rails = feed?.rails || [];
  const lists = rails.map((r) => ({
    ...r,
    content: r.items || [],
  }));

  const hero = feed?.hero;

  return (
    <div className='home'>
      <Navbar />
      <Featured
        type={type}
        setGenre={setGenre}
        hero={hero}
        profileId={currentProfile?._id}
      />
      {continueContent.length > 0 ? (
        <List
          list={{ title: 'Tiếp tục xem', content: continueContent }}
          profileId={currentProfile?._id}
        />
      ) : null}
      {recentContent.length > 0 ? (
        <List
          list={{ title: 'Gần đây', content: recentContent }}
          profileId={currentProfile?._id}
        />
      ) : null}
      {lists.map((list) => (
        <List
          key={list._id || list.title}
          list={list}
          profileId={currentProfile?._id}
        />
      ))}
    </div>
  );
}

export default Home;
