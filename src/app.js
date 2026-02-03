const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger.config');
const connectDB = require('./config/database.config');
const User = require('./models/user.model');

// Import routes
const apiRoutes = require('./routes/api.routes');

// Create Express app
const app = express();

// Connect to MongoDB and initialize default admin
connectDB().then(() => {
    User.createDefaultAdmin();
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
