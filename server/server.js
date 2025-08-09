import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { register, login, getUserByEmail, getAllUsers, searchUsers } from './routes/authRoutes.js';
import gigRoutes from './routes/gigRoutes.js';
import freelancerProfileRoutes from './routes/freelancerProfileRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import http from 'http';
import { Server } from 'socket.io';
import socketHandler from './socket/index.js';

const app = express();

// CORS configuration for both development and production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.vercel.app', 'https://your-frontend-domain.netlify.app'] // Replace with your actual frontend domain
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions
});

socketHandler(io);

// Make io available to routes
app.set('io', io);

// Connect Database
connectDB();

// Root route for health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Freelance Marketplace API is running!',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.post('/api/register', register);
app.post('/api/login', login);
app.get('/api/user/:email', getUserByEmail);
app.get('/api/users', getAllUsers);
app.get('/api/users/search', searchUsers);
app.use('/api/gigs', gigRoutes);
app.use('/api/freelancer-profile', freelancerProfileRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);

// 404 handler for undefined routes - Fixed the wildcard pattern
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));