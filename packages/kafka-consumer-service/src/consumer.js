require('dotenv').config();
const KafkaConsumerClient = require('./config/kafka');
const MessageHandler = require('./messageHandler');
const HealthCheckServer = require('./healthCheck');
const logger = require('./logger');

// Initialize components
const kafkaConsumer = new KafkaConsumerClient();
const messageHandler = new MessageHandler();
const healthCheckServer = new HealthCheckServer(kafkaConsumer, messageHandler);

// Graceful shutdown handler
async function shutdown(signal) {
  logger.info(`${signal} received, starting graceful shutdown...`);
  
  try {
    // Stop health check server
    await healthCheckServer.stop();
    
    // Disconnect Kafka consumer
    await kafkaConsumer.disconnect();
    
    // Log final statistics
    const stats = messageHandler.getStats();
    logger.info('Consumer shutdown complete', {
      totalMessagesProcessed: stats.messageCount,
      lastMessageAt: stats.lastMessageTime
    });
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Register signal handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection:', { reason, promise });
  shutdown('UNHANDLED_REJECTION');
});

// Start the consumer service
async function start() {
  try {
    logger.info('Starting Kafka Consumer Service...');
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Initialize Kafka consumer
    await kafkaConsumer.initialize();
    
    // Subscribe to topic
    await kafkaConsumer.subscribe();
    
    // Start health check server
    healthCheckServer.start();
    
    // Start consuming messages
    await kafkaConsumer.run(messageHandler);
    
    logger.info('Kafka Consumer Service started successfully');
    logger.info(`Health check available at: http://localhost:${process.env.HEALTH_CHECK_PORT || 3002}/health`);
    
  } catch (error) {
    logger.error('Failed to start Kafka Consumer Service:', error);
    process.exit(1);
  }
}

// Start the application
start();
