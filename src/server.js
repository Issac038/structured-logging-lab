const express = require('express');
const crypto = require('crypto');
const { connectDb } = require('./db');
const ordersRouter = require('./routes/orders');
const { processPayment } = require('./payment');
const { logger, createLogger } = require('./logger');

const app = express();
const port = 3000;

app.use(express.json());

// Middleware to add request ID and child logger to each request
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  req.log = createLogger({ 
    reqId: req.id,
    method: req.method,
    path: req.path
  });
  next();
});

logger.info({ service: 'orders-api', msg: 'startup.beginning' }, 'Starting application');

connectDb();

app.get('/', (req, res) => {
  req.log.info({ msg: 'root.endpoint.accessed' }, 'Health check endpoint accessed');
  res.send('Orders API is running');
});

app.use('/orders', ordersRouter);

app.post('/payments', (req, res) => {
  req.log.info({ msg: 'payment.start' }, 'Payment processing initiated');
  processPayment(req.log);
  res.send('Payment processed');
});

app.get('/simulate-error', (req, res) => {
  req.log.error({ msg: 'error.simulated', statusCode: 500 }, 'Simulated error endpoint triggered');
  res.status(500).send('Internal Server Error');
});

app.listen(port, () => {
  logger.info({ service: 'orders-api', port, msg: 'startup.complete' }, `Application listening on port ${port}`);
});

