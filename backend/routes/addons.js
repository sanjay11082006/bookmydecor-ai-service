import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = join(__dirname, '..', 'data', 'addons.json');

// GET /addons — return all addons
router.get('/', (req, res) => {
  try {
    const addons = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
    res.json(addons);
  } catch (err) {
    console.error('Error reading addons:', err.message);
    res.status(500).json({ error: 'Failed to load addons' });
  }
});

export default router;
