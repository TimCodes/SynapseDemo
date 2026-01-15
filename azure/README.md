# Azure Deployment

This directory contains Azure deployment configurations for the Synapse Demo application using Bicep templates and deployment scripts.

**Note:** This deployment focuses on Azure-native services only (Function App, Service Bus). Kafka-related services (kafka-producer-api, kafka-consumer-service, servicebus-publisher) are deployed to Kubernetes separately (see `k8s/` directory).

## 📋 Prerequisites

- **Azure CLI** installed and configured
- **Azure subscription** with appropriate permissions
- **Node.js 18+** (for Azure Functions deployment)
- **Azure Functions Core Tools** (for deploying function code)

## 🏗️ Architecture

The Azure deployment creates the following resources:

### Core Infrastructure
- **Resource Group** - Container for all resources
- **Storage Account** - For Azure Functions runtime
- **Service Bus Namespace** - Message queue service
  - Queue: `demo-queue`

### Compute Resources
- **Azure Function App** - Serverless functions with HTTP and Service Bus triggers
- **App Service Plan** - Hosting plan for Azure Functions (Consumption or Premium)

### Monitoring & Observability
- **Log Analytics Workspace** - Centralized logging
- **Application Insights** - Application performance monitoring

**Note:** Container Registry and Container Instances are NOT included. All containerized services (Kafka producer, consumer, Service Bus publisher) run in Kubernetes.

## 📁 Directory Structure

```
azure/
├── bicep/
│   ├── main.bicep                      # Main Bicep template
│   ├── parameters.dev.json             # Development environment parameters
│   ├── parameters.prod.json            # Production environment parameters
│   └── modules/
│       ├── service-bus.bicep           # Service Bus module
│       ├── storage-account.bicep       # Storage Account module
│       ├── log-analytics.bicep         # Log Analytics module
│       ├── app-insights.bicep          # Application Insights module
│       ├── app-service-plan.bicep      # App Service Plan module
│       └── function-app.bicep          # Azure Function App module
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

**Note**: Initial deployment takes 5-10 minutes.

### Step 3: Deploy Azure Function App Code

```bash
# Get Function App name from deployment outputs
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

**Note:** Kafka-related services (kafka-producer-api, kafka-consumer-service, servicebus-publisher) are deployed to Kubernetes using the manifests in the `k8s/` directory.

## 🔧 Configuration

### Environment Parameters

Parameters are defined in `parameters.{env}.json` files:

**Development (`parameters.dev.json`):**
- Service Bus: Standard SKU
- Function App: Consumption plan (Y1)

**Production (`parameters.prod.json`):**
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

In your GitHub repository, add this secret:
- `AZURE_CREDENTIALS` - Output from service principal creation

3. **Trigger Workflow:**

```bash
# Automatic on push to main branch
git push origin main

# Manual trigger via GitHub UI or:
gh workflow run azure-deploy.yml -f environment=dev
```

**Note:** The CI/CD workflow currently deploys Azure Function App only. For Kubernetes services, use the k8s deployment workflow or deploy manually using `kubectl`.

### Workflow Steps

The GitHub Actions workflow (`.github/workflows/azure-deploy.yml`) deploys the Azure Function App code to the already-provisioned Function App resource.

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
- Use Standard SKU for Service Bus
- Delete resources when not in use

### Production Environment
- Consider Reserved Instances for predictable workloads
- Monitor with Azure Cost Management

**Estimated Monthly Costs:**
- **Development**: $10-30/month (Function App + Service Bus + Storage)
- **Production**: $50-150/month (depends on usage and premium tiers)

**Note:** Kubernetes cluster costs are separate and depend on your cluster provider (AKS, EKS, GKE, on-prem).

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

For AKS deployment of the Kubernetes services, use the manifests in the `k8s/` directory:

```bash
# Create AKS cluster
az aks create \
  --resource-group synapse-demo-dev-rg \
  --name synapse-aks \
  --node-count 3 \
  --enable-managed-identity

# Get credentials
az aks get-credentials \
  --resource-group synapse-demo-dev-rg \
  --name synapse-aks

# Deploy Kubernetes services (kafka-producer-api, kafka-consumer-service, servicebus-publisher)
kubectl apply -f k8s/
```

**Note:** You'll need to build and push your container images to a container registry (Docker Hub, ACR, etc.) and update the image references in the k8s manifests.

## ✅ Validation

After deployment, validate:

1. ✓ All resources created in Azure Portal
2. ✓ Function App is running
3. ✓ Service Bus queue exists
4. ✓ Application Insights receiving telemetry
5. ✓ Function App HTTP endpoint accessible

```bash
# Quick validation script
az resource list --resource-group synapse-demo-dev-rg --output table

# Test Function App
FUNCTION_URL=$(az deployment group show \
  --resource-group synapse-demo-dev-rg \
  --name <deployment-name> \
  --query properties.outputs.functionAppUrl.value -o tsv)

curl $FUNCTION_URL/api/process
```

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.
