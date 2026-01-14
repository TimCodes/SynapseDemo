#!/bin/bash

# Kubernetes Deployment Script for Synapse Demo
# This script deploys all Kubernetes manifests to a cluster

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Synapse Demo - Kubernetes Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    echo "Please install kubectl: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

# Check if kubectl can connect to cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    echo "Please ensure your kubectl is configured correctly"
    exit 1
fi

echo -e "${GREEN}✓ kubectl is installed and configured${NC}"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
K8S_DIR="$SCRIPT_DIR"

echo -e "${YELLOW}Deploying to Kubernetes cluster...${NC}"
echo ""

# Deploy namespace first
echo -e "${YELLOW}[1/7] Creating namespace...${NC}"
kubectl apply -f "$K8S_DIR/namespace.yaml"
echo ""

# Deploy ConfigMap
echo -e "${YELLOW}[2/7] Creating ConfigMap...${NC}"
kubectl apply -f "$K8S_DIR/configmap.yaml"
echo ""

# Deploy Secrets
echo -e "${YELLOW}[3/7] Creating Secrets...${NC}"
echo -e "${YELLOW}⚠️  Warning: Make sure to update secret.yaml with actual values before deploying to production${NC}"
kubectl apply -f "$K8S_DIR/secret.yaml"
echo ""

# Deploy Services
echo -e "${YELLOW}[4/7] Deploying application services...${NC}"
kubectl apply -f "$K8S_DIR/kafka-producer-api.yaml"
kubectl apply -f "$K8S_DIR/kafka-consumer-service.yaml"
kubectl apply -f "$K8S_DIR/azure-function-app.yaml"
kubectl apply -f "$K8S_DIR/servicebus-publisher.yaml"
echo ""

# Deploy Ingress (optional)
echo -e "${YELLOW}[5/7] Creating Ingress...${NC}"
if kubectl get ingressclass nginx &> /dev/null; then
    kubectl apply -f "$K8S_DIR/ingress.yaml"
    echo -e "${GREEN}✓ Ingress created${NC}"
else
    echo -e "${YELLOW}⚠️  NGINX Ingress Controller not found. Skipping ingress deployment.${NC}"
    echo "   To install: https://kubernetes.github.io/ingress-nginx/deploy/"
fi
echo ""

# Wait for deployments to be ready
echo -e "${YELLOW}[6/7] Waiting for deployments to be ready...${NC}"
echo "This may take a few minutes..."
echo ""

kubectl wait --for=condition=available --timeout=300s \
    deployment/kafka-producer-api \
    deployment/kafka-consumer-service \
    deployment/azure-function-app \
    deployment/servicebus-publisher \
    -n demo-app

echo ""
echo -e "${GREEN}✓ All deployments are ready${NC}"
echo ""

# Display deployment status
echo -e "${YELLOW}[7/7] Deployment Status:${NC}"
echo ""
kubectl get all -n demo-app
echo ""

# Display service endpoints
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Service Endpoints:${NC}"
echo ""

# Get NodePort or LoadBalancer IPs if available
echo "To access the services, use port-forwarding:"
echo ""
echo "  kubectl port-forward -n demo-app svc/kafka-producer-api 3001:3001"
echo "  kubectl port-forward -n demo-app svc/kafka-consumer-service 3002:3002"
echo "  kubectl port-forward -n demo-app svc/azure-function-app 7071:80"
echo "  kubectl port-forward -n demo-app svc/servicebus-publisher 3003:3003"
echo ""

if kubectl get ingress -n demo-app synapse-ingress &> /dev/null; then
    echo "Or access via Ingress (if configured):"
    kubectl get ingress -n demo-app synapse-ingress
    echo ""
fi

echo -e "${YELLOW}Useful Commands:${NC}"
echo "  View pods:       kubectl get pods -n demo-app"
echo "  View services:   kubectl get svc -n demo-app"
echo "  View logs:       kubectl logs -n demo-app -l app=kafka-producer-api"
echo "  Delete all:      kubectl delete namespace demo-app"
echo ""
