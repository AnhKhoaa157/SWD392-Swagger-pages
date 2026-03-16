const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger.config');
const { sequelize, testConnection, User } = require('./models');
const { Op } = require('sequelize');

// Import routes
const apiRoutes = require('./routes/api.routes');

// Create Express app
const app = express();

// Connect to MySQL and create default admin
testConnection().then(async () => {
    // Sync database (optional - use migrations in production)
    // await sequelize.sync({ alter: true });

    // Create default admin from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    try {
        const adminExists = await User.findOne({ where: { email: adminEmail } });
        if (!adminExists) {
            await User.create({
                fullName: 'System Administrator',
                email: adminEmail,
                passwordHash: adminPassword, // Will be hashed via hook
                role: 'manager',  // Must match User model enum: student, lecturer, manager
                isEmailVerified: true, // Admin account is pre-verified
                isOnline: false, // Default to offline, will be online after login
                status: 'Offline'
            });
            console.log(`✅ Default admin created: ${adminEmail}`);
        } else if (!adminExists.isEmailVerified) {
            // Update existing admin if not verified (from previous migrations)
            adminExists.isEmailVerified = true;
            await adminExists.save();
            console.log(`✅ Existing admin email verified: ${adminEmail}`);
        } else {
            console.log(`ℹ️  Admin already exists: ${adminEmail}`);
        }
    } catch (err) {
        console.error('❌ Failed to create default admin:', err.message);
    }
}).catch(err => {
    console.error('❌ Database connection failed:', err);
});


// Middleware
// CORS configuration - Allow Frontend origins
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SWD392 API Docs'
}));

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Node.js Basic Project API',
        version: '1.0.0',
        status: 'running',
        documentation: '/api-docs'
    });
});

app.use('/api', apiRoutes);

// Auto-offline cron job: mỗi 60s, ai lastSeenAt > 3 phút → Offline
setInterval(async () => {
    try {
        const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
        const [count] = await User.update(
            { status: 'Offline', isOnline: false },
            {
                where: {
                    isOnline: true,
                    lastSeenAt: { [Op.lt]: threeMinutesAgo }
                }
            }
        );
        if (count > 0) console.log(`🔴 Auto-offline: ${count} user(s) set to Offline`);
    } catch (err) {
        console.error('❌ Auto-offline cron error:', err.message);
    }
}, 60 * 1000);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;
