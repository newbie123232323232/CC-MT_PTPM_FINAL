import { useContext, useRef, useState } from 'react';
import axios from 'axios';
import { storageUploadName } from '../../utils/storageUploadName';
import { createMovie } from '../../context/movieContext/apiCalls';
import { MovieContext } from '../../context/movieContext/MovieContext';
import './newProduct.css';

const UPLOAD_LABELS = [
  'Image (hero)',
  'Title image',
  'Thumbnail',
  'Trailer',
  'Video',
];

function axiosErrMessage(err) {
  const d = err.response?.data;
  if (d == null) return err.message || String(err);
  if (typeof d === 'string') return d;
  if (typeof d === 'object' && d.message) return d.message;
  try {
    return JSON.stringify(d);
  } catch {
    return String(d);
  }
}

function uploadHint(status, msg) {
  if (status !== 403) return '';
  if (/admin only/i.test(msg))
    return ' — Tài khoản chưa là admin: trong MongoDB set isAdmin: true cho user, rồi đăng nhập lại.';
  if (/token/i.test(msg))
    return ' — Token hết hạn hoặc SECRET_KEY lệch: đăng nhập lại hoặc kiểm tra .env API.';
  return ' — 403: đăng nhập lại bằng user admin.';
}

export default function NewProduct() {
  const [movie, setMovie] = useState(null);
  const [image, setImage] = useState(null);
  const [imageTitle, setImageTitle] = useState(null);
  const [imageSmall, setImageSmall] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [video, setVideo] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const hint403Once = useRef(false);

  const { dispatch } = useContext(MovieContext);

  const handleChange = (e) => {
    const value = e.target.value;
    setMovie({ ...movie, [e.target.name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMovie(movie, dispatch);
  };

  const getToken = () => {
    try {
      return JSON.parse(localStorage.getItem('user')).accessToken;
    } catch {
      return null;
    }
  };

  const upload = async (items) => {
    setUploadError('');
    hint403Once.current = false;
    const token = getToken();
    if (!token) {
      setUploadError('Chưa đăng nhập admin.');
      return;
    }

    for (let key = 0; key < items.length; key += 1) {
      const item = items[key];
      const el = document.getElementById(`uploadProgress${key}`);
      if (!item.file) {
        if (el) {
          el.textContent = `${UPLOAD_LABELS[key]}: (bỏ qua — chưa chọn file)`;
        }
        // eslint-disable-next-line no-continue
        continue;
      }
      if (el) el.textContent = `${UPLOAD_LABELS[key]}: đang tải… 0%`;
      const form = new FormData();
      form.append('file', item.file, storageUploadName(item.label, item.file));

      try {
        const res = await axios.post(
          `/api/upload/item?label=${encodeURIComponent(item.label)}`,
          form,
          {
            headers: { token: `Bearer ${token}` },
            onUploadProgress: (pe) => {
              if (!pe.total || !el) return;
              const pct = (pe.loaded / pe.total) * 100;
              el.textContent = `${UPLOAD_LABELS[key]}: ${pct.toFixed(1)}%`;
            },
          }
        );
        const url = res.data?.url;
        if (url) {
          setMovie((prev) => ({ ...prev, [item.label]: url }));
        }
        if (el) el.textContent = `${UPLOAD_LABELS[key]}: xong ✓`;
      } catch (err) {
        console.error(err);
        const msg = axiosErrMessage(err);
        const st = err.response?.status;
        let hint = '';
        if (st === 403 && !hint403Once.current) {
          hint403Once.current = true;
          hint = uploadHint(st, msg);
        }
        setUploadError((prev) =>
          prev ? `${prev} | ${msg}${hint}` : `Lỗi upload: ${msg}${hint}`
        );
        if (el) el.textContent = `${UPLOAD_LABELS[key]}: lỗi`;
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    await upload([
      { file: image, label: 'image' },
      { file: imageTitle, label: 'imageTitle' },
      { file: imageSmall, label: 'imageSmall' },
      { file: trailer, label: 'trailer' },
      { file: video, label: 'video' },
    ]);
  };

  return (
    <div className='newProduct'>
      <h1 className='addProductTitle'>New Movie</h1>
      <p className='newProductHint'>
        Upload lên API local (không cần Firebase). URL file:{' '}
        <code>http://localhost:5000/uploads/...</code>
      </p>
      <form className='addProductForm'>
        <div className='addProductItem'>
          <label>Image</label>
          <input
            type='file'
            id='image'
            name='image'
            onChange={(e) => setImage(e.target.files[0])}
          />
        </div>
        <div className='addProductItem'>
          <label>Title Image</label>
          <input
            type='file'
            id='imageTitle'
            name='imageTitle'
            onChange={(e) => setImageTitle(e.target.files[0])}
          />
        </div>
        <div className='addProductItem'>
          <label>Thumbnail Image</label>
          <input
            type='file'
            id='imageSmall'
            name='imageSmall'
            onChange={(e) => setImageSmall(e.target.files[0])}
          />
        </div>
        <div className='addProductItem'>
          <label>Title</label>
          <input
            type='text'
            placeholder='Django Unchained'
            name='title'
            onChange={handleChange}
          />
        </div>
        <div className='addProductItem'>
          <label>Description</label>
          <input
            type='text'
            placeholder='Description'
            name='description'
            onChange={handleChange}
          />
        </div>
        <div className='addProductItem'>
          <label>Year</label>
          <input
            type='text'
            placeholder='2012'
            name='year'
            onChange={handleChange}
          />
        </div>
        <div className='addProductItem'>
          <label>Genre</label>
          <input
            type='text'
            placeholder='Action'
            name='genre'
            onChange={handleChange}
          />
        </div>
        <div className='addProductItem'>
          <label>Duration</label>
          <input
            type='text'
            placeholder='2h 45m'
            name='duration'
            onChange={handleChange}
          />
        </div>
        <div className='addProductItem'>
          <label>Age Limit</label>
          <input
            type='text'
            placeholder='16'
            name='limit'
            onChange={handleChange}
          />
        </div>
        <div className='addProductItem'>
          <label>Is Series?</label>
          <select id='isSeries' name='isSeries' onChange={handleChange}>
            <option value='false'>No</option>
            <option value='true'>Yes</option>
          </select>
        </div>
        <div className='addProductItem'>
          <label>Trailer</label>
          <input
            type='file'
            name='trailer'
            onChange={(e) => setTrailer(e.target.files[0])}
          />
        </div>
        <div className='addProductItem'>
          <label>Video</label>
          <input
            type='file'
            name='video'
            onChange={(e) => setVideo(e.target.files[0])}
          />
        </div>
      </form>
      <div className='submitButtons'>
        <button className='addProductButton' onClick={handleUpload}>
          Upload
        </button>
        <button className='addProductButton' onClick={handleSubmit}>
          Create
        </button>
      </div>
      {uploadError ? (
        <p className='newProductUploadError'>{uploadError}</p>
      ) : null}
      <div id='uploadProgress0'></div>
      <div id='uploadProgress1'></div>
      <div id='uploadProgress2'></div>
      <div id='uploadProgress3'></div>
      <div id='uploadProgress4'></div>
    </div>
  );
}
