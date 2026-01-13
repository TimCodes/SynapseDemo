const { ServiceBusClient } = require('@azure/service-bus');
const logger = require('./logger');

class ServiceBusPublisher {
  constructor() {
    this.client = null;
    this.sender = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
      const queueName = process.env.SERVICE_BUS_QUEUE_NAME || 'demo-queue';

      if (!connectionString) {
        throw new Error('SERVICE_BUS_CONNECTION_STRING environment variable is required');
      }

      // Create Service Bus client
      this.client = new ServiceBusClient(connectionString, {
        retryOptions: {
          maxRetries: 3,
          retryDelayInMs: 1000,
          maxRetryDelayInMs: 10000
        }
      });

      // Create sender for the queue
      this.sender = this.client.createSender(queueName);
      this.isConnected = true;

      logger.info('Service Bus publisher initialized successfully', {
        queue: queueName
      });
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to initialize Service Bus publisher:', error);
      throw error;
    }
  }

  async sendMessage(message, properties = {}) {
    if (!this.isConnected) {
      throw new Error('Service Bus publisher is not connected');
    }

    try {
      const messageBody = typeof message === 'string' ? message : JSON.stringify(message);
      
      const serviceBusMessage = {
        body: messageBody,
        contentType: 'application/json',
        applicationProperties: properties,
        messageId: this.generateMessageId()
      };

      await this.sender.sendMessages(serviceBusMessage);

      logger.info('Message sent to Service Bus', {
        messageId: serviceBusMessage.messageId,
        bodyLength: messageBody.length,
        properties: properties
      });

      return {
        messageId: serviceBusMessage.messageId,
        queue: process.env.SERVICE_BUS_QUEUE_NAME || 'demo-queue'
      };
    } catch (error) {
      logger.error('Failed to send message to Service Bus:', error);
      throw error;
    }
  }

  async sendBatch(messages) {
    if (!this.isConnected) {
      throw new Error('Service Bus publisher is not connected');
    }

    try {
      const batch = await this.sender.createMessageBatch();
      const results = [];

      for (const message of messages) {
        const messageBody = typeof message === 'string' ? message : JSON.stringify(message);
        const messageId = this.generateMessageId();

        const serviceBusMessage = {
          body: messageBody,
          contentType: 'application/json',
          messageId: messageId
        };

        const added = batch.tryAddMessage(serviceBusMessage);
        if (!added) {
          logger.warn('Message too large for batch, sending batch and creating new one');
          await this.sender.sendMessages(batch);
          batch.clear();
          batch.tryAddMessage(serviceBusMessage);
        }

        results.push({ messageId });
      }

      if (batch.count > 0) {
        await this.sender.sendMessages(batch);
      }

      logger.info('Message batch sent to Service Bus', {
        messageCount: messages.length
      });

      return results;
    } catch (error) {
      logger.error('Failed to send message batch to Service Bus:', error);
      throw error;
    }
  }

  generateMessageId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async disconnect() {
    if (this.sender) {
      await this.sender.close();
      logger.info('Service Bus sender closed');
    }

    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      logger.info('Service Bus client disconnected');
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  async testConnection() {
    try {
      if (!this.isConnected) {
        return false;
      }
      // Service Bus doesn't have a ping method, so we check if the sender exists
      return this.sender !== null;
    } catch (error) {
      logger.error('Connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
const serviceBusPublisher = new ServiceBusPublisher();

module.exports = serviceBusPublisher;
