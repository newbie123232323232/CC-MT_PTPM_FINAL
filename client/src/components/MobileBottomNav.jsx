import { NavLink } from 'react-router-dom';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import WhatshotOutlinedIcon from '@mui/icons-material/WhatshotOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

const items = [
  { to: '/browse', label: 'Trang chủ', Icon: HomeOutlinedIcon },
  { to: '/new', label: 'Mới & Hot', Icon: WhatshotOutlinedIcon },
  { to: '/search', label: 'Tìm kiếm', Icon: SearchOutlinedIcon },
  { to: '/my-list', label: 'My List', Icon: PlaylistAddCheckOutlinedIcon },
  { to: '/downloads', label: 'Downloads', Icon: DownloadOutlinedIcon },
];

function MobileBottomNav() {
  return (
    <nav className='mobile-bottom-nav' aria-label='Điều hướng chính'>
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            'mobile-bottom-nav__item' + (isActive ? ' is-active' : '')
          }
        >
          <Icon className='mobile-bottom-nav__icon' fontSize='small' />
          <span className='mobile-bottom-nav__label'>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileBottomNav;
