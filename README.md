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

- **Docker** and **Docker Compose** installed
- **Node.js 18+** (for local development)
- **Azure subscription** (optional, for Service Bus features)

### Automated Setup

We provide a setup script that automates environment configuration:

```bash
# Run the setup script
node scripts/setup.js
```

This will:
- ✓ Check for required tools (Node.js, Docker)
- ✓ Copy `.env.example` files to `.env` in all packages
- ✓ Install npm dependencies
- ✓ Show next steps and available commands

### Manual Setup

If you prefer manual setup:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TimCodes/SynapseDemo.git
   cd synapse-demo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables (optional for Azure features):**
   ```bash
   cp .env.example .env
   # Edit .env and add your Azure Service Bus connection string
   ```

### Running the Application

#### Production Mode (Docker Compose)

Start all services with Docker Compose:
```bash
npm start
```

This is equivalent to:
```bash
docker-compose up -d
```

#### Development Mode (Hot Reload)

Start services in development mode with hot reload:
```bash
npm run dev
```

This uses `docker-compose.dev.yml` which mounts source directories as volumes, enabling instant code updates without rebuilding.

### Managing Services

#### Starting & Stopping

```bash
# Start all services
npm start

# Stop all services
npm stop

# Restart all services
npm restart

# Start in development mode
npm run dev
```

#### Direct Docker Compose Commands

```bash
# Start services (alternative to npm start)
npm run docker:start

# Stop services
npm run docker:stop

# Restart services
npm run docker:restart

# View running services
npm run docker:ps

# Clean up (stop + remove volumes)
npm run clean
```

#### Viewing Logs

```bash
# View all service logs
npm run logs

# View specific service logs
npm run logs:producer    # Kafka Producer API
npm run logs:consumer    # Kafka Consumer Service
npm run logs:function    # Azure Function App
npm run logs:publisher   # Service Bus Publisher
npm run logs:kafka       # Kafka broker
npm run logs:azurite     # Azurite emulator
```

#### Building Images

```bash
# Build all Docker images
npm run build

# Build with no cache
npm run docker:build:nocache
```

### Health Checks

Check the health of all running services:

```bash
npm run health
```

This script checks:
- ✓ Kafka Producer API (port 3000)
- ✓ Kafka Consumer Service (port 3002)
- ✓ Azure Function App (port 7071)
- ✓ Service Bus Publisher (port 3003)
- ✓ Kafka Broker (port 9092)
- ✓ Azurite services (ports 10000-10002)

### Service Endpoints

Once running, the following services are available:

| Service | Endpoint | Description |
|---------|----------|-------------|
| **Kafka Producer API** | http://localhost:3000 | Publish messages to Kafka |
| **Kafka Consumer Health** | http://localhost:3002/health | Consumer service health check |
| **Azure Function HTTP** | http://localhost:7071/api/process | HTTP trigger endpoint |
| **Service Bus Publisher** | http://localhost:3003 | Publish messages to Azure Service Bus |
| **Kafka Broker** | localhost:9092 | Kafka broker connection |
| **Zookeeper** | localhost:2181 | Kafka coordination service |
| **Azurite** | localhost:10000-10002 | Local Azure Storage emulator |
| **Service Bus Publisher** | http://localhost:3003 | Publish messages to Azure Service Bus |
| **Kafka Broker** | localhost:9092 | Kafka broker connection |
| **Zookeeper** | localhost:2181 | Kafka coordination service |
| **Azurite** | localhost:10000-10002 | Local Azure Storage emulator |

## 🧪 Testing the Application

### Quick Test

Use the automated health check to verify all services:
```bash
npm run health
```

### Test Kafka Flow (End-to-End)

1. **Publish a message to Kafka:**
   ```bash
   curl -X POST http://localhost:3000/events \
     -H "Content-Type: application/json" \
     -d '{"eventType":"test.event","data":{"message":"Hello Kafka!"}}'
   ```

   **PowerShell:**
   ```powershell
   $body = @{
       eventType = "test.event"
       data = @{ message = "Hello Kafka!" }
   } | ConvertTo-Json

   Invoke-WebRequest -Uri http://localhost:3000/events `
     -Method POST `
     -ContentType "application/json" `
     -Body $body
   ```

2. **View consumer logs to see the message being processed:**
   ```bash
   npm run logs:consumer
   ```

### Test Azure Service Bus Flow (Optional - Requires Azure)

1. **Configure Azure Service Bus** (if not already done):
   - Create a Service Bus namespace in Azure Portal
   - Create a queue named "demo-queue"
   - Copy the connection string to `.env` file

2. **Restart services with new configuration:**
   ```bash
   npm restart
   ```

3. **Publish a message to Service Bus:**
   ```bash
   curl -X POST http://localhost:3003/messages \
     -H "Content-Type: application/json" \
     -d '{"message":"Hello Service Bus!"}'
   ```

4. **View Azure Function logs to see the message being processed:**
   ```bash
   npm run logs:function
   ```

### Test HTTP Trigger Function

```bash
curl http://localhost:7071/api/process
```

**PowerShell:**
```powershell
Invoke-WebRequest -Uri http://localhost:7071/api/process -Method GET
```

### Health Checks

Check the health of all services with the automated script:
```bash
npm run health
```

Or check individual services manually:
```bash
# Kafka Producer API
curl http://localhost:3000/health

# Kafka Consumer Service
curl http://localhost:3002/health

# Service Bus Publisher
curl http://localhost:3003/health
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific packages
npm run test:producer    # Kafka Producer API tests
npm run test:consumer    # Kafka Consumer Service tests
npm run test:function    # Azure Function App tests
npm run test:publisher   # Service Bus Publisher tests
```

## 📦 Package Overview

### 1. kafka-producer-api

REST API built with Koa that publishes messages to Kafka.

**Key Features:**
- Koa framework with Joi validation
- KafkaJS integration
- Health monitoring
- Structured logging

**Documentation:** [packages/kafka-producer-api/README.md](packages/kafka-producer-api/README.md)

### 2. kafka-consumer-service

Background service that consumes messages from Kafka topics.

**Key Features:**
- Consumer group support
- Automatic message processing
- Health check endpoint
- Graceful shutdown

**Documentation:** [packages/kafka-consumer-service/README.md](packages/kafka-consumer-service/README.md)

### 3. azure-function-app

Azure Functions application with HTTP and Service Bus triggers.

**Key Features:**
- TypeScript-based functions
- HTTP trigger at `/api/process`
- Service Bus queue trigger
- Local development with Azurite

**Documentation:** [packages/azure-function-app/README.md](packages/azure-function-app/README.md)

### 4. servicebus-publisher

REST API built with Koa that publishes messages to Azure Service Bus.

**Key Features:**
- Azure Service Bus SDK integration
- Batch message support
- Retry logic
- Health monitoring

**Documentation:** [packages/servicebus-publisher/README.md](packages/servicebus-publisher/README.md)

## 🐳 Docker Compose Architecture

The `docker-compose.yml` orchestrates all services with proper dependencies and health checks:

### Service Startup Order

1. **Zookeeper** - Starts first (required for Kafka)
2. **Kafka** - Starts after Zookeeper is healthy
3. **Kafka Init** - Creates topics after Kafka is ready
4. **Azurite** - Starts independently (for Azure Functions)
5. **Application Services** - Start after dependencies are healthy:
   - kafka-producer-api
   - kafka-consumer-service
   - azure-function-app
   - servicebus-publisher

### Network Configuration

All services run on a custom bridge network (`synapse-network`), enabling:
- Service-to-service communication by name
- Network isolation
- Easy debugging and monitoring

### Health Checks

Each service includes health checks to ensure:
- Proper startup sequencing
- Service availability monitoring
- Automatic restart on failures

## 🛠️ Development

### NPM Scripts Reference

This project provides comprehensive npm scripts for managing the entire application stack:

#### Main Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start all services in production mode |
| `npm stop` | Stop all services |
| `npm restart` | Restart all services |
| `npm run dev` | Start all services in development mode with hot reload |
| `npm run logs` | View logs from all services |
| `npm run build` | Build all Docker images |
| `npm run clean` | Stop services and remove volumes |
| `npm test` | Run all tests |
| `npm run health` | Check health of all services |

#### Docker Compose Commands

| Command | Description |
|---------|-------------|
| `npm run docker:start` | Start services with docker-compose |
| `npm run docker:stop` | Stop services |
| `npm run docker:restart` | Restart services |
| `npm run docker:logs` | View all logs |
| `npm run docker:build` | Build all images |
| `npm run docker:build:nocache` | Build without cache |
| `npm run docker:clean` | Stop and remove volumes |
| `npm run docker:ps` | List running containers |
| `npm run docker:dev` | Start in development mode |

#### Service-Specific Log Commands

| Command | Description |
|---------|-------------|
| `npm run logs:producer` | View Kafka Producer API logs |
| `npm run logs:consumer` | View Kafka Consumer Service logs |
| `npm run logs:function` | View Azure Function App logs |
| `npm run logs:publisher` | View Service Bus Publisher logs |
| `npm run logs:kafka` | View Kafka broker logs |
| `npm run logs:azurite` | View Azurite emulator logs |

#### Package-Specific Test Commands

| Command | Description |
|---------|-------------|
| `npm run test:producer` | Run Kafka Producer API tests |
| `npm run test:consumer` | Run Kafka Consumer Service tests |
| `npm run test:function` | Run Azure Function App tests |
| `npm run test:publisher` | Run Service Bus Publisher tests |

### Development Workflows

#### Workflow 1: Initial Setup

```bash
# 1. Run automated setup
node scripts/setup.js

# 2. Start services in development mode
npm run dev

# 3. Check health
npm run health

# 4. View logs
npm run logs
```

#### Workflow 2: Making Changes

```bash
# 1. Start dev mode (with hot reload)
npm run dev

# 2. Make code changes in packages/*/src

# 3. Watch specific service logs
npm run logs:producer

# 4. Test your changes
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{"eventType":"test","data":{}}'
```

#### Workflow 3: Testing

```bash
# Run all tests
npm test

# Or test specific packages
npm run test:producer
npm run test:consumer
npm run test:function
npm run test:publisher
```

#### Workflow 4: Debugging

```bash
# View logs for specific service
npm run logs:producer

# Check service health
npm run health

# Restart specific service
docker-compose restart kafka-producer-api

# View all running containers
npm run docker:ps
```

### Local Development Without Docker

Each package can be run independently for development:

1. **Start infrastructure** (Kafka, Azurite):
   ```bash
   docker-compose up -d kafka zookeeper kafka-init azurite
   ```

2. **Run individual services:**

   ```bash
   # Kafka Producer API
   cd packages/kafka-producer-api
   npm install
   npm run dev

   # Kafka Consumer Service
   cd packages/kafka-consumer-service
   npm install
   npm run dev

   # Azure Function App
   cd packages/azure-function-app
   npm install
   npm run build
   npm start

   # Service Bus Publisher
   cd packages/servicebus-publisher
   npm install
   npm run dev
   ```

### Development vs Production Mode

**Development Mode** (`npm run dev`):
- Uses `docker-compose.dev.yml`
- Source directories mounted as volumes
- Hot reload enabled (nodemon)
- Debug logging enabled
- Instant code updates without rebuilding

**Production Mode** (`npm start`):
- Uses `docker-compose.yml`
- Code bundled in container images
- Optimized for performance
- Requires rebuild for code changes

## ☁️ Cloud Deployment

The application can be deployed to cloud platforms using the provided configurations:

### Kubernetes Deployment

Deploy to any Kubernetes cluster (AKS, EKS, GKE, or local):

```bash
# Deploy all services
./k8s/deploy.sh

# Access via port-forward
kubectl port-forward -n demo-app svc/kafka-producer-api 3001:3001
```

**Features:**
- ✓ Namespace isolation
- ✓ ConfigMaps and Secrets management
- ✓ Health checks and readiness probes
- ✓ Resource limits and requests
- ✓ Ingress for HTTP routing
- ✓ Horizontal scaling support

**Documentation:** [k8s/README.md](k8s/README.md)

### Azure Deployment

Deploy to Azure using Bicep templates:

```bash
# Deploy infrastructure
./azure/scripts/deploy.sh dev eastus

# Build and push images to ACR
# (See azure/README.md for complete instructions)
```

**Azure Resources Created:**
- ✓ Container Registry (ACR)
- ✓ Service Bus with queue
- ✓ Azure Function App
- ✓ Container Instances
- ✓ Application Insights
- ✓ Storage Account

**Features:**
- ✓ Infrastructure as Code (Bicep)
- ✓ Multi-environment support (dev, prod)
- ✓ CI/CD with GitHub Actions
- ✓ Monitoring and logging
- ✓ Automated deployments

**Documentation:** [azure/README.md](azure/README.md)

### Deployment Options Comparison

| Feature | Docker Compose | Kubernetes | Azure |
|---------|---------------|------------|-------|
| **Use Case** | Local development | Production clusters | Cloud-native apps |
| **Scalability** | Limited | High | High |
| **Cost** | Free | Cluster costs | Pay-per-use |
| **Complexity** | Low | Medium | Medium |
| **Setup Time** | 5 minutes | 15-30 minutes | 15-30 minutes |

## 📚 Additional Resources

### Kafka Resources
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [KafkaJS Documentation](https://kafka.js.org/)

### Azure Resources
- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Azure Service Bus Documentation](https://docs.microsoft.com/azure/service-bus-messaging/)

### Docker Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 🔧 Troubleshooting

### Kafka Services Not Starting

1. Check if ports are already in use:
   ```bash
   netstat -ano | findstr :9092
   ```

2. View Kafka logs:
   ```bash
   docker-compose logs kafka
   ```

3. Restart Kafka services:
   ```bash
   docker-compose restart zookeeper kafka
   ```

### Consumer Not Receiving Messages

1. Verify Kafka topic exists:
   ```bash
   docker exec synapse-kafka kafka-topics --list --bootstrap-server localhost:9092
   ```

2. Check consumer group status:
   ```bash
   docker exec synapse-kafka kafka-consumer-groups --describe --group consumer-group-1 --bootstrap-server localhost:9092
   ```

### Azure Functions Not Working

1. Ensure Azurite is running:
   ```bash
   docker-compose ps azurite
   ```

2. Check Azure Function logs:
   ```bash
   docker-compose logs -f azure-function-app
   ```

3. For Service Bus trigger, verify connection string in `.env`

### Port Conflicts

If ports are already in use, you can modify them in `docker-compose.yml`:

```yaml
ports:
  - "3001:3001"  # Change first number (host port)
```

## 📄 License

MIT

## 🤝 Contributing

This is a demo application for learning purposes. Feel free to fork and experiment!

## 📞 Support

For issues and questions, please refer to individual package README files or create an issue in the repository.
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
#   S y n a p s e D e m o 
 
 #   S y n a p s e D e m o 
 
 #   S y n a p s e D e m o 
 
 