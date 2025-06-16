#!/usr/bin/env node

// Import environment setup
require('./lib/env');

const { spawn } = require('child_process');
const os = require('os');

console.log('🚀 Starting Prisma Studio...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Determine the correct command for different platforms
const isWindows = os.platform() === 'win32';
const command = isWindows ? 'npx.cmd' : 'npx';

// Start Prisma Studio
const studio = spawn(command, ['prisma', 'studio'], {
  stdio: 'inherit',
  env: process.env,
  shell: isWindows
});

studio.on('close', (code) => {
  console.log(`Prisma Studio exited with code ${code}`);
});

studio.on('error', (error) => {
  console.error('Failed to start Prisma Studio:', error);
}); 