import { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    setBusy(true);
    try {
      const res = await client.post('/auth/forgot-password', { email });
      setMsg(res.data?.message || 'Đã gửi.');
    } catch (e2) {
      setErr(
        e2.response?.data?.message ||
          'Gửi thất bại — kiểm tra SMTP trên server.'
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
          <h1>Quên mật khẩu</h1>
          <input
            type='email'
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className='loginButton' type='submit' disabled={busy}>
            {busy ? 'Đang gửi…' : 'Gửi link đặt lại'}
          </button>
          {msg ? (
            <p style={{ color: '#46d369', marginTop: 16 }}>{msg}</p>
          ) : null}
          {err ? (
            <p style={{ color: '#e87c03', marginTop: 16 }}>{err}</p>
          ) : null}
          <span style={{ marginTop: 24, display: 'block' }}>
            <Link to='/login' className='signUpLink'>
              Quay lại đăng nhập
            </Link>
          </span>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
