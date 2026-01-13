const { Kafka, logLevel } = require('kafkajs');
const logger = require('./logger');

class KafkaProducer {
  constructor() {
    this.kafka = null;
    this.producer = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
      
      this.kafka = new Kafka({
        clientId: 'kafka-producer-api',
        brokers: brokers,
        logLevel: logLevel.ERROR,
        retry: {
          initialRetryTime: 100,
          retries: 8
        }
      });

      this.producer = this.kafka.producer({
        allowAutoTopicCreation: false,
        transactionTimeout: 30000
      });

      await this.producer.connect();
      this.isConnected = true;
      logger.info('Kafka producer connected successfully');
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  async sendMessage(topic, message) {
    if (!this.isConnected) {
      throw new Error('Kafka producer is not connected');
    }

    try {
      const result = await this.producer.send({
        topic: topic,
        messages: [
          {
            key: message.eventType || null,
            value: JSON.stringify(message),
            timestamp: Date.now().toString()
          }
        ]
      });

      logger.info(`Message sent to topic ${topic}`, { 
        partition: result[0].partition,
        offset: result[0].offset 
      });

      return result[0];
    } catch (error) {
      logger.error('Failed to send message to Kafka:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.producer && this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('Kafka producer disconnected');
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Singleton instance
const kafkaProducer = new KafkaProducer();

module.exports = kafkaProducer;
