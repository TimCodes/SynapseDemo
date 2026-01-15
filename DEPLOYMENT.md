# Deployment Guide

This guide provides step-by-step instructions for deploying the Synapse Demo application to both Azure and Kubernetes.

## 📋 Overview

The application uses a **hybrid deployment strategy**:

- **Azure**: Azure Function App, Service Bus, Monitoring (Application Insights, Log Analytics)
- **Kubernetes**: Kafka Producer API, Kafka Consumer Service, Service Bus Publisher

This separation keeps Azure-native serverless services in Azure while containerized microservices run in Kubernetes.

## 🎯 Deployment Options

### Option 1: Full Deployment (Azure + Kubernetes)
Deploy both Azure infrastructure and Kubernetes services for a complete setup.

### Option 2: Azure Only
Deploy only Azure Function App and Service Bus for serverless messaging.

### Option 3: Kubernetes Only
Deploy containerized services to Kubernetes (requires existing Service Bus connection string).

---

## 🚀 Full Deployment (Recommended)

### Prerequisites

**For Azure:**
- Azure CLI installed
- Azure subscription with contributor access
- Node.js 18+
- Azure Functions Core Tools

**For Kubernetes:**
- Kubernetes cluster (Docker Desktop, Minikube, AKS, EKS, GKE, etc.)
- kubectl configured
- Docker installed
- Container registry access (Docker Hub, ACR, etc.)

### Step 1: Deploy Azure Infrastructure

1. **Login to Azure:**
   ```bash
   az login
   az account set --subscription "Your Subscription Name"
   ```

2. **Deploy Azure resources:**
   ```bash
   cd /path/to/SynapseDemo
   ./azure/scripts/deploy.sh dev eastus
   ```

   This creates:
   - Service Bus namespace with `demo-queue`
   - Azure Function App
   - Storage Account
   - Application Insights
   - Log Analytics Workspace

   **⏱️ Time: ~5-10 minutes**

3. **Note the outputs:**
   ```
   Service Bus Namespace: synapse-demo-sb-dev-xxxxx
   Function App Name: synapse-demo-func-dev
   Function App URL: https://synapse-demo-func-dev.azurewebsites.net
   ```

4. **Deploy Function App code:**
   ```bash
   cd packages/azure-function-app
   npm install
   npm run build
   func azure functionapp publish synapse-demo-func-dev
   ```

   **⏱️ Time: ~2-3 minutes**

5. **Get Service Bus connection string (for Kubernetes):**
   ```bash
   az servicebus namespace authorization-rule keys list \
     --resource-group synapse-demo-dev-rg \
     --namespace-name synapse-demo-sb-dev-xxxxx \
     --name RootManageSharedAccessKey \
     --query primaryConnectionString -o tsv
   ```

   **Save this connection string** - you'll need it for Kubernetes deployment.

### Step 2: Deploy Kubernetes Services

1. **Build Docker images:**
   ```bash
   cd /path/to/SynapseDemo
   
   # Build images
   docker build -t <your-registry>/kafka-producer-api:latest ./packages/kafka-producer-api
   docker build -t <your-registry>/kafka-consumer-service:latest ./packages/kafka-consumer-service
   docker build -t <your-registry>/servicebus-publisher:latest ./packages/servicebus-publisher
   
   # Push to registry
   docker push <your-registry>/kafka-producer-api:latest
   docker push <your-registry>/kafka-consumer-service:latest
   docker push <your-registry>/servicebus-publisher:latest
   ```

   Replace `<your-registry>` with your Docker Hub username or container registry URL (e.g., `myregistry.azurecr.io`).

   **⏱️ Time: ~5-10 minutes**

2. **Update Kubernetes manifests:**

   Edit the following files to use your registry:
   - `k8s/kafka-producer-api.yaml` (line 22)
   - `k8s/kafka-consumer-service.yaml` (line 22)
   - `k8s/servicebus-publisher.yaml` (line 22)

   Change:
   ```yaml
   image: <your-registry>/kafka-producer-api:latest
   ```

3. **Configure secrets:**

   Edit `k8s/secret.yaml` and add the Service Bus connection string from Step 1.5:
   ```yaml
   stringData:
     SERVICE_BUS_CONNECTION_STRING: "Endpoint=sb://synapse-demo-sb-dev-xxxxx.servicebus.windows.net/..."
   ```

4. **Deploy to Kubernetes:**
   ```bash
   ./k8s/deploy.sh
   ```

   Or manually:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secret.yaml
   kubectl apply -f k8s/kafka-producer-api.yaml
   kubectl apply -f k8s/kafka-consumer-service.yaml
   kubectl apply -f k8s/servicebus-publisher.yaml
   kubectl apply -f k8s/ingress.yaml  # Optional
   ```

   **⏱️ Time: ~2-3 minutes**

5. **Verify deployment:**
   ```bash
   kubectl get pods -n demo-app
   kubectl get svc -n demo-app
   ```

   All pods should be in `Running` state.

### Step 3: Test the Deployment

1. **Port forward services (for local testing):**
   ```bash
   kubectl port-forward -n demo-app svc/kafka-producer-api 3001:3001 &
   kubectl port-forward -n demo-app svc/kafka-consumer-service 3002:3002 &
   kubectl port-forward -n demo-app svc/servicebus-publisher 3003:3003 &
   ```

2. **Test Kafka Producer API:**
   ```bash
   curl -X POST http://localhost:3001/events \
     -H "Content-Type: application/json" \
     -d '{"eventType":"test.event","data":{"message":"Hello from Kubernetes!"}}'
   ```

3. **Check Consumer logs:**
   ```bash
   kubectl logs -n demo-app -l app=kafka-consumer-service -f
   ```

4. **Test Azure Function App:**
   ```bash
   curl https://synapse-demo-func-dev.azurewebsites.net/api/process
   ```

5. **Test Service Bus Publisher:**
   ```bash
   curl -X POST http://localhost:3003/messages \
     -H "Content-Type: application/json" \
     -d '{"message":"Hello Azure Service Bus!"}'
   ```

   Check Azure Function logs:
   ```bash
   az webapp log tail --name synapse-demo-func-dev --resource-group synapse-demo-dev-rg
   ```

---

## 🔄 Azure Only Deployment

If you only want to deploy Azure services:

```bash
# Deploy infrastructure
./azure/scripts/deploy.sh dev eastus

# Deploy Function App code
cd packages/azure-function-app
npm install
npm run build
func azure functionapp publish <function-app-name>
```

**Test:**
```bash
curl https://<function-app-name>.azurewebsites.net/api/process
```

See [azure/README.md](azure/README.md) for detailed Azure deployment documentation.

---

## ☸️ Kubernetes Only Deployment

If you already have Azure Service Bus and just want to deploy Kubernetes services:

1. **Ensure you have a Service Bus connection string**

2. **Build and push images** (see Step 2.1 above)

3. **Update manifests** (see Step 2.2 above)

4. **Configure secrets** (see Step 2.3 above)

5. **Deploy:**
   ```bash
   ./k8s/deploy.sh
   ```

See [k8s/README.md](k8s/README.md) for detailed Kubernetes deployment documentation.

---

## 🧹 Cleanup

### Azure Cleanup

```bash
./azure/scripts/cleanup.sh dev
```

Or manually:
```bash
az group delete --name synapse-demo-dev-rg --yes --no-wait
```

### Kubernetes Cleanup

```bash
./k8s/cleanup.sh
```

Or manually:
```bash
kubectl delete namespace demo-app
```

---

## 🔧 Troubleshooting

### Azure Function not receiving Service Bus messages

1. Check Service Bus connection string in Azure Portal
2. Verify queue name is `demo-queue`
3. Check Function App logs:
   ```bash
   az webapp log tail --name <function-app-name> --resource-group synapse-demo-dev-rg
   ```

### Kubernetes pods not starting

1. Check pod status:
   ```bash
   kubectl describe pod -n demo-app <pod-name>
   ```

2. Check image pull errors:
   ```bash
   kubectl get events -n demo-app --sort-by='.lastTimestamp'
   ```

3. Verify Service Bus connection string in secret:
   ```bash
   kubectl get secret -n demo-app synapse-secrets -o yaml
   ```

### Services not communicating

1. Check service endpoints:
   ```bash
   kubectl get endpoints -n demo-app
   ```

2. Test internal connectivity:
   ```bash
   kubectl run -it --rm debug --image=busybox --restart=Never -n demo-app -- sh
   # Inside pod:
   wget -O- http://kafka-producer-api:3001/health
   ```

---

## 📚 Additional Resources

- **Kubernetes Deployment Details**: [k8s/README.md](k8s/README.md)
- **Azure Deployment Details**: [azure/README.md](azure/README.md)
- **Architecture Overview**: [README.md](README.md)
- **Epic 6 Completion**: [EPIC-6-COMPLETE.md](EPIC-6-COMPLETE.md)

---

## 💡 Quick Reference

### Common Commands

**Azure:**
```bash
# Check deployment status
az deployment group list --resource-group synapse-demo-dev-rg --output table

# View Function App logs
az webapp log tail --name <function-app-name> --resource-group synapse-demo-dev-rg

# Get Service Bus connection string
az servicebus namespace authorization-rule keys list \
  --resource-group synapse-demo-dev-rg \
  --namespace-name <namespace-name> \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv
```

**Kubernetes:**
```bash
# Check pod status
kubectl get pods -n demo-app

# View logs
kubectl logs -n demo-app -l app=kafka-producer-api -f

# Port forward
kubectl port-forward -n demo-app svc/kafka-producer-api 3001:3001

# Restart deployment
kubectl rollout restart deployment/kafka-producer-api -n demo-app
```

### Deployment Time Estimates

| Task | Time |
|------|------|
| Azure infrastructure deployment | 5-10 min |
| Function App code deployment | 2-3 min |
| Docker image build & push | 5-10 min |
| Kubernetes deployment | 2-3 min |
| **Total (full deployment)** | **15-25 min** |

### Cost Estimates

| Environment | Azure (monthly) | Kubernetes (monthly) |
|-------------|-----------------|----------------------|
| Development | $10-30 | Free (local) or cluster costs |
| Production | $50-150 | Cluster costs vary |

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Azure Function App is running
- [ ] Service Bus queue exists
- [ ] All Kubernetes pods are in `Running` state
- [ ] Can send message to Kafka Producer API
- [ ] Kafka Consumer processes messages
- [ ] Can send message to Service Bus Publisher
- [ ] Azure Function receives and processes Service Bus messages
- [ ] Application Insights shows telemetry data

---

**For detailed deployment options and advanced configurations, refer to the individual README files in the `azure/` and `k8s/` directories.**
