import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import servicesRouter from './routes/services.js';
import addonsRouter from './routes/addons.js';
import availabilityRouter from './routes/availability.js';
import bookingsRouter from './routes/bookings.js';
import galleryRouter from './routes/gallery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ─── FastAPI service URL (env-var override for Render) ────────
const FASTAPI_URL = process.env.FASTAPI_SERVICE_URL || 'http://127.0.0.1:8000';

// ─── CORS configuration ───────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',      // Live Server / VS Code
  'http://127.0.0.1:5500',
  /\.vercel\.app$/,              // all Vercel preview / prod domains
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, Postman, same-origin SSR)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    if (allowed) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));
app.use(express.json());     // parse JSON request bodies

// ─── Serve Frontend static files ─────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ─── API health-check / endpoint listing ─────────────────────
app.get('/api', (req, res) => {
  res.json({
    status: 'BookMyDecor API is running 🎉',
    business: 'PR Decorations',
    storage: 'Local JSON files',
    endpoints: [
      { method: 'GET',   path: '/services',            description: 'List all decoration services' },
      { method: 'GET',   path: '/services/:id',        description: 'Get a single service by ID' },
      { method: 'GET',   path: '/addons',              description: 'List all available add-ons' },
      { method: 'GET',   path: '/availability',        description: 'Check date availability (query: month, year)' },
      { method: 'POST',  path: '/booking',             description: 'Create a new booking' },
      { method: 'GET',   path: '/booking/:id',         description: 'Get booking status by ID' },
      { method: 'PATCH', path: '/booking/:id/payment', description: 'Update booking status to paid' },
    ],
  });
});

// ─── Route mounting ───────────────────────────────────────────
app.use('/services', servicesRouter);
app.use('/addons', addonsRouter);
app.use('/availability', availabilityRouter);
app.use('/booking', bookingsRouter);
app.use('/gallery', galleryRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Chat Route (Proxy to Python RAG Backend) ─────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message field is required' });
    }

    // Call the Python FastAPI RAG backend (FASTAPI_URL set via env var)
    let response;
    try {
      response = await fetch(`${FASTAPI_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: message }),
      });
    } catch (fetchErr) {
      // Network-level failure — Python service is down or cold-starting
      console.error('FastAPI unreachable:', fetchErr.message);
      return res.status(503).json({
        error: 'Chat service is starting up, please try again in a few seconds.',
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`FastAPI ${response.status} error:`, errorText);
      return res.status(response.status).json({
        error: 'Error communicating with chat service',
        detail: errorText,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── 404 catch-all ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Global error handler ─────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 BookMyDecor API running at http://localhost:${PORT}`);
});
