import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

router.get('/mine', async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('product').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (e) {
    console.error('Get bookings error:', e);
    res.status(500).json({ message: 'Could not retrieve bookings.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { productId, startDate, endDate } = req.body;
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: 'Choose a valid device.' });
    const start = new Date(startDate), end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start)
      return res.status(400).json({ message: 'Choose valid rental dates. End date must be on or after start date.' });
    start.setHours(0,0,0,0); end.setHours(0,0,0,0);
    const days = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Device not found.' });
    const booking = await Booking.create({
      user: req.user.id, product: product._id, startDate: start, endDate: end,
      days, totalPrice: days * product.pricePerDay
    });
    res.status(201).json(await booking.populate('product'));
  } catch (e) {
    console.error('Create booking error:', e);
    res.status(500).json({ message: 'Could not create rental.' });
  }
});

router.patch('/:id/cancel', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid rental ID.' });
    }
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Rental not found.' });
    if (booking.status === 'Cancelled') return res.status(400).json({ message: 'This rental is already cancelled.' });
    booking.status = 'Cancelled';
    await booking.save();
    res.json(booking);
  } catch (e) {
    console.error('Cancel booking error:', e);
    res.status(500).json({ message: 'Could not cancel rental.' });
  }
});

export default router;
