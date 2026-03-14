import { createServer } from 'http';
import { Server } from 'socket.io';
import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import app from './app.js';
import sequelize from './src/config/db.js';
import Admin from './src/models/admin.model.js';
import { autoCheckoutExpiredBookings } from './src/services/autoCheckout.service.js';
import 'dotenv/config'

const PORT = process.env.PORT || 5000;
const AUTO_CHECKOUT_INTERVAL_MS = 60 * 60 * 1000;
const SUPER_ADMIN_CONFIG = {
  nic: process.env.SUPER_ADMIN_NIC || '900000000V',
  name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
  email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@ousl.lk',
  contactNumber: process.env.SUPER_ADMIN_CONTACT || '+94770000000',
  password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
};

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

const ensureAdminRoleSchemaBeforeSync = async () => {
  const queryInterface = sequelize.getQueryInterface();

  try {
    const table = await queryInterface.describeTable('Admins');

    if (!table.Role) {
      await queryInterface.addColumn('Admins', 'Role', {
        type: DataTypes.ENUM('admin', 'super_admin'),
        allowNull: false,
        defaultValue: 'admin',
      });
    }
  } catch (error) {
    const dbCode = error?.original?.code;
    const message = error?.original?.sqlMessage || error?.message || '';

    const tableNotFound = dbCode === 'ER_NO_SUCH_TABLE' || message.includes("Table 'Admins' doesn't exist");
    if (!tableNotFound) {
      throw error;
    }
  }
};

const ensureSuperAdminAccount = async () => {
  const { nic, name, email, contactNumber, password } = SUPER_ADMIN_CONFIG;

  const existingSuperAdmin = await Admin.findOne({
    where: {
      [Op.or]: [{ Role: 'super_admin' }, { NIC: nic }, { Email: email }],
    },
  });

  if (existingSuperAdmin) {
    const updates = {};
    if (existingSuperAdmin.Role !== 'super_admin') updates.Role = 'super_admin';
    if (existingSuperAdmin.NIC !== nic) updates.NIC = nic;
    if (existingSuperAdmin.Name !== name) updates.Name = name;
    if (existingSuperAdmin.Email !== email) updates.Email = email;
    if (existingSuperAdmin.ContactNumber !== contactNumber) updates.ContactNumber = contactNumber;

    if (Object.keys(updates).length > 0) {
      await existingSuperAdmin.update(updates);
      console.log('[AdminSeed] Super admin account synced.');
    } else {
      console.log('[AdminSeed] Super admin account already exists.');
    }
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await Admin.create({
    NIC: nic,
    Name: name,
    Email: email,
    ContactNumber: contactNumber,
    Password: hashedPassword,
    Role: 'super_admin',
  });

  console.log('[AdminSeed] Super admin account created.');
};

const runAutoCheckoutJob = async () => {
  try {
    const result = await autoCheckoutExpiredBookings();
    if (result.checkedOutCount > 0) {
      console.log(`[AutoCheckout] Checked out ${result.checkedOutCount} expired booking(s) out of ${result.scannedCount} found.`);
    }
  } catch (error) {
    console.error('[AutoCheckout] Failed to process expired bookings:', error.message);
  }
};

// Sync Database and Start Server
sequelize.authenticate()
    .then(() => ensureManualCodeSchemaBeforeSync())
  .then(() => ensureAdminRoleSchemaBeforeSync())
    .then(() => sequelize.sync())
  .then(() => ensureSuperAdminAccount())
    .then(() => {
        console.log('Database connected successfully.');
      runAutoCheckoutJob();
      setInterval(runAutoCheckoutJob, AUTO_CHECKOUT_INTERVAL_MS);
        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`WebSocket server ready for real-time sync`);
        });
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });