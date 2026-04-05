import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthContext } from '../authContext/AuthContext';

const STORAGE_KEY = 'currentProfile';

function stripMeta(p) {
  if (!p || typeof p !== 'object') return p;
  const { __uid, ...rest } = p;
  return rest;
}

export const ProfileContext = createContext({
  currentProfile: null,
  setCurrentProfile: () => {},
  clearProfile: () => {},
});

export function ProfileProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [currentProfile, setCurrentProfileState] = useState(null);

  useEffect(() => {
    if (!user) {
      setCurrentProfileState(null);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const uid = user._id || user.id;
        if (parsed?.__uid && uid && String(parsed.__uid) !== String(uid)) {
          localStorage.removeItem(STORAGE_KEY);
          setCurrentProfileState(null);
          return;
        }
        if (parsed?._id) setCurrentProfileState(stripMeta(parsed));
      }
    } catch (_) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const setCurrentProfile = useCallback(
    (profile) => {
      const uid = user?._id || user?.id;
      if (!profile) {
        setCurrentProfileState(null);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const withMeta =
        uid != null ? { ...profile, __uid: String(uid) } : profile;
      setCurrentProfileState(stripMeta(withMeta));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withMeta));
    },
    [user]
  );

  const clearProfile = useCallback(() => {
    setCurrentProfileState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      currentProfile,
      setCurrentProfile,
      clearProfile,
    }),
    [currentProfile, setCurrentProfile, clearProfile]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
