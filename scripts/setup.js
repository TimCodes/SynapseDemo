#!/usr/bin/env node

/**
 * Setup Script for Synapse Demo Application
 * 
 * This script helps initialize the development environment by:
 * 1. Copying .env.example files to .env
 * 2. Checking for required tools (Docker, Node.js)
 * 3. Installing dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function checkCommand(command, name) {
  try {
    execSync(`${command} --version`, { stdio: 'pipe' });
    log(`✓ ${name} is installed`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${name} is not installed`, 'red');
    return false;
  }
}

function copyEnvFile(source, dest) {
  if (fs.existsSync(dest)) {
    log(`  ⚠ ${dest} already exists, skipping...`, 'yellow');
    return false;
  }
  
  if (!fs.existsSync(source)) {
    log(`  ✗ ${source} not found`, 'red');
    return false;
  }

  try {
    fs.copyFileSync(source, dest);
    log(`  ✓ Created ${dest}`, 'green');
    return true;
  } catch (error) {
    log(`  ✗ Failed to create ${dest}: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  log('\n🚀 Synapse Demo Application Setup', 'blue');
  log('This script will help you set up the development environment\n', 'blue');

  // Check prerequisites
  logSection('1. Checking Prerequisites');
  const hasNode = checkCommand('node', 'Node.js');
  const hasNpm = checkCommand('npm', 'npm');
  const hasDocker = checkCommand('docker', 'Docker');
  const hasDockerCompose = checkCommand('docker-compose', 'Docker Compose');

  if (!hasNode || !hasNpm) {
    log('\n❌ Node.js and npm are required. Please install from https://nodejs.org/', 'red');
    process.exit(1);
  }

  if (!hasDocker || !hasDockerCompose) {
    log('\n⚠ Docker and Docker Compose are recommended but not required for local development', 'yellow');
  }

  // Copy environment files
  logSection('2. Setting Up Environment Files');
  
  const envFiles = [
    { source: '.env.example', dest: '.env' },
    { source: 'packages/kafka-producer-api/.env.example', dest: 'packages/kafka-producer-api/.env' },
    { source: 'packages/kafka-consumer-service/.env.example', dest: 'packages/kafka-consumer-service/.env' },
    { source: 'packages/servicebus-publisher/.env.example', dest: 'packages/servicebus-publisher/.env' }
  ];

  let envFilesCreated = 0;
  envFiles.forEach(({ source, dest }) => {
    if (copyEnvFile(source, dest)) {
      envFilesCreated++;
    }
  });

  if (envFilesCreated > 0) {
    log(`\n✓ Created ${envFilesCreated} environment file(s)`, 'green');
    log('\n⚠ Please edit the .env files and add your configuration:', 'yellow');
    log('  - Azure Service Bus connection string (for Service Bus features)', 'yellow');
  } else {
    log('\n✓ All environment files already exist', 'green');
  }

  // Install dependencies
  logSection('3. Installing Dependencies');
  
  try {
    log('Installing npm dependencies...', 'cyan');
    execSync('npm install', { stdio: 'inherit' });
    log('\n✓ Dependencies installed successfully', 'green');
  } catch (error) {
    log('\n✗ Failed to install dependencies', 'red');
    process.exit(1);
  }

  // Success message
  logSection('4. Setup Complete! 🎉');
  
  log('Next steps:', 'green');
  log('\n1. Configure your environment:');
  log('   - Edit .env file with your Azure Service Bus connection string (optional)');
  
  log('\n2. Start the application:');
  log('   npm start              # Start all services with Docker Compose', 'cyan');
  log('   npm run dev            # Start in development mode with hot reload', 'cyan');
  
  log('\n3. View logs:');
  log('   npm run logs           # View all service logs', 'cyan');
  log('   npm run logs:producer  # View producer API logs only', 'cyan');
  
  log('\n4. Test the services:');
  log('   npm run health         # Check health of all services', 'cyan');
  log('   npm test               # Run tests', 'cyan');
  
  log('\n5. Stop the application:');
  log('   npm stop               # Stop all services', 'cyan');
  log('   npm run clean          # Stop and remove volumes', 'cyan');
  
  log('\nFor more information, see README.md', 'blue');
  log('\n✨ Happy coding! ✨\n', 'green');
}

main();
