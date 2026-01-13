const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Basic Middleware
app.use(cors());
app.use(bodyParser.json());

// Test Route
app.get('/', (req, res) => {
    res.send('Hostal Management API is running...');
});

module.exports = app;