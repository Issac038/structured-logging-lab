# Quick Reference - Structured Logging Commands

## View Logs

### All logs
```bash
docker logs structured-logging-lab-orders-api-1
```

### Pretty-print JSON (if jq installed)
```bash
docker logs structured-logging-lab-orders-api-1 | jq '.'
```

## Filter Logs with jq

### All error-level logs
```bash
docker logs structured-logging-lab-orders-api-1 | jq 'select(.level==50)'
```

### Specific request by ID
```bash
docker logs structured-logging-lab-orders-api-1 | jq 'select(.reqId=="REQUEST_ID_HERE")'
```

### Specific message type
```bash
docker logs structured-logging-lab-orders-api-1 | jq 'select(.msg=="orders.create.success")'
```

### Custom field extraction
```bash
docker logs structured-logging-lab-orders-api-1 | jq '{time,reqId,msg,level,service}'
```

### Combine filters (errors in a specific request)
```bash
docker logs structured-logging-lab-orders-api-1 | jq 'select(.level==50 and .reqId=="REQUEST_ID")'
```

## Testing Endpoints

### Health check (should succeed)
```bash
curl http://localhost:3000/
```

### List orders
```bash
curl http://localhost:3000/orders
```

### Create order
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"product_id":1,"quantity":5,"customer_id":123}'
```

### Trigger error (returns 500)
```bash
curl http://localhost:3000/simulate-error
```

### Start/stop containers
```bash
docker compose up -d      # Start
docker compose down       # Stop
docker compose logs -f    # Follow logs
```

## Log Level Meanings

| Level | Numeric | Usage |
|-------|---------|-------|
| TRACE | 10 | Very detailed diagnostic info |
| DEBUG | 20 | Debugging information |
| INFO | 30 | Normal operational messages (default) |
| WARN | 40 | Warning - handled anomalies |
| ERROR | 50 | Error - something failed |
| FATAL | 60 | Fatal - system-level failure |

## Standard Log Fields

Every log includes:
- `level` - Log severity (numeric: 10-60)
- `time` - Unix milliseconds timestamp
- `pid` - Process ID
- `hostname` - Container/host name
- `msg` - Event identifier
- `service` - Service name (for logs originating from service startup)
- `reqId` - Request ID (for logs within a request handler)

## Key Event Messages

### Startup Events
- `startup.beginning` - Application starting
- `startup.complete` - Application ready to accept requests
- `db.connection.attempting` - Attempting database connection
- `db.connection.success` - Database connected
- `db.connection.failed` - Database connection failed

### Order Operations
- `orders.list.started` - Starting to fetch orders
- `orders.list.success` - Successfully fetched orders
- `orders.create.started` - Starting to create order
- `orders.create.success` - Order created successfully
- `orders.create.validation_failed` - Missing required fields
- `orders.create.failed` - Error creating order

### Error Handling
- `error.simulated` - Intentional error endpoint triggered
- `orders.list.failed` - Error fetching orders
- `db.query.failed` - Database query error

## Real-World Scenarios

### Scenario: User reports order not created
```bash
# Get all failed order creations
docker logs structured-logging-lab-orders-api-1 | jq 'select(.msg=="orders.create.failed")'

# Get logs for specific time window
docker logs structured-logging-lab-orders-api-1 | jq 'select(.time > 1787803000000 and .time < 1787803500000)'
```

### Scenario: Debug slow requests
```bash
# Find requests that took long
# (measure time between .started and .success for same reqId)
docker logs structured-logging-lab-orders-api-1 | jq 'select(.msg | contains("started"))'
docker logs structured-logging-lab-orders-api-1 | jq 'select(.msg | contains("success"))'
```

### Scenario: Follow one user's request through system
```bash
# After getting the reqId from one log
docker logs structured-logging-lab-orders-api-1 | jq 'select(.reqId=="USER_REQUEST_ID")' | jq '.msg'
```

### Scenario: Dashboard metrics
```bash
# Count errors per minute (assuming current time)
docker logs structured-logging-lab-orders-api-1 | jq 'select(.level==50)' | wc -l

# Group errors by type
docker logs structured-logging-lab-orders-api-1 | jq 'select(.level==50) | .msg' | sort | uniq -c
```

## Integration with Cloud Platforms

The JSON logs can be sent directly to:
- Google Cloud Logging - automatic JSON field indexing
- AWS CloudWatch Insights - structured log queries
- Grafana Loki - log aggregation
- ELK Stack - Elasticsearch indexing
- Datadog - out-of-the-box support

See [CLOUD_LOGGING.md](./CLOUD_LOGGING.md) for detailed setup instructions.

## Documentation

- **[TEST_RESULTS.md](./TEST_RESULTS.md)** - Test evidence and detailed analysis
- **[STRUCTURED_LOGGING_DEMO.md](./STRUCTURED_LOGGING_DEMO.md)** - Technical deep-dive
- **[CLOUD_LOGGING.md](./CLOUD_LOGGING.md)** - Cloud platform integration
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Full implementation overview
