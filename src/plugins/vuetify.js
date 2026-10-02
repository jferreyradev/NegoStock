import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#1E3A8A',    // Azul corporativo profundo
          secondary: '#F59E0B',  // Ámbar / Ferretería industrial
          accent: '#10B981',     // Verde esmeralda (ventas / stock positivo)
          error: '#EF4444',      // Rojo alertas de stock crítico
          warning: '#F97316',    // Naranja stock bajo
          info: '#3B82F6',
          surface: '#FFFFFF',
          background: '#F8FAFC',
        }
      }
    }
  }
});
