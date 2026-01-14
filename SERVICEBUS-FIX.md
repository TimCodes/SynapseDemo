# Azure Service Bus Emulator - SQL Authentication Fix

## Issue
The Azure Service Bus Emulator was failing to start due to SQL Server authentication errors:
```
Login failed for user 'sa'. Reason: Password did not match that for the login provided.
```

Additionally, there was a configuration validation error:
```
Expected time to be less than or equal to 1h because Max DefaultMessageTimeToLive supported 1h, but found 14d.
```

## Root Causes
1. **Missing SQL Connection String**: The Service Bus emulator requires the `Config__SqlConnectionString` environment variable to be properly set with the complete connection string format.
2. **Invalid TTL Configuration**: The emulator only supports a maximum DefaultMessageTimeToLive of 1 hour (PT1H), but the configuration had 14 days (P14D).

## Solutions Applied

### 1. Updated `docker-compose.dev.yml`
Added the properly formatted SQL connection string environment variable:

```yaml
environment:
  ACCEPT_EULA: "Y"
  SERVICEBUS_LOGGING_LEVEL: "Information"
  SQL_SERVER: "sql-server"
  MSSQL_SA_PASSWORD: "Pass@word123"
  Config__SqlConnectionString: "Data Source=sql-server,1433;User Id=sa;Password=Pass@word123;Initial Catalog=master;Encrypt=false;TrustServerCertificate=true;"
```

**Key Points**:
- Environment variable name: `Config__SqlConnectionString` (double underscore)
- Format: Standard ADO.NET connection string
- Include `Encrypt=false` and `TrustServerCertificate=true` for local development
- Must match the SQL Server credentials exactly

### 2. Updated `packages/servicebus-emulator/Config.json`
Changed all `DefaultMessageTimeToLive` values from `P14D` (14 days) to `PT1H` (1 hour):

**Before**:
```json
"DefaultMessageTimeToLive": "P14D"
```

**After**:
```json
"DefaultMessageTimeToLive": "PT1H"
```

This was updated in three locations:
- Queue: `demo-queue`
- Topic: `demo-topic`
- Subscription: `demo-subscription`

## Verification
After applying the fixes:

1. The Service Bus emulator starts successfully:
   ```
   Emulator Service is Successfully Up!
   ```

2. SQL databases are created without errors:
   ```
   Creating database 'SbGatewayDatabase'
   Creating database 'SbMessageContainerDatabase00001'
   ```

3. User-defined entities are created:
   ```
   Creating queue: demo-queue
   Creating topic: demo-topic
   Creating subscription demo-subscription for topic: demo-topic
   ```

4. Connection string for applications:
   ```
   Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;
   ```

## References
- [Azure Service Bus Emulator Documentation](https://github.com/Azure/azure-service-bus-emulator-installer)
- [Microsoft Service Bus Emulator Configuration](https://aka.ms/sbResourceMgrExceptions)
- ISO 8601 Duration Format: PT1H = Period of Time, 1 Hour

## Status
✅ **RESOLVED** - The Azure Service Bus Emulator is now running successfully with proper SQL authentication.
