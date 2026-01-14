# Azure Service Bus Emulator

Local emulator for Azure Service Bus for development and testing.

## Overview

This package configures the Azure Service Bus emulator container for local development. The emulator allows you to develop and test Service Bus applications locally without connecting to Azure.

## Documentation

- [Test locally with Service Bus Emulator](https://learn.microsoft.com/en-us/azure/service-bus-messaging/test-locally-with-service-bus-emulator?tabs=docker-linux-container)

## Configuration

The emulator is configured with:
- Default namespace: `sbemulatorns`
- Connection string is automatically generated and available to connected services

## Usage

The emulator is automatically started with the docker-compose setup. No additional configuration is needed.
