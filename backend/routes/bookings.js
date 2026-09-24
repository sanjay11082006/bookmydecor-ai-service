import { Router } from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BOOKINGS_PATH = join(__dirname, '..', 'data', 'bookings.json');
const SERVICES_PATH = join(__dirname, '..', 'data', 'services.json');
const ADDONS_PATH = join(__dirname, '..', 'data', 'addons.json');

// GET /booking/:id — lookup a single booking by ID
router.get('/:id', (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID format. Must be a numeric ID.' });
    }

    const bookings = JSON.parse(readFileSync(BOOKINGS_PATH, 'utf-8'));
    const booking = bookings.find((b) => Number(b.id) === bookingId);

    if (!booking) {
      return res.status(404).json({ error: `Booking with ID ${req.params.id} not found` });
    }

    res.json({
      id: booking.id,
      customer_name: booking.customer_name,
      phone: booking.phone,
      service_id: booking.service_id,
      service_name: booking.service_name,
      selected_addons: booking.selected_addons,
      date: booking.date,
      advance_amount: booking.advance_amount,
      status: booking.status,
      created_at: booking.created_at,
    });
  } catch (err) {
    console.error('Error fetching booking status:', err.message);
    res.status(500).json({ error: 'Failed to retrieve booking status' });
  }
});

// PATCH /booking/:id/payment — update booking status to "paid"
router.patch('/:id/payment', (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID format. Must be a numeric ID.' });
    }

    const bookings = JSON.parse(readFileSync(BOOKINGS_PATH, 'utf-8'));
    const index = bookings.findIndex((b) => Number(b.id) === bookingId);

    if (index === -1) {
      return res.status(404).json({ error: `Booking with ID ${req.params.id} not found` });
    }

    bookings[index].status = 'paid';
    bookings[index].paid_at = new Date().toISOString();

    writeFileSync(BOOKINGS_PATH, JSON.stringify(bookings, null, 2), 'utf-8');

    res.json({
      message: 'Payment successful! Booking status updated to paid.',
      booking: bookings[index],
    });
  } catch (err) {
    console.error('Error updating payment status:', err.message);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// POST /booking — create a new booking
router.post('/', (req, res) => {
  try {
    const { customer_name, phone, service_id, selected_addons, date } = req.body;

    // --- Validation ---
    if (!customer_name || !phone || !service_id || !date) {
      return res.status(400).json({
        error: 'Missing required fields: customer_name, phone, service_id, date',
      });
    }

    // --- Add-on Validation ---
    const addons = JSON.parse(readFileSync(ADDONS_PATH, 'utf-8'));
    const validAddonNames = new Set(addons.map((a) => a.name));
    const requestedAddons = selected_addons || [];

    const invalidAddons = requestedAddons.filter((addonName) => !validAddonNames.has(addonName));

    if (invalidAddons.length > 0) {
      return res.status(400).json({
        error: `Invalid add-on(s): ${invalidAddons.join(', ')}`,
      });
    }

    // Look up the service to calculate advance
    const services = JSON.parse(readFileSync(SERVICES_PATH, 'utf-8'));
    const service = services.find((s) => s.id === parseInt(service_id, 10));

    if (!service) {
      return res.status(404).json({ error: `Service with id ${service_id} not found` });
    }

    // 25% of starting price as advance
    const advance_amount = Math.round(service.starting_price * 0.25);

    // Read existing bookings
    const bookings = JSON.parse(readFileSync(BOOKINGS_PATH, 'utf-8'));

    // Generate a unique booking id using Date.now()
    const newId = Date.now();

    const newBooking = {
      id: newId,
      customer_name,
      phone,
      service_id: parseInt(service_id, 10),
      service_name: service.name,
      selected_addons: requestedAddons,
      date,
      advance_amount,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };

    bookings.push(newBooking);

    // Persist to file
    writeFileSync(BOOKINGS_PATH, JSON.stringify(bookings, null, 2), 'utf-8');

    res.status(201).json({
      message: 'Booking confirmed!',
      notice:
        'The advance amount is non-refundable if cancelled. We recommend booking at least 1 month in advance during busy/wedding season to ensure availability.',
      booking: newBooking,
    });
  } catch (err) {
    console.error('Error creating booking:', err.message);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

export default router;
