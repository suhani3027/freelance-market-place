import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { register, login, getUserByEmail, getAllUsers, searchUsers } from './routes/authRoutes.js';
import gigRoutes from './routes/gigRoutes.js';
import freelancerProfileRoutes from './routes/freelancerProfileRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));