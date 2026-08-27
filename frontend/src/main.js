import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import './style.css';
import { getTheme, applyTheme } from './utils/theme';

applyTheme(getTheme());

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);

const auth = useAuthStore(pinia);

const initializeApp = async () => {
  if (auth.token) {
    await auth.fetchMe().catch(() => {});
  }
  app.mount('#app');
};

initializeApp();