import express from 'express';
import Product from '../models/Product.js';
const router = express.Router();
router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.category && req.query.category !== 'All') filter.category = req.query.category;
  if (req.query.q) filter.$or = [
    { name: { $regex: req.query.q, $options: 'i' } },
    { brand: { $regex: req.query.q, $options: 'i' } },
    { description: { $regex: req.query.q, $options: 'i' } }
  ];
  res.json(await Product.find(filter).sort({ featured: -1, createdAt: -1 }));
});
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json(product);
});
export default router;
