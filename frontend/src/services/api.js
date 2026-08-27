// Importe la librairie Axios, utilisée pour faire les requêtes HTTP vers le backend
import axios from 'axios';
// Importe le store Pinia qui pilote l'affichage de la modale "Passez à un forfait supérieur"
import { usePlanLimitStore } from '../stores/planLimit';

// Crée une instance Axios personnalisée (plutôt que d'utiliser axios directement)
// afin de lui appliquer une configuration commune (URL de base + intercepteurs)
// partagée par tous les appels API de l'application
const api = axios.create({
  // Adresse de base du backend : chaque appel comme api.get('/tasks')
  // ira automatiquement chercher http://localhost:5000/api/tasks
  baseURL: 'http://localhost:5000/api',
});

// Intercepteur de REQUÊTE : ce code s'exécute automatiquement AVANT
// que chaque requête (GET, POST, PUT, DELETE...) ne parte vers le backend
api.interceptors.request.use((config) => {
  // Récupère le token JWT stocké dans le navigateur (localStorage) —
  // c'est le "badge" reçu à la connexion, qui contient organizationId
  const token = localStorage.getItem('token');

  // Si un token existe (donc si l'utilisateur est connecté)...
  if (token) {
    // ...on l'ajoute dans l'en-tête Authorization de la requête,
    // au format attendu par le backend : "Bearer <token>"
    // C'est ce header que le middleware auth.js va lire et vérifier
    config.headers.Authorization = `Bearer ${token}`;
  }

  // On renvoie la configuration (modifiée ou non) pour que la requête parte réellement
  return config;
});

// Intercepteur de RÉPONSE : ce code s'exécute automatiquement quand
// une réponse arrive du backend, que ce soit un succès ou une erreur
api.interceptors.response.use(
  // Si la réponse est un succès, on la laisse passer sans rien changer
  (response) => response,

  // Si la réponse est une erreur...
  (error) => {
    // Seul le 401 (token invalide/expiré) doit forcer une déconnexion.
    // Le 403 peut aussi signifier "droits insuffisants" ou "limite de plan atteinte" —
    // dans ces cas, l'utilisateur reste connecté, c'est juste l'action qui est refusée.
    if (error.response && error.response.status === 401) {
      // On supprime le token et les infos utilisateur du navigateur
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // On force la redirection vers la page de connexion
      window.location.href = '/login';
    }

    // Si le backend signale explicitement qu'une limite de forfait est atteinte,
    // on affiche automatiquement la modale "Passez à un forfait supérieur",
    // peu importe depuis quel formulaire l'appel a été fait.
    if (error.response?.data?.planLimitReached) {
      const planLimitStore = usePlanLimitStore();
      planLimitStore.show(error.response.data.message);
    }

    // On propage l'erreur pour que le code appelant puisse aussi la gérer si besoin
    return Promise.reject(error);
  }
);

// Exporte cette instance pour qu'elle soit utilisée partout dans l'app,
// au lieu de réimporter/reconfigurer axios dans chaque fichier
export default api;