const http = require('http');
const logger = require('./logger');

class HealthCheckServer {
  constructor(kafkaConsumer, messageHandler) {
    this.kafkaConsumer = kafkaConsumer;
    this.messageHandler = messageHandler;
    this.server = null;
    this.port = process.env.HEALTH_CHECK_PORT || 3002;
  }

  start() {
    this.server = http.createServer((req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        this.handleHealthCheck(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    this.server.listen(this.port, () => {
      logger.info(`Health check server listening on port ${this.port}`);
    });

    this.server.on('error', (error) => {
      logger.error('Health check server error:', error);
    });
  }

  handleHealthCheck(req, res) {
    const isConnected = this.kafkaConsumer.getConnectionStatus();
    const stats = this.messageHandler.getStats();

    const health = {
      status: isConnected ? 'healthy' : 'unhealthy',
      kafka: isConnected ? 'connected' : 'disconnected',
      consumer: {
        groupId: process.env.KAFKA_GROUP_ID || 'consumer-group-1',
        topic: process.env.KAFKA_TOPIC || 'demo-events',
        messagesProcessed: stats.messageCount,
        lastMessageAt: stats.lastMessageTime,
        isProcessing: stats.isProcessing
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    const statusCode = isConnected ? 200 : 503;
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health, null, 2));
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          logger.info('Health check server stopped');
          resolve();
        });
      });
    }
  }
}

module.exports = HealthCheckServer;
