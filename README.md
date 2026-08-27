# structured-logging-lab

This repository contains a simple Orders API application for the DevOps Foundation assignment: Implementing Structured Logging for Debugging (LU 5.3).

## Setup

```bash
docker compose up -d
```

## View Logs

```bash
docker logs structured-logging-lab-orders-api-1
```

## Trigger Error

```bash
curl localhost:3000/simulate-error
```

## Structured Logging Implementation

This repository now features production-grade structured JSON logging with request correlation IDs and severity levels.

### Key Features
- ✅ **JSON Logging** - Every log line is valid JSON with structured fields
- ✅ **Request IDs** - Track complete request journey with correlation IDs
- ✅ **Severity Levels** - Proper log levels (INFO, WARN, ERROR)
- ✅ **Cloud Ready** - Compatible with Google Cloud Logging, AWS CloudWatch, Grafana Loki, ELK, Datadog

### Documentation
- **[TEST_RESULTS.md](./TEST_RESULTS.md)** - Test evidence, before/after comparison, and implementation summary
- **[STRUCTURED_LOGGING_DEMO.md](./STRUCTURED_LOGGING_DEMO.md)** - Technical deep-dive with examples
- **[CLOUD_LOGGING.md](./CLOUD_LOGGING.md)** - Integration guide for cloud logging services

### Example Logs

**Before (Plain text):**
```
starting
ok
payment started
done
error happened
```

**After (Structured JSON):**
```json
{"level":30,"time":1787803025293,"pid":17,"service":"orders-api","msg":"startup.beginning"}
{"level":30,"time":1787803077984,"reqId":"7ed81bce-a767-4af7-9dc5-5653c63855d3","method":"GET","path":"/","msg":"root.endpoint.accessed"}
{"level":50,"reqId":"55acb1a5-889f-41f0-bbbc-3adaae0ade8c","msg":"error.simulated","statusCode":500}
```

### Quick Examples

**Filter errors:**
```bash
docker logs structured-logging-lab-orders-api-1 | jq 'select(.level==50)'
```

**Trace a single request:**
```bash
docker logs structured-logging-lab-orders-api-1 | jq 'select(.reqId=="55acb1a5-889f-41f0-bbbc-3adaae0ade8c")'
```

**Show all logs with custom fields:**
```bash
docker logs structured-logging-lab-orders-api-1 | jq '{time,reqId,msg,level,service}'
```

### Implementation Details

- **Logger:** Pino (fast, lightweight JSON logger)
- **Request Correlation:** UUID-based correlation IDs attached to child loggers
- **Severity Levels:** INFO (30), WARN (40), ERROR (50)
- **Standard Fields:** level, time, pid, hostname, msg, service, reqId

