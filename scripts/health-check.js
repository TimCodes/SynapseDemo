#!/usr/bin/env node

/**
 * Health Check Script for Synapse Demo Application
 * 
 * This script checks the health of all running services:
 * - Kafka Producer API (port 3000)
 * - Kafka Consumer Service (port 3002)
 * - Azure Function App (port 7071)
 * - Service Bus Publisher (port 3003)
 * - Kafka Broker (port 9092)
 * - Azurite (port 10000)
 */

const http = require('http');
const net = require('net');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkHttpHealth(name, host, port, path = '/health') {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        if (res.statusCode === 200) {
          try {
            const body = JSON.parse(data);
            resolve({
              name,
              status: 'healthy',
              statusCode: res.statusCode,
              responseTime,
              details: body
            });
          } catch (e) {
            resolve({
              name,
              status: 'healthy',
              statusCode: res.statusCode,
              responseTime,
              details: data
            });
          }
        } else {
          resolve({
            name,
            status: 'unhealthy',
            statusCode: res.statusCode,
            responseTime,
            error: `HTTP ${res.statusCode}`
          });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name,
        status: 'timeout',
        error: 'Request timeout (5s)'
      });
    });

    req.on('error', (error) => {
      resolve({
        name,
        status: 'unreachable',
        error: error.message
      });
    });

    req.end();
  });
}

function checkTcpPort(name, host, port) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(5000);

    socket.on('connect', () => {
      const responseTime = Date.now() - startTime;
      socket.destroy();
      resolve({
        name,
        status: 'listening',
        responseTime,
        details: { host, port }
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({
        name,
        status: 'timeout',
        error: 'Connection timeout (5s)'
      });
    });

    socket.on('error', (error) => {
      resolve({
        name,
        status: 'unreachable',
        error: error.message
      });
    });

    socket.connect(port, host);
  });
}

function printResult(result) {
  const statusSymbol = {
    'healthy': '✓',
    'listening': '✓',
    'unhealthy': '✗',
    'unreachable': '✗',
    'timeout': '⚠'
  }[result.status] || '?';

  const statusColor = {
    'healthy': 'green',
    'listening': 'green',
    'unhealthy': 'red',
    'unreachable': 'red',
    'timeout': 'yellow'
  }[result.status] || 'gray';

  const nameWidth = 30;
  const statusWidth = 15;
  const name = result.name.padEnd(nameWidth);
  const status = result.status.toUpperCase().padEnd(statusWidth);

  process.stdout.write(`${colors[statusColor]}${statusSymbol}${colors.reset} `);
  process.stdout.write(`${name} `);
  process.stdout.write(`${colors[statusColor]}${status}${colors.reset}`);

  if (result.responseTime) {
    process.stdout.write(`${colors.gray}(${result.responseTime}ms)${colors.reset}`);
  }

  if (result.error) {
    process.stdout.write(` ${colors.red}${result.error}${colors.reset}`);
  }

  console.log();

  if (result.details && typeof result.details === 'object') {
    if (result.details.service) {
      console.log(`  ${colors.gray}Service: ${result.details.service}${colors.reset}`);
    }
    if (result.details.version) {
      console.log(`  ${colors.gray}Version: ${result.details.version}${colors.reset}`);
    }
  }
}

async function main() {
  log('\n🏥 Synapse Demo Application Health Check', 'blue');
  log('Checking health of all services...\n', 'blue');

  console.log('='.repeat(80) + '\n');

  // Check HTTP services
  const httpChecks = [
    checkHttpHealth('Kafka Producer API', 'localhost', 3000),
    checkHttpHealth('Kafka Consumer Service', 'localhost', 3002),
    checkHttpHealth('Service Bus Publisher', 'localhost', 3003),
    checkHttpHealth('Azure Function App', 'localhost', 7071, '/api/process')
  ];

  // Check TCP services
  const tcpChecks = [
    checkTcpPort('Kafka Broker', 'localhost', 9092),
    checkTcpPort('Azurite Blob Service', 'localhost', 10000),
    checkTcpPort('Azurite Queue Service', 'localhost', 10001),
    checkTcpPort('Azurite Table Service', 'localhost', 10002)
  ];

  const results = await Promise.all([...httpChecks, ...tcpChecks]);

  results.forEach(printResult);

  console.log('\n' + '='.repeat(80));

  // Summary
  const healthy = results.filter(r => r.status === 'healthy' || r.status === 'listening').length;
  const total = results.length;
  const unhealthy = total - healthy;

  if (unhealthy === 0) {
    log(`\n✓ All services are healthy (${healthy}/${total})`, 'green');
    log('\n✨ System is ready! ✨\n', 'green');
    process.exit(0);
  } else {
    log(`\n⚠ ${unhealthy} service(s) are not healthy (${healthy}/${total} healthy)`, 'yellow');
    
    if (results.some(r => r.status === 'unreachable')) {
      log('\nTip: Make sure all services are started with "npm start" or "npm run dev"', 'cyan');
    }
    
    console.log();
    process.exit(1);
  }
}

main();
