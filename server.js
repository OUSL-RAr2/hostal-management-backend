import { createServer } from 'http';
import { Server } from 'socket.io';
import { DataTypes } from 'sequelize';
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
      
      // Allow local network IPs for mobile development
      if (origin.match(/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/) || 
          origin.includes('exp://')) {
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

const ensureManualCodeSchemaBeforeSync = async () => {
  const queryInterface = sequelize.getQueryInterface();

  try {
    const table = await queryInterface.describeTable('QRCodes');

    if (!table.ManualCode) {
      await queryInterface.addColumn('QRCodes', 'ManualCode', {
        type: DataTypes.STRING(9),
        allowNull: true,
        comment: '9-digit manual fallback code mapped to the QR code'
      });
    }

    const indexes = await queryInterface.showIndex('QRCodes');
    const hasManualCodeUniqueIndex = indexes.some((index) => {
      const hasManualCodeField = index.fields?.some((field) => field.attribute === 'ManualCode');
      return index.unique && hasManualCodeField;
    });

    if (!hasManualCodeUniqueIndex) {
      await queryInterface.addIndex('QRCodes', ['ManualCode'], {
        unique: true,
        name: 'qrcodes_manual_code_unique',
      });
    }
  } catch (error) {
    const dbCode = error?.original?.code;
    const message = error?.original?.sqlMessage || error?.message || '';

    const tableNotFound = dbCode === 'ER_NO_SUCH_TABLE' || message.includes("Table 'QRCodes' doesn't exist");
    if (!tableNotFound) {
      throw error;
    }
  }
};

// Sync Database and Start Server
sequelize.authenticate()
    .then(() => ensureManualCodeSchemaBeforeSync())
    .then(() => sequelize.sync())
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