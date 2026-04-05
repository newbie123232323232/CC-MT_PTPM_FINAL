import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthContext } from '../authContext/AuthContext';
import { ProfileContext } from './ProfileContext';

export const NotificationStreamContext = createContext({ connected: false });

export function NotificationStreamProvider({ children }) {
  const { user } = useContext(AuthContext);
  const { currentProfile } = useContext(ProfileContext);
  const [connected, setConnected] = useState(false);

  const value = useMemo(() => ({ connected }), [connected]);

  useEffect(() => {
    if (!user || !currentProfile?._id) {
      setConnected(false);
      return undefined;
    }

    let token;
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return undefined;
      const u = JSON.parse(raw);
      token = u?.accessToken;
    } catch {
      return undefined;
    }
    if (!token) return undefined;

    const url = `/notifications/stream?profileId=${encodeURIComponent(
      String(currentProfile._id)
    )}&token=${encodeURIComponent(token)}`;

    const es = new EventSource(url);

    es.addEventListener('open', () => setConnected(true));
    es.addEventListener('error', () => setConnected(false));

    es.addEventListener('notification', (ev) => {
      try {
        const data = JSON.parse(ev.data);
        window.dispatchEvent(
          new CustomEvent('notification:new', { detail: data })
        );
      } catch (_) {
        /* ignore */
      }
    });

    return () => {
      es.close();
      setConnected(false);
    };
  }, [user, currentProfile?._id]);

  return (
    <NotificationStreamContext.Provider value={value}>
      {children}
    </NotificationStreamContext.Provider>
  );
}
