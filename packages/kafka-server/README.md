# Kafka Server Package

Preconfigured Kafka broker with automatic topic creation and consumer groups for the demo application.

## Overview

This package provides a containerized Kafka setup with:
- Apache Kafka 7.5.0
- Zookeeper for cluster coordination
- Automatic topic initialization
- Health check capabilities
- Pre-configured consumer groups

## Configuration

### Topic Configuration

**Topic Name:** `demo-events`
- **Partitions:** 3
- **Replication Factor:** 1
- **Purpose:** Main event stream for demo application

### Consumer Groups

- `consumer-group-1` - First consumer group for parallel processing
- `consumer-group-2` - Second consumer group for parallel processing

### Connection Details

- **Kafka Bootstrap Server:** `localhost:9092`
- **Zookeeper:** `localhost:2181`
- **Internal Kafka Address:** `kafka:29092` (for inter-container communication)

## Quick Start

### Prerequisites

- Docker Desktop installed and running
- Node.js >= 18.0.0 (for npm scripts)

### Starting the Kafka Server

```bash
# From the kafka-server directory
npm start
```

Or using Docker Compose directly:

```bash
docker-compose up -d
```

This will:
1. Start Zookeeper
2. Start Kafka broker
3. Wait for Kafka to be healthy
4. Automatically create the `demo-events` topic
5. Verify topic creation

### Verifying the Setup

Check that containers are running:

```bash
docker ps
```

You should see:
- `demo-zookeeper`
- `demo-kafka`
- `demo-kafka-init` (will exit after initialization)

Check Kafka health:

```bash
npm run health
```

List all topics:

```bash
npm run topics:list
```

Describe the demo-events topic:

```bash
npm run topics:describe
```

## Available Scripts

### Container Management

```bash
npm start              # Start Kafka and Zookeeper
npm stop               # Stop all containers
npm restart            # Restart containers
npm run clean          # Stop containers and remove volumes
npm run build          # Build custom Kafka image
```

### Monitoring

```bash
npm run logs           # View Kafka logs (follow mode)
npm run logs:all       # View all container logs
npm run health         # Check Kafka health status
```

### Topic Management

```bash
npm run topics:list    # List all topics
npm run topics:describe # Describe demo-events topic
```

### Testing with Console Clients

#### Producer (Send Messages)

```bash
npm run console:producer
```

Then type messages and press Enter. Each line becomes a message.

Example:
```
> {"eventType": "user.created", "userId": "123"}
> {"eventType": "order.placed", "orderId": "456"}
```

Press `Ctrl+C` to exit.

#### Consumer (Receive Messages)

```bash
# Read all messages from beginning
npm run console:consumer

# Consumer with group 1
npm run console:consumer:group1

# Consumer with group 2
npm run console:consumer:group2
```

## Architecture

```
┌─────────────────────────────────────────────┐
│                Zookeeper                    │
│            (Port 2181)                      │
└──────────────────┬──────────────────────────┘
                   │
                   │ Cluster Coordination
                   │
┌──────────────────▼──────────────────────────┐
│              Kafka Broker                   │
│         (Ports 9092, 29092)                 │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │     Topic: demo-events              │   │
│  │  ┌──────────┬──────────┬──────────┐ │   │
│  │  │Partition │Partition │Partition │ │   │
│  │  │    0     │    1     │    2     │ │   │
│  │  └──────────┴──────────┴──────────┘ │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Docker Compose Services

### zookeeper
- **Image:** confluentinc/cp-zookeeper:7.5.0
- **Container Name:** demo-zookeeper
- **Port:** 2181
- **Purpose:** Kafka cluster coordination

### kafka
- **Image:** Custom (built from Dockerfile)
- **Base Image:** confluentinc/cp-kafka:7.5.0
- **Container Name:** demo-kafka
- **Ports:** 9092 (host), 29092 (internal)
- **Health Check:** Runs every 30s
- **Purpose:** Message broker

### kafka-init
- **Image:** confluentinc/cp-kafka:7.5.0
- **Container Name:** demo-kafka-init
- **Purpose:** One-time initialization (creates topics)
- **Lifecycle:** Runs once and exits

## Environment Variables

### Kafka Configuration

| Variable | Value | Description |
|----------|-------|-------------|
| `KAFKA_BROKER_ID` | 1 | Unique broker identifier |
| `KAFKA_ZOOKEEPER_CONNECT` | zookeeper:2181 | Zookeeper connection string |
| `KAFKA_ADVERTISED_LISTENERS` | PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092 | Advertised listener addresses |
| `KAFKA_LISTENERS` | PLAINTEXT://0.0.0.0:29092,PLAINTEXT_HOST://0.0.0.0:9092 | Listener addresses |
| `KAFKA_INTER_BROKER_LISTENER_NAME` | PLAINTEXT | Inter-broker communication protocol |
| `KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR` | 1 | Offset topic replication |
| `KAFKA_TRANSACTION_STATE_LOG_MIN_ISR` | 1 | Transaction log minimum in-sync replicas |
| `KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR` | 1 | Transaction log replication factor |

## Scripts

### init-kafka.sh

Initializes the Kafka broker with required topics:
- Creates `demo-events` topic with 3 partitions
- Verifies topic creation
- Idempotent (safe to run multiple times)

### health-check.sh

Verifies Kafka broker health:
- Attempts to list topics
- Returns exit code 0 if healthy, 1 if not
- Used by Docker health check

## Troubleshooting

### Issue: Containers won't start

**Check Docker Desktop is running:**
```bash
docker ps
```

**View logs:**
```bash
npm run logs:all
```

### Issue: Topic not created

**Manually create the topic:**
```bash
docker exec -it demo-kafka kafka-topics --create \
  --topic demo-events \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

### Issue: Port conflicts

**Check what's using port 9092:**
```bash
# Windows
netstat -ano | findstr :9092
```

**Change the port in docker-compose.yml:**
```yaml
ports:
  - "9093:9092"  # Use 9093 instead
```

### Issue: Cannot connect from application

**Verify Kafka is accessible:**
```bash
# From host machine
telnet localhost 9092
```

**Check network configuration:**
```bash
docker network inspect kafka-server_demo-network
```

## Integration with Other Services

### Connecting from Node.js (KafkaJS)

```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'consumer-group-1' });
```

### Connecting from Python (kafka-python)

```python
from kafka import KafkaProducer, KafkaConsumer

producer = KafkaProducer(bootstrap_servers='localhost:9092')
consumer = KafkaConsumer('demo-events', 
                          bootstrap_servers='localhost:9092',
                          group_id='consumer-group-1')
```

## Production Considerations

⚠️ **This setup is for development only!**

For production deployments:
- Increase replication factor to at least 3
- Use multiple Kafka brokers
- Configure proper authentication and encryption
- Set up monitoring and alerting
- Use managed Kafka services (e.g., Confluent Cloud, Amazon MSK)
- Configure persistent volumes for data durability
- Implement proper backup strategies

## Next Steps

After setting up the Kafka server:
1. ✅ Verify Kafka is running and healthy
2. ✅ Confirm `demo-events` topic exists
3. 🔄 Proceed to Story 2.1: Build Kafka Producer API
4. 🔄 Proceed to Story 2.2: Build Kafka Consumer Service

## Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent Platform Documentation](https://docs.confluent.io/platform/current/overview.html)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Package:** @demo-app/kafka-server  
**Version:** 1.0.0  
**License:** MIT
