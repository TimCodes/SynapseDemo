// Container Registry Module
@description('The name of the Container Registry')
param name string

@description('The location for the Container Registry')
param location string

@description('The SKU of the Container Registry')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param sku string = 'Basic'

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: name
  location: location
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
    networkRuleBypassOptions: 'AzureServices'
  }
}

output registryName string = containerRegistry.name
output registryServer string = containerRegistry.properties.loginServer
output registryId string = containerRegistry.id
