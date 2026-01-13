import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();

// Basic Middleware
app.use(cors());
app.use(bodyParser.json());

// Test Route
app.get('/', (req, res) => {
    res.send('Hostal Management API is running...');
});

export default app;