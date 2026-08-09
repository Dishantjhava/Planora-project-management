const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const dns = require('dns');

dotenv.config();

// Configure custom DNS servers to prevent querySrv ECONNREFUSED errors on some local networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('⚠️ Warning: Failed to set custom DNS servers:', err.message);
}


const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // Vite dev servers
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/team', require('./routes/teamRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Planora API is running 🚀' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
const socket = require('./socket');
socket.init(server);

if (process.env.NODE_ENV !== 'test') {
  // Start server immediately to keep Vite proxy alive and prevent 500/504 errors
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

  // Connect to MongoDB asynchronously in the background
  console.log('⏳ Connecting to MongoDB Atlas...');
  mongoose
    .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log('✅ MongoDB Atlas connected');
    })
    .catch((err) => {
      console.warn('⚠️ MongoDB Atlas connection failed:', err.message);
      console.log('🔄 Attempting connection to local MongoDB fallback...');
      mongoose
        .connect('mongodb://127.0.0.1:27017/planora', { serverSelectionTimeoutMS: 4000 })
        .then(() => {
          console.log('✅ Local MongoDB connected successfully');
        })
        .catch((localErr) => {
          console.error('❌ Both MongoDB Atlas and Local MongoDB connections failed:', localErr.message);
          console.log('⚠️ Running server in offline-only mode. Database is not available.');
        });
    });
}

module.exports = server;