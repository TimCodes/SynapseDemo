// Container Instances Module
@description('The base name for resources')
param baseName string

@description('The environment name')
param environment string

@description('The location for the Container Instances')
param location string

@description('The Container Registry name')
param containerRegistryName string

@description('The Container Registry server')
param containerRegistryServer string

// Get Container Registry credentials
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' existing = {
  name: containerRegistryName
}

var registryUsername = containerRegistry.listCredentials().username
var registryPassword = containerRegistry.listCredentials().passwords[0].value

// Kafka Producer API Container Instance
resource kafkaProducerContainer 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: '${baseName}-kafka-producer-${environment}'
  location: location
  properties: {
    containers: [
      {
        name: 'kafka-producer-api'
        properties: {
          image: '${containerRegistryServer}/kafka-producer-api:latest'
          ports: [
            {
              port: 3001
              protocol: 'TCP'
            }
          ]
          environmentVariables: [
            {
              name: 'PORT'
              value: '3001'
            }
            {
              name: 'KAFKA_BROKERS'
              value: 'kafka-service:9092'  // This should point to your Kafka service
            }
            {
              name: 'KAFKA_TOPIC'
              value: 'demo-events'
            }
            {
              name: 'LOG_LEVEL'
              value: 'info'
            }
          ]
          resources: {
            requests: {
              cpu: 1
              memoryInGB: 1
            }
          }
        }
      }
    ]
    osType: 'Linux'
    restartPolicy: 'Always'
    ipAddress: {
      type: 'Public'
      ports: [
        {
          port: 3001
          protocol: 'TCP'
        }
      ]
      dnsNameLabel: '${baseName}-kafka-producer-${environment}'
    }
    imageRegistryCredentials: [
      {
        server: containerRegistryServer
        username: registryUsername
        password: registryPassword
      }
    ]
  }
}

// Service Bus Publisher Container Instance
resource serviceBusPublisherContainer 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: '${baseName}-servicebus-publisher-${environment}'
  location: location
  properties: {
    containers: [
      {
        name: 'servicebus-publisher'
        properties: {
          image: '${containerRegistryServer}/servicebus-publisher:latest'
          ports: [
            {
              port: 3003
              protocol: 'TCP'
            }
          ]
          environmentVariables: [
            {
              name: 'PORT'
              value: '3003'
            }
            {
              name: 'LOG_LEVEL'
              value: 'info'
            }
          ]
          resources: {
            requests: {
              cpu: 1
              memoryInGB: 1
            }
          }
        }
      }
    ]
    osType: 'Linux'
    restartPolicy: 'Always'
    ipAddress: {
      type: 'Public'
      ports: [
        {
          port: 3003
          protocol: 'TCP'
        }
      ]
      dnsNameLabel: '${baseName}-servicebus-publisher-${environment}'
    }
    imageRegistryCredentials: [
      {
        server: containerRegistryServer
        username: registryUsername
        password: registryPassword
      }
    ]
  }
}

output kafkaProducerFqdn string = kafkaProducerContainer.properties.ipAddress.fqdn
output serviceBusPublisherFqdn string = serviceBusPublisherContainer.properties.ipAddress.fqdn
