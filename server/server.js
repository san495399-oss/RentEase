import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import bookingRoutes from './routes/bookings.js';
import { autoSeedIfEmpty } from './seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json());

// Health check endpoint with database status
app.get('/api/health', (_, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  res.json({
    status: 'ok',
    app: 'RentEase API',
    database: dbStatus
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bookings', bookingRoutes);

// Serve frontend build in production
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`Serving frontend build from ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    // Avoid returning index.html for missing API endpoints or assets
    if (req.path.startsWith('/api') || req.path.startsWith('/assets/')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  console.warn(`WARNING: Client dist directory not found at ${clientDistPath}`);
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.status(503).json({
      status: 'error',
      message: 'Frontend is still building or dist directory not found. Please verify the build step on your hosting dashboard.'
    });
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Something went wrong.' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || (process.env.NODE_ENV === 'production' ? '' : 'mongodb://127.0.0.1:27017/rentease');

// Bind to 0.0.0.0 immediately so Render port detection and health checks succeed
app.listen(PORT, '0.0.0.0', () => {
  console.log(`RentEase running on port ${PORT}`);
});

// Connect to MongoDB asynchronously without crashing the server process on startup
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(async () => {
      console.log('Connected to MongoDB successfully');
      await autoSeedIfEmpty();
    })
    .catch(err => {
      console.error('MongoDB connection error:', err.message);
      console.error('Make sure your MONGO_URI in Render is correct and MongoDB Atlas Network Access allows 0.0.0.0/0');
    });
} else {
  console.warn('WARNING: MONGO_URI environment variable is not set. Database features will be unavailable until set.');
}
