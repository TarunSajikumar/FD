// Re-export from actual implementation
import api from './fp-fetch-proxy.js';
window.api = api;
console.log('frontend api.js loaded (proxy to fp-fetch-proxy.js)');