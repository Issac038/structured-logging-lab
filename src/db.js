const { Pool } = require('pg');
const { logger } = require('./logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'myuser',
  password: process.env.DB_PASSWORD || 'mypassword',
  database: process.env.DB_NAME || 'ordersdb',
  port: process.env.DB_PORT || 5432,
});

const connectDb = async () => {
  logger.info({ msg: 'db.connection.attempting' }, 'Attempting database connection');
  try {
    await pool.query('SELECT NOW()');
    logger.info({ msg: 'db.connection.success' }, 'Database connection successful');
  } catch (err) {
    logger.error({ msg: 'db.connection.failed', error: err.message }, 'Database connection failed');
    logger.info({ msg: 'db.connection.retrying' }, 'Retrying database connection');
  }
};

const queryDb = async (text, params) => {
  logger.debug({ msg: 'db.query.executing', query: text }, 'Executing database query');
  try {
    const res = await pool.query(text, params);
    logger.debug({ msg: 'db.query.success', rows: res.rowCount }, 'Database query completed successfully');
    return res;
  } catch (err) {
    logger.error({ msg: 'db.query.failed', error: err.message, query: text }, 'Database query failed');
    throw err;
  }
};

module.exports = { connectDb, queryDb, pool };

