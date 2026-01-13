# Demo Application - Distributed Systems Architecture

A comprehensive demo application designed to onboard new engineers to distributed systems architecture, showcasing Kafka messaging, Azure Service Bus integration, containerization, and cloud deployment patterns using a monorepo structure.

## 🏗️ Architecture Overview

This application demonstrates a microservices architecture with message-driven communication patterns:

```
demo-app/
├── packages/
│   ├── kafka-server/           # Kafka broker with preconfigured topics
│   ├── kafka-producer-api/     # REST API that publishes to Kafka
│   ├── kafka-consumer-service/ # Service that consumes Kafka messages
│   ├── azure-function-app/     # Azure Functions with HTTP and Service Bus triggers
│   └── servicebus-publisher/   # REST API that publishes to Azure Service Bus
├── docker-compose.yml
├── package.json
└── README.md
```

## 🔑 Key Technologies

- **Apache Kafka** - Event streaming platform
- **Azure Service Bus** - Cloud messaging service
- **Node.js** - Service implementation
- **Azure Functions** - Serverless computing
- **Docker** - Containerization
- **Kubernetes** - Container orchestration
- **Docker Compose** - Local orchestration

## 📊 Data Flow Patterns

### Kafka Flow
```
Client → Kafka Producer API → Kafka Topic → Kafka Consumer Service
```

### Service Bus Flow
```
Client → Service Bus Publisher → Azure Service Bus → Azure Function
```

### Azure Function HTTP Flow
```
Client → Azure Function HTTP Trigger
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker Desktop
- Docker Compose
- (Optional) Azure subscription for Service Bus and Functions

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd synapse-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Kafka (Docker)**
   
   Follow the Kafka setup instructions below or refer to the [Kafka Setup Guide](#kafka-setup-with-docker).

4. **Start all services**
   ```bash
   docker-compose up -d
   ```

## 🐳 Kafka Setup with Docker

### Step 1: Create Kafka Directory Structure

Create a directory for Kafka setup:
```bash
mkdir kafka-docker
cd kafka-docker
```

### Step 2: Create Docker Compose File

Create a `docker-compose.yml` file with the following content:

```yaml
version: '3'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    container_name: zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:latest
    container_name: kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
```

### Step 3: Start Kafka Containers

```bash
docker-compose up -d
```

The `-d` flag runs containers in detached mode (background).

### Step 4: Verify Containers are Running

```bash
docker ps
```

You should see both `kafka` and `zookeeper` containers running.

### Step 5: View Container Logs (Optional)

```bash
# View logs
docker logs kafka

# Follow logs in real-time
docker logs -f kafka
```

Press `Ctrl+C` to stop following logs.

## 📝 Working with Kafka Topics

### Create a Topic

```bash
docker exec -it kafka kafka-topics --create --topic my-first-topic --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
```

**Parameters:**
- `--topic` - Name of your topic
- `--partitions` - Number of partitions (affects parallelism)
- `--replication-factor` - Number of replicas (use 1 for local development)

### List All Topics

```bash
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Describe a Topic

```bash
docker exec -it kafka kafka-topics --describe --topic my-first-topic --bootstrap-server localhost:9092
```

### Publish Messages

Start a console producer:
```bash
docker exec -it kafka kafka-console-producer --topic my-first-topic --bootstrap-server localhost:9092
```

Type messages and press Enter. Each line becomes a separate message.

Example:
```
> Hello, Kafka!
> This is my first message
> Testing message publishing
```

Press `Ctrl+C` to exit.

### Consume Messages

Start a console consumer:
```bash
docker exec -it kafka kafka-console-consumer --topic my-first-topic --from-beginning --bootstrap-server localhost:9092
```

The `--from-beginning` flag reads all messages from the start. Omit to only consume new messages.

### Consumer Groups

Consume as part of a consumer group:
```bash
docker exec -it kafka kafka-console-consumer --topic my-first-topic --group my-consumer-group --bootstrap-server localhost:9092
```

Consumer groups allow scaling message processing across multiple consumers.

## 📦 Package Details

### kafka-server
Kafka broker with preconfigured topics and consumer groups for demo purposes.

### kafka-producer-api
REST API service that accepts HTTP requests and publishes messages to Kafka topics.

### kafka-consumer-service
Background service that consumes messages from Kafka topics and processes them.

### azure-function-app
Azure Functions with HTTP triggers and Service Bus triggers for serverless processing.

### servicebus-publisher
REST API that publishes messages to Azure Service Bus queues and topics.

## 🛠️ Development

### Available Scripts

```bash
# Install all dependencies
npm run install:all

# Build all packages
npm run build

# Run all services
npm run start

# Run in development mode
npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check

# Clean build artifacts
npm run clean
```

## 🐋 Docker Commands

### Stop All Containers
```bash
docker-compose down
```

### Rebuild Containers
```bash
docker-compose up -d --build
```

### View All Container Logs
```bash
docker-compose logs -f
```

## 📚 Additional Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Azure Service Bus Documentation](https://docs.microsoft.com/azure/service-bus-messaging/)
- [Docker Documentation](https://docs.docker.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 📄 License

MIT

## 👥 Contributing

This is a demo application for educational purposes. Contributions and suggestions are welcome!

---

Built with ❤️ for learning distributed systems architecture
