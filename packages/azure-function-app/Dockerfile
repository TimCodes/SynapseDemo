# Build stage
FROM mcr.microsoft.com/azure-functions/node:4-node18 AS builder

WORKDIR /home/site/wwwroot

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM mcr.microsoft.com/azure-functions/node:4-node18

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

WORKDIR /home/site/wwwroot

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy compiled JavaScript from builder
COPY --from=builder /home/site/wwwroot/dist ./dist

# Copy function configurations
COPY host.json ./
COPY http-trigger/function.json ./http-trigger/
COPY servicebus-trigger/function.json ./servicebus-trigger/

# The base image already exposes port 80
EXPOSE 80

# Azure Functions runtime will start automatically
