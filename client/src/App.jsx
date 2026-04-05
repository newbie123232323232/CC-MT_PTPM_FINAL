import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { lazy, Suspense, useContext } from 'react';
import { AuthContext } from './authContext/AuthContext';
import { ProfileContext } from './contexts/ProfileContext';
import AppShellLayout from './layouts/AppShellLayout';
import PageFallback from './components/PageFallback';

const Home = lazy(() => import('./pages/Home'));
const Register = lazy(() => import('./pages/Register'));
const Watch = lazy(() => import('./pages/Watch'));
const Login = lazy(() => import('./pages/Login'));
const Profiles = lazy(() => import('./pages/Profiles'));
const NewHot = lazy(() => import('./pages/NewHot'));
const Search = lazy(() => import('./pages/Search'));
const MovieDetail = lazy(() => import('./pages/MovieDetail'));
const SeriesDetail = lazy(() => import('./pages/SeriesDetail'));
const MyList = lazy(() => import('./pages/MyList'));
const Downloads = lazy(() => import('./pages/Downloads'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const Account = lazy(() => import('./pages/Account'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

function RootRedirect() {
  const { user } = useContext(AuthContext);
  const { currentProfile } = useContext(ProfileContext);
  if (!user) return <Navigate to='/login' replace />;
  if (!currentProfile) return <Navigate to='/profiles' replace />;
  return <Navigate to='/browse' replace />;
}

function RequireAuth({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to='/login' replace />;
}

function RequireProfile({ children }) {
  const { user } = useContext(AuthContext);
  const { currentProfile } = useContext(ProfileContext);
  if (!user) return <Navigate to='/login' replace />;
  if (!currentProfile) return <Navigate to='/profiles' replace />;
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path='/' element={<RootRedirect />} />
        <Route
          path='/login'
          element={
            <GuestOnly>
              <Login />
            </GuestOnly>
          }
        />
        <Route
          path='/register'
          element={
            <GuestOnly>
              <Register />
            </GuestOnly>
          }
        />
        <Route
          path='/forgot-password'
          element={
            <GuestOnly>
              <ForgotPassword />
            </GuestOnly>
          }
        />
        <Route
          path='/reset-password'
          element={
            <GuestOnly>
              <ResetPassword />
            </GuestOnly>
          }
        />
        <Route
          path='/profiles'
          element={
            <RequireAuth>
              <Profiles />
            </RequireAuth>
          }
        />
        <Route element={<RequireProfile><AppShellLayout /></RequireProfile>}>
          <Route path='browse' element={<Home />} />
          <Route path='movies' element={<Home type='movie' />} />
          <Route path='series' element={<Home type='series' />} />
          <Route path='new' element={<NewHot />} />
          <Route path='search' element={<Search />} />
          <Route path='my-list' element={<MyList />} />
          <Route path='downloads' element={<Downloads />} />
          <Route path='notifications' element={<Notifications />} />
          <Route path='settings' element={<Settings />} />
          <Route path='account' element={<Account />} />
          <Route path='content/:id' element={<MovieDetail />} />
          <Route path='series/:id' element={<SeriesDetail />} />
        </Route>
        <Route
          path='/watch'
          element={
            <RequireProfile>
              <Watch />
            </RequireProfile>
          }
        />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

function GuestOnly({ children }) {
  const { user } = useContext(AuthContext);
  return user ? <Navigate to='/' replace /> : children;
}

export default App;
