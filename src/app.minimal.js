const express = require('express');
const app = express();

console.log('Minimal app.js loaded');

// Log EVERY request
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Simple health check
app.get('/health', (req, res) => {
  console.log('HEALTH HIT!');
  res.json({ 
    success: true, 
    message: 'Minimal app works!',
    timestamp: new Date().toISOString()
  });
});

// Root
app.get('/', (req, res) => {
  console.log(' ROOT HIT!');
  res.json({ success: true, message: 'Root works!' });
});

// Catch all
app.use((req, res) => {
  console.log(' 404:', req.method, req.url);
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;