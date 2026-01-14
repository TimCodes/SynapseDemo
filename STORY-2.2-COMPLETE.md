# Story 2.2 - Build Kafka Consumer Service - COMPLETE

## Story Details

**As a** developer  
**I want** a background service that consumes Kafka messages  
**So that** I can demonstrate message processing patterns

## Implementation Summary

Successfully implemented a production-ready Kafka Consumer Service with all acceptance criteria met. The service consumes messages from the "demo-events" topic, provides health monitoring, and demonstrates proper consumer group patterns.

## Acceptance Criteria ✅

- ✅ Node.js service connects to Kafka and consumes from "demo-events" topic
- ✅ Service joins "consumer-group-1" consumer group
- ✅ Messages logged to console with timestamp, partition, and offset information
- ✅ Graceful shutdown handling for SIGTERM and SIGINT signals
- ✅ Automatic reconnection on connection loss
- ✅ Health check endpoint on port 3002
- ✅ Dockerized with production-ready configuration
- ✅ Comprehensive error handling and retry logic

## Technical Implementation

### Files Created

1. **package.json** - Dependencies including KafkaJS and Winston
2. **src/consumer.js** - Main application entry point with lifecycle management
3. **src/config/kafka.js** - KafkaJS consumer client with connection management
4. **src/messageHandler.js** - Message processing logic with statistics tracking
5. **src/healthCheck.js** - HTTP server for health monitoring
6. **src/logger.js** - Winston logger configuration
7. **Dockerfile** - Multi-stage production build
8. **.env.example** - Environment variable template
9. **.dockerignore** - Docker build exclusions
10. **.gitignore** - Git exclusions
11. **README.md** - Comprehensive documentation

### Technology Stack

- **KafkaJS 2.2.4** - Modern Kafka client for Node.js
- **Winston 3.11.0** - Structured logging
- **Node.js Built-in HTTP** - Health check server (no framework needed)

### Consumer Configuration

```javascript
{
  groupId: 'consumer-group-1',
  topic: 'demo-events',
  fromBeginning: false,
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  autoCommit: true,
  autoCommitInterval: 5000
}
```

### Key Features Implemented

1. **KafkaJS Consumer Client**
   - Consumer group support with configurable group ID
   - Automatic partition assignment and rebalancing
   - Connection event handlers (connect, disconnect, crash)
   - Automatic retry with exponential backoff (5 retries)
   - Session timeout and heartbeat management
   - Auto-commit with 5-second interval

2. **Message Handler**
   - JSON message parsing with fallback
   - Detailed logging of message metadata
   - Message statistics tracking (count, last message time)
   - Error handling that doesn't stop consumer
   - Extensible processing logic structure
   - Debug logging for message content

3. **Health Check Server**
   - Simple HTTP server using Node.js built-in http module
   - Returns consumer status, Kafka connectivity, and statistics
   - Includes messages processed count
   - Shows last message timestamp
   - Reports consumer group and topic information
   - Uptime tracking

4. **Graceful Shutdown**
   - SIGTERM and SIGINT signal handlers
   - Stops accepting new messages
   - Disconnects from Kafka (commits offsets)
   - Stops health check server
   - Logs final statistics
   - Clean process exit

5. **Error Recovery**
   - Uncaught exception handler
   - Unhandled promise rejection handler
   - Connection loss detection and logging
   - Consumer crash event handling
   - Automatic reconnection on disconnect

6. **Comprehensive Logging**
   - Winston structured logging
   - JSON format with timestamps
   - Message metadata logging (partition, offset, timestamp, key)
   - Event type extraction and logging
   - Processing statistics in logs
   - Configurable log levels

### Health Check Endpoint

#### GET /health

**Healthy Response (200 OK):**
```json
{
  "status": "healthy",
  "kafka": "connected",
  "consumer": {
    "groupId": "consumer-group-1",
    "topic": "demo-events",
    "messagesProcessed": 42,
    "lastMessageAt": "2026-01-13T10:30:00.000Z",
    "isProcessing": true
  },
  "timestamp": "2026-01-13T10:35:00.000Z",
  "uptime": 300.5
}
```

**Unhealthy Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "kafka": "disconnected",
  "consumer": {
    "groupId": "consumer-group-1",
    "topic": "demo-events",
    "messagesProcessed": 0,
    "lastMessageAt": null,
    "isProcessing": false
  },
  "timestamp": "2026-01-13T10:35:00.000Z",
  "uptime": 15.2
}
```

### Message Processing Flow

1. Consumer receives message from Kafka
2. Message metadata logged (topic, partition, offset)
3. Message value parsed as JSON
4. Event type extracted from message
5. Processing statistics updated
6. Message data logged
7. Business logic executed (extensible)
8. Offset auto-committed (every 5 seconds)
9. Ready for next message

### Log Output Example

```
info: Starting Kafka Consumer Service...
info: Kafka consumer initialized with group: consumer-group-1
info: Subscribed to topic: demo-events {"fromBeginning":false}
info: Health check server listening on port 3002
info: Kafka consumer running and waiting for messages...
info: Kafka consumer connected
info: Message received {
  "partition": 2,
  "offset": "1234",
  "timestamp": "1705147800000",
  "key": "user.created",
  "eventType": "user.created",
  "messageCount": 1,
  "receivedAt": "2026-01-13T10:30:00.000Z"
}
```

## Configuration

### Environment Variables

```env
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC=demo-events
KAFKA_GROUP_ID=consumer-group-1
KAFKA_FROM_BEGINNING=false
HEALTH_CHECK_PORT=3002
LOG_LEVEL=info
NODE_ENV=development
```

### Docker Configuration

- Multi-stage build for optimized image size
- Non-root user (nodejs:1001) for security
- Alpine Linux base image
- Built-in health check every 30 seconds
- Exposes port 3002 for health monitoring

## Testing

### Local Development

1. Install dependencies:
```bash
cd packages/kafka-consumer-service
npm install
```

2. Start Kafka (from kafka-server package)

3. Configure environment:
```bash
cp .env.example .env
```

4. Start the consumer:
```bash
npm run dev
```

### End-to-End Testing

1. Start the consumer service
2. Use kafka-producer-api to publish messages:
```bash
curl -X POST http://localhost:3001/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "test.event",
    "data": {"message": "Hello!"}
  }'
```

3. Watch consumer logs for message processing
4. Check health endpoint:
```bash
curl http://localhost:3002/health
```

### Docker Testing

**Build and run:**
```bash
docker build -t kafka-consumer-service .
docker run -d -p 3002:3002 \
  -e KAFKA_BROKERS=kafka:9092 \
  kafka-consumer-service
```

**View logs:**
```bash
docker logs -f kafka-consumer-service
```

### Testing Consumer Groups

Run multiple instances to see partition distribution:

**Terminal 1:**
```bash
HEALTH_CHECK_PORT=3002 npm start
```

**Terminal 2:**
```bash
HEALTH_CHECK_PORT=3003 npm start
```

Both will join the same consumer group and share partitions.

## Advanced Features

### Consumer Group Behavior

- **Load Balancing**: Multiple consumers share topic partitions
- **Fault Tolerance**: Automatic rebalancing when consumers join/leave
- **Offset Management**: Group-level offset tracking
- **At-Least-Once Delivery**: Messages may be redelivered on failure

### Connection Management

- Automatic retry with exponential backoff
- Connection event monitoring
- Session timeout management (30 seconds)
- Heartbeat interval (3 seconds)
- Consumer crash detection

### Message Statistics

The message handler tracks:
- Total messages processed
- Last message timestamp
- Processing status
- Available via health endpoint

## Documentation

Comprehensive README.md includes:
- Feature overview and architecture
- Installation and setup instructions
- Health check endpoint documentation
- Message processing behavior
- Docker usage and commands
- Testing procedures (single and multiple consumers)
- Configuration reference
- Error handling and recovery
- Troubleshooting guide
- Development guidelines
- Performance considerations
- Consumer group explanation

## Integration with Producer

This consumer service integrates seamlessly with Story 2.1 (kafka-producer-api):

1. Producer publishes to "demo-events" topic
2. Consumer receives from "demo-events" topic
3. Both use same Kafka cluster
4. Demonstrates complete message flow
5. End-to-end testing possible

## Estimated vs Actual Effort

- **Estimated:** 5 hours
- **Actual:** Completed in single session with full documentation

## Next Steps

Story 2.2 is complete. The Kafka integration epic is finished. Next epic (Epic 3) will implement Azure Service Bus integration:
- Story 3.1: Create Azure Function App Package
- Story 3.2: Build Service Bus Publisher (can be implemented next)

## Completion Date

January 13, 2026

---

**Status: COMPLETE ✅**

**Epic 2 (Kafka Integration Services): COMPLETE ✅**
- Story 2.1: Kafka Producer API - COMPLETE ✅
- Story 2.2: Kafka Consumer Service - COMPLETE ✅
