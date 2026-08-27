const express = require('express');
const router = express.Router();
const { queryDb } = require('../db');

router.get('/', async (req, res) => {
  req.log.info({ msg: 'orders.list.started' }, 'Fetching orders list');
  try {
    const result = await queryDb('SELECT * FROM orders', []);
    req.log.info({ msg: 'orders.list.success', count: result.rows.length }, 'Successfully fetched orders');
    res.json(result.rows);
  } catch (err) {
    req.log.error({ msg: 'orders.list.failed', error: err.message }, 'Error fetching orders');
    res.status(500).send('Error fetching orders');
  }
});

router.post('/', async (req, res) => {
  req.log.info({ msg: 'orders.create.started' }, 'Creating new order');
  const { product_id, quantity, customer_id } = req.body;
  
  if (!product_id || !quantity || !customer_id) {
    req.log.warn({ msg: 'orders.create.validation_failed', missing: { product_id: !product_id, quantity: !quantity, customer_id: !customer_id } }, 'Missing required fields');
    return res.status(400).send('Missing fields');
  }

  try {
    const result = await queryDb(
      'INSERT INTO orders (product_id, quantity, customer_id) VALUES ($1, $2, $3) RETURNING *',
      [product_id, quantity, customer_id]
    );
    req.log.info({ msg: 'orders.create.success', orderId: result.rows[0].id }, 'Order created successfully');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    req.log.error({ msg: 'orders.create.failed', error: err.message }, 'Error creating order');
    res.status(500).send('Error creating order');
  }
});

module.exports = router;

