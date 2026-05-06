// components/layout/PrivateRoute.js
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from '../../store/slices/authSlice';
import { Spinner } from '../ui';

export default function PrivateRoute({ children }) {
  const dispatch = useDispatch();
  const { token, user } = useSelector(s => s.auth);

  useEffect(() => {
    if (token && !user) dispatch(fetchMe());
  }, [token, user, dispatch]);

  if (!token) return <Navigate to="/login" replace />;
  if (!user)  return <Spinner size="lg" center />;

  return children;
}
