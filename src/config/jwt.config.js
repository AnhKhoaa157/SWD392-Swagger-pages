require('dotenv').config();

module.exports = {
    secret: process.env.JWT_SECRET || (() => {
        throw new Error('❌ JWT_SECRET is required in .env file!');
    })(),
    expiresIn: process.env.JWT_EXPIRE || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || (() => {
        throw new Error('❌ JWT_REFRESH_SECRET is required in .env file!');
    })(),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
};
