import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import th from '../locales/th.json';

// Inline resources avoid async file loading, which is important for React Native.
// initImmediate: false makes init synchronous so i18n is ready before first render.
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    th: { translation: th },
  },
  lng: 'th',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
