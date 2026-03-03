import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import authRoutes from './src/routes/auth.routes.js'
import userRoutes from './src/routes/user.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import roomRoutes from './src/routes/room.routes.js';
import bookingRoutes from './src/routes/booking.routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// CORS configuration - allow frontend origins for development
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400 // 24 hours
}));
app.use(bodyParser.json());
app.use(cookieParser());

//Auth Routes
app.use('/api/auth', authRoutes);

//user routes
app.use('/api/users', userRoutes);

//dashboard routes
app.use('/api/dashboard', dashboardRoutes);

//room routes
app.use('/api/rooms', roomRoutes);

//booking routes
app.use('/api/bookings', bookingRoutes);


// Test Route
app.get('/', (req, res) => {
    res.send('Hostal Management API is running...');
});

export default app;