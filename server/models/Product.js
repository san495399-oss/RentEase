import mongoose from 'mongoose';
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  brand: String,
  description: String,
  pricePerDay: { type: Number, required: true },
  deposit: { type: Number, default: 0 },
  image: String,
  stock: { type: Number, default: 1 },
  featured: { type: Boolean, default: false }
}, { timestamps: true });
export default mongoose.model('Product', productSchema);
