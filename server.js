import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import sequelize from './src/config/db.js';
import 'dotenv/config'

const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      // Allow localhost and 127.0.0.1 on any port
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Sync Database and Start Server
sequelize.sync()
    .then(() => {
        console.log('Database connected successfully.');
        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`WebSocket server ready for real-time sync`);
        });
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });