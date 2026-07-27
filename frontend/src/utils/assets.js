import api from '../services/api';

// Déduit l'origine du backend depuis la baseURL de l'API (enlève le "/api" final)
const API_ORIGIN = api.defaults.baseURL.replace(/\/api\/?$/, '');

export const resolveAssetUrl = (relativePath) => {
  if (!relativePath) return '';
  if (/^https?:\/\//.test(relativePath)) return relativePath; // déjà une URL absolue
  return `${API_ORIGIN}${relativePath}`;
};