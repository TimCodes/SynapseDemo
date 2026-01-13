#!/bin/bash

# Kafka Health Check Script
# Verifies that Kafka is ready to accept connections

echo "Checking Kafka health..."

# Try to list topics (this will fail if Kafka is not ready)
kafka-topics --list --bootstrap-server localhost:9092 > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✓ Kafka is healthy and ready"
  exit 0
else
  echo "✗ Kafka is not ready"
  exit 1
fi
