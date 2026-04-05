import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import client from '../api/client';
import { AuthContext } from '../authContext/AuthContext';
import { ProfileContext } from '../contexts/ProfileContext';
import { logoutCall } from '../authContext/apiCalls';
import { loginSuccess } from '../authContext/AuthActions';

function Account() {
  const { user, dispatch } = useContext(AuthContext);
  const { clearProfile } = useContext(ProfileContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState(user?.email || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [deletePw, setDeletePw] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  const saveEmail = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    setBusy('email');
    try {
      const res = await client.put('/settings/account/email', { email });
      dispatch(
        loginSuccess({
          ...user,
          ...res.data,
          accessToken: user.accessToken,
        })
      );
      setMsg('Đã cập nhật email.');
    } catch (e2) {
      setErr(
        e2.response?.data?.message || 'Không đổi được email (trùng email?).'
      );
    } finally {
      setBusy('');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    setBusy('pw');
    try {
      await client.put('/settings/account/password', {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setCurrentPw('');
      setNewPw('');
      setMsg('Đã đổi mật khẩu.');
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setBusy('');
    }
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    if (
      !window.confirm(
        'Xóa vĩnh viễn tài khoản và dữ liệu liên quan? Không hoàn tác.'
      )
    ) {
      return;
    }
    setMsg('');
    setErr('');
    setBusy('del');
    try {
      await client.delete('/settings/account', {
        data: { currentPassword: deletePw },
      });
      clearProfile();
      logoutCall(dispatch);
      navigate('/login', { replace: true });
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Xóa tài khoản thất bại.');
    } finally {
      setBusy('');
    }
  };

  const box = {
    background: 'rgba(20,20,20,0.9)',
    border: '1px solid #222',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  };
  const label = { display: 'block', color: '#e5e5e5', fontSize: 14, marginBottom: 6 };
  const input = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#141414',
    color: '#fff',
    boxSizing: 'border-box',
    marginBottom: 10,
  };
  const btn = {
    border: '1px solid #333',
    background: '#e50914',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: 8,
    cursor: 'pointer',
  };

  return (
    <div className='home page-newhot'>
      <Navbar />
      <div className='page-newhot__inner'>
        <h1 className='page-newhot__title'>Tài khoản</h1>
        {msg ? <p style={{ color: '#46d369', marginBottom: 12 }}>{msg}</p> : null}
        {err ? <p style={{ color: '#e87c03', marginBottom: 12 }}>{err}</p> : null}

        <form style={box} onSubmit={saveEmail}>
          <h2 style={{ color: '#fff', fontSize: 16, marginBottom: 12 }}>Email</h2>
          <label style={label}>
            Email mới
            <input
              style={input}
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button type='submit' style={btn} disabled={busy === 'email'}>
            {busy === 'email' ? 'Đang lưu…' : 'Lưu email'}
          </button>
        </form>

        <form style={box} onSubmit={savePassword}>
          <h2 style={{ color: '#fff', fontSize: 16, marginBottom: 12 }}>
            Đổi mật khẩu
          </h2>
          <input
            style={input}
            type='password'
            placeholder='Mật khẩu hiện tại'
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            required
          />
          <input
            style={input}
            type='password'
            placeholder='Mật khẩu mới'
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
            minLength={6}
          />
          <button type='submit' style={btn} disabled={busy === 'pw'}>
            {busy === 'pw' ? 'Đang lưu…' : 'Đổi mật khẩu'}
          </button>
        </form>

        <form style={{ ...box, borderColor: '#5c1010' }} onSubmit={deleteAccount}>
          <h2 style={{ color: '#e50914', fontSize: 16, marginBottom: 12 }}>
            Xóa tài khoản
          </h2>
          <input
            style={input}
            type='password'
            placeholder='Nhập mật khẩu hiện tại để xác nhận'
            value={deletePw}
            onChange={(e) => setDeletePw(e.target.value)}
            required
          />
          <button
            type='submit'
            style={{ ...btn, background: '#5c1010' }}
            disabled={busy === 'del'}
          >
            {busy === 'del' ? 'Đang xóa…' : 'Xóa vĩnh viễn'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Account;
