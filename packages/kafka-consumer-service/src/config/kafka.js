const { Kafka, logLevel } = require('kafkajs');
const logger = require('../logger');

class KafkaConsumerClient {
  constructor() {
    this.kafka = null;
    this.consumer = null;
    this.isConnected = false;
    this.isRunning = false;
  }

  async initialize() {
    try {
      const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
      const groupId = process.env.KAFKA_GROUP_ID || 'consumer-group-1';

      this.kafka = new Kafka({
        clientId: 'kafka-consumer-service',
        brokers: brokers,
        logLevel: logLevel.ERROR,
        retry: {
          initialRetryTime: 100,
          retries: 8
        },
        connectionTimeout: 10000,
        requestTimeout: 30000
      });

      this.consumer = this.kafka.consumer({
        groupId: groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxWaitTimeInMs: 100,
        retry: {
          retries: 5
        }
      });

      // Event handlers for connection management
      this.consumer.on(this.consumer.events.CONNECT, () => {
        this.isConnected = true;
        logger.info('Kafka consumer connected');
      });

      this.consumer.on(this.consumer.events.DISCONNECT, () => {
        this.isConnected = false;
        logger.warn('Kafka consumer disconnected');
      });

      this.consumer.on(this.consumer.events.CRASH, ({ error, groupId }) => {
        this.isConnected = false;
        logger.error('Kafka consumer crashed', { error: error.message, groupId });
      });

      await this.consumer.connect();
      this.isConnected = true;
      logger.info(`Kafka consumer initialized with group: ${groupId}`);
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to initialize Kafka consumer:', error);
      throw error;
    }
  }

  async subscribe() {
    try {
      const topic = process.env.KAFKA_TOPIC || 'demo-events';
      const fromBeginning = process.env.KAFKA_FROM_BEGINNING === 'true';

      await this.consumer.subscribe({
        topic: topic,
        fromBeginning: fromBeginning
      });

      logger.info(`Subscribed to topic: ${topic}`, { fromBeginning });
    } catch (error) {
      logger.error('Failed to subscribe to topic:', error);
      throw error;
    }
  }

  async run(messageHandler) {
    try {
      this.isRunning = true;

      await this.consumer.run({
        autoCommit: true,
        autoCommitInterval: 5000,
        eachMessage: async ({ topic, partition, message }) => {
          try {
            logger.debug('Received message', {
              topic,
              partition,
              offset: message.offset
            });

            await messageHandler.handleMessage(message);
          } catch (error) {
            logger.error('Error processing message', {
              topic,
              partition,
              offset: message.offset,
              error: error.message
            });
            // Don't throw - let the consumer continue
          }
        }
      });

      logger.info('Kafka consumer running and waiting for messages...');
    } catch (error) {
      this.isRunning = false;
      logger.error('Failed to run Kafka consumer:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.consumer && this.isConnected) {
      this.isRunning = false;
      await this.consumer.disconnect();
      this.isConnected = false;
      logger.info('Kafka consumer disconnected');
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  isConsumerRunning() {
    return this.isRunning;
  }
}

module.exports = KafkaConsumerClient;
