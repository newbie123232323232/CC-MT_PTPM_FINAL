import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import client from '../api/client';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    if (!token) {
      setErr('Thiếu token trong URL.');
      return;
    }
    setBusy(true);
    try {
      await client.post('/auth/reset-password', { token, newPassword: password });
      setMsg('Đã đặt lại mật khẩu. Đăng nhập lại.');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (e2) {
      setErr(
        e2.response?.data?.message || 'Không đặt lại được — token hết hạn?'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='login'>
      <div className='top'>
        <div className='wrapper'>
          <Link to='/login'>
            <img
              src={require('../images/Netflix_2015_logo.svg.png')}
              alt='Netflix logo'
              className='logo'
            />
          </Link>
        </div>
      </div>
      <div className='container'>
        <form onSubmit={submit}>
          <h1>Đặt lại mật khẩu</h1>
          <input
            type='password'
            placeholder='Mật khẩu mới'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button className='loginButton' type='submit' disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu'}
          </button>
          {msg ? (
            <p style={{ color: '#46d369', marginTop: 16 }}>{msg}</p>
          ) : null}
          {err ? (
            <p style={{ color: '#e87c03', marginTop: 16 }}>{err}</p>
          ) : null}
          <span style={{ marginTop: 24, display: 'block' }}>
            <Link to='/login' className='signUpLink'>
              Đăng nhập
            </Link>
          </span>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
