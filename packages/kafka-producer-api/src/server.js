require('dotenv').config();
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const eventsRouter = require('./routes/events');
const kafkaProducer = require('./config/kafka');
const logger = require('./logger');

const app = new Koa();
const PORT = process.env.PORT || 3001;

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    logger.error('Unhandled error:', err);
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      error: err.message || 'Internal server error'
    };
    ctx.app.emit('error', err, ctx);
  }
});

// Request logging middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
});

// Middleware
app.use(cors());
app.use(bodyParser({
  enableTypes: ['json'],
  jsonLimit: '1mb'
}));

// Routes
app.use(eventsRouter.routes());
app.use(eventsRouter.allowedMethods());

// Initialize Kafka and start server
async function start() {
  try {
    // Initialize Kafka producer
    await kafkaProducer.initialize();
    logger.info('Kafka producer initialized');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Kafka Producer API listening on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Events endpoint: http://localhost:${PORT}/events`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  try {
    await kafkaProducer.disconnect();
    logger.info('Server shut down successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the application
start();
