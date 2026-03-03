import app from './app.js';
import sequelize from './src/config/db.js';
import 'dotenv/config'

const PORT = process.env.PORT || 5000;

// Sync Database and Start Server
sequelize.sync({ alter: true }) // Use 'alter: true' to update existing tables to match models
    .then(() => {
        console.log('Database connected successfully.');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });