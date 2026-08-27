# Structured Logging Implementation Demo

## Overview
This document demonstrates the transformation from plain-text logging to structured JSON logging in the Orders API, and shows how to trace requests using correlation IDs.

## Task 1: Structured JSON Logging

### Before (Plain Text Logs)
Plain text logs were vague and unstructured:
```
starting
ok
payment started
done
error happened
connecting...
connected
```

**Problems with plain text:**
- Logs are strings, not data
- No consistent format or structure
- Cannot programmatically filter or query
- No timestamps or severity levels
- No way to correlate related events
- Human-readable only (at best)

### After (Structured JSON Logging)
Each log line is now a complete JSON object with consistent fields:
```json
{"level":30,"time":1787803025293,"pid":17,"hostname":"71fc99fd76fd","service":"orders-api","msg":"startup.beginning","msg":"Starting application"}
{"level":30,"time":1787803025295,"pid":17,"hostname":"71fc99fd76fd","msg":"db.connection.attempting","msg":"Attempting database connection"}
{"level":30,"time":1787803025306,"pid":17,"hostname":"71fc99fd76fd","service":"orders-api","port":3000,"msg":"startup.complete","msg":"Application listening on port 3000"}
{"level":50,"time":1787803025309,"pid":17,"hostname":"71fc99fd76fd","msg":"db.connection.failed","error":"connect ECONNREFUSED 172.21.0.2:5432","msg":"Database connection failed"}
{"level":30,"time":1787803077984,"pid":17,"hostname":"71fc99fd76fd","reqId":"7ed81bce-a767-4af7-9dc5-5653c63855d3","method":"GET","path":"/","msg":"root.endpoint.accessed","msg":"Health check endpoint accessed"}
```

**Standard fields in each log:**
- `level`: Log severity (10=trace, 20=debug, 30=info, 40=warn, 50=error, 60=fatal)
- `time`: Unix millisecond timestamp
- `pid`: Process ID
- `hostname`: Container/host name
- `msg`: Event identifier (e.g., "startup.beginning")
- `service`: Service name (e.g., "orders-api")
- Additional context fields as needed (e.g., `reqId`, `port`, `error`)

**Benefits:**
- ✅ Logs are structured data
- ✅ Queryable and filterable by tools
- ✅ Consistent across all services
- ✅ Machine AND human readable
- ✅ Timestamps on every event
- ✅ Request correlation possible

## Task 2: Severity Levels + Request IDs

### Severity Levels
Logs now use proper severity levels:
- **INFO** (level 30): Normal application events
  ```json
  {"level":30,...,"msg":"startup.complete","msg":"Application listening on port 3000"}
  ```
- **WARN** (level 40): Handled anomalies (validation failures, retry attempts)
  ```json
  {"level":40,...,"msg":"orders.create.validation_failed",...}
  ```
- **ERROR** (level 50): Real failures that need attention
  ```json
  {"level":50,...,"msg":"error.simulated","statusCode":500,...}
  ```

### Request IDs (Correlation IDs)
Every request now has a unique ID attached to all its logs:

**Middleware in server.js:**
```javascript
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  req.log = createLogger({ 
    reqId: req.id,
    method: req.method,
    path: req.path
  });
  next();
});
```

**Example logs for a single request:**
All events related to request `55acb1a5-889f-41f0-bbbc-3adaae0ade8c` can be found:
```json
{"level":50,"time":1787803090374,"pid":17,"hostname":"71fc99fd76fd","reqId":"55acb1a5-889f-41f0-bbbc-3adaae0ade8c","method":"GET","path":"/simulate-error","msg":"error.simulated","statusCode":500,"msg":"Simulated error endpoint triggered"}
```

## Task 3: Failure Tracing with Evidence

### Test Scenario
We triggered two types of requests:
1. **Health check (success):** `GET /`
2. **Error endpoint (failure):** `GET /simulate-error`

### Filtering Logs with jq

**Command 1: Filter all error-level logs**
```bash
docker logs orders-api | jq 'select(.level==50)'
```

Output shows all events with severity ERROR:
```json
{"level":50,"time":1787803025309,...,"msg":"db.connection.failed",...}
{"level":50,"time":1787803090374,...,"msg":"error.simulated",...}
```

**Command 2: Trace a single request by ID**
```bash
docker logs orders-api | jq 'select(.reqId=="55acb1a5-889f-41f0-bbbc-3adaae0ade8c")'
```

Output shows all logs for that one request (the complete journey):
```json
{"level":50,"time":1787803090374,"pid":17,"hostname":"71fc99fd76fd","reqId":"55acb1a5-889f-41f0-bbbc-3adaae0ade8c","method":"GET","path":"/simulate-error","msg":"error.simulated","statusCode":500,"msg":"Simulated error endpoint triggered"}
```

**Command 3: Combine filters - errors in a specific request**
```bash
docker logs orders-api | jq 'select(.level==50 and .reqId=="55acb1a5-889f-41f0-bbbc-3adaae0ade8c")'
```

**Command 4: Extract just message and request ID**
```bash
docker logs orders-api | jq '{reqId, msg, level, time}'
```

### Real-World Use Cases
1. **Incident Response:** Find all errors → Filter by time window → Group by service
2. **User Debugging:** Get user's request ID → Trace all logs for that request → Replay the issue
3. **Performance Analysis:** Find slow requests → Calculate time between log entries
4. **Dependency Tracing:** Propagate request ID across microservices → Follow one request through the entire system

## Task 4: Cloud Logging Integration

See [CLOUD_LOGGING.md](./CLOUD_LOGGING.md) for detailed information on how these JSON logs integrate with cloud logging services.

## Implementation Summary

### Files Modified
1. **package.json** - Added `pino` and `pino-pretty` dependencies
2. **src/logger.js** - Created structured logger using pino
3. **src/server.js** - Added request ID middleware, replaced console.log
4. **src/routes/orders.js** - Replaced console.log with structured logging
5. **src/payment.js** - Updated to accept and use logger
6. **src/db.js** - Added structured logging for database operations

### Key Pattern
Every endpoint follows this pattern:
```javascript
// In route handler
req.log.info({ msg: 'operation.started' }, 'Starting operation');
try {
  // Operation
  req.log.info({ msg: 'operation.success', result: data }, 'Operation succeeded');
} catch (err) {
  req.log.error({ msg: 'operation.failed', error: err.message }, 'Operation failed');
}
```

### Advantages Over Plain Text
- **Querying:** Use jq, grep, or log aggregation tools
- **Correlation:** Follow requests across services
- **Metrics:** Extract values for dashboards
- **Filtering:** Find exactly what you need
- **Retention:** Store as structured data
- **Alerts:** Create rules based on field values
