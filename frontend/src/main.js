import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';
import { getTheme, applyTheme } from './utils/theme';

applyTheme(getTheme());

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');