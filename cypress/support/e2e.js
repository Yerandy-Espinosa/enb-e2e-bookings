import 'cypress-iframe';
import './commands';

// 👇 Ignora errores JS del sitio (como appId is missing)
Cypress.on('uncaught:exception', (err, runnable) => {
  if (err.message && err.message.includes('appId is missing')) {
    return false; // evita que Cypress falle
  }
  return false;
});
