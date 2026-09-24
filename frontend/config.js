// ─── API Configuration ─────────────────────────────────────────
// Dynamically selects the backend URL:
//   • localhost / 127.0.0.1  →  local Express dev server
//   • any other host         →  production Render deployment
const API_BASE = (() => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  return 'https://bookmydecor-ai-service-api.onrender.com';
})();
