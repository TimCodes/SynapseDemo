# Azure Function App

A serverless Azure Functions application with HTTP and Service Bus triggers built with TypeScript. This package demonstrates cloud-native serverless patterns, event-driven architecture, and Azure Service Bus integration.

## Features

- **HTTP Trigger Function**: REST API endpoint at `/api/process` with GET and POST support
- **Service Bus Trigger Function**: Event-driven message processing from Azure Service Bus queue
- **TypeScript**: Strongly-typed functions with full IntelliSense support
- **Azure Functions v4**: Latest Azure Functions runtime
- **Logging**: Comprehensive logging with Application Insights integration
- **Error Handling**: Retry policies and error handling for resilience
- **Dockerized**: Container deployment support
- **Local Development**: Azurite support for local testing

## Prerequisites

- Node.js 18 or higher
- Azure Functions Core Tools v4 (for local development)
- Azure subscription (for cloud deployment)
- Azure Service Bus namespace (for Service Bus trigger)
- Azurite (optional, for local storage emulation)

### Install Azure Functions Core Tools

**Windows (via npm):**
```powershell
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

**Or via Chocolatey:**
```powershell
choco install azure-functions-core-tools-4
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build TypeScript:
```bash
npm run build
```

3. Configure local settings:
   - Copy `local.settings.json` and update with your Azure Service Bus connection string
   - For local development, you can use "UseDevelopmentStorage=true" for `AzureWebJobsStorage`

## Local Development

### Start the Function App

```bash
npm start
```

Or with auto-rebuild:
```bash
npm run watch
```

In a separate terminal:
```bash
func start
```

The functions will be available at:
- HTTP Trigger: `http://localhost:7071/api/process`
- Admin endpoint: `http://localhost:7071/admin/functions`

### Configuration

Update `local.settings.json` with your settings:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "ServiceBusConnection": "Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"
  }
}
```

**Important:** Never commit `local.settings.json` with real credentials to version control!

## Functions

### 1. HTTP Trigger (`/api/process`)

REST API endpoint that accepts GET and POST requests.

**GET Request:**
```bash
curl http://localhost:7071/api/process
```

**Response:**
```json
{
  "message": "Azure Function HTTP trigger is working!",
  "method": "GET",
  "timestamp": "2026-01-13T10:30:00.000Z",
  "functionName": "http-trigger"
}
```

**POST Request:**
```bash
curl -X POST http://localhost:7071/api/process \
  -H "Content-Type: application/json" \
  -d '{"data": "test message", "type": "demo"}'
```

**PowerShell:**
```powershell
$body = @{
    data = "test message"
    type = "demo"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:7071/api/process `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Response:**
```json
{
  "message": "Data received and processed successfully",
  "method": "POST",
  "receivedData": {
    "data": "test message",
    "type": "demo"
  },
  "timestamp": "2026-01-13T10:30:00.000Z",
  "functionName": "http-trigger"
}
```

### 2. Service Bus Trigger (`demo-queue`)

Automatically processes messages from the Azure Service Bus queue named "demo-queue".

**Message Format:**
The function accepts any message format (JSON or text). JSON messages will be parsed automatically.

**Example JSON Message:**
```json
{
  "type": "order.created",
  "orderId": "12345",
  "customerId": "67890",
  "timestamp": "2026-01-13T10:30:00.000Z"
}
```

**Logged Metadata:**
- Message ID
- Enqueued time (UTC)
- Delivery count
- Sequence number

**Processing Behavior:**
- Parses JSON messages automatically
- Logs message content and metadata
- Retries on failure (configured in `host.json`)
- Moves to dead-letter queue after max retries

## Project Structure

```
azure-function-app/
├── http-trigger/
│   ├── function.json          # HTTP trigger configuration
│   └── index.ts               # HTTP trigger implementation
├── servicebus-trigger/
│   ├── function.json          # Service Bus trigger configuration
│   └── index.ts               # Service Bus trigger implementation
├── dist/                      # Compiled JavaScript (generated)
├── host.json                  # Function app configuration
├── local.settings.json        # Local development settings
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## Configuration Files

### host.json

Global configuration for the function app:
- Logging settings
- Application Insights sampling
- Extension bundle version
- Function timeout (5 minutes)
- Retry policy (3 retries with 5-second delay)

### local.settings.json

Local development settings:
- `AzureWebJobsStorage`: Storage account connection string
- `FUNCTIONS_WORKER_RUNTIME`: Set to "node"
- `ServiceBusConnection`: Azure Service Bus connection string

## Docker

### Build Image

```bash
docker build -t azure-function-app .
```

### Run Container

```bash
docker run -p 8080:80 \
  -e AzureWebJobsStorage="UseDevelopmentStorage=true" \
  -e ServiceBusConnection="your-connection-string" \
  azure-function-app
```

The HTTP trigger will be available at:
```
http://localhost:8080/api/process
```

### Multi-Stage Build

The Dockerfile uses a multi-stage build:
1. **Builder stage**: Compiles TypeScript to JavaScript
2. **Production stage**: Copies only compiled code and production dependencies

This results in a smaller, optimized container image.

## Azure Deployment

### Option 1: Deploy via Azure CLI

1. **Create a Function App:**
```bash
az functionapp create \
  --resource-group your-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name your-function-app-name \
  --storage-account your-storage-account
```

2. **Configure Service Bus Connection:**
```bash
az functionapp config appsettings set \
  --name your-function-app-name \
  --resource-group your-rg \
  --settings ServiceBusConnection="your-connection-string"
```

3. **Deploy:**
```bash
func azure functionapp publish your-function-app-name
```

### Option 2: Deploy Container to Azure

```bash
# Build and tag image
docker build -t yourregistry.azurecr.io/azure-function-app:latest .

# Push to Azure Container Registry
docker push yourregistry.azurecr.io/azure-function-app:latest

# Create Function App from container
az functionapp create \
  --name your-function-app-name \
  --resource-group your-rg \
  --storage-account your-storage-account \
  --plan your-app-service-plan \
  --deployment-container-image-name yourregistry.azurecr.io/azure-function-app:latest \
  --functions-version 4
```

### Option 3: VS Code Extension

1. Install "Azure Functions" extension in VS Code
2. Sign in to Azure
3. Right-click on the function app folder
4. Select "Deploy to Function App..."
5. Follow the prompts

## Azure Service Bus Setup

### Create Service Bus Namespace and Queue

**Via Azure Portal:**
1. Create a Service Bus namespace
2. Create a queue named "demo-queue"
3. Get the connection string from "Shared access policies"

**Via Azure CLI:**
```bash
# Create namespace
az servicebus namespace create \
  --name your-namespace \
  --resource-group your-rg \
  --location eastus

# Create queue
az servicebus queue create \
  --name demo-queue \
  --namespace-name your-namespace \
  --resource-group your-rg

# Get connection string
az servicebus namespace authorization-rule keys list \
  --namespace-name your-namespace \
  --resource-group your-rg \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv
```

## Testing

### Test HTTP Trigger

**Local:**
```bash
curl http://localhost:7071/api/process
```

**Azure:**
```bash
curl https://your-function-app-name.azurewebsites.net/api/process
```

### Test Service Bus Trigger

Use the `servicebus-publisher` package (Story 3.2) to send messages to the queue, or use Azure Portal's Service Bus Explorer.

**Via Azure Portal:**
1. Navigate to your Service Bus queue
2. Click "Service Bus Explorer"
3. Send a test message

**Via Azure CLI:**
```bash
az servicebus queue message send \
  --namespace-name your-namespace \
  --queue-name demo-queue \
  --body '{"type":"test","message":"Hello from CLI"}'
```

Watch the function logs to see the message being processed.

## Monitoring

### View Logs Locally

Logs appear in the terminal when running `func start`.

### View Logs in Azure

**Via Azure Portal:**
1. Navigate to your Function App
2. Click "Functions" → Select your function
3. Click "Monitor"
4. View execution logs and Application Insights

**Via Azure CLI:**
```bash
# Stream logs
az webapp log tail \
  --name your-function-app-name \
  --resource-group your-rg
```

### Application Insights

The function app integrates with Application Insights for:
- Performance monitoring
- Exception tracking
- Custom telemetry
- Dependency tracking
- Live metrics

Configure in Azure Portal or via ARM template.

## Error Handling

### HTTP Trigger
- Returns 500 with error details on exceptions
- Logs errors to Application Insights

### Service Bus Trigger
- Retries on failure (3 times with 5-second delay)
- Moves to dead-letter queue after max retries
- Logs all errors with stack traces

### Retry Policy

Configured in `host.json`:
```json
{
  "retry": {
    "strategy": "fixedDelay",
    "maxRetryCount": 3,
    "delayInterval": "00:00:05"
  }
}
```

## Development

### Adding New Functions

1. Create a new folder (e.g., `my-function`)
2. Add `function.json` with binding configuration
3. Create `index.ts` with function implementation
4. Build and test

### TypeScript Compilation

The project uses TypeScript for type safety:
- Source files: `*/index.ts`
- Compiled output: `dist/*/index.js`
- Configuration: `tsconfig.json`

Build TypeScript:
```bash
npm run build
```

Watch mode (auto-rebuild):
```bash
npm run watch
```

## Troubleshooting

### Function not starting locally

1. Ensure Azure Functions Core Tools is installed: `func --version`
2. Build TypeScript: `npm run build`
3. Check `local.settings.json` is configured
4. Verify Node.js version: `node --version` (should be 18+)

### Service Bus trigger not firing

1. Verify connection string in `local.settings.json`
2. Check queue name matches ("demo-queue")
3. Ensure messages are in the queue
4. Check function app logs for errors

### TypeScript errors

1. Install dependencies: `npm install`
2. Clean and rebuild: `rm -rf dist && npm run build`
3. Check `tsconfig.json` configuration

### Docker container not starting

1. Build locally first: `docker build -t azure-function-app .`
2. Check environment variables are set
3. View container logs: `docker logs <container-id>`

## Performance Considerations

- **HTTP Trigger**: Stateless, scales automatically based on load
- **Service Bus Trigger**: Scales based on queue length
- **Timeout**: Default 5 minutes (configured in `host.json`)
- **Memory**: Adjust based on function complexity
- **Concurrency**: Service Bus can process multiple messages in parallel

## Security

- **Authentication**: HTTP trigger uses anonymous auth (change in production!)
- **Connection Strings**: Store in Azure Key Vault or App Settings
- **CORS**: Configure in `host.json` for production
- **Managed Identity**: Use for Service Bus authentication in production

## Best Practices

1. **Use Managed Identity** instead of connection strings in production
2. **Enable Application Insights** for monitoring and diagnostics
3. **Implement proper error handling** and logging
4. **Use environment-specific settings** (dev, staging, prod)
5. **Configure retry policies** for resilience
6. **Monitor queue depth** for Service Bus triggers
7. **Set appropriate timeout values** based on processing time

## License

MIT
