import api from '../services/api';

export const resolveAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${base}${avatarPath}`;
};