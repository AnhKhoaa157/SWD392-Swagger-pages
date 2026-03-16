/**
 * Sequelize Database Configuration
 * MySQL Connection Setup
 */
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'academic_collaboration_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
            charset: 'utf8mb4',
            supportBigNumbers: true,
            bigNumberStrings: true
        },
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: false,
            freezeTableName: true,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        },
        timezone: '+07:00' // Vietnam timezone
    }
);

// Test connection
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL connection established successfully.');
    } catch (error) {
        console.error('❌ Unable to connect to MySQL database:', error);
        throw error;
    }
}

// Sync database (for development only)
async function syncDatabase(options = {}) {
    try {
        await sequelize.sync(options);
        console.log('✅ Database synchronized successfully.');
    } catch (error) {
        console.error('❌ Error synchronizing database:', error);
        throw error;
    }
}

module.exports = {
    sequelize,
    testConnection,
    syncDatabase,
    Sequelize
};
