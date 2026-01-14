// App Service Plan Module
@description('The name of the App Service Plan')
param name string

@description('The location for the App Service Plan')
param location string

@description('The SKU of the App Service Plan')
param sku string = 'Y1'

var isConsumption = sku == 'Y1'

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: name
  location: location
  sku: {
    name: sku
    tier: isConsumption ? 'Dynamic' : 'ElasticPremium'
  }
  properties: {
    reserved: true  // Linux
  }
}

output planId string = appServicePlan.id
output planName string = appServicePlan.name
