import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import authRoutes from './src/routes/auth.routes.js'
import userRoutes from './src/routes/user.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import roomRoutes from './src/routes/room.routes.js';
import bookingRoutes from './src/routes/booking.routes.js';
import complaintRoutes from './src/routes/complaint.routes.js';
import reportRoutes from './src/routes/report.routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// CORS configuration - allow all localhost/127.0.0.1 origins for development
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or direct browser access)
        if (!origin) return callback(null, true);
        
        // Allow localhost and 127.0.0.1 on any port
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
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

//complaint routes
app.use('/api/complaints', complaintRoutes);

//report routes
app.use('/api/reports', reportRoutes);


// Test Route
app.get('/', (req, res) => {
    res.send('Hostal Management API is running...');
});

export default app;