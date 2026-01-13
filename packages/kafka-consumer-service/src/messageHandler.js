const logger = require('./logger');

class MessageHandler {
  constructor() {
    this.messageCount = 0;
    this.lastMessageTime = null;
  }

  async handleMessage(message) {
    try {
      this.messageCount++;
      this.lastMessageTime = new Date();

      // Parse message value
      const messageValue = message.value ? message.value.toString() : null;
      let parsedData = null;

      if (messageValue) {
        try {
          parsedData = JSON.parse(messageValue);
        } catch (parseError) {
          logger.warn('Failed to parse message as JSON', {
            partition: message.partition,
            offset: message.offset,
            error: parseError.message
          });
          parsedData = messageValue;
        }
      }

      // Log message details
      logger.info('Message received', {
        partition: message.partition,
        offset: message.offset,
        timestamp: message.timestamp,
        key: message.key ? message.key.toString() : null,
        eventType: parsedData?.eventType || 'unknown',
        messageCount: this.messageCount,
        receivedAt: this.lastMessageTime.toISOString()
      });

      // Log the actual message data
      logger.debug('Message data', {
        data: parsedData
      });

      // Simulate processing (you can add actual business logic here)
      await this.processMessage(parsedData, message);

    } catch (error) {
      logger.error('Error handling message', {
        partition: message.partition,
        offset: message.offset,
        error: error.message,
        stack: error.stack
      });
      // Don't throw - let the consumer continue processing other messages
    }
  }

  async processMessage(data, message) {
    // Placeholder for actual message processing logic
    // In a real application, this would contain business logic
    logger.debug('Processing message', {
      eventType: data?.eventType,
      partition: message.partition
    });
  }

  getStats() {
    return {
      messageCount: this.messageCount,
      lastMessageTime: this.lastMessageTime,
      isProcessing: this.messageCount > 0
    };
  }

  reset() {
    this.messageCount = 0;
    this.lastMessageTime = null;
  }
}

module.exports = MessageHandler;
