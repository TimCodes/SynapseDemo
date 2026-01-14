// Main Bicep Template for Synapse Demo Application
// This template deploys all required Azure resources

@description('The environment name (e.g., dev, staging, prod)')
param environment string = 'dev'

@description('The location for all resources')
param location string = resourceGroup().location

@description('The base name for all resources')
param baseName string = 'synapse-demo'

@description('Container Registry SKU')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param acrSku string = 'Basic'

@description('Service Bus SKU')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param serviceBusSku string = 'Standard'

@description('App Service Plan SKU for Azure Functions')
@allowed([
  'Y1'  // Consumption
  'EP1' // Elastic Premium
  'EP2'
  'EP3'
])
param functionAppPlanSku string = 'Y1'

// Variables
var uniqueSuffix = uniqueString(resourceGroup().id)
var containerRegistryName = '${baseName}acr${uniqueSuffix}'
var serviceBusNamespaceName = '${baseName}-sb-${environment}-${uniqueSuffix}'
var queueName = 'demo-queue'
var storageAccountName = '${replace(baseName, '-', '')}st${uniqueSuffix}'
var appInsightsName = '${baseName}-insights-${environment}'
var logAnalyticsName = '${baseName}-logs-${environment}'
var functionAppName = '${baseName}-func-${environment}'
var appServicePlanName = '${baseName}-plan-${environment}'

// Container Registry
module containerRegistry 'modules/container-registry.bicep' = {
  name: 'containerRegistryDeployment'
  params: {
    name: containerRegistryName
    location: location
    sku: acrSku
  }
}

// Service Bus
module serviceBus 'modules/service-bus.bicep' = {
  name: 'serviceBusDeployment'
  params: {
    namespaceName: serviceBusNamespaceName
    location: location
    sku: serviceBusSku
    queueName: queueName
  }
}

// Storage Account
module storageAccount 'modules/storage-account.bicep' = {
  name: 'storageAccountDeployment'
  params: {
    name: storageAccountName
    location: location
  }
}

// Log Analytics Workspace
module logAnalytics 'modules/log-analytics.bicep' = {
  name: 'logAnalyticsDeployment'
  params: {
    name: logAnalyticsName
    location: location
  }
}

// Application Insights
module appInsights 'modules/app-insights.bicep' = {
  name: 'appInsightsDeployment'
  params: {
    name: appInsightsName
    location: location
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
  }
}

// App Service Plan
module appServicePlan 'modules/app-service-plan.bicep' = {
  name: 'appServicePlanDeployment'
  params: {
    name: appServicePlanName
    location: location
    sku: functionAppPlanSku
  }
}

// Azure Function App
module functionApp 'modules/function-app.bicep' = {
  name: 'functionAppDeployment'
  params: {
    name: functionAppName
    location: location
    appServicePlanId: appServicePlan.outputs.planId
    storageAccountName: storageAccount.outputs.storageAccountName
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
    appInsightsConnectionString: appInsights.outputs.connectionString
    serviceBusConnectionString: serviceBus.outputs.connectionString
  }
}

// Container Instances (optional - for running other services)
module containerInstances 'modules/container-instances.bicep' = {
  name: 'containerInstancesDeployment'
  params: {
    baseName: baseName
    environment: environment
    location: location
    containerRegistryName: containerRegistry.outputs.registryName
    containerRegistryServer: containerRegistry.outputs.registryServer
  }
}

// Outputs
output containerRegistryName string = containerRegistry.outputs.registryName
output containerRegistryServer string = containerRegistry.outputs.registryServer
output serviceBusNamespace string = serviceBus.outputs.namespaceName
output serviceBusConnectionString string = serviceBus.outputs.connectionString
output queueName string = serviceBus.outputs.queueName
output storageAccountName string = storageAccount.outputs.storageAccountName
output functionAppName string = functionApp.outputs.functionAppName
output functionAppUrl string = functionApp.outputs.functionAppUrl
output appInsightsName string = appInsights.outputs.appInsightsName
output appInsightsInstrumentationKey string = appInsights.outputs.instrumentationKey
