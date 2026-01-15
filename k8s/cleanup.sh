#!/bin/bash

# Kubernetes Cleanup Script for Synapse Demo
# This script removes all deployed resources

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Synapse Demo - Kubernetes Cleanup${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Confirm deletion
echo -e "${RED}WARNING: This will delete all resources in the 'demo-app' namespace${NC}"
echo -n "Are you sure you want to continue? (yes/no): "
read -r confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Deleting namespace and all resources...${NC}"
kubectl delete namespace demo-app

echo ""
echo -e "${GREEN}✓ Cleanup complete!${NC}"
echo ""
