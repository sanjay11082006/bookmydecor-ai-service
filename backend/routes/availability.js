import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BOOKINGS_PATH = join(__dirname, '..', 'data', 'bookings.json');

// GET /availability?month=9&year=2026
// Returns every date in the month marked "available" or "booked"
// by checking existing bookings in bookings.json.
router.get('/', (req, res) => {
  try {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

    if (!month || !year || month < 1 || month > 12 || year < 2000) {
      return res.status(400).json({
        error: 'Invalid query parameters. Provide month (1–12) and year (≥ 2000).',
      });
    }

    // Number of days in the requested month
    const daysInMonth = new Date(year, month, 0).getDate();

    // Read bookings and find which days are booked in this month
    const bookings = JSON.parse(readFileSync(BOOKINGS_PATH, 'utf-8'));
    const bookedDays = new Set();

    bookings.forEach((b) => {
      const bookingDate = new Date(b.date);
      if (bookingDate.getFullYear() === year && bookingDate.getMonth() + 1 === month) {
        bookedDays.add(bookingDate.getDate());
      }
    });

    // Build the response array
    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isBooked = bookedDays.has(day);
      dates.push({
        date: dateStr,
        status: isBooked ? 'booked' : 'available',
        color: isBooked ? 'red' : 'white',
      });
    }

    res.json({ month, year, dates });
  } catch (err) {
    console.error('Error computing availability:', err.message);
    res.status(500).json({ error: 'Failed to compute availability' });
  }
});

export default router;
