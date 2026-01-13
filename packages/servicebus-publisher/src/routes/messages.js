const Router = require('koa-router');
const Joi = require('joi');
const serviceBusPublisher = require('../config/servicebus');
const logger = require('../logger');

const router = new Router();

// Validation schema for POST /messages
const messageSchema = Joi.object({
  message: Joi.alternatives().try(
    Joi.string(),
    Joi.object()
  ).required(),
  properties: Joi.object().optional()
});

// Validation schema for POST /messages/batch
const batchSchema = Joi.object({
  messages: Joi.array().items(
    Joi.alternatives().try(
      Joi.string(),
      Joi.object()
    )
  ).min(1).max(100).required()
});

// GET /health - Health check endpoint
router.get('/health', async (ctx) => {
  const isConnected = await serviceBusPublisher.testConnection();
  
  ctx.status = isConnected ? 200 : 503;
  ctx.body = {
    status: isConnected ? 'healthy' : 'unhealthy',
    serviceBus: isConnected ? 'connected' : 'disconnected',
    queue: process.env.SERVICE_BUS_QUEUE_NAME || 'demo-queue',
    timestamp: new Date().toISOString()
  };
});

// POST /messages - Publish single message to Service Bus
router.post('/messages', async (ctx) => {
  try {
    // Validate request body
    const { error, value } = messageSchema.validate(ctx.request.body);
    
    if (error) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      };
      return;
    }

    // Send message to Service Bus
    const result = await serviceBusPublisher.sendMessage(
      value.message,
      value.properties || {}
    );

    logger.info('Message published successfully', {
      messageId: result.messageId,
      queue: result.queue
    });

    ctx.status = 200;
    ctx.body = {
      success: true,
      messageId: result.messageId,
      queue: result.queue,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error publishing message:', error);
    
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Failed to publish message',
      message: error.message
    };
  }
});

// POST /messages/batch - Publish multiple messages to Service Bus
router.post('/messages/batch', async (ctx) => {
  try {
    // Validate request body
    const { error, value } = batchSchema.validate(ctx.request.body);
    
    if (error) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      };
      return;
    }

    // Send batch of messages to Service Bus
    const results = await serviceBusPublisher.sendBatch(value.messages);

    logger.info('Message batch published successfully', {
      messageCount: results.length
    });

    ctx.status = 200;
    ctx.body = {
      success: true,
      messageCount: results.length,
      messageIds: results.map(r => r.messageId),
      queue: process.env.SERVICE_BUS_QUEUE_NAME || 'demo-queue',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error publishing message batch:', error);
    
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Failed to publish message batch',
      message: error.message
    };
  }
});

module.exports = router;
