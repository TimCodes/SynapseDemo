// Log Analytics Workspace Module
@description('The name of the Log Analytics Workspace')
param name string

@description('The location for the Log Analytics Workspace')
param location string

@description('SKU name')
param sku string = 'PerGB2018'

@description('Data retention in days')
param retentionInDays int = 30

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: name
  location: location
  properties: {
    sku: {
      name: sku
    }
    retentionInDays: retentionInDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

output workspaceId string = logAnalyticsWorkspace.id
output customerId string = logAnalyticsWorkspace.properties.customerId
output workspaceName string = logAnalyticsWorkspace.name
