# Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the Synapse Demo application to a Kubernetes cluster.

## 📋 Prerequisites

- **Kubernetes cluster** (Docker Desktop, Minikube, AKS, EKS, GKE, etc.)
- **kubectl** CLI tool installed and configured
- **Docker images** built and pushed to a container registry
- **NGINX Ingress Controller** (optional, for ingress)

## 🏗️ Architecture

The Kubernetes deployment includes:

- **Namespace**: `demo-app` - Isolated namespace for all resources
- **ConfigMap**: `synapse-config` - Non-sensitive configuration
- **Secret**: `synapse-secrets` - Sensitive credentials (Azure Service Bus)
- **3 Deployments**: One for each microservice
- **3 Services**: ClusterIP services for internal communication
- **1 Ingress**: HTTP routing for external access (optional)

### Services Deployed

| Service | Replicas | Port | Type |
|---------|----------|------|------|
| kafka-producer-api | 2 | 3001 | ClusterIP |
| kafka-consumer-service | 1 | 3002 | ClusterIP |
| servicebus-publisher | 2 | 3003 | ClusterIP |

**Note:** Azure Function App is deployed to Azure separately (see `azure/` directory), not to Kubernetes.

## 📦 Resource Requirements

Each service has defined resource requests and limits:

**kafka-producer-api & servicebus-publisher:**
- Requests: 128Mi memory, 100m CPU
- Limits: 256Mi memory, 500m CPU

**kafka-consumer-service:**
- Requests: 128Mi memory, 100m CPU
- Limits: 256Mi memory, 500m CPU

## 🚀 Deployment

### Step 1: Build and Push Docker Images

Build all images and push to your container registry:

```bash
# Build images
docker build -t <your-registry>/kafka-producer-api:latest ./packages/kafka-producer-api
docker build -t <your-registry>/kafka-consumer-service:latest ./packages/kafka-consumer-service
docker build -t <your-registry>/servicebus-publisher:latest ./packages/servicebus-publisher

# Push images
docker push <your-registry>/kafka-producer-api:latest
docker push <your-registry>/kafka-consumer-service:latest
docker push <your-registry>/servicebus-publisher:latest
```

### Step 2: Update Image References

Update the image references in the deployment files to point to your registry:

- `kafka-producer-api.yaml`
- `kafka-consumer-service.yaml`
- `servicebus-publisher.yaml`

Replace `<your-registry>` with your actual container registry (e.g., `myregistry.azurecr.io`).

### Step 3: Configure Secrets

Edit `secret.yaml` and update with your actual Azure credentials:

```yaml
stringData:
  SERVICE_BUS_CONNECTION_STRING: "Endpoint=sb://your-namespace.servicebus.windows.net/..."
```

**⚠️ Security Note**: Never commit actual secrets to version control. Use sealed-secrets, external secret managers (Azure Key Vault, AWS Secrets Manager), or CI/CD pipeline secrets instead.

**Note:** Azure Storage configuration is not needed in Kubernetes deployment as Azure Functions run in Azure.

### Step 4: Deploy to Kubernetes

Use the automated deployment script:

```bash
./k8s/deploy.sh
```

Or deploy manually:

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create ConfigMap and Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy services
kubectl apply -f k8s/kafka-producer-api.yaml
kubectl apply -f k8s/kafka-consumer-service.yaml
kubectl apply -f k8s/servicebus-publisher.yaml

# Deploy Ingress (optional)
kubectl apply -f k8s/ingress.yaml
```

### Step 5: Verify Deployment

Check deployment status:

```bash
# View all resources
kubectl get all -n demo-app

# Check pod status
kubectl get pods -n demo-app

# View service endpoints
kubectl get svc -n demo-app

# Check ingress
kubectl get ingress -n demo-app
```

Wait for all pods to be in `Running` state:

```bash
kubectl wait --for=condition=available --timeout=300s deployment --all -n demo-app
```

## 🔍 Accessing Services

### Option 1: Port Forwarding (Recommended for Testing)

Forward local ports to cluster services:

```bash
# Kafka Producer API
kubectl port-forward -n demo-app svc/kafka-producer-api 3001:3001

# Kafka Consumer Service
kubectl port-forward -n demo-app svc/kafka-consumer-service 3002:3002

# Service Bus Publisher
kubectl port-forward -n demo-app svc/servicebus-publisher 3003:3003
```

Then access services at:
- http://localhost:3001 (Kafka Producer)
- http://localhost:3002/health (Kafka Consumer)
- http://localhost:3003 (Service Bus Publisher)

**Note:** Azure Function App is deployed to Azure (see `azure/` directory) and accessed via its Azure URL.

### Option 2: Ingress (Production)

If NGINX Ingress Controller is installed, access services via ingress:

```bash
# Get ingress IP/hostname
kubectl get ingress -n demo-app synapse-ingress
```

Access services at:
- http://demo.local/api/producer
- http://demo.local/api/consumer
- http://demo.local/api/servicebus
- http://demo.local/api/servicebus

**Note**: Update your `/etc/hosts` file or DNS to point `demo.local` to the ingress IP.

### Option 3: LoadBalancer Services

For cloud providers, you can change service type to `LoadBalancer`:

```yaml
spec:
  type: LoadBalancer  # Change from ClusterIP
```

This will provision external load balancers (costs may apply).

## 🧪 Testing

Test the Kafka flow:

```bash
# Forward ports
kubectl port-forward -n demo-app svc/kafka-producer-api 3001:3001 &
kubectl port-forward -n demo-app svc/kafka-consumer-service 3002:3002 &

# Publish a message
curl -X POST http://localhost:3001/events \
  -H "Content-Type: application/json" \
  -d '{"eventType":"test","data":{"message":"Hello Kubernetes!"}}'

# Check consumer logs
kubectl logs -n demo-app -l app=kafka-consumer-service -f
```

## 📊 Monitoring and Debugging

### View Logs

```bash
# All pods in namespace
kubectl logs -n demo-app --all-containers=true -f

# Specific service
kubectl logs -n demo-app -l app=kafka-producer-api -f

# Specific pod
kubectl logs -n demo-app <pod-name> -f
```

### Describe Resources

```bash
# Describe deployment
kubectl describe deployment -n demo-app kafka-producer-api

# Describe pod
kubectl describe pod -n demo-app <pod-name>

# Describe service
kubectl describe svc -n demo-app kafka-producer-api
```

### Execute Commands in Pods

```bash
# Get a shell
kubectl exec -it -n demo-app <pod-name> -- /bin/sh

# Run a command
kubectl exec -n demo-app <pod-name> -- env
```

### Health Checks

Check if pods are healthy:

```bash
# Port forward and check health endpoints
kubectl port-forward -n demo-app svc/kafka-producer-api 3001:3001
curl http://localhost:3001/health
```

## 🔧 Scaling

Scale deployments up or down:

```bash
# Scale kafka-producer-api to 3 replicas
kubectl scale deployment -n demo-app kafka-producer-api --replicas=3

# Scale back to 2 replicas
kubectl scale deployment -n demo-app kafka-producer-api --replicas=2
```

## 🔄 Updates and Rollouts

### Update Image

```bash
# Update image tag
kubectl set image deployment/kafka-producer-api \
  kafka-producer-api=<your-registry>/kafka-producer-api:v2.0 \
  -n demo-app

# Check rollout status
kubectl rollout status deployment/kafka-producer-api -n demo-app
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/kafka-producer-api -n demo-app

# Rollback to specific revision
kubectl rollout undo deployment/kafka-producer-api --to-revision=2 -n demo-app
```

### View Rollout History

```bash
kubectl rollout history deployment/kafka-producer-api -n demo-app
```

## 🗑️ Cleanup

### Using Script

```bash
./k8s/cleanup.sh
```

### Manual Cleanup

Delete all resources:

```bash
# Delete entire namespace (removes all resources)
kubectl delete namespace demo-app
```

Or delete individual resources:

```bash
kubectl delete -f k8s/kafka-producer-api.yaml
kubectl delete -f k8s/kafka-consumer-service.yaml
kubectl delete -f k8s/servicebus-publisher.yaml
kubectl delete -f k8s/ingress.yaml
kubectl delete -f k8s/configmap.yaml
kubectl delete -f k8s/secret.yaml
kubectl delete -f k8s/namespace.yaml
```

## 🔒 Security Best Practices

1. **Never commit secrets**: Use sealed-secrets or external secret managers
2. **Use RBAC**: Define proper roles and service accounts
3. **Network policies**: Implement network segmentation
4. **Resource limits**: Always define resource requests and limits
5. **Image scanning**: Scan images for vulnerabilities before deployment
6. **Pod Security**: Use Pod Security Policies or Pod Security Standards
7. **Private registry**: Store images in a private container registry

## 📁 Files

- `namespace.yaml` - Namespace definition
- `configmap.yaml` - Non-sensitive configuration
- `secret.yaml` - Sensitive credentials (template)
- `kafka-producer-api.yaml` - Kafka Producer API deployment and service
- `kafka-consumer-service.yaml` - Kafka Consumer Service deployment and service
- `servicebus-publisher.yaml` - Service Bus Publisher deployment and service
- `ingress.yaml` - Ingress configuration for HTTP routing
- `deploy.sh` - Automated deployment script
- `cleanup.sh` - Cleanup script
- `README.md` - This file

**Note:** Azure Function App deployment is in the `azure/` directory.

## 🌐 Cloud-Specific Notes

### Azure Kubernetes Service (AKS)

```bash
# Connect to AKS cluster
az aks get-credentials --resource-group <rg-name> --name <cluster-name>

# Use Azure Container Registry
az acr login --name <registry-name>
```

### Amazon EKS

```bash
# Connect to EKS cluster
aws eks update-kubeconfig --region <region> --name <cluster-name>

# Use ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
```

### Google Kubernetes Engine (GKE)

```bash
# Connect to GKE cluster
gcloud container clusters get-credentials <cluster-name> --zone <zone> --project <project-id>

# Use GCR
gcloud auth configure-docker
```

## 🆘 Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n demo-app

# View events
kubectl get events -n demo-app --sort-by='.lastTimestamp'

# Describe pod
kubectl describe pod -n demo-app <pod-name>
```

### Image Pull Errors

- Verify image name and tag
- Check registry credentials
- Ensure imagePullSecrets are configured if using private registry

### Service Not Accessible

- Check service endpoints: `kubectl get endpoints -n demo-app`
- Verify pod labels match service selector
- Check network policies

### Out of Resources

- Check node resources: `kubectl top nodes`
- Adjust resource requests/limits
- Scale down or add more nodes

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
