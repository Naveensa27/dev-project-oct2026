const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Prometheus metrics collection
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'pulse_app_' });

// Custom counter metric for HTTP requests
const httpRequestCounter = new client.Counter({
  name: 'pulse_app_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Middleware to count requests
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestCounter.labels(req.method, req.path, res.statusCode).inc();
  });
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to New-Project-2026! Your DevOps pipeline is working.',
    environment: process.env.NODE_ENV || 'development',
    hostname: require('os').hostname(),
    timestamp: new Date().toISOString(),
  });
});

// Liveness Probe Endpoint
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Readiness Probe Endpoint
app.get('/readyz', (req, res) => {
  // In a real app, check DB connections or cache health here
  res.status(200).send('READY');
});

// Prometheus Metrics Endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.setHeader('ContentType', register.contentType);
    res.send(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`PulseApp server is running on port ${PORT}`);
});