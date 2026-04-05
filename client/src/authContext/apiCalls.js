import client from '../api/client';
import { loginFailure, loginStart, loginSuccess, logout } from './AuthActions';

export const loginCall = async (user, dispatch) => {
  dispatch(loginStart());
  try {
    const res = await client.post('/auth/login', user);
    dispatch(loginSuccess(res.data));
  } catch (err) {
    dispatch(loginFailure());
  }
};

export const googleLoginCall = async (credential, dispatch) => {
  dispatch(loginStart());
  try {
    const res = await client.post('/auth/google', { credential });
    dispatch(loginSuccess(res.data));
  } catch (err) {
    dispatch(loginFailure());
  }
};

export const logoutCall = (dispatch) => {
  dispatch(logout());
};
