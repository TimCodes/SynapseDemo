# Azure Deployment

This directory contains Azure deployment configurations for the Synapse Demo application using Bicep templates and deployment scripts.

## 📋 Prerequisites

- **Azure CLI** installed and configured
- **Azure subscription** with appropriate permissions
- **Docker** installed (for building and pushing images)
- **Node.js 18+** (for Azure Functions deployment)
- **Azure Functions Core Tools** (optional, for local testing)

## 🏗️ Architecture

The Azure deployment creates the following resources:

### Core Infrastructure
- **Resource Group** - Container for all resources
- **Container Registry (ACR)** - Private Docker registry
- **Storage Account** - For Azure Functions and application data
- **Service Bus Namespace** - Message queue service
  - Queue: `demo-queue`

### Compute Resources
- **Azure Function App** - Serverless functions with HTTP and Service Bus triggers
- **App Service Plan** - Hosting plan for Azure Functions
- **Container Instances** (Optional) - For kafka-producer-api and servicebus-publisher

### Monitoring & Observability
- **Log Analytics Workspace** - Centralized logging
- **Application Insights** - Application performance monitoring

## 📁 Directory Structure

```
azure/
├── bicep/
│   ├── main.bicep                      # Main Bicep template
│   ├── parameters.dev.json             # Development environment parameters
│   ├── parameters.prod.json            # Production environment parameters
│   └── modules/
│       ├── container-registry.bicep    # ACR module
│       ├── service-bus.bicep           # Service Bus module
│       ├── storage-account.bicep       # Storage Account module
│       ├── log-analytics.bicep         # Log Analytics module
│       ├── app-insights.bicep          # Application Insights module
│       ├── app-service-plan.bicep      # App Service Plan module
│       ├── function-app.bicep          # Azure Function App module
│       └── container-instances.bicep   # Container Instances module
├── scripts/
│   ├── deploy.sh                       # Deployment script
│   └── cleanup.sh                      # Cleanup script
└── README.md                           # This file
```

## 🚀 Deployment

### Step 1: Login to Azure

```bash
az login

# Set your subscription (if you have multiple)
az account set --subscription "Your Subscription Name"
```

### Step 2: Deploy Infrastructure

Deploy to **development** environment:

```bash
./azure/scripts/deploy.sh dev eastus
```

Deploy to **production** environment:

```bash
./azure/scripts/deploy.sh prod eastus
```

The script will:
1. Create a resource group
2. Validate the Bicep template
3. Deploy all Azure resources
4. Display deployment outputs

**Note**: Initial deployment takes 10-15 minutes.

### Step 3: Build and Push Docker Images

After infrastructure deployment, build and push container images:

```bash
# Get ACR credentials
ACR_NAME=$(az deployment group show \
  --resource-group synapse-demo-dev-rg \
  --name <deployment-name> \
  --query properties.outputs.containerRegistryName.value -o tsv)

ACR_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)

# Login to ACR
az acr login --name $ACR_NAME

# Build and push images
docker build -t $ACR_SERVER/kafka-producer-api:latest ./packages/kafka-producer-api
docker push $ACR_SERVER/kafka-producer-api:latest

docker build -t $ACR_SERVER/kafka-consumer-service:latest ./packages/kafka-consumer-service
docker push $ACR_SERVER/kafka-consumer-service:latest

docker build -t $ACR_SERVER/azure-function-app:latest ./packages/azure-function-app
docker push $ACR_SERVER/azure-function-app:latest

docker build -t $ACR_SERVER/servicebus-publisher:latest ./packages/servicebus-publisher
docker push $ACR_SERVER/servicebus-publisher:latest
```

### Step 4: Deploy Azure Function App

```bash
# Get Function App name
FUNCTION_APP_NAME=$(az deployment group show \
  --resource-group synapse-demo-dev-rg \
  --name <deployment-name> \
  --query properties.outputs.functionAppName.value -o tsv)

# Deploy function code
cd packages/azure-function-app
npm install
npm run build
func azure functionapp publish $FUNCTION_APP_NAME
```

## 🔧 Configuration

### Environment Parameters

Parameters are defined in `parameters.{env}.json` files:

**Development (`parameters.dev.json`):**
- Container Registry: Basic SKU
- Service Bus: Standard SKU
- Function App: Consumption plan (Y1)

**Production (`parameters.prod.json`):**
- Container Registry: Standard SKU
- Service Bus: Premium SKU
- Function App: Elastic Premium plan (EP1)

### Customizing Deployment

Edit parameter files or override during deployment:

```bash
az deployment group create \
  --resource-group synapse-demo-dev-rg \
  --template-file azure/bicep/main.bicep \
  --parameters azure/bicep/parameters.dev.json \
  --parameters location=westus baseName=my-custom-name
```

## 📊 Monitoring

### View Application Insights

```bash
# Get Application Insights details
az deployment group show \
  --resource-group synapse-demo-dev-rg \
  --name <deployment-name> \
  --query properties.outputs.appInsightsName.value
```

Access Application Insights in Azure Portal for:
- Request tracking
- Performance metrics
- Dependency mapping
- Live metrics

### View Logs

```bash
# Function App logs
az webapp log tail --name $FUNCTION_APP_NAME --resource-group synapse-demo-dev-rg

# Container Instance logs
az container logs --resource-group synapse-demo-dev-rg --name <container-name>
```

## 🧪 Testing

### Test Azure Function HTTP Trigger

```bash
# Get Function App URL
FUNCTION_URL=$(az deployment group show \
  --resource-group synapse-demo-dev-rg \
  --name <deployment-name> \
  --query properties.outputs.functionAppUrl.value -o tsv)

# Test HTTP endpoint
curl $FUNCTION_URL/api/process
```

### Test Service Bus Integration

1. Get Service Bus connection string:

```bash
SERVICE_BUS_NAMESPACE=$(az deployment group show \
  --resource-group synapse-demo-dev-rg \
  --name <deployment-name> \
  --query properties.outputs.serviceBusNamespace.value -o tsv)

az servicebus namespace authorization-rule keys list \
  --resource-group synapse-demo-dev-rg \
  --namespace-name $SERVICE_BUS_NAMESPACE \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv
```

2. Send a message using servicebus-publisher API or Azure Portal

3. Check Function App logs to see message processing

## 🔄 CI/CD with GitHub Actions

### Setup

1. **Create Azure Service Principal:**

```bash
az ad sp create-for-rbac --name "synapse-demo-github" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/synapse-demo-dev-rg \
  --sdk-auth
```

2. **Add GitHub Secrets:**

In your GitHub repository, add these secrets:
- `AZURE_CREDENTIALS` - Output from service principal creation
- `ACR_USERNAME` - Container Registry username
- `ACR_PASSWORD` - Container Registry password

3. **Trigger Workflow:**

```bash
# Automatic on push to main branch
git push origin main

# Manual trigger via GitHub UI or:
gh workflow run azure-deploy.yml -f environment=dev
```

### Workflow Steps

The GitHub Actions workflow (`.github/workflows/azure-deploy.yml`):
1. Builds all Docker images
2. Pushes images to Azure Container Registry
3. Deploys Azure Function App
4. Restarts Container Instances to pull latest images

## 🗑️ Cleanup

### Using Script

```bash
# Delete development environment
./azure/scripts/cleanup.sh dev

# Delete production environment
./azure/scripts/cleanup.sh prod
```

### Manual Cleanup

```bash
# Delete entire resource group
az group delete --name synapse-demo-dev-rg --yes --no-wait
```

## 💰 Cost Optimization

### Development Environment
- Use Consumption plan for Functions (pay per execution)
- Use Basic SKU for Container Registry
- Use Standard SKU for Service Bus
- Delete resources when not in use

### Production Environment
- Consider Reserved Instances for predictable workloads
- Use autoscaling for Container Instances
- Monitor with Azure Cost Management

**Estimated Monthly Costs:**
- **Development**: $20-50/month
- **Production**: $100-300/month (depends on usage)

## 🔒 Security Best Practices

1. **Managed Identities**: Use for service-to-service authentication
2. **Key Vault**: Store secrets in Azure Key Vault (not implemented in this demo)
3. **Network Security**: Use Virtual Networks and Private Endpoints in production
4. **RBAC**: Implement role-based access control
5. **TLS**: Enforce HTTPS/TLS 1.2+ for all services
6. **Monitoring**: Enable Azure Security Center

## 🆘 Troubleshooting

### Deployment Fails

```bash
# View deployment logs
az deployment group show \
  --resource-group synapse-demo-dev-rg \
  --name <deployment-name>

# View deployment operations
az deployment operation group list \
  --resource-group synapse-demo-dev-rg \
  --name <deployment-name>
```

### Container Registry Access Issues

```bash
# Enable admin user (if needed)
az acr update --name $ACR_NAME --admin-enabled true

# Get credentials
az acr credential show --name $ACR_NAME
```

### Function App Not Working

```bash
# Check function app settings
az functionapp config appsettings list \
  --name $FUNCTION_APP_NAME \
  --resource-group synapse-demo-dev-rg

# Restart function app
az functionapp restart \
  --name $FUNCTION_APP_NAME \
  --resource-group synapse-demo-dev-rg
```

### Service Bus Connection Issues

```bash
# Verify queue exists
az servicebus queue show \
  --resource-group synapse-demo-dev-rg \
  --namespace-name $SERVICE_BUS_NAMESPACE \
  --name demo-queue

# Check messages in queue
az servicebus queue show \
  --resource-group synapse-demo-dev-rg \
  --namespace-name $SERVICE_BUS_NAMESPACE \
  --name demo-queue \
  --query "countDetails"
```

## 📚 Additional Resources

- [Azure Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Azure Service Bus Documentation](https://docs.microsoft.com/azure/service-bus-messaging/)
- [Azure Container Registry Documentation](https://docs.microsoft.com/azure/container-registry/)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/)

## 🌐 Alternative Deployments

### Azure Kubernetes Service (AKS)

For AKS deployment, use the Kubernetes manifests in the `k8s/` directory:

```bash
# Create AKS cluster
az aks create \
  --resource-group synapse-demo-dev-rg \
  --name synapse-aks \
  --node-count 3 \
  --enable-managed-identity \
  --attach-acr $ACR_NAME

# Get credentials
az aks get-credentials \
  --resource-group synapse-demo-dev-rg \
  --name synapse-aks

# Deploy using kubectl
kubectl apply -f k8s/
```

### Azure App Service

Deploy individual services as App Service web apps:

```bash
az appservice plan create \
  --name synapse-app-plan \
  --resource-group synapse-demo-dev-rg \
  --is-linux

az webapp create \
  --name synapse-kafka-producer \
  --resource-group synapse-demo-dev-rg \
  --plan synapse-app-plan \
  --deployment-container-image-name $ACR_SERVER/kafka-producer-api:latest
```

## ✅ Validation

After deployment, validate:

1. ✓ All resources created in Azure Portal
2. ✓ Container Registry contains images
3. ✓ Function App is running
4. ✓ Service Bus queue exists
5. ✓ Application Insights receiving telemetry
6. ✓ HTTP endpoints accessible

```bash
# Quick validation script
az resource list --resource-group synapse-demo-dev-rg --output table
```

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.
