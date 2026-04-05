import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import client from '../api/client';
import { mediaUrl } from '../utils/mediaUrl';
import { ProfileContext } from '../contexts/ProfileContext';
import './profiles.css';

function Profiles() {
  const navigate = useNavigate();
  const { setCurrentProfile } = useContext(ProfileContext);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const load = async () => {
    setError('');
    try {
      const res = await client.get('/profiles');
      setProfiles(res.data || []);
    } catch (e) {
      setError('Không tải được danh sách profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSelect = async (p) => {
    setError('');
    try {
      await client.post(`/profiles/${p._id}/select`);
      setCurrentProfile(p);
      navigate('/browse', { replace: true });
    } catch (e) {
      setError('Không chọn được profile.');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError('');
    try {
      const res = await client.post('/profiles', {
        name,
        isKid: false,
      });
      setProfiles((prev) => [...prev, res.data]);
      setNewName('');
      setCreating(false);
    } catch (e) {
      setError(
        e.response?.status === 400
          ? 'Tối đa 5 profile / tài khoản.'
          : 'Không tạo được profile.'
      );
    }
  };

  if (loading) {
    return (
      <Box className='profiles-page profiles-page--center'>
        <CircularProgress sx={{ color: '#e50914' }} />
      </Box>
    );
  }

  return (
    <Box className='profiles-page'>
      <Typography component='h1' className='profiles-page__title'>
        Ai đang xem?
      </Typography>

      {error ? (
        <Typography color='error' sx={{ mb: 2, textAlign: 'center' }}>
          {error}
        </Typography>
      ) : null}

      {profiles.length === 0 && !creating ? (
        <Typography sx={{ textAlign: 'center', mb: 2, color: '#888' }}>
          Chưa có profile — tạo mới để bắt đầu.
        </Typography>
      ) : null}

      <div className='profiles-page__grid'>
        {profiles.map((p) => (
          <button
            key={p._id}
            type='button'
            className='profiles-page__card'
            onClick={() => handleSelect(p)}
          >
            <Avatar
              src={mediaUrl(p.avatarUrl)}
              alt={p.name}
              sx={{
                width: 120,
                height: 120,
                bgcolor: '#333',
                fontSize: 48,
                mx: 'auto',
              }}
            >
              {p.name?.[0]?.toUpperCase()}
            </Avatar>
            <span className='profiles-page__name'>{p.name}</span>
          </button>
        ))}

        {profiles.length < 5 && (
          <button
            type='button'
            className='profiles-page__card profiles-page__card--add'
            onClick={() => setCreating(true)}
          >
            <Box className='profiles-page__add-icon'>
              <AddIcon sx={{ fontSize: 56 }} />
            </Box>
            <span className='profiles-page__name'>Thêm profile</span>
          </button>
        )}
      </div>

      {creating && (
        <Box
          component='form'
          onSubmit={handleAdd}
          className='profiles-page__form'
        >
          <TextField
            autoFocus
            label='Tên profile'
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            size='small'
            sx={{ input: { color: '#fff' }, label: { color: '#aaa' } }}
          />
          <Button type='submit' variant='contained' color='primary'>
            Tạo
          </Button>
          <Button type='button' onClick={() => setCreating(false)}>
            Huỷ
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default Profiles;
