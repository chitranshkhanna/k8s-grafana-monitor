const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3000;

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// --- Custom metrics ---

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Simulated number of active users',
  registers: [register],
});

const errorCounter = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP 5xx errors',
  labelNames: ['route'],
  registers: [register],
});

// Simulate active users fluctuating
setInterval(() => {
  activeUsers.set(Math.floor(Math.random() * 100) + 20);
}, 5000);

// --- Middleware ---

app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode,
    });
    end({ method: req.method, route: req.path, status: res.statusCode });
    if (res.statusCode >= 500) {
      errorCounter.inc({ route: req.path });
    }
  });
  next();
});

// --- Routes ---

app.get('/', (req, res) => {
  res.json({ message: 'Monitor app is running', timestamp: new Date().toISOString() });
});

app.get('/api/data', (req, res) => {
  const delay = Math.random() * 200;
  setTimeout(() => {
    res.json({
      items: Array.from({ length: 10 }, (_, i) => ({
        id: i,
        value: Math.random() * 100,
      })),
    });
  }, delay);
});

app.get('/api/slow', (req, res) => {
  setTimeout(() => {
    res.json({ message: 'This is a slow endpoint', delay: '1500ms' });
  }, 1500);
});

app.get('/api/error', (req, res) => {
  if (Math.random() < 0.5) {
    return res.status(500).json({ error: 'Simulated server error' });
  }
  res.json({ ok: true });
});

app.get('/api/cpu', (req, res) => {
  // Simulate CPU spike
  let sum = 0;
  for (let i = 0; i < 5_000_000; i++) sum += i;
  res.json({ result: sum });
});

// --- Health probes ---

app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

app.get('/health/ready', (req, res) => {
  res.status(200).json({ status: 'ready' });
});

// --- Metrics endpoint ---

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});