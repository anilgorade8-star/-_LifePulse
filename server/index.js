require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for frontend requests
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api', chatRoutes);

// Serve static files (HTML, CSS, JS) from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'LifePulse Backend',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!process.env.GEMINI_API_KEY,
    });
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 404 handler for unknown routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// Start server
app.listen(PORT, () => {
    console.log('\n🚀 LifePulse Backend Server Started!');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🏥 AI Assistant: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('\n📋 Available endpoints:');
    console.log(`   GET  /                  - LifePulse website`);
    console.log(`   GET  /api/health        - Health check`);
    console.log(`   POST /api/chat          - AI chat endpoint`);
    console.log('\n💡 Press Ctrl+C to stop the server\n');
});
