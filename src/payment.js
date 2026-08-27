const processPayment = (log) => {
  log.info({ msg: 'payment.processing' }, 'Payment processing started');
  
  // Simulate some payment processing
  setTimeout(() => {
    log.info({ msg: 'payment.completed' }, 'Payment processing completed');
  }, 500);
};

module.exports = { processPayment };

