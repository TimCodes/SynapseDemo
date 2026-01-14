// Service Bus Module
@description('The name of the Service Bus namespace')
param namespaceName string

@description('The location for the Service Bus')
param location string

@description('The SKU of the Service Bus')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param sku string = 'Standard'

@description('The name of the queue')
param queueName string

resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: namespaceName
  location: location
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    minimumTlsVersion: '1.2'
  }
}

resource serviceBusQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: queueName
  properties: {
    lockDuration: 'PT1M'
    maxSizeInMegabytes: 1024
    requiresDuplicateDetection: false
    requiresSession: false
    defaultMessageTimeToLive: 'P14D'
    deadLetteringOnMessageExpiration: false
    enableBatchedOperations: true
    maxDeliveryCount: 10
  }
}

// Get connection string
var endpoint = '${serviceBusNamespace.id}/AuthorizationRules/RootManageSharedAccessKey'
var connectionString = listKeys(endpoint, serviceBusNamespace.apiVersion).primaryConnectionString

output namespaceName string = serviceBusNamespace.name
output queueName string = serviceBusQueue.name
output connectionString string = connectionString
output serviceBusId string = serviceBusNamespace.id
