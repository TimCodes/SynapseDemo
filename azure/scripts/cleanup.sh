#!/bin/bash

# Azure Cleanup Script for Synapse Demo
# This script removes all Azure resources

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Synapse Demo - Azure Cleanup${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    exit 1
fi

# Parameters
ENVIRONMENT=${1:-dev}
RESOURCE_GROUP="synapse-demo-${ENVIRONMENT}-rg"

echo -e "${YELLOW}Target Resource Group: ${RESOURCE_GROUP}${NC}"
echo ""

# Check if resource group exists
if ! az group exists --name "$RESOURCE_GROUP" | grep -q true; then
    echo -e "${YELLOW}Resource group does not exist. Nothing to clean up.${NC}"
    exit 0
fi

# List resources
echo -e "${YELLOW}Resources in ${RESOURCE_GROUP}:${NC}"
az resource list --resource-group "$RESOURCE_GROUP" --output table
echo ""

# Confirm deletion
echo -e "${RED}WARNING: This will permanently delete all resources in ${RESOURCE_GROUP}${NC}"
echo -n "Are you sure you want to continue? (yes/no): "
read -r confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Deleting resource group and all resources...${NC}"
echo "This may take several minutes..."

az group delete \
    --name "$RESOURCE_GROUP" \
    --yes \
    --no-wait

echo ""
echo -e "${GREEN}✓ Cleanup initiated!${NC}"
echo "Resources are being deleted in the background."
echo ""
echo "To check deletion status:"
echo "  az group exists --name ${RESOURCE_GROUP}"
echo ""
