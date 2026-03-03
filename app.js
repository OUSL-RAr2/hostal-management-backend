import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import authRoutes from './src/routes/auth.routes.js'
import userRoutes from './src/routes/user.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import roomRoutes from './src/routes/room.routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173'
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


// Test Route
app.get('/', (req, res) => {
    res.send('Hostal Management API is running...');
});

export default app;