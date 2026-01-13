const Router = require('koa-router');
const Joi = require('joi');
const kafkaProducer = require('../config/kafka');
const logger = require('../logger');

const router = new Router();

// Validation schema for POST /events
const eventSchema = Joi.object({
  eventType: Joi.string().required().min(1).max(100),
  data: Joi.object().required()
});

// GET /health - Health check endpoint
router.get('/health', async (ctx) => {
  const kafkaConnected = kafkaProducer.getConnectionStatus();
  
  ctx.status = kafkaConnected ? 200 : 503;
  ctx.body = {
    status: kafkaConnected ? 'healthy' : 'unhealthy',
    kafka: kafkaConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  };
});

// POST /events - Publish event to Kafka
router.post('/events', async (ctx) => {
  try {
    // Validate request body
    const { error, value } = eventSchema.validate(ctx.request.body);
    
    if (error) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      };
      return;
    }

    // Send message to Kafka
    const topic = process.env.KAFKA_TOPIC || 'demo-events';
    const result = await kafkaProducer.sendMessage(topic, value);

    logger.info('Event published successfully', {
      eventType: value.eventType,
      partition: result.partition,
      offset: result.offset
    });

    ctx.status = 200;
    ctx.body = {
      success: true,
      messageId: `${result.partition}-${result.offset}`,
      partition: result.partition,
      offset: result.offset,
      topic: topic
    };
  } catch (error) {
    logger.error('Error publishing event:', error);
    
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Failed to publish event',
      message: error.message
    };
  }
});

module.exports = router;
