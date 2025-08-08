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
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

socketHandler(io);

// Make io available to routes
app.set('io', io);

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));