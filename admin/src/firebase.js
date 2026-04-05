import firebase from 'firebase/app';
import 'firebase/storage';
import 'firebase/auth';

/**
 * Console đôi khi cho `xxx.firebasestorage.app` — REST upload dùng bucket id `xxx.appspot.com`.
 * Sai bucket → preflight 404 → browser báo CORS.
 */
function normalizeStorageBucket(bucket) {
  if (!bucket) return bucket;
  if (bucket.endsWith('.firebasestorage.app')) {
    return bucket.replace(/\.firebasestorage\.app$/, '.appspot.com');
  }
  return bucket;
}

/**
 * Copy toàn bộ object từ Firebase Console → Project settings → Your apps (Web).
 * `apiKey` phải cùng project với `storageBucket`.
 */
const rawBucket =
  process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
  'netflix-clone-3553f.appspot.com';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    'netflix-clone-3553f.firebaseapp.com',
  projectId:
    process.env.REACT_APP_FIREBASE_PROJECT_ID || 'netflix-clone-3553f',
  storageBucket: normalizeStorageBucket(rawBucket),
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '238884783532',
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    '1:238884783532:web:1dc355a0024e71f380a609',
  measurementId:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-FESVVTKLD4',
};

if (!firebaseConfig.apiKey) {
  console.error(
    '[Firebase] Thiếu REACT_APP_FIREBASE_API_KEY trong admin/.env — upload sẽ lỗi.'
  );
}

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

/**
 * Chỉ bật khi Storage rules cần request.auth (vd: chỉ user đã sign-in).
 * Set REACT_APP_FIREBASE_USE_ANON=true sau khi:
 *   Firebase Console → Authentication → Get started → Sign-in method → Anonymous (Bật)
 * Nếu không bật: không gọi Identity Toolkit → tránh CONFIGURATION_NOT_FOUND / signupNewUser 400.
 * Rules dev: allow read, write: if true → không cần env này.
 */
export const storageAuthReady =
  process.env.REACT_APP_FIREBASE_USE_ANON === 'true'
    ? firebase
        .auth()
        .signInAnonymously()
        .catch((err) => {
          console.warn(
            '[Firebase] Anonymous thất bại — bật Authentication + Anonymous trong Console, hoặc tắt REACT_APP_FIREBASE_USE_ANON và nới Storage rules.',
            err.code,
            err.message
          );
        })
    : Promise.resolve();

const storage = firebase.storage();
export default storage;
