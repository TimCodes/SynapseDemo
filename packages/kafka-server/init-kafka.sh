#!/bin/bash

# Kafka Topic Initialization Script
# This script creates the demo-events topic and sets up consumer groups

echo "Waiting for Kafka to be ready..."
sleep 10

echo "Creating demo-events topic..."
kafka-topics --create \
  --topic demo-events \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1 \
  --if-not-exists

echo "Verifying topic creation..."
kafka-topics --describe \
  --topic demo-events \
  --bootstrap-server localhost:9092

echo "Topic initialization complete!"
