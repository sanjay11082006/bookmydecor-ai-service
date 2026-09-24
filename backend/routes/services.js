import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = join(__dirname, '..', 'data', 'services.json');

// GET /services — return all services
router.get('/', (req, res) => {
  try {
    const services = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
    res.json(services);
  } catch (err) {
    console.error('Error reading services:', err.message);
    res.status(500).json({ error: 'Failed to load services' });
  }
});

// GET /services/:id — return one service by id
router.get('/:id', (req, res) => {
  try {
    const services = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
    const service = services.find((s) => s.id === parseInt(req.params.id, 10));

    if (!service) {
      return res.status(404).json({ error: `Service with id ${req.params.id} not found` });
    }

    res.json(service);
  } catch (err) {
    console.error('Error reading service:', err.message);
    res.status(500).json({ error: 'Failed to load service' });
  }
});

export default router;
