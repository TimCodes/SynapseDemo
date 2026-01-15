#!/bin/bash

# Azure Deployment Script for Synapse Demo
# This script deploys all Azure resources using Bicep templates

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Synapse Demo - Azure Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    echo "Please install Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

echo -e "${GREEN}✓ Azure CLI is installed${NC}"
echo ""

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}You are not logged in to Azure${NC}"
    echo "Please run: az login"
    exit 1
fi

echo -e "${GREEN}✓ Logged in to Azure${NC}"
echo ""

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${YELLOW}Current subscription: ${SUBSCRIPTION}${NC}"
echo ""

# Parameters
ENVIRONMENT=${1:-dev}
LOCATION=${2:-eastus}
RESOURCE_GROUP="synapse-demo-${ENVIRONMENT}-rg"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BICEP_DIR="$SCRIPT_DIR/../bicep"

echo -e "${YELLOW}Deployment Configuration:${NC}"
echo "  Environment: ${ENVIRONMENT}"
echo "  Location: ${LOCATION}"
echo "  Resource Group: ${RESOURCE_GROUP}"
echo ""

# Confirm deployment
echo -n "Do you want to proceed with deployment? (yes/no): "
read -r confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}[1/4] Creating Resource Group...${NC}"
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none

echo -e "${GREEN}✓ Resource Group created${NC}"
echo ""

echo -e "${YELLOW}[2/4] Validating Bicep template...${NC}"
az deployment group validate \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$BICEP_DIR/main.bicep" \
    --parameters "$BICEP_DIR/parameters.${ENVIRONMENT}.json" \
    --parameters location="$LOCATION" \
    --output none

echo -e "${GREEN}✓ Template validation passed${NC}"
echo ""

echo -e "${YELLOW}[3/4] Deploying Azure resources...${NC}"
echo "This may take 10-15 minutes..."
echo ""

DEPLOYMENT_NAME="synapse-demo-deployment-$(date +%Y%m%d-%H%M%S)"

az deployment group create \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$BICEP_DIR/main.bicep" \
    --parameters "$BICEP_DIR/parameters.${ENVIRONMENT}.json" \
    --parameters location="$LOCATION" \
    --output table

echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""

echo -e "${YELLOW}[4/4] Getting deployment outputs...${NC}"
echo ""

# Get deployment outputs
SERVICE_BUS_NAMESPACE=$(az deployment group show \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.outputs.serviceBusNamespace.value \
    -o tsv)

FUNCTION_APP_NAME=$(az deployment group show \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.outputs.functionAppName.value \
    -o tsv)

FUNCTION_APP_URL=$(az deployment group show \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.outputs.functionAppUrl.value \
    -o tsv)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Outputs:${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Service Bus:${NC}"
echo "  Namespace: ${SERVICE_BUS_NAMESPACE}"
echo ""
echo -e "${YELLOW}Azure Function:${NC}"
echo "  Name: ${FUNCTION_APP_NAME}"
echo "  URL: ${FUNCTION_APP_URL}"
echo ""

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "1. Deploy Azure Function code:"
echo "   cd packages/azure-function-app"
echo "   npm install"
echo "   npm run build"
echo "   func azure functionapp publish ${FUNCTION_APP_NAME}"
echo ""
echo "2. Deploy Kubernetes services (kafka-producer-api, kafka-consumer-service, servicebus-publisher):"
echo "   See k8s/README.md for Kubernetes deployment instructions"
echo ""
echo "3. Get Service Bus connection string for Kubernetes secrets:"
echo "   az servicebus namespace authorization-rule keys list \\"
echo "     --resource-group ${RESOURCE_GROUP} \\"
echo "     --namespace-name ${SERVICE_BUS_NAMESPACE} \\"
echo "     --name RootManageSharedAccessKey \\"
echo "     --query primaryConnectionString -o tsv"
echo ""
echo -e "${GREEN}Deployment complete! 🎉${NC}"
echo ""
