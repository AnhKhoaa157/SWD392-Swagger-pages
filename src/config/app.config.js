/**
 * Application Configuration
 * Centralized configuration management
 */

module.exports = {
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },

    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
    },

    api: {
        prefix: '/api',
        version: 'v1'
    },

    // Add more configuration as needed
    // database: {
    //   host: process.env.DB_HOST,
    //   port: process.env.DB_PORT,
    //   name: process.env.DB_NAME
    // }
};
